/**
 * Host half of the Materials bundle.
 *
 * A material library lives on disk as ordinary directories and Markdown files.
 * Tags are the only thing that is not a file: they live in `.index.json` at the
 * library root, keyed by the material's relative path. The browser half talks to
 * this half over a namespaced HTTP route (same origin, JSON only), so one page
 * fetch is enough to keep the panel in sync with what is really on disk — and
 * the same files stay readable by any other tool.
 */
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const API_PREFIX = '/api/dsh-materials';
const INDEX_NAME = '.index.json';
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_DEPTH = 12;
const MAX_FILES = 4000;
const EXCERPT_CHARS = 220;
const MD_SUFFIX = '.md';
const MAX_TAGS = 16;
const MAX_PREVIEW_BYTES = 1024 * 1024;
const PREVIEW_EXTENSIONS = new Set(['.md', '.markdown', '.txt', '.json', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.html', '.htm', '.css', '.scss', '.csv', '.tsv', '.yaml', '.yml', '.log', '.sh', '.command', '.toml', '.ini', '.xml', '.sql']);
const MAX_LIST_ENTRIES = 800;
const HOME_ROOT = os.homedir();
const MAX_RAW_BYTES = 24 * 1024 * 1024;
const ICON_CACHE_DIR = path.join(os.tmpdir(), 'dsh-materials-icons');
const HISTORY_DIR = '.history';
const MAX_VERSIONS = 30;
const MAX_IMPORT_FILES = 2000;
const ARCHIVE_MAX_ENTRIES = 200;
const ARCHIVE_DEFAULT_LIMIT = 50;
const RULES_NAME = '.rules.json';
const MAX_RULES = 200;
const AUTO_ARCHIVE_LIMIT = 50;
const AUTO_RULE_DEPTH = 3;
const MAX_RULE_EXTENSIONS = 4;
const SCHEDULE_MARK = '[SCHEDULE REMINDER';
/** Transient files a task writes on the way to its real output. */
const JUNK_EXTENSIONS = new Set(['.tmp', '.temp', '.log', '.bak', '.swp', '.part', '.crdownload', '.ds_store']);

const APP_DIRS = ['/Applications', '/System/Applications', path.join(HOME_ROOT, 'Applications'), '/System/Applications/Utilities'];
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.bmp', '.ico', '.avif']);

/**
 * Which apps macOS users usually pick for a given kind of file. Names are the
 * bundle names without `.app`; anything missing is simply skipped.
 */
const APP_HINTS = {
  image: ['Preview', 'Photos', 'Pixelmator Pro', 'Adobe Photoshop 2024', 'Google Chrome', 'Safari'],
  text: ['Visual Studio Code', 'Cursor', 'Typora', 'Obsidian', 'iA Writer', 'TextEdit'],
  web: ['Safari', 'Google Chrome', 'Microsoft Edge', 'Firefox'],
  pdf: ['Preview', 'Google Chrome', 'Adobe Acrobat Reader'],
  shell: ['Terminal', 'iTerm', 'Visual Studio Code'],
  video: ['QuickTime Player', 'IINA', 'VLC'],
  audio: ['Music', 'QuickTime Player', 'IINA'],
  sheet: ['Numbers', 'Microsoft Excel', 'Visual Studio Code'],
  doc: ['Pages', 'Microsoft Word'],
  archive: ['Archive Utility', 'Keka'],
};

/** Kind of file, from its extension. Used for the card subtitle and app hints. */
function kindOf(target) {
  const ext = path.extname(String(target ?? '')).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (ext === '.html' || ext === '.htm') return 'web';
  if (ext === '.pdf') return 'pdf';
  if (ext === '.sh' || ext === '.command' || ext === '.zsh' || ext === '.bash') return 'shell';
  if (['.mp4', '.mov', '.m4v', '.mkv', '.webm'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.m4a', '.flac', '.aac'].includes(ext)) return 'audio';
  if (ext === '.csv' || ext === '.tsv' || ext === '.xlsx' || ext === '.xls') return 'sheet';
  if (ext === '.doc' || ext === '.docx' || ext === '.pages' || ext === '.rtf') return 'doc';
  if (ext === '.zip' || ext === '.tar' || ext === '.gz' || ext === '.7z') return 'archive';
  return 'text';
}

let appCache = { at: 0, apps: [] };

/** Every `.app` bundle macOS can find in the usual places (cached for a minute). */
async function installedApps() {
  const now = Date.now();
  if (now - appCache.at < 60_000 && appCache.apps.length > 0) return appCache.apps;
  const found = [];
  const seen = new Set();
  for (const dir of APP_DIRS) {
    let entries = [];
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.name.endsWith('.app')) continue;
      const target = path.join(dir, entry.name);
      if (seen.has(target)) continue;
      seen.add(target);
      found.push({ name: entry.name.replace(/\.app$/i, ''), path: target });
    }
  }
  found.sort((left, right) => left.name.localeCompare(right.name));
  appCache = { at: now, apps: found };
  return found;
}

/** The `.icns` a bundle ships as its app icon. */
async function iconFileOf(appPath) {
  const resources = path.join(appPath, 'Contents', 'Resources');
  let entries = [];
  try {
    entries = await fsp.readdir(resources);
  } catch {
    return '';
  }
  const icons = entries.filter((name) => name.toLowerCase().endsWith('.icns'));
  if (icons.length === 0) return '';
  const preferred = icons.find((name) => /^appicon\.icns$/i.test(name)) ?? icons.find((name) => /^icon\.icns$/i.test(name)) ?? icons[0];
  return path.join(resources, preferred);
}

const iconMemo = new Map();

/** App icon as a data URL; converted once per app with `sips`, then cached. */
async function appIconDataUrl(appPath) {
  if (iconMemo.has(appPath)) return iconMemo.get(appPath);
  const source = await iconFileOf(appPath);
  if (source === '') {
    iconMemo.set(appPath, '');
    return '';
  }
  const digest = Buffer.from(appPath).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
  const target = path.join(ICON_CACHE_DIR, `${digest}.png`);
  let dataUrl = '';
  try {
    await fsp.mkdir(ICON_CACHE_DIR, { recursive: true });
    await fsp.access(target);
  } catch {
    try {
      await run('sips', ['-s', 'format', 'png', '--resampleHeightWidth', '64', '64', source, '--out', target], { timeout: 10_000 });
    } catch {
      iconMemo.set(appPath, '');
      return '';
    }
  }
  try {
    const bytes = await fsp.readFile(target);
    dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
  } catch {
    dataUrl = '';
  }
  iconMemo.set(appPath, dataUrl);
  return dataUrl;
}

/** Apps worth offering for one file, most likely first. */
async function openersFor(target) {
  const apps = await installedApps();
  const kind = kindOf(target);
  const hinted = APP_HINTS[kind] ?? APP_HINTS.text;
  const items = [];
  const used = new Set();
  for (const name of hinted) {
    const match = apps.find((app) => app.name === name);
    if (match === undefined || used.has(match.path)) continue;
    used.add(match.path);
    items.push(match);
  }
  for (const extra of ['Finder'].concat(kind === 'shell' ? ['Terminal'] : [])) {
    const match = apps.find((app) => app.name === extra);
    if (match !== undefined && !used.has(match.path)) {
      used.add(match.path);
      items.push(match);
    }
  }
  const withIcons = [];
  for (const item of items.slice(0, 8)) {
    withIcons.push({ name: item.name, path: item.path, icon: await appIconDataUrl(item.path) });
  }
  return withIcons;
}

/** Hard dependency: without a web server the panel cannot be reached. */
export const inject = ['webServer'];

/** A request-level failure carrying the HTTP status to answer with. */
class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** The Harness home directory that holds sessions and storages. */
function dshHome() {
  const home = (process.env.DSH_HOME ?? '').trim() !== '' ? process.env.DSH_HOME : path.join(os.homedir(), '.dsh');
  return path.resolve(home);
}

/** Read the configured library root, falling back to `<DSH_HOME>/materials`. */
function resolveRoot(config) {
  const configured = config && typeof config.root === 'string' ? config.root.trim() : '';
  if (configured !== '') return path.resolve(configured);
  return path.join(dshHome(), 'materials');
}

/**
 * Modification times of the stored sessions, keyed by session id.
 * The client already knows titles and working directories; this only adds the
 * recency order a session picker needs, without parsing a single event log.
 */
async function readSessionTimes() {
  const base = path.join(dshHome(), 'sessions');
  const times = {};
  let groups = [];
  try {
    groups = await fsp.readdir(base, { withFileTypes: true });
  } catch {
    return times;
  }
  for (const group of groups) {
    if (!group.isDirectory()) continue;
    const groupDir = path.join(base, group.name);
    let sessions = [];
    try {
      sessions = await fsp.readdir(groupDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const session of sessions) {
      if (!session.isDirectory()) continue;
      /* Both layouts are on disk: `session-<id>` and a bare `<id>`. */
      const id = session.name.startsWith('session-') ? session.name.slice('session-'.length) : session.name;
      if (!/^[0-9a-zA-Z-]{8,}$/.test(id)) continue;
      try {
        const stats = await fsp.stat(path.join(groupDir, session.name));
        const previous = times[id];
        if (typeof previous !== 'number' || stats.mtimeMs > previous) times[id] = stats.mtimeMs;
      } catch {
        /* a vanished session dir is simply unreported */
      }
    }
  }
  return times;
}

/** Split a relative path into safe segments; reject traversal and NUL bytes. */
function safeSegments(value) {
  if (typeof value !== 'string') throw new RequestError(400, 'path must be a string');
  if (value.includes('\u0000')) throw new RequestError(400, 'path must not contain NUL');
  const segments = value.replaceAll('\\', '/').split('/').filter((s) => s !== '' && s !== '.');
  for (const segment of segments) {
    if (segment === '..') throw new RequestError(400, 'path must stay inside the library');
  }
  return segments;
}

/** Normalize a relative path; `''` is the library root. */
function normalizeRel(value) {
  return safeSegments(value).join('/');
}

/** A user-facing name must be one path segment. */
function sanitizeName(value, fallback) {
  const raw = typeof value === 'string' ? value.trim() : '';
  const candidate = raw === '' ? fallback : raw;
  if (candidate.includes('/') || candidate.includes('\\') || candidate.includes('\u0000') || candidate === '.' || candidate === '..') {
    throw new RequestError(400, `invalid name: ${candidate}`);
  }
  return candidate;
}

/** Material file names always end in `.md`. */
function materialName(value, fallback) {
  const name = sanitizeName(value, fallback);
  return name.toLowerCase().endsWith(MD_SUFFIX) ? name : `${name}${MD_SUFFIX}`;
}

/** Trim, dedupe case-insensitively, and cap the tag list. */
function normalizeTags(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new RequestError(400, 'tags must be an array');
  const seen = new Set();
  const tags = [];
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const tag = entry.trim();
    if (tag === '' || tag.length > 40) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

/** One-line preview of a material body. */
function excerptOf(text) {
  const flat = text
    .replace(/^#+\s*/gm, '')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length > EXCERPT_CHARS ? `${flat.slice(0, EXCERPT_CHARS)}…` : flat;
}

/** Expand `~` so a task prompt can name a home-relative folder. */
function expandTarget(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (raw === '') return '';
  if (raw === '~') return HOME_ROOT;
  if (raw.startsWith('~/')) return path.join(HOME_ROOT, raw.slice(2));
  return raw;
}

/** Turn `include` (".html, *.md") into filename matchers; `null` matches everything. */
function parseIncludes(value) {
  const raw = typeof value === 'string' ? value : '';
  const patterns = raw.split(/[,;\s]+/).map((part) => part.trim()).filter(Boolean);
  if (patterns.length === 0) return null;
  return patterns.map((pattern) => {
    const lower = pattern.toLowerCase();
    if (!lower.includes('*')) return (name) => name.toLowerCase().endsWith(lower);
    const source = lower
      .split('*')
      .map((part) => part.replace(/[.+^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    const rx = new RegExp(`^${source}$`);
    return (name) => rx.test(name.toLowerCase());
  });
}

/** Resolve one absolute path the picker may read: nothing outside the home folder. */
function externalPath(value) {
  if (typeof value !== 'string' || value.trim() === '') throw new RequestError(400, 'path is required');
  if (value.includes('\0')) throw new RequestError(400, 'path is invalid');
  const resolved = path.resolve(value);
  const homeResolved = path.resolve(HOME_ROOT);
  if (resolved !== homeResolved && !resolved.startsWith(homeResolved + path.sep)) {
    throw new RequestError(403, 'path must stay inside your home folder');
  }
  return resolved;
}

/** Coerce a stored index of either version into the current shape. */
function normalizeIndex(raw) {
  const files = raw && typeof raw.files === 'object' && raw.files !== null ? raw.files : {};
  const refs = raw && typeof raw.refs === 'object' && raw.refs !== null ? raw.refs : {};
  return { version: 2, files, refs };
}

/**
 * Filing rules: a folder or file a session keeps producing, filed again on
 * every turn once the user has filed it by hand at least once.
 */
function normalizeRules(raw) {
  const list = raw && Array.isArray(raw.rules) ? raw.rules : [];
  const out = [];
  for (const rule of list) {
    if (!rule || typeof rule !== 'object') continue;
    if (typeof rule.sessionId !== 'string' || rule.sessionId === '') continue;
    if (typeof rule.root !== 'string' || rule.root === '') continue;
    out.push({
      id: typeof rule.id === 'string' && rule.id !== '' ? rule.id : `rule-${Date.now().toString(36)}`,
      sessionId: rule.sessionId,
      sessionTitle: typeof rule.sessionTitle === 'string' ? rule.sessionTitle : '',
      root: rule.root,
      kind: rule.kind === 'file' ? 'file' : 'dir',
      folder: normalizeRel(rule.folder ?? ''),
      tags: normalizeTags(rule.tags),
      include: typeof rule.include === 'string' && rule.include !== '' ? rule.include : null,
      depth: Number.isInteger(rule.depth) ? Math.max(0, Math.min(AUTO_RULE_DEPTH, rule.depth)) : 1,
      cwd: typeof rule.cwd === 'string' ? rule.cwd : '',
      createdAt: typeof rule.createdAt === 'number' ? rule.createdAt : 0,
      lastRunAt: typeof rule.lastRunAt === 'number' ? rule.lastRunAt : 0,
      lastCount: typeof rule.lastCount === 'number' ? rule.lastCount : 0,
    });
  }
  return out;
}

/** Count what one referenced folder holds, bounded so a huge tree stays cheap. */
async function countTree(target) {
  let files = 0;
  let folders = 0;
  const walk = async (dir, depth) => {
    if (depth > 6 || files + folders > 5000) return;
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules') continue;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        folders += 1;
        await walk(path.join(dir, entry.name), depth + 1);
        continue;
      }
      files += 1;
    }
  };
  await walk(target, 0);
  return { files, folders };
}

/**
 * Copy a directory tree into the library. Dotfiles, node_modules and symlinks
 * are skipped; the walk stops at the same caps the listing uses.
 */
async function copyTree(source, target, depth) {
  if (depth > MAX_DEPTH) return 0;
  await fsp.mkdir(target, { recursive: true });
  let entries = [];
  try {
    entries = await fsp.readdir(source, { withFileTypes: true });
  } catch {
    return 0;
  }
  let copied = 0;
  for (const entry of entries) {
    if (copied >= MAX_IMPORT_FILES) break;
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    if (entry.isSymbolicLink()) continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copied += await copyTree(from, to, depth + 1);
    } else if (entry.isFile()) {
      await fsp.copyFile(from, to);
      copied += 1;
    }
  }
  return copied;
}

async function writeAtomic(target, text) {
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await fsp.writeFile(temporary, text, 'utf8');
  await fsp.rename(temporary, target);
}

/**
 * The library: directories and Markdown files on disk, tags in one JSON index,
 * every mutation serialized so concurrent requests cannot interleave.
 */
/**
 * Sortable, filename-safe stamp for one saved version.
 */
function versionStamp(date) {
  const iso = (date ?? new Date()).toISOString();
  return `${iso.slice(0, 10).replace(/-/g, '')}T${iso.slice(11, 19).replace(/:/g, '')}-${iso.slice(20, 23)}Z`;
}

/**
 * The file types a filing actually produced, as an include pattern. A rule made
 * from "I filed today's report.html" should keep picking up `*.html` and leave
 * the run's intermediate `.json`/`.png` alone; too many types means the target is
 * a mixed folder rather than one deliverable, and no rule is made.
 */
function extensionPattern(names) {
  const exts = [];
  for (const name of names) {
    const ext = path.extname(String(name ?? '')).toLowerCase();
    if (ext === '' || JUNK_EXTENSIONS.has(ext)) continue;
    if (!exts.includes(ext)) exts.push(ext);
  }
  if (exts.length === 0 || exts.length > MAX_RULE_EXTENSIONS) return null;
  return exts.join(',');
}

/** Plain text of one session message, for the schedule marker. */
function messageText(message) {
  if (message === null || typeof message !== 'object') return '';
  const content = message.content;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  let out = '';
  for (const block of content) {
    if (block && block.type === 'text' && typeof block.text === 'string') out += block.text;
  }
  return out;
}

class MaterialsStore {
  constructor(root) {
    this.root = root;
    this.indexPath = path.join(root, INDEX_NAME);
    this.rulesPath = path.join(root, RULES_NAME);
    this.queue = Promise.resolve();
    /** Set by apply(): tells a filing whether its turn came from a schedule. */
    this.scheduleProbe = null;
  }

  /** True when this filing happened in a turn a scheduled task started. */
  isScheduled(sessionId, explicit) {
    if (explicit === true) return true;
    if (explicit === false) return false;
    if (typeof this.scheduleProbe !== 'function') return false;
    try {
      return this.scheduleProbe(sessionId) === true;
    } catch {
      return false;
    }
  }

  /** Run one mutation after the previous one settled. */
  serialize(task) {
    const run = this.queue.then(task, task);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  /** Absolute path for a relative library path, refusing escapes. */
  resolve(rel) {
    const normalized = normalizeRel(rel);
    const target = normalized === '' ? this.root : path.resolve(this.root, normalized);
    const rootResolved = path.resolve(this.root);
    if (target !== rootResolved && !target.startsWith(rootResolved + path.sep)) {
      throw new RequestError(400, 'path must stay inside the library');
    }
    return target;
  }

  async ensure() {
    await fsp.mkdir(this.root, { recursive: true });
  }

  async readIndex() {
    try {
      const raw = JSON.parse(await fsp.readFile(this.indexPath, 'utf8'));
      return normalizeIndex(raw);
    } catch (error) {
      if (error && error.code === 'ENOENT') return normalizeIndex(null);
      if (error instanceof SyntaxError) return normalizeIndex(null);
      throw error;
    }
  }

  async writeIndex(index) {
    await writeAtomic(this.indexPath, `${JSON.stringify(index, null, 2)}\n`);
  }

  async readRules() {
    try {
      const raw = JSON.parse(await fsp.readFile(this.rulesPath, 'utf8'));
      return normalizeRules(raw);
    } catch (error) {
      if (error && error.code === 'ENOENT') return [];
      if (error instanceof SyntaxError) return [];
      throw error;
    }
  }

  async writeRules(rules) {
    const trimmed = rules.slice(-MAX_RULES);
    await writeAtomic(this.rulesPath, `${JSON.stringify({ version: 1, rules: trimmed }, null, 2)}\n`);
  }

  /**
   * Remember one manual filing as a recurring rule. Callers hold the queue.
   * A rule is skipped when it cannot mean "this session keeps producing it":
   * no session, a target already inside the library, or the session cwd itself.
   */
  async saveRule(input) {
    const sessionId = typeof input.sessionId === 'string' ? input.sessionId : '';
    if (sessionId === '') return null;
    // Only a scheduled run may leave a standing rule behind: an ordinary chat
    // turn must never turn the library into a dumping ground for its scratch work.
    if (!this.isScheduled(sessionId, input.scheduled)) return null;
    const includeDerived = input.include === undefined || input.include === null || input.include === ''
      ? extensionPattern(input.names ?? [])
      : null;
    if (input.include !== undefined && input.include !== null && input.include !== '') {
      input = { ...input, include: input.include };
    } else {
      if (includeDerived === null) return null;
      input = { ...input, include: includeDerived };
    }
    const root = path.resolve(String(input.root ?? ''));
    if (root === '' ) return null;
    const cwd = typeof input.cwd === 'string' ? input.cwd : '';
    if (cwd !== '' && root === path.resolve(cwd)) return null;
    const libraryRoot = path.resolve(this.root);
    if (root === libraryRoot || root.startsWith(libraryRoot + path.sep)) return null;
    const kind = input.kind === 'file' ? 'file' : 'dir';
    const include = typeof input.include === 'string' && input.include !== '' ? input.include : null;
    const depth = kind === 'file' ? 0 : Math.max(0, Math.min(AUTO_RULE_DEPTH, Number.isInteger(input.depth) ? input.depth : 1));
    const rules = await this.readRules();
    const existing = rules.find((rule) => rule.sessionId === sessionId && rule.root === root && rule.include === include);
    if (existing !== undefined) {
      existing.folder = normalizeRel(input.folder ?? existing.folder);
      existing.tags = normalizeTags([...existing.tags, ...normalizeTags(input.tags)]);
      existing.depth = depth;
      if (typeof input.sessionTitle === 'string' && input.sessionTitle !== '') existing.sessionTitle = input.sessionTitle;
      await this.writeRules(rules);
      return existing;
    }
    const rule = {
      id: `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId,
      sessionTitle: typeof input.sessionTitle === 'string' ? input.sessionTitle : '',
      root,
      kind,
      folder: normalizeRel(input.folder ?? ''),
      tags: normalizeTags(input.tags),
      include,
      depth,
      cwd,
      createdAt: Date.now(),
      lastRunAt: 0,
      lastCount: 0,
    };
    rules.push(rule);
    await this.writeRules(rules);
    return rule;
  }

  /** Every rule, newest first, with whether its target is still there. */
  async listRules() {
    const rules = await this.readRules();
    const out = [];
    for (const rule of rules) {
      let exists = false;
      let stat = null;
      try {
        stat = await fsp.stat(rule.root);
        exists = true;
      } catch {
        exists = false;
      }
      out.push({ ...rule, exists, updatedAt: stat ? stat.mtimeMs : 0 });
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  }

  removeRule(input) {
    const body = input && typeof input === 'object' ? input : {};
    return this.serialize(async () => {
      const id = typeof body.id === 'string' ? body.id : '';
      const rules = await this.readRules();
      const next = rules.filter((rule) => rule.id !== id);
      if (next.length === rules.length) throw new RequestError(404, 'rule not found');
      await this.writeRules(next);
      return { id };
    });
  }

  /**
   * Re-file everything the rules of one session point at. Runs after a turn
   * closes; unknown folders and vanished targets are skipped, never fatal.
   */
  async runRules(sessionId) {
    const key = typeof sessionId === 'string' ? sessionId : '';
    if (key === '') return { sessionId: key, applied: [] };
    const rules = (await this.readRules()).filter((rule) => rule.sessionId === key);
    if (rules.length === 0) return { sessionId: key, applied: [] };
    const applied = [];
    for (const rule of rules) {
      try {
        const result = await this.serialize(() => this.archiveInner({
          path: rule.root,
          folder: rule.folder,
          tags: rule.tags,
          include: rule.include ?? undefined,
          depth: rule.kind === 'file' ? 0 : rule.depth,
          sessionId: rule.sessionId,
          sessionTitle: rule.sessionTitle,
          cwd: rule.cwd,
          limit: AUTO_ARCHIVE_LIMIT,
          remember: false,
        }));
        const added = result.archived.filter((item) => item.added === true).length;
        applied.push({ rule: rule.id, root: rule.root, added, total: result.archived.length });
        rule.lastRunAt = Date.now();
        rule.lastCount = result.archived.length;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        applied.push({ rule: rule.id, root: rule.root, added: 0, error: message });
      }
    }
    await this.serialize(() => this.writeRules(rules));
    return { sessionId: key, applied };
  }

  /** Tags for one material, from the index. */
  tagsOf(index, rel) {
    const entry = index.files[rel];
    return entry && Array.isArray(entry.tags) ? normalizeTags(entry.tags) : [];
  }

  /** Reference entries, newest first, each with whether its target still exists. */
  async refState(index) {
    const source = index ?? (await this.readIndex());
    const out = [];
    for (const [id, value] of Object.entries(source.refs)) {
      if (!value || typeof value !== 'object') continue;
      const absPath = typeof value.absPath === 'string' ? value.absPath : '';
      let exists = false;
      let stat = null;
      try {
        stat = await fsp.stat(absPath);
        exists = true;
      } catch {
        exists = false;
      }
      out.push({
        id,
        type: 'ref',
        name: typeof value.name === 'string' && value.name !== '' ? value.name : path.basename(absPath || 'reference'),
        folder: normalizeRel(value.folder ?? ''),
        tags: normalizeTags(value.tags),
        kind: value.kind === 'file' ? 'file' : 'dir',
        sessionId: typeof value.sessionId === 'string' ? value.sessionId : '',
        sessionTitle: typeof value.sessionTitle === 'string' ? value.sessionTitle : '',
        cwd: typeof value.cwd === 'string' ? value.cwd : '',
        absPath,
        relPath: typeof value.relPath === 'string' ? value.relPath : '',
        createdAt: typeof value.createdAt === 'number' ? value.createdAt : 0,
        exists,
        updatedAt: stat ? stat.mtimeMs : (typeof value.createdAt === 'number' ? value.createdAt : 0),
        size: stat ? stat.size : 0,
        counts: value.counts && typeof value.counts === 'object' ? value.counts : null,
      });
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  }

  /** Whole-library snapshot: folders, materials, tag counts, root path. */
  async state() {
    await this.ensure();
    const index = await this.readIndex();
    const folders = [];
    const files = [];
    const walk = async (rel, depth) => {
      if (depth > MAX_DEPTH || files.length >= MAX_FILES) return;
      let entries;
      try {
        entries = await fsp.readdir(this.resolve(rel), { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`;
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) {
          folders.push(childRel);
          await walk(childRel, depth + 1);
          continue;
        }
        if (!entry.name.toLowerCase().endsWith(MD_SUFFIX)) continue;
        const absolute = this.resolve(childRel);
        let stat;
        let body = '';
        try {
          stat = await fsp.stat(absolute);
          body = await fsp.readFile(absolute, 'utf8');
        } catch {
          continue;
        }
        files.push({
          path: childRel,
          name: entry.name.slice(0, -MD_SUFFIX.length),
          dir: rel,
          size: stat.size,
          updatedAt: stat.mtimeMs,
          tags: this.tagsOf(index, childRel),
          excerpt: excerptOf(body),
        });
        if (files.length >= MAX_FILES) return;
      }
    };
    await walk('', 0);
    files.sort((a, b) => b.updatedAt - a.updatedAt);
    const refs = await this.refState(index);
    for (const ref of refs) {
      if (ref.folder === '') continue;
      const parts = ref.folder.split('/');
      for (let depth = 1; depth <= parts.length; depth += 1) {
        const candidate = parts.slice(0, depth).join('/');
        if (!folders.includes(candidate)) folders.push(candidate);
      }
    }
    folders.sort((a, b) => a.localeCompare(b));
    const counts = new Map();
    for (const item of [...files, ...refs]) {
      for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    const tags = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return { root: this.root, folders, files, refs, tags, truncated: files.length >= MAX_FILES };
  }

  /** One material with its body and tags. */
  async read(rel) {
    const normalized = normalizeRel(rel);
    if (normalized === '' || normalized.endsWith('/')) throw new RequestError(400, 'path must name a material');
    const absolute = this.resolve(normalized);
    let body;
    try {
      body = await fsp.readFile(absolute, 'utf8');
    } catch (error) {
      if (error && error.code === 'ENOENT') throw new RequestError(404, 'material not found');
      throw error;
    }
    const stat = await fsp.stat(absolute);
    const index = await this.readIndex();
    return {
      path: normalized,
      name: path.posix.basename(normalized).slice(0, -MD_SUFFIX.length),
      dir: path.posix.dirname(normalized) === '.' ? '' : path.posix.dirname(normalized),
      content: body,
      tags: this.tagsOf(index, normalized),
      updatedAt: stat.mtimeMs,
    };
  }

  /** Create one material; an existing name is rejected rather than replaced. */
  create({ dir, name, content, tags }) {
    return this.serialize(async () => {
      await this.ensure();
      const folder = normalizeRel(dir ?? '');
      const filename = materialName(name, `material-${Date.now()}`);
      await fsp.mkdir(this.resolve(folder), { recursive: true });
      const rel = folder === '' ? filename : `${folder}/${filename}`;
      const absolute = this.resolve(rel);
      if (await exists(absolute)) throw new RequestError(409, `${filename} already exists in this folder`);
      await fsp.writeFile(absolute, typeof content === 'string' ? content : '', 'utf8');
      const index = await this.readIndex();
      const normalizedTags = normalizeTags(tags);
      if (normalizedTags.length > 0) index.files[rel] = { tags: normalizedTags };
      await this.writeIndex(index);
      return { path: rel };
    });
  }

  /** Directory that holds saved versions of one material. */
  historyPath(rel) {
    const parts = normalizeRel(rel).split('/');
    return path.join(this.root, HISTORY_DIR, ...parts);
  }

  /** Keep the previous body as a version before it gets overwritten. */
  async snapshot(rel, content) {
    if (typeof content !== 'string' || content === '') return;
    const dir = this.historyPath(rel);
    await fsp.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${versionStamp()}.md`);
    await fsp.writeFile(file, content, 'utf8');
    const names = (await fsp.readdir(dir)).filter((name) => name.endsWith('.md')).sort();
    for (const stale of names.slice(0, Math.max(0, names.length - MAX_VERSIONS))) {
      await fsp.rm(path.join(dir, stale), { force: true });
    }
  }

  /** Saved versions of one material, newest first. */
  async listVersions(rel) {
    const normalized = normalizeRel(rel);
    if (normalized === '') throw new RequestError(400, 'path must name a material');
    const dir = this.historyPath(normalized);
    let names = [];
    try {
      names = (await fsp.readdir(dir)).filter((name) => name.endsWith('.md'));
    } catch (error) {
      if (error && error.code === 'ENOENT') return { path: normalized, versions: [] };
      throw error;
    }
    const versions = [];
    for (const name of names.sort().reverse()) {
      const stat = await fsp.stat(path.join(dir, name));
      versions.push({ id: name.slice(0, -MD_SUFFIX.length), size: stat.size, updatedAt: stat.mtimeMs });
    }
    return { path: normalized, versions };
  }

  /** Body of one saved version. */
  async readVersion({ path: rel, id }) {
    const normalized = normalizeRel(rel);
    if (normalized === '') throw new RequestError(400, 'path must name a material');
    const safeId = safeSegments(String(id ?? ''));
    if (safeId.length !== 1) throw new RequestError(400, 'version id is not valid');
    const file = path.join(this.historyPath(normalized), `${safeId[0]}${MD_SUFFIX}`);
    try {
      const content = await fsp.readFile(file, 'utf8');
      return { path: normalized, id: safeId[0], content };
    } catch (error) {
      if (error && error.code === 'ENOENT') throw new RequestError(404, 'version not found');
      throw error;
    }
  }

  /** Bring one saved version back, keeping the current body as a version first. */
  restoreVersion({ path: rel, id }) {
    return this.serialize(async () => {
      const version = await this.readVersion({ path: rel, id });
      const absolute = this.resolve(version.path);
      let previous = '';
      try {
        previous = await fsp.readFile(absolute, 'utf8');
      } catch (error) {
        if (!error || error.code !== 'ENOENT') throw error;
      }
      if (previous !== version.content) await this.snapshot(version.path, previous);
      await fsp.writeFile(absolute, version.content, 'utf8');
      return { path: version.path, id: version.id };
    });
  }

  /** Raw bytes of a file inside the library, for previews that need a URL. */
  async readRaw(rel) {
    const normalized = normalizeRel(rel);
    if (normalized === '') throw new RequestError(400, 'path must name a file');
    const absolute = this.resolve(normalized);
    let stat;
    try {
      stat = await fsp.stat(absolute);
    } catch (error) {
      if (error && error.code === 'ENOENT') throw new RequestError(404, 'file not found');
      throw error;
    }
    if (stat.isDirectory()) throw new RequestError(400, 'this path is a folder');
    if (stat.size > MAX_RAW_BYTES) throw new RequestError(413, 'that file is too large to preview');
    return { target: absolute, bytes: await fsp.readFile(absolute), modified: stat.mtimeMs };
  }

  /** Copy an external file or folder into the library, so the library owns it. */
  importPath({ from, dir, name, tags }) {
    return this.serialize(async () => {
      const source = externalPath(from);
      let stat;
      try {
        stat = await fsp.stat(source);
      } catch {
        throw new RequestError(404, 'that source is no longer there');
      }
      const folder = normalizeRel(dir ?? '');
      const fallbackName = path.basename(source).replace(/\.md$/i, '');
      const wanted = sanitizeName(name ?? fallbackName, fallbackName);
      await fsp.mkdir(this.resolve(folder), { recursive: true });
      const target = folder === '' ? wanted : `${folder}/${wanted}`;
      const absolute = this.resolve(target);
      if (await exists(absolute)) throw new RequestError(409, `${wanted} already exists in this folder`);
      let imported = 0;
      if (stat.isDirectory()) {
        imported = await copyTree(source, absolute, 0);
      } else {
        const filename = target.endsWith(MD_SUFFIX) || path.extname(target) !== '' ? target : target + path.extname(source);
        await fsp.copyFile(source, this.resolve(filename));
        imported = 1;
        const index0 = await this.readIndex();
        const normalizedTags = normalizeTags(tags);
        if (normalizedTags.length > 0) index0.files[filename] = { tags: normalizedTags };
        await this.writeIndex(index0);
        return { path: filename, kind: 'file', files: imported };
      }
      const index = await this.readIndex();
      const normalizedTags = normalizeTags(tags);
      if (normalizedTags.length > 0) index.files[target] = { tags: normalizedTags };
      await this.writeIndex(index);
      return { path: target, kind: 'dir', files: imported };
    });
  }

  /** Save a material, optionally renaming it and moving it to another folder. */
  update({ path: rel, name, dir, content, tags }) {
    return this.serialize(async () => {
      await this.ensure();
      const current = normalizeRel(rel);
      if (current === '') throw new RequestError(400, 'path must name a material');
      const absolute = this.resolve(current);
      let previous;
      try {
        previous = await fsp.readFile(absolute, 'utf8');
      } catch (error) {
        if (error && error.code === 'ENOENT') throw new RequestError(404, 'material not found');
        throw error;
      }
      const targetName = name === undefined ? path.posix.basename(current) : materialName(name, path.posix.basename(current));
      const targetDir = dir === undefined ? (path.posix.dirname(current) === '.' ? '' : path.posix.dirname(current)) : normalizeRel(dir);
      const next = targetDir === '' ? targetName : `${targetDir}/${targetName}`;
      const nextAbsolute = this.resolve(next);
      if (next !== current) {
        await fsp.mkdir(path.dirname(nextAbsolute), { recursive: true });
        if (await exists(nextAbsolute)) throw new RequestError(409, `${targetName} already exists in this folder`);
        await fsp.rename(absolute, nextAbsolute);
      }
      const body = typeof content === 'string' ? content : previous;
      if (body !== previous) {
        await this.snapshot(current, previous);
        await fsp.writeFile(nextAbsolute, body, 'utf8');
      }
      const index = await this.readIndex();
      const kept = index.files[current] ?? {};
      const normalizedTags = tags === undefined ? this.tagsOf(index, current) : normalizeTags(tags);
      delete index.files[current];
      if (normalizedTags.length > 0) index.files[next] = { ...kept, tags: normalizedTags };
      else if (Object.keys(kept).length > 0) delete index.files[next];
      await this.writeIndex(index);
      return { path: next };
    });
  }

  /** Delete one material file and its tags. */
  remove({ path: rel }) {
    return this.serialize(async () => {
      const normalized = normalizeRel(rel);
      if (normalized === '') throw new RequestError(400, 'refusing to delete the library root');
      const absolute = this.resolve(normalized);
      try {
        const stat = await fsp.stat(absolute);
        if (stat.isDirectory()) throw new RequestError(400, 'this path is a folder; use the folder action');
        await fsp.rm(absolute);
      } catch (error) {
        if (error && error.code === 'ENOENT') throw new RequestError(404, 'material not found');
        throw error;
      }
      const index = await this.readIndex();
      if (index.files[normalized] !== undefined) {
        delete index.files[normalized];
        await this.writeIndex(index);
      }
      return { path: normalized };
    });
  }

  /** Create a folder, including missing parents. */
  createFolder({ dir, name }) {
    return this.serialize(async () => {
      await this.ensure();
      const parent = normalizeRel(dir ?? '');
      const folder = sanitizeName(name, '');
      if (folder === '') throw new RequestError(400, 'folder name is required');
      const rel = parent === '' ? folder : `${parent}/${folder}`;
      const absolute = this.resolve(rel);
      if (await exists(absolute)) throw new RequestError(409, `${folder} already exists`);
      /* A parent folder can exist only as a label that references carry, with no
         directory on disk yet, so materialise the ancestors before the leaf. */
      await fsp.mkdir(path.dirname(absolute), { recursive: true });
      await fsp.mkdir(absolute, { recursive: false });
      return { path: rel };
    });
  }

  /** Delete an empty folder; a non-empty one must be emptied first. */
  removeFolder({ path: rel }) {
    return this.serialize(async () => {
      const normalized = normalizeRel(rel);
      if (normalized === '') throw new RequestError(400, 'refusing to delete the library root');
      const absolute = this.resolve(normalized);
      const index = await this.readIndex();
      /* References keep their own folder label, so a folder may hold nothing but
         labelled references and no directory on disk at all. */
      const labelled = refsInFolder(index, normalized);
      if (labelled.length > 0) {
        throw new RequestError(409, 'folder still holds references; move them first');
      }
      let entries;
      try {
        entries = await fsp.readdir(absolute);
      } catch (error) {
        if (error && error.code === 'ENOENT') throw new RequestError(404, 'folder not found');
        throw error;
      }
      const meaningful = entries.filter((entry) => !entry.startsWith('.'));
      if (meaningful.length > 0) throw new RequestError(409, 'folder is not empty');
      await fsp.rmdir(absolute);
      const prefix = `${normalized}/`;
      let touched = false;
      for (const key of Object.keys(index.files)) {
        if (key.startsWith(prefix)) {
          delete index.files[key];
          touched = true;
        }
      }
      if (touched) await this.writeIndex(index);
      return { path: normalized };
    });
  }

  /** Rename (or move) a folder, both on disk and in the index. */
  renameFolder({ path: rel, name, dir }) {
    return this.serialize(async () => {
      const from = normalizeRel(rel);
      if (from === '') throw new RequestError(400, 'cannot rename the library root');
      const leaf = sanitizeName(name, '');
      if (leaf === '') throw new RequestError(400, 'folder name is required');
      const parent = typeof dir === 'string'
        ? normalizeRel(dir)
        : from.includes('/')
          ? from.slice(0, from.lastIndexOf('/'))
          : '';
      const to = parent === '' ? leaf : `${parent}/${leaf}`;
      if (to === from) return { path: from, previous: from };
      const fromAbs = this.resolve(from);
      const toAbs = this.resolve(to);
      if (await exists(toAbs)) throw new RequestError(409, `${leaf} already exists`);
      let stat;
      try {
        stat = await fsp.stat(fromAbs);
      } catch {
        throw new RequestError(404, 'folder not found');
      }
      if (!stat.isDirectory()) throw new RequestError(400, 'that is not a folder');
      await fsp.mkdir(path.dirname(toAbs), { recursive: true });
      await fsp.rename(fromAbs, toAbs);

      const index = await this.readIndex();
      const fromPrefix = `${from}/`;
      const files = {};
      for (const [key, value] of Object.entries(index.files)) {
        if (key === from || key.startsWith(fromPrefix)) files[`${to}${key.slice(from.length)}`] = value;
        else files[key] = value;
      }
      index.files = files;
      for (const ref of Object.values(index.refs ?? {})) {
        const folder = String(ref.folder ?? '');
        if (folder === from) ref.folder = to;
        else if (folder.startsWith(fromPrefix)) ref.folder = `${to}${folder.slice(from.length)}`;
      }
      await this.writeIndex(index);
      return { path: to, previous: from };
    });
  }

  /** Rename a tag everywhere it is used. */
  renameTag({ from, to }) {
    return this.serialize(async () => {
      const before = normalizeTags([from])[0];
      const after = normalizeTags([to])[0];
      if (!before) throw new RequestError(400, 'tag is required');
      if (!after) throw new RequestError(400, 'new tag name is required');
      if (before.toLowerCase() === after.toLowerCase()) return { from: before, to: before };
      const index = await this.readIndex();
      const swap = (tags) => {
        const next = [];
        for (const tag of Array.isArray(tags) ? tags : []) {
          const value = String(tag).toLowerCase() === before.toLowerCase() ? after : tag;
          if (!next.some((seen) => String(seen).toLowerCase() === String(value).toLowerCase())) next.push(value);
        }
        return next;
      };
      for (const entry of Object.values(index.files ?? {})) entry.tags = swap(entry.tags);
      for (const ref of Object.values(index.refs ?? {})) ref.tags = swap(ref.tags);
      await this.writeIndex(index);
      return { from: before, to: after };
    });
  }

  /** Remove a tag from every note and reference. */
  removeTag({ name }) {
    return this.serialize(async () => {
      const target = normalizeTags([name])[0];
      if (!target) throw new RequestError(400, 'tag is required');
      const index = await this.readIndex();
      const strip = (tags) =>
        (Array.isArray(tags) ? tags : []).filter((tag) => String(tag).toLowerCase() !== target.toLowerCase());
      for (const entry of Object.values(index.files ?? {})) entry.tags = strip(entry.tags);
      for (const ref of Object.values(index.refs ?? {})) ref.tags = strip(ref.tags);
      await this.writeIndex(index);
      return { name: target };
    });
  }

  /** File a directory or file from a conversation into the library. */
  addRef(input) {
    const body = input && typeof input === 'object' ? input : {};
    return this.serialize(async () => {
      await this.ensure();
      const absPath = externalPath(body.absPath ?? body.path);
      let stat;
      try {
        stat = await fsp.stat(absPath);
      } catch {
        throw new RequestError(404, 'that file or folder does not exist any more');
      }
      const kind = body.kind === 'file' ? 'file' : stat.isDirectory() ? 'dir' : 'file';
      const folder = normalizeRel(body.folder ?? '');
      if (folder !== '') await fsp.mkdir(this.resolve(folder), { recursive: true });
      const cwd = typeof body.cwd === 'string' ? body.cwd : '';
      const relPath = cwd !== '' && (absPath === cwd || absPath.startsWith(cwd + path.sep))
        ? path.relative(cwd, absPath)
        : path.basename(absPath);
      const index = await this.readIndex();
      const existing = Object.keys(index.refs).find((key) => {
        const entry = index.refs[key];
        return entry && entry.absPath === absPath;
      });
      if (existing !== undefined) {
        throw new RequestError(409, 'that target is already in the library');
      }
      const id = `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const counts = kind === 'dir' ? await countTree(absPath) : { files: 1, folders: 0 };
      index.refs[id] = {
        name: sanitizeName(body.name, path.basename(absPath) || 'reference'),
        folder,
        tags: normalizeTags(body.tags),
        kind,
        sessionId: typeof body.sessionId === 'string' ? body.sessionId : '',
        sessionTitle: typeof body.sessionTitle === 'string' ? body.sessionTitle : '',
        cwd,
        absPath,
        relPath,
        createdAt: Date.now(),
        counts,
      };
      await this.writeIndex(index);
      if (body.remember !== false) {
        await this.saveRule({
          root: kind === 'dir' ? absPath : path.dirname(absPath),
          kind: 'dir',
          folder,
          tags: normalizeTags(body.tags),
          include: null,
          names: kind === 'dir' ? [] : [path.basename(absPath)],
          depth: 1,
          sessionId: typeof body.sessionId === 'string' ? body.sessionId : '',
          sessionTitle: typeof body.sessionTitle === 'string' ? body.sessionTitle : '',
          cwd,
          scheduled: body.scheduled,
        });
      }
      return { id, absPath, relPath, kind };
    });
  }

  /** Rename, refile, or retag one reference entry. */
  /** One reference entry by id, without touching its target. */
  async readRefEntry(id) {
    const key = String(id ?? '');
    if (!key) throw new RequestError(400, 'id is required');
    const index = await this.readIndex();
    const ref = index.refs[key];
    if (!ref) throw new RequestError(404, 'reference not found');
    return { id: key, ...ref };
  }

  /**
   * File a file or a folder into the library as references (originals untouched).
   * A path that is already in the library is refreshed in place instead of being
   * added twice, so a scheduled task can call this on every single run.
   */
  archive(input) {
    const body = input && typeof input === 'object' ? input : {};
    return this.serialize(() => this.archiveInner(body));
  }

  /** The body of archive(); the caller already holds the write queue. */
  async archiveInner(body) {
    {
      await this.ensure();
      const rawPath = expandTarget(body.path);
      if (rawPath === '') throw new RequestError(400, 'path is required');
      const absTarget = path.resolve(rawPath);
      let stat;
      try {
        stat = await fsp.stat(absTarget);
      } catch {
        throw new RequestError(404, `no such file or folder: ${absTarget}`);
      }
      const folderRaw = body.folder === undefined || body.folder === null ? '' : String(body.folder);
      const folder = folderRaw.trim() === '' ? '' : normalizeRel(folderRaw);
      if (folder !== '') await fsp.mkdir(this.resolve(folder), { recursive: true });
      const tags = normalizeTags(body.tags);
      const include = parseIncludes(body.include);
      const depth = Number.isInteger(body.depth) ? Math.max(0, Math.min(MAX_DEPTH, body.depth)) : 1;
      const limit = Number.isInteger(body.limit) ? Math.max(1, Math.min(ARCHIVE_MAX_ENTRIES, body.limit)) : ARCHIVE_DEFAULT_LIMIT;
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
      const sessionTitle = typeof body.sessionTitle === 'string' ? body.sessionTitle : '';
      const cwd = typeof body.cwd === 'string' ? body.cwd : '';

      const targets = [];
      let truncated = false;
      if (stat.isDirectory() && depth > 0) {
        const walk = async (dir, level) => {
          let entries;
          try {
            entries = await fsp.readdir(dir, { withFileTypes: true });
          } catch {
            return;
          }
          entries.sort((a, b) => a.name.localeCompare(b.name));
          for (const entry of entries) {
            if (targets.length >= limit) {
              truncated = true;
              return;
            }
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            if (JUNK_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (level < depth) await walk(full, level + 1);
              continue;
            }
            if (!entry.isFile()) continue;
            if (include !== null && !include.some((match) => match(entry.name))) continue;
            targets.push(full);
          }
        };
        await walk(absTarget, 1);
      } else {
        targets.push(absTarget);
      }

      const index = await this.readIndex();
      const byPath = new Map();
      for (const [id, entry] of Object.entries(index.refs)) {
        if (entry && typeof entry.absPath === 'string') byPath.set(entry.absPath, id);
      }

      const archived = [];
      for (const target of targets) {
        const existingId = byPath.get(target);
        if (existingId !== undefined) {
          const entry = index.refs[existingId];
          const current = Array.isArray(entry.tags) ? entry.tags : [];
          const merged = normalizeTags([...current, ...tags]);
          const changed = merged.length !== current.length || (folder !== '' && entry.folder !== folder);
          if (merged.length !== current.length) entry.tags = merged;
          if (folder !== '' && entry.folder !== folder) entry.folder = folder;
          if (changed) entry.updatedAt = Date.now();
          archived.push({ id: existingId, absPath: target, name: entry.name, kind: entry.kind, folder: entry.folder, tags: entry.tags ?? [], added: false });
          continue;
        }
        let targetStat;
        try {
          targetStat = await fsp.stat(target);
        } catch {
          continue;
        }
        const kind = targetStat.isDirectory() ? 'dir' : 'file';
        const id = `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const counts = kind === 'dir' ? await countTree(target) : { files: 1, folders: 0 };
        const fallback = path.basename(target) || 'reference';
        const name = sanitizeName(targets.length === 1 ? body.name : undefined, fallback);
        const relPath = cwd !== '' && (target === cwd || target.startsWith(cwd + path.sep))
          ? path.relative(cwd, target)
          : path.basename(target);
        index.refs[id] = {
          name,
          folder,
          tags,
          kind,
          sessionId,
          sessionTitle,
          cwd,
          absPath: target,
          relPath,
          createdAt: Date.now(),
          counts,
        };
        byPath.set(target, id);
        archived.push({ id, absPath: target, name, kind, folder, tags, added: true });
      }
      await this.writeIndex(index);
      if (body.remember !== false && sessionId !== '' && archived.length > 0) {
        const rememberDepth = Math.min(depth, AUTO_RULE_DEPTH);
        const explicitInclude = typeof body.include === 'string' && body.include !== '' ? body.include : null;
        const names = archived.map((item) => path.basename(String(item.absPath ?? item.name ?? '')));
        const isDir = stat.isDirectory();
        // A single deliverable in a folder: remember the folder plus its file
        // type, so the next run's fresh file of the same kind is picked up and
        // its intermediate siblings are not.
        const ruleRoot = isDir ? absTarget : path.dirname(absTarget);
        await this.saveRule({
          root: ruleRoot,
          kind: 'dir',
          folder,
          tags,
          include: explicitInclude,
          names,
          depth: isDir ? rememberDepth : 1,
          sessionId,
          sessionTitle,
          cwd,
          scheduled: body.scheduled,
        });
      }
      return { root: this.root, folder, archived, truncated, limit };
    }
  }

  updateRef(input) {
    const body = input && typeof input === 'object' ? input : {};
    return this.serialize(async () => {
      const index = await this.readIndex();
      const id = typeof body.id === 'string' ? body.id : '';
      const entry = index.refs[id];
      if (!entry) throw new RequestError(404, 'reference not found');
      if (body.name !== undefined) entry.name = sanitizeName(body.name, entry.name);
      if (body.folder !== undefined) {
        const folder = normalizeRel(body.folder);
        if (folder !== '' ) await fsp.mkdir(this.resolve(folder), { recursive: true });
        entry.folder = folder;
      }
      if (body.tags !== undefined) entry.tags = normalizeTags(body.tags);
      await this.writeIndex(index);
      return { id };
    });
  }

  /** Drop one reference entry; the files it points at are never touched. */
  removeRef(input) {
    const body = input && typeof input === 'object' ? input : {};
    return this.serialize(async () => {
      const index = await this.readIndex();
      const id = typeof body.id === 'string' ? body.id : '';
      if (!index.refs[id]) throw new RequestError(404, 'reference not found');
      delete index.refs[id];
      await this.writeIndex(index);
      return { id };
    });
  }

  /** Raw bytes of a referenced file, for the picture/document preview. */
  async readRefRaw({ id }) {
    const index = await this.readIndex();
    const ref = index.refs[typeof id === 'string' ? id : ''];
    if (!ref) throw new RequestError(404, 'reference not found');
    const target = externalPath(ref.absPath);
    let stat;
    try {
      stat = await fsp.stat(target);
    } catch {
      throw new RequestError(404, 'that file is no longer there');
    }
    if (!stat.isFile()) throw new RequestError(400, 'that target is not a file');
    if (stat.size > MAX_RAW_BYTES) throw new RequestError(413, 'that file is too large to preview');
    const bytes = await fsp.readFile(target);
    return { target, bytes, modified: stat.mtimeMs };
  }

  /** One level of a real directory, for the "file this from a conversation" picker. */
  async listExternal({ path: target, showHidden }) {
    const dir = externalPath(target);
    let stat;
    try {
      stat = await fsp.stat(dir);
    } catch {
      throw new RequestError(404, 'that folder does not exist');
    }
    if (!stat.isDirectory()) throw new RequestError(400, 'that path is not a folder');
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new RequestError(403, message);
    }
    const show = showHidden === true || showHidden === '1' || showHidden === 'true';
    const rows = [];
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (!show && entry.name.startsWith('.')) continue;
      if (entry.name === 'node_modules') continue;
      const child = path.join(dir, entry.name);
      let childStat = null;
      try {
        childStat = await fsp.stat(child);
      } catch {
        continue;
      }
      rows.push({
        name: entry.name,
        path: child,
        type: entry.isDirectory() ? 'dir' : 'file',
        size: childStat.size,
        updatedAt: childStat.mtimeMs,
      });
      if (rows.length >= MAX_LIST_ENTRIES) break;
    }
    rows.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
    const parent = path.dirname(dir);
    return {
      path: dir,
      name: path.basename(dir) || dir,
      parent: parent === dir ? null : parent,
      entries: rows,
      truncated: rows.length >= MAX_LIST_ENTRIES,
    };
  }

  /** A readable slice of a referenced file, so a reference opens like a document. */
  async readRefPreview({ id }) {
    const index = await this.readIndex();
    const ref = index.refs[typeof id === 'string' ? id : ''];
    if (ref === undefined) throw new RequestError(404, 'that reference does not exist');
    if (ref.kind !== 'file') throw new RequestError(400, 'only a file reference has text');
    const absolute = externalPath(ref.absPath);
    let stat;
    try {
      stat = await fsp.stat(absolute);
    } catch {
      throw new RequestError(404, 'that file does not exist');
    }
    if (!stat.isFile()) throw new RequestError(400, 'that path is not a file');
    const name = path.basename(absolute);
    const extension = path.extname(name).toLowerCase();
    const readable = PREVIEW_EXTENSIONS.has(extension) || extension === '';
    if (!readable) return { ok: true, path: absolute, name, binary: true, text: '', tooLarge: false };
    if (stat.size > MAX_PREVIEW_BYTES) {
      return { ok: true, path: absolute, name, binary: false, text: '', tooLarge: true };
    }
    let text = '';
    try {
      text = await fsp.readFile(absolute, 'utf8');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new RequestError(403, message);
    }
    return { ok: true, path: absolute, name, binary: false, text, tooLarge: false, truncated: false };
  }

  /** Case-insensitive full-text search over material bodies and tags. */
  async search({ query, tags }) {
    const needle = typeof query === 'string' ? query.trim().toLowerCase() : '';
    const wanted = normalizeTags(tags);
    const snapshot = await this.state();
    const results = [];
    for (const ref of snapshot.refs) {
      if (wanted.length > 0 && !wanted.every((tag) => ref.tags.some((own) => own.toLowerCase() === tag.toLowerCase()))) continue;
      const haystack = `${ref.name} ${ref.absPath} ${ref.relPath} ${ref.folder}`.toLowerCase();
      if (needle !== '' && !haystack.includes(needle)) continue;
      results.push({ ...ref, snippet: ref.absPath });
    }
    for (const file of snapshot.files) {
      if (wanted.length > 0 && !wanted.every((tag) => file.tags.some((own) => own.toLowerCase() === tag.toLowerCase()))) continue;
      if (needle === '') {
        results.push({ ...file, snippet: file.excerpt });
        continue;
      }
      if (file.name.toLowerCase().includes(needle) || file.excerpt.toLowerCase().includes(needle)) {
        results.push({ ...file, snippet: file.excerpt });
        continue;
      }
      let body = '';
      try {
        body = await fsp.readFile(this.resolve(file.path), 'utf8');
      } catch {
        continue;
      }
      const at = body.toLowerCase().indexOf(needle);
      if (at === -1) continue;
      const start = Math.max(0, at - 60);
      const snippet = body
        .slice(start, Math.min(body.length, at + needle.length + 100))
        .replace(/\s+/g, ' ')
        .trim();
      results.push({ ...file, snippet: start > 0 ? `…${snippet}` : snippet });
      if (results.length >= 200) break;
    }
    return { root: snapshot.root, results, total: results.length, query: needle };
  }
}

/** References whose folder label is `folder` or nested under it. */
function refsInFolder(index, folder) {
  const prefix = `${folder}/`;
  return Object.values(index.refs ?? {}).filter(
    (ref) => ref.folder === folder || String(ref.folder ?? '').startsWith(prefix),
  );
}

/** Content type for the preview route, keyed by extension. */
const CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
};

/** Content type of one path. */
function contentTypeOf(target) {
  return CONTENT_TYPES[path.extname(String(target ?? '')).toLowerCase()] ?? 'application/octet-stream';
}

/** Hand a file to macOS: default app, a named app, or reveal it in Finder. */
async function openWith({ path: target, app, reveal }) {
  const resolved = externalPath(target);
  try {
    await fsp.stat(resolved);
  } catch {
    throw new RequestError(404, 'that file is no longer there');
  }
  if (reveal === true) {
    await run('open', ['-R', resolved], { timeout: 10_000 });
    return { path: resolved, app: 'Finder', reveal: true };
  }
  const bundle = typeof app === 'string' ? app.trim() : '';
  if (bundle !== '') {
    const apps = await installedApps();
    const match = apps.find((item) => item.path === bundle);
    if (match === undefined) throw new RequestError(400, 'unknown application');
    await run('open', ['-a', match.path, resolved], { timeout: 10_000 });
    return { path: resolved, app: match.name, reveal: false };
  }
  await run('open', [resolved], { timeout: 10_000 });
  return { path: resolved, app: '', reveal: false };
}

/** Whether a path exists (any type). */
async function exists(target) {
  try {
    await fsp.stat(target);
    return true;
  } catch {
    return false;
  }
}

/** Answer one JSON response. */
function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  response.end(body);
}

/** Only same-origin browser requests are served: this route has no cookies of its own. */
function trustedRequest(request) {
  const origin = request.headers.origin;
  if (origin === undefined) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

/** Read and parse a JSON request body. */
async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new RequestError(413, 'request body is too large');
    chunks.push(chunk);
  }
  if (size === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return parsed !== null && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new RequestError(400, 'request body must be JSON');
  }
}

/** Route one request to the store method that serves it. */
async function handle(request, response, store) {
  if (!trustedRequest(request)) {
    sendJson(response, 403, { ok: false, error: 'cross-origin request refused' });
    return;
  }
  const url = new URL(request.url ?? '/', 'http://localhost');
  const route = url.pathname.slice(API_PREFIX.length) || '/';
  const method = request.method ?? 'GET';
  try {
    if (method === 'GET') {
      if (route === '/' || route === '/health') {
        sendJson(response, 200, { ok: true, root: store.root });
        return;
      }
      if (route === '/state') {
        const snapshot = await store.state();
        sendJson(response, 200, { ok: true, ...snapshot });
        return;
      }
      if (route === '/file') {
        const material = await store.read(url.searchParams.get('path') ?? '');
        sendJson(response, 200, { ok: true, ...material });
        return;
      }
      if (route === '/home') {
        sendJson(response, 200, { ok: true, path: HOME_ROOT });
        return;
      }
      if (route === '/rules') {
        sendJson(response, 200, { ok: true, rules: await store.listRules() });
        return;
      }
      if (route === '/session-times') {
        sendJson(response, 200, { ok: true, times: await readSessionTimes() });
        return;
      }
      if (route === '/ref/preview') {
        const preview = await store.readRefPreview({ id: url.searchParams.get('id') ?? '' });
        sendJson(response, 200, preview);
        return;
      }
      if (route === '/openers') {
        const target = externalPath(url.searchParams.get('path') ?? '');
        let name = path.basename(target);
        let kind = kindOf(target);
        let isDir = false;
        try {
          const stat = await fsp.stat(target);
          isDir = stat.isDirectory();
        } catch {
          throw new RequestError(404, 'that target is no longer there');
        }
        if (isDir) kind = 'folder';
        sendJson(response, 200, { ok: true, path: target, name, kind, items: isDir ? [] : await openersFor(target) });
        return;
      }
      if (route === '/ref/raw') {
        const raw = await store.readRefRaw({ id: url.searchParams.get('id') ?? '' });
        response.writeHead(200, {
          'Content-Type': contentTypeOf(raw.target),
          'Content-Length': String(raw.bytes.length),
          'Cache-Control': 'no-store',
        });
        response.end(raw.bytes);
        return;
      }
      if (route === '/raw') {
        const raw = await store.readRaw(url.searchParams.get('path') ?? '');
        response.writeHead(200, {
          'Content-Type': contentTypeOf(raw.target),
          'Content-Length': String(raw.bytes.length),
          'Cache-Control': 'no-store',
        });
        response.end(raw.bytes);
        return;
      }
      if (route === '/versions') {
        const listed = await store.listVersions(url.searchParams.get('path') ?? '');
        sendJson(response, 200, { ok: true, ...listed });
        return;
      }
      if (route === '/version') {
        const version = await store.readVersion({
          path: url.searchParams.get('path') ?? '',
          id: url.searchParams.get('id') ?? '',
        });
        sendJson(response, 200, { ok: true, ...version });
        return;
      }
      if (route === '/list') {
        const listing = await store.listExternal({
          path: url.searchParams.get('path') ?? '',
          showHidden: url.searchParams.get('hidden'),
        });
        sendJson(response, 200, { ok: true, ...listing });
        return;
      }
      if (route === '/search') {
        const tagParams = url.searchParams.getAll('tag');
        const result = await store.search({ query: url.searchParams.get('q') ?? '', tags: tagParams });
        sendJson(response, 200, { ok: true, ...result });
        return;
      }
      sendJson(response, 404, { ok: false, error: `unknown route ${route}` });
      return;
    }
    if (method !== 'POST') {
      sendJson(response, 405, { ok: false, error: 'GET or POST only' });
      return;
    }
    const body = await readJsonBody(request);
    switch (route) {
      case '/create': {
        const created = await store.create(body);
        sendJson(response, 200, { ok: true, ...created });
        return;
      }
      case '/update': {
        const updated = await store.update(body);
        sendJson(response, 200, { ok: true, ...updated });
        return;
      }
      case '/delete': {
        const removed = await store.remove(body);
        sendJson(response, 200, { ok: true, ...removed });
        return;
      }
      case '/folder': {
        const folder = await store.createFolder(body);
        sendJson(response, 200, { ok: true, ...folder });
        return;
      }
      case '/ref/add': {
        const added = await store.addRef(body);
        sendJson(response, 200, { ok: true, ...added });
        return;
      }
      case '/ref/update': {
        const ref = await store.updateRef(body);
        sendJson(response, 200, { ok: true, ...ref });
        return;
      }
      case '/ref/delete': {
        const ref = await store.removeRef(body);
        sendJson(response, 200, { ok: true, ...ref });
        return;
      }
      case '/open': {
        const opened = await openWith(body);
        sendJson(response, 200, { ok: true, ...opened });
        return;
      }
      case '/folder/rename': {
        const folder = await store.renameFolder(body);
        sendJson(response, 200, { ok: true, ...folder });
        return;
      }
      case '/tag/rename': {
        const tag = await store.renameTag(body);
        sendJson(response, 200, { ok: true, ...tag });
        return;
      }
      case '/tag/delete': {
        const tag = await store.removeTag(body);
        sendJson(response, 200, { ok: true, ...tag });
        return;
      }
      case '/restore': {
        const restored = await store.restoreVersion(body);
        sendJson(response, 200, { ok: true, ...restored });
        return;
      }
      case '/import': {
        const imported = await store.importPath(body);
        sendJson(response, 200, { ok: true, ...imported });
        return;
      }
      case '/archive': {
        const archived = await store.archive(body);
        sendJson(response, 200, { ok: true, ...archived });
        return;
      }
      case '/rules/delete': {
        const removed = await store.removeRule(body);
        sendJson(response, 200, { ok: true, ...removed });
        return;
      }
      case '/rules/run': {
        const ran = await store.runRules(body.sessionId);
        sendJson(response, 200, { ok: true, ...ran });
        return;
      }
      case '/ref/copy': {
        const refund = await store.readRefEntry(body.id);
        const imported = await store.importPath({
          from: refund.absPath,
          dir: body.dir ?? refund.folder ?? '',
          name: body.name ?? refund.name,
          tags: body.tags ?? refund.tags,
        });
        sendJson(response, 200, { ok: true, ...imported });
        return;
      }
      case '/folder/delete': {
        const folder = await store.removeFolder(body);
        sendJson(response, 200, { ok: true, ...folder });
        return;
      }
      default:
        sendJson(response, 404, { ok: false, error: `unknown route ${route}` });
    }
  } catch (error) {
    if (error instanceof RequestError) {
      sendJson(response, error.status, { ok: false, error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    sendJson(response, 500, { ok: false, error: message });
  }
}

/** One line per archived entry, for the agent to read back. */
function renderArchive(result) {
  const entries = Array.isArray(result?.archived) ? result.archived : [];
  if (entries.length === 0) return 'Nothing matched, so the library is unchanged.';
  const added = entries.filter((entry) => entry.added).length;
  const refreshed = entries.length - added;
  const lines = [`Filed ${entries.length} reference(s) into the materials library: ${added} new, ${refreshed} refreshed.`];
  for (const entry of entries) {
    const where = entry.folder === '' ? 'root' : entry.folder;
    lines.push(`- ${entry.name} — ${entry.kind === 'dir' ? 'folder' : 'file'} in ${where}${entry.added ? '' : ' (already filed)'} → ${entry.absPath}`);
  }
  if (result?.truncated) lines.push(`Stopped at the limit of ${result.limit}; raise limit or narrow include to file the rest.`);
  lines.push('The originals were not moved or copied. Library root: ' + result.root);
  return lines.join('\n');
}

/**
 * The agent-facing tool: file what a task just produced into the library.
 * Reference entries only — the files stay exactly where they are.
 */
function buildArchiveTool(store) {
  return {
    name: 'materials_archive',
    description:
      'File the finished deliverable of a task into the materials library as a reference (the original is not moved or copied). Point it at the final output folder or the final file, not at scratch files. Inside a scheduled run, filing once also remembers the rule: the same file type in the same folder is filed automatically at the end of every later scheduled run, so a daily task only calls this once. Ordinary chat turns never start automatic filing. A path already in the library is refreshed (tags, folder) instead of being added twice. 中文：把任务的最终交付物收进材料库，只记引用、原件不动；指向最终成品或成品所在目录，不要指向过程草稿。在定时任务里收一次就会记住规则：同一目录、同一类文件此后每次定时跑完自动入库，日常任务只需调用一次；普通对话轮次不会自动收录。同一条路径重复归档只更新标签与所在文件夹，不会重复入库。',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: "File or folder to file. Supports ~. A relative path resolves against this session's working directory. Omitted: the working directory itself.",
        },
        folder: {
          type: 'string',
          description: 'Library folder to file them under, e.g. "日报/2026-11". Omitted or empty: the library root.',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to attach, e.g. ["日报","v2ex"]. Tags already on a filed entry are kept and merged with these.',
        },
        depth: {
          type: 'integer',
          description: 'How deep to walk when path is a folder. 1 (default) files the files directly inside it; 0 files the folder itself as one entry; up to 12.',
        },
        include: {
          type: 'string',
          description: 'Only names matching these, comma separated, e.g. ".html,.md" or "*.png". Omitted: every file.',
        },
        limit: {
          type: 'integer',
          description: 'Stop after this many entries (default 50, max 200).',
        },
        name: {
          type: 'string',
          description: 'Entry name when exactly one file or folder is filed. Omitted: its own file name.',
        },
      },
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => [{ type: 'text', text: renderArchive(value) }],
    },
    async execute(args, exec) {
      const session = exec?.agent?.session;
      const header = session?.header ?? {};
      const cwd = typeof header.cwd === 'string' && header.cwd !== '' ? header.cwd : process.cwd();
      const requested = expandTarget(args?.path);
      const target = requested === '' ? cwd : path.isAbsolute(requested) ? requested : path.resolve(cwd, requested);
      return store.archive({
        path: target,
        folder: args?.folder,
        tags: args?.tags,
        depth: args?.depth,
        include: args?.include,
        limit: args?.limit,
        name: args?.name,
        cwd,
        sessionId: typeof session?.id === 'string' ? session.id : '',
        sessionTitle: typeof header.title === 'string' ? header.title : '',
        scheduled: store.isScheduled(typeof session?.id === 'string' ? session.id : ''),
      });
    },
  };
}

/**
 * Register the library route and the archive tool.
 * @param ctx - host context carrying the web server.
 * @param config - bundle config; only `root` is read.
 */
export async function apply(ctx, config) {
  const store = new MaterialsStore(resolveRoot(config));
  await store.ensure();
  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'prefix',
      path: API_PREFIX,
      handler: (request, response) => handle(request, response, store),
    });
    return () => dispose();
  }, 'materials.route');
  const registerTool = (host) => {
    host.effect(() => {
      const dispose = host.tools.register(buildArchiveTool(store));
      return () => dispose();
    }, 'materials.archive-tool');
  };
  if (typeof ctx.inject === 'function') {
    ctx.inject(['tools'], registerTool);
  } else if (ctx.tools && typeof ctx.tools.register === 'function') {
    registerTool(ctx);
  }
  const sessionsOf = () => (typeof ctx.get === 'function' ? ctx.get('sessions') : ctx.sessions);
  /**
   * Did a scheduled task start the current turn? The reminder the scheduler
   * delivers is a user message that opens with the marker, so the newest user
   * message of the session answers it. A human typing in the same session makes
   * the newest message theirs, and then nothing files itself.
   */
  const isScheduledSession = (session) => {
    try {
      if (!session || typeof session.snapshotEvents !== 'function') return false;
      const events = session.snapshotEvents();
      for (let index = events.length - 1; index >= 0; index -= 1) {
        const event = events[index];
        if (!event || event.type !== 'user/message') continue;
        return messageText(event.data).includes(SCHEDULE_MARK);
      }
      return false;
    } catch {
      return false;
    }
  };
  store.scheduleProbe = (sessionId) => {
    try {
      const sessions = sessionsOf();
      if (!sessions || typeof sessions.get !== 'function') return false;
      return isScheduledSession(sessions.get(sessionId));
    } catch {
      return false;
    }
  };
  const lastRun = new Map();
  const onTurnStopping = (payload) => {
    const session = payload && payload.agent && payload.agent.session ? payload.agent.session : null;
    const sessionId = session && typeof session.id === 'string' ? session.id : '';
    if (sessionId === '') return;
    // Automatic filing is for scheduled tasks only; a chat turn stays untouched.
    if (!isScheduledSession(session)) return;
    const now = Date.now();
    const previous = lastRun.get(sessionId) ?? 0;
    if (now - previous < 3000) return;
    lastRun.set(sessionId, now);
    void store
      .runRules(sessionId)
      .then((result) => {
        const added = result.applied.reduce((sum, item) => sum + (item.added ?? 0), 0);
        if (added > 0) ctx.logger.info('materials: auto-filed %d item(s) for %s', added, sessionId);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        ctx.logger.warn('materials: auto-filing failed: %s', message);
      });
  };
  if (typeof ctx.on === 'function') {
    ctx.effect(() => {
      const dispose = ctx.on('agent/turn-stopping', onTurnStopping);
      return () => {
        if (typeof dispose === 'function') dispose();
      };
    }, 'materials.auto-archive');
  }
  ctx.logger.info('materials: library at %s', store.root);
}
