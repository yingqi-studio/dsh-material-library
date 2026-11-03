/**
 * Browser half of the Materials bundle.
 *
 * One left-sidebar entry opens a full panel: folder tree on the left, material
 * list in the middle, editor on the right. Every action goes through the host
 * half over `/api/dsh-materials`, so what the panel shows is what is actually on
 * disk.
 */
window.__ModuleLoader__.load({
  id: 'dsh-material-library',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useState } = React;

    const NS = 'dshMaterials';
    const PANEL_ID = 'materials';
    const API = '/api/dsh-materials';

    const ZH = {
      panel: '材料库',
      title: '材料库',
      subtitle: '对话里值得留下的东西，按文件夹存放，用标签归类。',
      refresh: '刷新',
      search: '搜索',
      searchPlaceholder: '搜索名称、正文或标签',
      folders: '文件夹',
      rootFolder: '全部材料',
      tagFilter: '标签',
      searchFilter: '搜索',
      clearFilter: '清除筛选',
      newFolder: '新建文件夹',
      folderName: '文件夹名称',
      create: '创建',
      cancel: '取消',
      tags: '标签',
      allTags: '全部标签',
      untagged: '未打标签',
      materials: '材料',
      empty: '这里还没有材料',
      emptyHint: '把对话里关键的内容贴进来，起个名字，以后随时能找回。',
      newMaterial: '新建材料',
      collectFromSession: '从对话采集',
      collectFolderOther: '或输入新文件夹，如 客户/交付物',
      collectTarget: '将存为',
      pickSession: '选择对话',
      pickSessionHint: '选一个对话，浏览它的工作目录，把要留的目录或文件收进材料库。',
      pickSessionEmpty: '没有可选的对话',
      sessionSearch: '搜对话标题或目录…',
      sessionNoCwd: '没有工作目录',
      name: '名称',
      folder: '文件夹',
      content: '正文',
      tagsField: '标签（用逗号分隔）',
      save: '保存',
      saved: '已保存',
      saving: '保存中…',
      close: '关闭',
      delete: '删除',
      deleteFolder: '删除文件夹',
      autoRules: '自动归档',
      rulePending: '有一个定时任务这轮没产出，等你重跑后自动补收',
      stopAutoRule: '不再自动归档',
      confirmDelete: '确认删除',
      confirmDeleteFolder: '确认删除文件夹',
      folderNotEmpty: '文件夹里还有材料，先清空再删除。',
      folderHasRefs: '这个文件夹里还有引用，先把引用移到别处再删。',
      folderMissing: '这个文件夹已经不在磁盘上了。',
      folderExists: '同名文件夹已经有了。',
      fsMissing: '磁盘上找不到这个位置，可能被移动或删除了。',
      pickOne: '从左侧选一条材料，或新建一条。',
      loading: '加载中…',
      total: '条材料',
      truncated: '材料太多，只显示了一部分。',
      updated: '更新于',
      root: '根目录',
      moveTo: '文件夹路径，留空放在根目录',
      folderHint: '留空=根目录',
      rename: '重命名',
      renameTag: '重命名标签',
      removeTag: '删除标签',
      confirmRemoveTag: '确认删除？',
      tagRenamed: '标签已改名',
      tagRemoved: '标签已删除',
      folderRenamed: '文件夹已改名',
      rename: '重命名',
      moveHint: '改「文件夹」并保存，即可移动材料。',
      noResult: '没有匹配的材料',
      nameRequired: '名称不能为空',
      saveFailed: '保存失败',
      rootPath: '存放位置',
      openFolder: '展开',
      closeFolder: '收起',
      ref: '引用',
      refKindFile: '文件',
      refKindDir: '目录',
      refTarget: '目标位置',
      refSession: '来自会话',
      refMissing: '目标已经不在磁盘上了',
      open: '打开',
      openEntry: '在右侧打开',
      deleteRef: '移除引用',
      confirmDeleteRef: '确认移除引用',
      refRemoved: '已移除引用',
      collect: '收进材料库',
      collectTitle: '把这次的产出归进材料库',
      collectHint: '选一个目录或文件，起个名字，之后在材料库里一点就能回到这里。',
      collectFolderHere: '收这个目录',
      collectFileHere: '收这个文件',
      collectChoose: '点击目录进入，点击文件选中',
      collectUp: '上一层',
      collectLibFolder: '库内文件夹',
      collectTags: '标签（用逗号分隔）',
      collectDone: '已收进材料库',
      collectOpenLibrary: '去材料库看看',
      collectEmpty: '这个目录里没有可收的内容',
      collectHidden: '显示隐藏文件',
      collectNoCwd: '这个会话还没有工作目录，先从宿主目录开始选。',
      targetFile: '文件',
      targetDir: '目录',
      items: '项',
      noSession: '没有记录来源会话',
      breadcrumbRoot: '起点',
      pickHintDir: '当前选中的是目录；点文件可以改成选文件。',
      pickHintFile: '当前选中的是文件。',
      copyPath: '复制路径',
      copied: '已复制',
      scanning: '读取中…',
      count: '条',
    };

    const EN = {
      panel: 'Materials',
      title: 'Materials',
      subtitle: 'What is worth keeping from a conversation, filed in folders and sorted by tags.',
      refresh: 'Refresh',
      search: 'Search',
      searchPlaceholder: 'Search name, body or tag',
      folders: 'Folders',
      rootFolder: 'All materials',
      tagFilter: 'Tag',
      searchFilter: 'Search',
      clearFilter: 'Clear filter',
      newFolder: 'New folder',
      folderName: 'Folder name',
      create: 'Create',
      cancel: 'Cancel',
      tags: 'Tags',
      allTags: 'All tags',
      untagged: 'Untagged',
      materials: 'Materials',
      empty: 'No materials here yet',
      emptyHint: 'Paste what matters from the conversation, give it a name, and find it again later.',
      newMaterial: 'New material',
      collectFromSession: 'Collect from a chat',
      collectFolderOther: 'Or type a new folder, e.g. clients/deliverables',
      collectTarget: 'Will be saved as',
      pickSession: 'Pick a conversation',
      pickSessionHint: 'Pick a conversation, browse its working directory, and file what you want to keep.',
      pickSessionEmpty: 'No conversations to pick from',
      sessionSearch: 'Search title or folder…',
      sessionNoCwd: 'no working directory',
      name: 'Name',
      folder: 'Folder',
      content: 'Body',
      tagsField: 'Tags (comma separated)',
      save: 'Save',
      saved: 'Saved',
      saving: 'Saving…',
      close: 'Close',
      delete: 'Delete',
      deleteFolder: 'Delete folder',
      autoRules: 'Auto-filed',
      rulePending: 'a scheduled run came back empty — the next run of this task is filed automatically',
      stopAutoRule: 'Stop auto-filing',
      confirmDelete: 'Confirm delete',
      confirmDeleteFolder: 'Confirm folder delete',
      folderNotEmpty: 'The folder still holds materials; empty it first.',
      folderHasRefs: 'The folder still holds references; move them elsewhere first.',
      folderMissing: 'That folder is no longer on disk.',
      folderExists: 'A folder with that name already exists.',
      fsMissing: 'That location is gone from disk.',
      pickOne: 'Pick a material on the left, or create one.',
      loading: 'Loading…',
      total: 'materials',
      truncated: 'Too many materials; only some are shown.',
      updated: 'updated',
      root: 'root',
      moveTo: 'Folder path — blank puts it in the root',
      folderHint: 'empty = root',
      rename: 'Rename',
      renameTag: 'Rename tag',
      removeTag: 'Delete tag',
      confirmRemoveTag: 'Delete?',
      tagRenamed: 'Tag renamed',
      tagRemoved: 'Tag removed',
      folderRenamed: 'Folder renamed',
      rename: 'Rename',
      moveHint: 'Change “Folder” and save to move a material.',
      noResult: 'Nothing matched',
      nameRequired: 'A name is required',
      saveFailed: 'Could not save',
      rootPath: 'Stored in',
      openFolder: 'Expand',
      closeFolder: 'Collapse',
      ref: 'Reference',
      refKindFile: 'File',
      refKindDir: 'Folder',
      refTarget: 'Points at',
      refSession: 'From session',
      refMissing: 'The target is no longer on disk',
      open: 'Open',
      openEntry: 'Open in the right panel',
      deleteRef: 'Remove reference',
      confirmDeleteRef: 'Confirm removal',
      refRemoved: 'Reference removed',
      collect: 'File to library',
      collectTitle: 'File these outputs into the library',
      collectHint: 'Pick a folder or a file, name it, and one click later you are back here.',
      collectFolderHere: 'File this folder',
      collectFileHere: 'File this file',
      collectChoose: 'Click a folder to enter it, a file to select it',
      collectUp: 'Up',
      collectLibFolder: 'Library folder',
      collectTags: 'Tags (comma separated)',
      collectDone: 'Filed into the library',
      collectOpenLibrary: 'Open the library',
      collectEmpty: 'Nothing to file in this folder',
      collectHidden: 'Show hidden files',
      collectNoCwd: 'This session has no workspace yet, so the picker starts at your home folder.',
      targetFile: 'file',
      targetDir: 'folder',
      items: 'items',
      noSession: 'No originating session recorded',
      breadcrumbRoot: 'Start',
      pickHintDir: 'A folder is selected; click a file to select it instead.',
      pickHintFile: 'A file is selected.',
      copyPath: 'Copy path',
      copied: 'Copied',
      scanning: 'Reading…',
      count: '',
    };


    Object.assign(ZH, {
      back: '返回',
      forward: '前进',
      editDoc: '编辑',
      doneDoc: '完成',
      docNoContent: '这条材料还没有正文，点「编辑」写点什么。',
      sortHint: '点一下按修改日期排序',
      openHint: '双击打开',
      history: '历史版本',
      historyHint: '每次保存都会留下上一版，选一条可以查看，确认后恢复。',
      historyEmpty: '这条材料还没有历史版本。',
      historyPick: '从左边选一个版本查看正文。',
      restore: '恢复这个版本',
      restored: '已恢复',
      copyIntoLibrary: '收进库',
      copiedIntoLibrary: '已复制进库',
      pickHint: '从中间选一条材料，这里会显示它的内容。',
      openDefault: '默认应用',
      openWith: '打开方式',
      revealInFinder: '在 Finder 中显示',
      openInSession: '在原始会话右侧打开',
      opened: '已交给系统打开',
      revealed: '已在 Finder 中显示',
      newMaterial: '新素材',
      untitled: '未命名',
      kindImage: '图片',
      kindWeb: '网页',
      kindPdf: 'PDF',
      kindShell: '脚本',
      kindText: '文本',
      kindFile: '文件',
      kindFolder: '文件夹',
      panelHint: '点左侧的图标打开材料库',
      previewTooLarge: '这个文件太大，先不在这里展开，点「在右侧打开」看原文。',
      previewBinary: '这个文件不是文本，点「在右侧打开」用对应程序查看。',
    });

    Object.assign(EN, {
      back: 'Back',
      forward: 'Forward',
      editDoc: 'Edit',
      doneDoc: 'Done',
      docNoContent: 'Nothing written yet. Press Edit to start.',
      sortHint: 'Click to sort by date modified',
      openHint: 'Double-click to open',
      history: 'Versions',
      historyHint: 'Every save keeps the previous body. Pick one to look at it, then restore if you want it back.',
      historyEmpty: 'No saved versions yet.',
      historyPick: 'Pick a version on the left to read it.',
      restore: 'Restore this version',
      restored: 'Restored',
      copyIntoLibrary: 'Copy into library',
      copiedIntoLibrary: 'Copied into the library',
      pickHint: 'Pick a material in the middle column to see it here.',
      openDefault: 'Default app',
      openWith: 'Open with',
      revealInFinder: 'Show in Finder',
      openInSession: 'Open in original session',
      opened: 'Handed to the system',
      revealed: 'Revealed in Finder',
      newMaterial: 'New material',
      untitled: 'Untitled',
      kindImage: 'Image',
      kindWeb: 'Web page',
      kindPdf: 'PDF',
      kindShell: 'Script',
      kindText: 'Text',
      kindFile: 'File',
      kindFolder: 'Folder',
      panelHint: 'Open the library from the sidebar icon',
      previewTooLarge: 'Too large to preview here; open it in the right panel.',
      previewBinary: 'Not a text file; open it in the right panel.',
    });

    const CSS = `
.mat-root { display:flex; height:100%; min-height:0; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font-size:13px; }
.mat-col { display:flex; flex-direction:column; min-height:0; min-width:0; }
.mat-sidebar { width:236px; flex:0 0 236px; border-right:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); }
.mat-listcol { width:312px; flex:0 0 312px; border-right:1px solid var(--dsw-alias-border-l1); }
.mat-editor { flex:1 1 auto; background:var(--dsw-alias-bg-base); }
.mat-head { display:flex; align-items:center; gap:8px; padding:12px 14px 10px; }
.mat-head > .mat-input { flex:1 1 auto; }
.mat-tools { display:flex; align-items:center; gap:8px; padding:0 14px 10px; }
.mat-title { font-size:14px; font-weight:600; }
.mat-sub { padding:0 14px 10px; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:1.5; }
.mat-scroll { flex:1 1 auto; overflow:auto; min-height:0; padding:0 8px 12px; }
.mat-btn { white-space:nowrap; flex:0 0 auto; appearance:none; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); border-radius:6px; padding:4px 9px; font-size:12px; cursor:pointer; font-family:inherit; line-height:1.5; }
.mat-btn:hover:not(:disabled) { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); }
.mat-btn:disabled { opacity:.5; cursor:default; }
.mat-btn-primary { background:var(--dsw-alias-brand-primary); border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-bg-base); font-weight:600; }
.mat-btn-primary:hover:not(:disabled) { color:var(--dsw-alias-bg-base); opacity:.9; }
.mat-btn-danger { color:var(--dsw-alias-state-error-primary); }
.mat-btn-danger:hover:not(:disabled) { border-color:var(--dsw-alias-state-error-primary); color:var(--dsw-alias-state-error-primary); }
.mat-btn-ghost { background:transparent; border-color:transparent; }
.mat-input { width:100%; box-sizing:border-box; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); border-radius:6px; padding:5px 8px; font-size:12px; font-family:inherit; outline:none; }
.mat-input:focus { border-color:var(--dsw-alias-brand-primary); }
.mat-row { display:flex; align-items:center; gap:6px; }
.mat-row-gap { margin-top:8px; }
.mat-label { display:block; color:var(--dsw-alias-label-secondary); font-size:11px; margin:0 0 4px; letter-spacing:.02em; }
.mat-section { padding:8px 6px 4px; color:var(--dsw-alias-label-secondary); font-size:11px; text-transform:uppercase; letter-spacing:.06em; display:flex; align-items:center; justify-content:space-between; }
.mat-folder { display:flex; align-items:center; gap:4px; border-radius:6px; padding:3px 6px; cursor:pointer; color:var(--dsw-alias-label-primary); }
.mat-folder:hover { background:var(--dsw-alias-bg-layer-2); }
.mat-folder[data-active="true"] { background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-brand-primary); }
.mat-folder-name { flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; }
.mat-count { color:var(--dsw-alias-label-secondary); font-size:11px; flex:0 0 auto; }
.mat-caret { width:14px; display:inline-flex; justify-content:center; color:var(--dsw-alias-label-secondary); flex:0 0 14px; font-size:10px; }
.mat-item { border:1px solid transparent; border-radius:8px; padding:8px 9px; cursor:pointer; margin-bottom:2px; }
.mat-item:hover { background:var(--dsw-alias-bg-layer-2); }
.mat-item[data-active="true"] { background:var(--dsw-alias-bg-layer-2); border-color:var(--dsw-alias-brand-primary); }
.mat-item-name { display:flex; align-items:center; gap:5px; font-size:12.5px; font-weight:600; overflow:hidden; }
.mat-item-title { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mat-item-excerpt { color:var(--dsw-alias-label-secondary); font-size:11.5px; line-height:1.45; margin-top:3px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.mat-item-meta { color:var(--dsw-alias-label-secondary); font-size:10.5px; margin-top:4px; display:flex; gap:6px; flex-wrap:wrap; }
.mat-chip { display:inline-flex; align-items:center; border-radius:999px; border:1px solid var(--dsw-alias-border-l1); padding:0 7px; font-size:10.5px; line-height:16px; color:var(--dsw-alias-label-secondary); background:transparent; cursor:pointer; font-family:inherit; }
.mat-chip[data-active="true"] { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); }
.mat-chip-row { display:flex; flex-wrap:wrap; gap:4px; margin-top:5px; }
.mat-editorbody { display:flex; flex-direction:column; height:100%; min-height:0; }
.mat-editorhead { display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid var(--dsw-alias-border-l1); }
.mat-editorform { padding:14px 16px; overflow:auto; flex:1 1 auto; min-height:0; display:flex; flex-direction:column; gap:10px; }
.mat-textarea { width:100%; box-sizing:border-box; flex:1 1 auto; min-height:220px; resize:vertical; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); border-radius:8px; padding:10px 12px; font-size:12.5px; line-height:1.65; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; outline:none; }
.mat-textarea:focus { border-color:var(--dsw-alias-brand-primary); }
.mat-empty { flex:1 1 auto; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:32px; text-align:center; color:var(--dsw-alias-label-secondary); font-size:12px; }
.mat-error { color:var(--dsw-alias-state-error-primary); font-size:12px; padding:6px 14px; }
.mat-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; padding:0; border:none; border-radius:6px; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; }
.mat-icon-btn:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.mat-icon-btn:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
.mat-toast { color:var(--dsw-alias-state-success-primary); font-size:11.5px; }
.mat-hint { color:var(--dsw-alias-label-secondary); font-size:11px; line-height:1.5; }
.mat-mono { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:11px; color:var(--dsw-alias-label-secondary); }
.mat-grow { flex:1 1 auto; }
.mat-badge { display:inline-flex; align-items:center; border-radius:4px; padding:0 5px; font-size:10px; line-height:15px; background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-label-secondary); border:1px solid var(--dsw-alias-border-l1); font-weight:400; }
.mat-badge-link { color:var(--dsw-alias-brand-primary); border-color:var(--dsw-alias-brand-primary); }
.mat-overlay { position:fixed; inset:0; background:rgba(0,0,0,.34); display:flex; align-items:center; justify-content:center; z-index:1000; }
.mat-dialog { width:min(700px, 92vw); max-height:84vh; display:flex; flex-direction:column; background:var(--dsw-alias-bg-layer-1); border:1px solid var(--dsw-alias-border-l1); border-radius:12px; box-shadow:0 12px 40px rgba(0,0,0,.24); overflow:hidden; color:var(--dsw-alias-label-primary); font-size:13px; }
.mat-dialog-head { display:flex; align-items:center; gap:8px; padding:14px 16px 6px; }
.mat-dialog-sub { padding:0 16px 10px; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:1.55; }
.mat-dialog-body { padding:0 16px 12px; overflow:auto; min-height:0; flex:1 1 auto; display:flex; flex-direction:column; gap:10px; }
.mat-dialog-foot { display:flex; align-items:center; gap:8px; padding:10px 16px 14px; border-top:1px solid var(--dsw-alias-border-l1); }
.mat-crumbs { display:flex; align-items:center; gap:4px; flex-wrap:wrap; font-size:11.5px; color:var(--dsw-alias-label-secondary); }
.mat-crumb { border:none; background:transparent; color:var(--dsw-alias-brand-primary); cursor:pointer; font-family:inherit; font-size:11.5px; padding:1px 3px; border-radius:4px; }
.mat-crumb:hover { background:var(--dsw-alias-bg-layer-2); }
.mat-pick { flex:1 1 auto; min-height:170px; max-height:300px; overflow:auto; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-base); padding:4px; }
.mat-pick-row { display:flex; align-items:center; gap:6px; width:100%; border:none; background:transparent; color:var(--dsw-alias-label-primary); font-family:inherit; font-size:12px; text-align:left; padding:5px 8px; border-radius:6px; cursor:pointer; }
.mat-pick-row:hover { background:var(--dsw-alias-bg-layer-2); }
.mat-pick-row[data-active="true"] { background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-brand-primary); }
.mat-pick-name { flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mat-pick-meta { color:var(--dsw-alias-label-secondary); font-size:10.5px; flex:0 0 auto; }
.mat-tabbar { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.mat-target { border:1px solid var(--dsw-alias-border-l1); border-radius:8px; padding:8px 10px; background:var(--dsw-alias-bg-layer-1); display:flex; flex-direction:column; gap:4px; }
`;


    const FDRCSS = `
.fdr-root { position:relative; display:flex; height:100%; min-height:0; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font-size:13px; }
.fdr-window { display:flex; flex:1 1 auto; min-height:0; min-width:0; }
.fdr-side { width:216px; flex:0 0 216px; display:flex; flex-direction:column; min-height:0; background:var(--dsw-alias-bg-layer-1); border-right:1px solid var(--dsw-alias-border-l1); }
.fdr-side-head { display:flex; align-items:center; gap:6px; padding:10px 8px 4px 12px; }
.fdr-side-title { font-size:13px; font-weight:600; letter-spacing:.01em; }
.fdr-side-scroll { flex:1 1 auto; overflow:auto; padding:2px 6px 10px; }
.mat-select { display:flex; align-items:center; gap:7px; width:100%; padding:6px 9px; border:1px solid var(--dsw-alias-border-l1); border-radius:7px; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font:inherit; font-size:13px; cursor:pointer; text-align:left; }
.mat-select[data-open="true"] { border-color:var(--dsw-alias-brand-primary); }
.mat-select-label { flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mat-select-arrow { color:var(--dsw-alias-label-secondary); font-size:11px; }
.mat-select-wrap { position:relative; }
.fdr-folder-field { min-width:0; }
.fdr-select { display:flex; align-items:center; gap:6px; width:100%; text-align:left; cursor:pointer; }
.fdr-select[data-open="true"] { border-color:var(--dsw-alias-brand-primary); }
.fdr-folder-field .mat-tree { min-width:240px; }
.mat-tree { position:absolute; z-index:80; left:0; right:0; top:calc(100% + 4px); max-height:184px; overflow:auto; padding:4px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-1); box-shadow:0 10px 30px rgba(0,0,0,.18); }
.mat-tree-new { margin-top:4px; width:100%; }
.mat-tree-row { display:flex; align-items:center; gap:6px; width:100%; padding:4px 8px; border:none; background:transparent; color:var(--dsw-alias-label-primary); font:inherit; font-size:12.5px; text-align:left; border-radius:6px; cursor:pointer; }
.mat-tree-row:hover { background:var(--dsw-alias-bg-layer-2); }
.mat-tree-row[data-active="true"] { background:color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); color:var(--dsw-alias-brand-primary); }
.mat-tree-twisty { width:12px; flex:0 0 12px; color:var(--dsw-alias-label-secondary); font-size:10px; }
.mat-tree-name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mat-chips { display:flex; flex-wrap:wrap; gap:6px; margin:2px 0 6px; }
.mat-chip { appearance:none; border:1px solid var(--dsw-alias-border-l1); background:transparent; color:var(--dsw-alias-label-secondary); font:inherit; font-size:12px; padding:2px 9px; border-radius:999px; cursor:pointer; }
.mat-chip[data-active="true"] { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }
.fdr-collect { gap:5px; padding-inline:9px; }
.fdr-collect span { white-space:nowrap; }
.fdr-group-label { display:flex; align-items:center; gap:6px; padding:12px 6px 3px; font-size:11px; font-weight:600; color:var(--dsw-alias-label-secondary); }
.fdr-group-add { margin-left:auto; border:none; background:transparent; color:var(--dsw-alias-label-secondary); font-family:inherit; font-size:12px; line-height:16px; padding:0 4px; border-radius:4px; cursor:pointer; }
.fdr-group-add:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.fdr-nav { display:flex; align-items:center; gap:6px; width:100%; box-sizing:border-box; padding:4px 8px; border:none; border-radius:6px; background:transparent; color:var(--dsw-alias-label-primary); font-family:inherit; font-size:12.5px; text-align:left; cursor:default; min-height:24px; }
.fdr-nav:hover { background:var(--dsw-alias-bg-layer-2); }
.fdr-row-ops { display:none; align-items:center; gap:2px; margin-left:2px; }
.fdr-nav:hover .fdr-row-ops, .fdr-nav:focus-within .fdr-row-ops, .fdr-nav[data-active="true"] .fdr-row-ops { display:flex; }
.fdr-op { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 3px; border:none; border-radius:5px; background:transparent; color:var(--dsw-alias-label-secondary); font:inherit; font-size:11px; cursor:pointer; }
.fdr-op:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.fdr-op-danger { color:var(--dsw-alias-state-error-primary); }
.fdr-nav-input { flex:1 1 auto; min-width:0; padding:1px 5px; border:1px solid var(--dsw-alias-brand-primary); border-radius:5px; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font:inherit; font-size:12.5px; }
.fdr-nav[data-active="true"] { background:var(--dsw-alias-bg-overlay); }
.fdr-nav-ico { display:inline-flex; flex:0 0 auto; color:var(--dsw-alias-label-secondary); }
.fdr-nav[data-active="true"] .fdr-nav-ico, .fdr-nav[data-active="true"] .fdr-nav-name { color:var(--dsw-alias-brand-primary); }
.fdr-nav-name { flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fdr-nav-count { flex:0 0 auto; font-size:11px; color:var(--dsw-alias-label-secondary); font-variant-numeric:tabular-nums; }
.fdr-nav-rule { cursor:default; }
.fdr-nav-rule:hover { background:var(--dsw-alias-bg-layer-2); }
.fdr-nav-rule-pending .fdr-nav-dot { background:#f0a020; opacity:1; }
.fdr-nav-rule:hover .fdr-row-ops { display:flex; }
.fdr-nav-dot { flex:0 0 auto; width:7px; height:7px; margin:0 3px; border-radius:50%; background:var(--dsw-alias-label-secondary); opacity:.45; }
.fdr-twisty { flex:0 0 auto; width:10px; font-size:9px; line-height:1; color:var(--dsw-alias-label-secondary); cursor:default; }
.fdr-side-foot { border-top:1px solid var(--dsw-alias-border-l1); padding:6px 12px; }
.fdr-side-path { display:block; font-size:10.5px; color:var(--dsw-alias-label-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fdr-side-foot-row { padding:6px 6px 0; }
.fdr-main { flex:1 1 auto; display:flex; flex-direction:column; min-width:0; min-height:0; }
.fdr-bar { display:flex; flex-direction:column; gap:6px; padding:7px 14px 8px; border-bottom:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-base); }
.fdr-bar-top { display:flex; align-items:center; gap:4px; min-width:0; }
.fdr-bar-bottom { display:flex; align-items:center; gap:6px; min-width:0; }
.fdr-bar-bottom .fdr-search { flex:1 1 auto; width:auto; }
.fdr-narrow { padding:0 8px; }
.fdr-bar-nav { display:flex; gap:2px; flex:0 0 auto; }
.fdr-crumbs { display:flex; align-items:center; gap:2px; min-width:0; overflow:hidden; }
.fdr-crumb { border:none; background:transparent; color:var(--dsw-alias-label-primary); font-family:inherit; font-size:12.5px; padding:2px 3px; border-radius:4px; cursor:default; white-space:nowrap; }
.fdr-crumb:hover { background:var(--dsw-alias-bg-layer-2); }
.fdr-crumb-sep { color:var(--dsw-alias-label-secondary); font-size:11px; }
.fdr-search { display:flex; align-items:center; gap:4px; flex:0 0 auto; width:188px; height:24px; padding:0 6px; border-radius:6px; background:var(--dsw-alias-bg-layer-2); border:1px solid transparent; }
.fdr-search:focus-within { border-color:var(--dsw-alias-brand-primary); }
.fdr-search-ico { color:var(--dsw-alias-label-secondary); font-size:12px; line-height:1; }
.fdr-search-input { flex:1 1 auto; min-width:0; border:none; background:transparent; outline:none; color:var(--dsw-alias-label-primary); font-family:inherit; font-size:12px; }
.fdr-search-clear { border:none; background:transparent; color:var(--dsw-alias-label-secondary); font-size:10px; line-height:1; padding:0 2px; cursor:pointer; }
.fdr-btn { display:inline-flex; align-items:center; justify-content:center; gap:4px; height:24px; padding:0 10px; border-radius:6px; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font-family:inherit; font-size:12px; white-space:nowrap; cursor:pointer; }
.fdr-btn:hover { background:var(--dsw-alias-bg-layer-2); }
.fdr-btn:disabled { opacity:.5; cursor:default; }
.fdr-btn-primary { background:var(--dsw-alias-brand-primary); border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-bg-base); }
.fdr-btn-quiet { border-color:transparent; background:transparent; color:var(--dsw-alias-label-secondary); }
.fdr-btn-quiet:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.fdr-btn-danger { border-color:var(--dsw-alias-state-error-primary); color:var(--dsw-alias-state-error-primary); background:transparent; }
.fdr-body { display:flex; flex-direction:column; flex:1 1 auto; min-height:0; }
.fdr-thead { display:grid; grid-template-columns:22px minmax(0,1fr) 76px; gap:10px; align-items:center; padding:5px 14px; border-bottom:1px solid var(--dsw-alias-border-l1); }
.fdr-th { font-size:10.5px; font-weight:600; color:var(--dsw-alias-label-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fdr-th-date { cursor:default; }
.fdr-th-date:hover { color:var(--dsw-alias-label-primary); }
.fdr-rows { flex:1 1 auto; overflow:auto; }
.fdr-row { display:grid; grid-template-columns:22px minmax(0,1fr) 76px; gap:10px; align-items:center; padding:5px 14px; cursor:default; }
.fdr-row:hover { background:var(--dsw-alias-bg-layer-1); }
.fdr-row[data-selected="true"] { background:var(--dsw-alias-bg-overlay); }
.fdr-row-ico { display:inline-flex; color:var(--dsw-alias-label-secondary); }
.fdr-row-name { display:flex; flex-direction:column; min-width:0; }
.fdr-row-title { font-size:12.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fdr-row-sub { font-size:11px; color:var(--dsw-alias-label-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fdr-row-date, .fdr-row-place { font-size:11.5px; color:var(--dsw-alias-label-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-variant-numeric:tabular-nums; }
.fdr-row-tags { display:flex; gap:4px; overflow:hidden; }
.fdr-tag { flex:0 0 auto; border:1px solid var(--dsw-alias-border-l1); background:transparent; color:var(--dsw-alias-label-secondary); border-radius:999px; padding:0 7px; font-family:inherit; font-size:10px; line-height:16px; white-space:nowrap; cursor:default; }
.fdr-tag:hover { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); }
.fdr-placeholder { padding:22px 16px; font-size:12px; color:var(--dsw-alias-label-secondary); }
.fdr-filters { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:0 14px 8px; }
.fdr-filter { display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border:1px solid var(--dsw-alias-border-l2); border-radius:999px; background:color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent); color:var(--dsw-alias-brand-primary); font:inherit; font-size:11.5px; cursor:pointer; }
.fdr-filter:hover { background:color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent); }
.fdr-filter-x { font-size:10px; opacity:.8; }
.fdr-status { display:flex; align-items:center; gap:8px; padding:5px 14px; border-top:1px solid var(--dsw-alias-border-l1); font-size:10.5px; color:var(--dsw-alias-label-secondary); }
.fdr-status-hint { color:var(--dsw-alias-label-secondary); opacity:.75; }
.fdr-status-path { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fdr-grow { flex:1 1 auto; }
.fdr-newfolder { padding:2px 6px 6px; }
.fdr-input { width:100%; box-sizing:border-box; border:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); border-radius:7px; padding:6px 9px; font-family:inherit; font-size:12.5px; outline:none; }
.fdr-input:focus { border-color:var(--dsw-alias-brand-primary); }
.fdr-input-title { font-size:16px; font-weight:600; }
.fdr-error { position:absolute; left:12px; right:12px; bottom:32px; padding:8px 10px; border-radius:8px; font-size:12px; background:var(--dsw-alias-bg-overlay); border:1px solid var(--dsw-alias-state-error-primary); color:var(--dsw-alias-state-error-primary); }
.fdr-doc { display:flex; flex-direction:column; flex:1 1 auto; min-height:0; background:var(--dsw-alias-bg-base); }
.fdr-doc-bar { display:flex; align-items:center; gap:8px; padding:7px 14px; border-bottom:1px solid var(--dsw-alias-border-l1); }
.fdr-listcol { display:flex; flex-direction:column; width:340px; flex:0 0 340px; min-height:0; min-width:0; border-right:1px solid var(--dsw-alias-border-l1); background:var(--dsw-alias-bg-base); }
.fdr-detail { position:relative; flex:1 1 auto; display:flex; flex-direction:column; min-width:0; min-height:0; }
.fdr-detail-head { padding:12px 14px 0; }
.fdr-detail-actions { display:flex; align-items:center; gap:8px; padding:10px 2px 10px; }
.fdr-detail-scroll { flex:1 1 auto; overflow:auto; min-height:0; }
.fdr-detail-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; height:100%; padding:40px; color:var(--dsw-alias-label-secondary); font-size:12.5px; text-align:center; }
.fdr-detail-empty-ico { color:var(--dsw-alias-label-secondary); opacity:.5; }
.fdr-detail-empty-actions { display:flex; align-items:center; gap:8px; margin-top:2px; }
.fdr-detail-empty-actions .fdr-btn { display:inline-flex; align-items:center; gap:6px; }
.fdr-filecard { display:flex; align-items:center; gap:12px; padding:12px 14px; border:1px solid var(--dsw-alias-border-l1); border-radius:14px; background:var(--dsw-alias-bg-layer-1); }
.fdr-filecard-ico { flex:0 0 auto; display:flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:10px; background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-brand-primary); }
.fdr-filecard-main { flex:1 1 auto; min-width:0; }
.fdr-filecard-name { font-size:13.5px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fdr-filecard-sub { font-size:11.5px; color:var(--dsw-alias-label-secondary); margin-top:2px; }
.fdr-split { display:flex; align-items:stretch; flex:0 0 auto; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-base); overflow:hidden; }
.fdr-split-main { display:flex; align-items:center; gap:6px; padding:0 9px; height:30px; border:none; background:transparent; color:var(--dsw-alias-label-primary); font-family:inherit; font-size:12px; cursor:pointer; }
.fdr-split-main:hover { background:var(--dsw-alias-bg-layer-2); }
.fdr-split-main:disabled { opacity:.55; cursor:default; }
.fdr-split-arrow { width:26px; height:30px; border:none; border-left:1px solid var(--dsw-alias-border-l1); background:transparent; color:var(--dsw-alias-label-secondary); font-family:inherit; font-size:11px; cursor:pointer; }
.fdr-split-arrow:hover { background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); }
.fdr-app-ico { width:16px; height:16px; border-radius:3px; display:block; }
.fdr-menu { position:absolute; right:14px; top:74px; z-index:20; min-width:220px; padding:5px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-overlay); box-shadow:0 12px 32px rgba(0,0,0,.22); }
.fdr-menu-item { display:flex; align-items:center; gap:9px; width:100%; box-sizing:border-box; padding:6px 9px; border:none; border-radius:6px; background:transparent; color:var(--dsw-alias-label-primary); font-family:inherit; font-size:12.5px; text-align:left; cursor:pointer; }
.fdr-menu-item:hover { background:var(--dsw-alias-bg-layer-2); }
.fdr-menu-ico { display:inline-flex; width:16px; justify-content:center; color:var(--dsw-alias-label-secondary); }
.fdr-menu-name { flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fdr-menu-hint { font-size:10.5px; color:var(--dsw-alias-label-secondary); }
.fdr-menu-sep { height:1px; margin:4px 6px; background:var(--dsw-alias-border-l1); }
.fdr-thumb { display:block; max-width:100%; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; margin:0 0 18px; background:var(--dsw-alias-bg-layer-1); }
.fdr-embed { display:block; width:100%; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); margin:0 0 18px; }
.fdr-embed-html { height:560px; }
.fdr-embed-pdf { height:640px; }
.fdr-table-wrap { overflow:auto; max-height:560px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; margin:0 0 18px; }
.fdr-grid { border-collapse:collapse; width:100%; font-size:12.5px; }
.fdr-grid th, .fdr-grid td { text-align:left; padding:6px 10px; border-bottom:1px solid var(--dsw-alias-border-l1); white-space:nowrap; }
.fdr-grid th { position:sticky; top:0; background:var(--dsw-alias-bg-layer-2); font-weight:600; }
.fdr-history { width:min(760px, 92vw); }
.fdr-history-body { display:flex; gap:12px; min-height:240px; max-height:52vh; }
.fdr-history-list { flex:0 0 190px; overflow:auto; display:flex; flex-direction:column; gap:2px; }
.fdr-history-item { display:flex; justify-content:space-between; gap:8px; padding:6px 9px; border:none; border-radius:7px; background:transparent; color:var(--dsw-alias-label-primary); font-family:inherit; font-size:12px; cursor:pointer; text-align:left; }
.fdr-history-item:hover { background:var(--dsw-alias-bg-layer-2); }
.fdr-history-item[data-active="true"] { background:color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); }
.fdr-history-size { color:var(--dsw-alias-label-secondary); }
.fdr-history-pane { flex:1 1 auto; min-width:0; overflow:auto; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; padding:10px 12px; background:var(--dsw-alias-bg-layer-1); }
.fdr-doc-scroll { flex:1 1 auto; overflow:auto; }
.fdr-doc-foot { display:flex; align-items:center; gap:8px; padding:7px 14px; border-top:1px solid var(--dsw-alias-border-l1); }
.fdr-doc-foot .fdr-status-path { font-size:10.5px; color:var(--dsw-alias-label-secondary); }
.fdr-toast { font-size:11.5px; color:var(--dsw-alias-state-success-primary); }
.fdr-prose { max-width:760px; margin:0 auto; padding:28px 32px 64px; font-size:14px; line-height:1.75; color:var(--dsw-alias-label-primary); }
.fdr-prose h1 { font-size:21px; line-height:1.4; font-weight:600; margin:26px 0 10px; }
.fdr-prose h2 { font-size:17.5px; line-height:1.45; font-weight:600; margin:24px 0 8px; }
.fdr-prose h3 { font-size:15px; font-weight:600; margin:20px 0 6px; }
.fdr-prose h4, .fdr-prose h5, .fdr-prose h6 { font-size:14px; font-weight:600; margin:16px 0 6px; }
.fdr-prose p { margin:0 0 14px; }
.fdr-prose ul, .fdr-prose ol { margin:0 0 14px; padding-left:22px; }
.fdr-prose li { margin:3px 0; }
.fdr-prose li > ul, .fdr-prose li > ol { margin:4px 0; }
.fdr-prose code { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12.5px; background:var(--dsw-alias-bg-layer-2); border-radius:5px; padding:1px 5px; }
.fdr-prose pre { margin:0 0 16px; padding:12px 14px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-2); overflow:auto; }
.fdr-prose pre code { background:none; padding:0; font-size:12.5px; line-height:1.65; }
.fdr-prose blockquote { margin:0 0 16px; padding:2px 0 2px 14px; border-left:3px solid var(--dsw-alias-border-l2); color:var(--dsw-alias-label-secondary); }
.fdr-prose blockquote p:last-child { margin-bottom:0; }
.fdr-prose hr { border:none; border-top:1px solid var(--dsw-alias-border-l1); margin:24px 0; }
.fdr-prose a { color:var(--dsw-alias-brand-primary); text-decoration:none; }
.fdr-prose a:hover { text-decoration:underline; }
.fdr-prose table { border-collapse:collapse; margin:0 0 16px; font-size:12.5px; }
.fdr-prose th, .fdr-prose td { border:1px solid var(--dsw-alias-border-l1); padding:6px 10px; text-align:left; }
.fdr-prose th { font-weight:600; background:var(--dsw-alias-bg-layer-1); }
.fdr-doc-title { font-size:23px; line-height:1.35; font-weight:600; letter-spacing:-.01em; margin:0 0 6px; }
.fdr-doc-meta { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin:0 0 22px; font-size:11.5px; color:var(--dsw-alias-label-secondary); }
.fdr-doc-empty { font-size:13px; color:var(--dsw-alias-label-secondary); }
.fdr-doc-card { display:flex; flex-direction:column; gap:8px; padding:14px 16px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); }
.fdr-doc-actions { display:flex; gap:8px; }
.fdr-label { font-size:10.5px; font-weight:600; color:var(--dsw-alias-label-secondary); }
.fdr-mono { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:11.5px; color:var(--dsw-alias-label-secondary); word-break:break-all; }
.fdr-fields { display:flex; flex-direction:column; gap:8px; margin:0 0 18px; }
.fdr-fields-row { display:flex; gap:8px; align-items:flex-start; }
.fdr-fields-row > .mat-select-wrap { flex:1 1 0; min-width:0; }
.fdr-fields-row > .fdr-input { flex:1 1 0; min-width:0; }
.fdr-textarea { width:100%; box-sizing:border-box; min-height:52vh; resize:vertical; padding:12px 14px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12.5px; line-height:1.7; outline:none; }
.fdr-textarea:focus { border-color:var(--dsw-alias-brand-primary); }
.fdr-prose-pre { margin:0 0 18px; padding:12px 14px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-bg-layer-2); overflow:auto; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12.5px; line-height:1.65; }
@supports (background: color-mix(in srgb, red 10%, transparent)) {
  .fdr-nav[data-active="true"], .fdr-row[data-selected="true"] { background:color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); }
}
`;

    /** One JSON call to the host half; a failed status becomes an Error. */
    async function call(pathname, init) {
      /* A host restart can leave a request hanging; never wait forever. */
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = controller === null ? null : setTimeout(() => controller.abort(), 12000);
      let response;
      try {
        response = await fetch(`${API}${pathname}`, controller === null ? init : { ...(init || {}), signal: controller.signal });
      } finally {
        if (timer !== null) clearTimeout(timer);
      }
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      if (!response.ok || payload === null || payload.ok === false) {
        const message = payload && typeof payload.error === 'string' ? payload.error : `HTTP ${response.status}`;
        throw new Error(message);
      }
      return payload;
    }

    /** JSON POST body. */
    function post(body) {
      return {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      };
    }

    /** Split a comma or space separated tag field. */
    function parseTags(text) {
      return text
        .split(/[,，\s]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag !== '');
    }

    /** Shape a flat folder list into a sorted tree. */
    function buildTree(folders) {
      const root = { name: '', path: '', children: [] };
      const index = new Map([['', root]]);
      for (const rel of folders) {
        const cut = rel.lastIndexOf('/');
        const node = { name: rel.slice(cut + 1), path: rel, children: [] };
        index.set(rel, node);
        const parent = index.get(cut === -1 ? '' : rel.slice(0, cut)) ?? root;
        parent.children.push(node);
      }
      const sort = (node) => {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        node.children.forEach(sort);
      };
      sort(root);
      return root;
    }

    /** Material counts per folder, counting descendants. */
    function countByFolder(files) {
      const counts = new Map();
      for (const file of files) {
        let rel = file.dir;
        for (;;) {
          counts.set(rel, (counts.get(rel) ?? 0) + 1);
          if (rel === '') break;
          const cut = rel.lastIndexOf('/');
          rel = cut === -1 ? '' : rel.slice(0, cut);
        }
      }
      return counts;
    }

    /** Short local timestamp. */
    function stamp(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms)) return '';
      const date = new Date(ms);
      const pad = (value) => String(value).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    /** Sidebar mark: a folder holding a bookmark. */
    function MaterialsIcon({ size }) {
      const dimension = typeof size === 'number' ? size : 18;
      return h(
        'svg',
        { width: dimension, height: dimension, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' },
        h('path', {
          d: 'M3.5 7.2A1.7 1.7 0 0 1 5.2 5.5h3.6l1.9 2.2h7.1a1.7 1.7 0 0 1 1.7 1.7v7.9a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V7.2Z',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M10.2 12.1h3.6M12 10.3v6.2',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
        }),
      );
    }

    /** One folder row and its children. */
    function FolderNode({ node, depth, selected, collapsed, counts, onSelect, onToggle }) {
      const isCollapsed = collapsed.has(node.path);
      const hasChildren = node.children.length > 0;
      const caret = hasChildren ? (isCollapsed ? '▸' : '▾') : '';
      return h(
        'div',
        null,
        h(
          'div',
          {
            className: 'mat-folder',
            'data-active': selected === node.path ? 'true' : 'false',
            style: { paddingLeft: `${6 + depth * 12}px` },
            onClick: () => onSelect(node.path),
            title: node.path,
          },
          h(
            'span',
            {
              className: 'mat-caret',
              onClick: (event) => {
                event.stopPropagation();
                if (hasChildren) onToggle(node.path);
              },
            },
            caret,
          ),
          h('span', { className: 'mat-folder-name' }, node.name),
          h('span', { className: 'mat-count' }, String(counts.get(node.path) ?? 0)),
        ),
        !isCollapsed &&
          node.children.map((child) =>
            h(FolderNode, {
              key: child.path,
              node: child,
              depth: depth + 1,
              selected,
              collapsed,
              counts,
              onSelect,
              onToggle,
            }),
          ),
      );
    }

    /** Keep a translator usable even when the slot provides none, and never let a
        slot-bound translator that predates a key show the raw key instead. */
    function translator(value) {
      const bound = typeof value === 'function' ? value : null;
      return (key) => {
        const text = bound ? bound(key) : key;
        if (text === key && Object.prototype.hasOwnProperty.call(ZH, key)) return ZH[key];
        return text;
      };
    }

    /** Reference entries answer search hits and state rows in one shape. */
    /** Turn a host failure into something a person can read. */
    function describeError(t, failure) {
      const message = failure && typeof failure.message === 'string' ? failure.message : String(failure ?? '');
      if (message === 'folder is not empty') return t('folderNotEmpty');
      if (message.indexOf('holds references') !== -1) return t('folderHasRefs');
      if (message === 'folder not found') return t('folderMissing');
      if (/already exists$/.test(message)) return t('folderExists');
      if (message.indexOf('ENOENT') === 0) return t('fsMissing');
      return message;
    }

    function shapeEntry(raw) {
      if (raw !== null && typeof raw === 'object' && raw.type === 'ref') {
        return {
          type: 'ref',
          key: `ref:${raw.id}`,
          id: raw.id,
          dir: typeof raw.folder === 'string' ? raw.folder : '',
          name: typeof raw.name === 'string' ? raw.name : '',
          excerpt: typeof raw.absPath === 'string' ? raw.absPath : '',
          tags: Array.isArray(raw.tags) ? raw.tags : [],
          updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
          ref: raw,
        };
      }
      return {
        type: 'note',
        key: raw.path,
        path: raw.path,
        dir: typeof raw.dir === 'string' ? raw.dir : '',
        name: typeof raw.name === 'string' ? raw.name : '',
        excerpt: typeof raw.snippet === 'string' ? raw.snippet : (typeof raw.excerpt === 'string' ? raw.excerpt : ''),
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
      };
    }

    const FOLDER_ADDRESS_PREFIX = 'dsh-resource://materials/folder/';

    /** The right-panel address of one folder reference. */
    function folderAddress(ref) {
      const sessionId = typeof ref.sessionId === 'string' ? ref.sessionId : '';
      return `${FOLDER_ADDRESS_PREFIX}${encodeURIComponent(sessionId)}/${encodeURIComponent(ref.absPath)}`;
    }

    /** Read back that address. */
    function parseFolderAddress(address) {
      const text = typeof address === 'string' ? address : '';
      if (!text.startsWith(FOLDER_ADDRESS_PREFIX)) return { sessionId: '', path: '' };
      const rest = text.slice(FOLDER_ADDRESS_PREFIX.length);
      const cut = rest.indexOf('/');
      try {
        if (cut === -1) return { sessionId: '', path: decodeURIComponent(rest) };
        return { sessionId: decodeURIComponent(rest.slice(0, cut)), path: decodeURIComponent(rest.slice(cut + 1)) };
      } catch {
        return { sessionId: '', path: '' };
      }
    }

    /** The last path segment, for default names. */
    function baseName(target) {
      const parts = String(target ?? '').split('/').filter((part) => part !== '');
      return parts.length > 0 ? parts[parts.length - 1] : '';
    }

    /** A working directory with the user's home shortened to `~`. */
    function shortenPath(target) {
      const text = String(target ?? '');
      const match = /^\/(?:Users|home)\/([^/]+)/.exec(text);
      if (match === null) return text;
      return `~${text.slice(match[0].length)}`;
    }

    /** Trailing path split into clickable steps, anchored at `root`. */
    function crumbsOf(root, current) {
      const trimmedRoot = String(root ?? '').replace(/\/+$/, '');
      const trimmed = String(current ?? '').replace(/\/+$/, '');
      const steps = [{ name: baseName(trimmedRoot) || trimmedRoot, path: trimmedRoot }];
      if (trimmedRoot !== '' && trimmed.startsWith(`${trimmedRoot}/`)) {
        let walked = trimmedRoot;
        for (const part of trimmed.slice(trimmedRoot.length + 1).split('/')) {
          if (part === '') continue;
          walked = `${walked}/${part}`;
          steps.push({ name: part, path: walked });
        }
      }
      return steps;
    }

    /** Right-panel tab: one referenced folder, exactly as it sits on disk. */
    function FolderTab(props) {
      const t = translator(props.t);
      const info = typeof props.useTabInfo === 'function' ? props.useTabInfo() : null;
      const address = info && info.tab && typeof info.tab.contentId === 'string' ? info.tab.contentId : '';
      const parsed = useMemo(() => parseFolderAddress(address), [address]);
      const root = parsed.path;
      const [current, setCurrent] = useState(root);
      const [listing, setListing] = useState(null);
      const [error, setError] = useState('');
      const [hidden, setHidden] = useState(false);

      useEffect(() => {
        setCurrent(root);
      }, [root]);

      useEffect(() => {
        if (current === '') return undefined;
        let cancelled = false;
        setListing(null);
        call(`/list?path=${encodeURIComponent(current)}${hidden ? '&hidden=1' : ''}`)
          .then((next) => {
            if (cancelled) return;
            setListing(next);
            setError('');
          })
          .catch((failure) => {
            if (!cancelled) setError(describeError(t, failure));
          });
        return () => {
          cancelled = true;
        };
      }, [current, hidden]);

      const steps = useMemo(() => crumbsOf(root, current), [root, current]);
      const entries = listing !== null && Array.isArray(listing.entries) ? listing.entries : [];
      const openFile = typeof props.openFileAt === 'function' ? props.openFileAt : null;

      return h(
        'div',
        { className: 'mat-col', style: { height: '100%', padding: '0 0 8px' }, },
        h('style', null, CSS),
        h(
          'div',
          { className: 'mat-head', style: { borderBottom: '1px solid var(--dsw-alias-border-l1)' } },
          h('span', { className: 'mat-title' }, t('refKindDir')),
          h('span', { className: 'mat-grow' }),
          h(
            'button',
            { className: 'mat-btn mat-btn-ghost', onClick: () => setHidden(!hidden), title: t('collectHidden') },
            hidden ? '◉' : '○',
          ),
          h(
            'button',
            { className: 'mat-btn mat-btn-ghost', onClick: () => setCurrent(current) },
            '↻',
          ),
        ),
        h(
          'div',
          { className: 'mat-crumbs', style: { padding: '8px 14px' } },
          steps.map((step, index) =>
            h(
              React.Fragment,
              { key: step.path },
              index > 0 && h('span', null, '/'),
              h(
                'button',
                { className: 'mat-crumb', onClick: () => setCurrent(step.path) },
                step.name,
              ),
            ),
          ),
        ),
        error !== '' && h('div', { className: 'mat-error' }, error),
        h(
          'div',
          { className: 'mat-scroll', style: { padding: '0 8px' } },
          listing === null && h('div', { className: 'mat-hint', style: { padding: '8px' } }, t('scanning')),
          listing !== null && entries.length === 0 && h('div', { className: 'mat-hint', style: { padding: '8px' } }, t('collectEmpty')),
          entries.map((entry) =>
            h(
              'button',
              {
                key: entry.path,
                className: 'mat-pick-row',
                onClick: () => {
                  if (entry.type === 'dir') setCurrent(entry.path);
                  else if (openFile !== null) openFile(parsed.sessionId, entry.path);
                },
              },
              h('span', { className: 'mat-pick-meta' }, entry.type === 'dir' ? '▸' : '·'),
              h('span', { className: 'mat-pick-name' }, entry.name),
              h('span', { className: 'mat-pick-meta' }, entry.type === 'dir' ? t('refKindDir') : t('refKindFile')),
            ),
          ),
        ),
      );
    }

    /** Folder picker: a button that opens a hierarchical dropdown. */
    function FolderField({ t, value, folders, onChange, compact, placeholder }) {
      const [open, setOpen] = useState(false);
      const [expanded, setExpanded] = useState(() => new Set(['']));
      const current = typeof value === 'string' ? value : '';
      const rows = useMemo(() => {
        const flattened = [{ path: '', label: t('rootFolder'), depth: 0, hasChildren: false }];
        const walk = (node, depth) => {
          for (const child of node.children) {
            if (!expanded.has(node.path)) continue;
            flattened.push({ path: child.path, label: child.name, depth, hasChildren: child.children.length > 0 });
            walk(child, depth + 1);
          }
        };
        walk(buildTree(folders), 1);
        return flattened;
      }, [folders, expanded, t]);

      useEffect(() => {
        if (!open) return undefined;
        const onDown = (event) => {
          const node = event.target;
          if (node instanceof Element && (node.closest('.mat-select-wrap') !== null)) return;
          setOpen(false);
        };
        document.addEventListener('mousedown', onDown, true);
        return () => document.removeEventListener('mousedown', onDown, true);
      }, [open]);

      return h(
        'div',
        { className: compact === true ? 'mat-select-wrap fdr-folder-field' : 'mat-select-wrap' },
        h(
          'button',
          {
            className: compact === true ? 'fdr-input fdr-select' : 'mat-select',
            type: 'button',
            'data-open': open ? 'true' : 'false',
            onClick: () => setOpen(!open),
          },
          glyph('folder', 13),
          h('span', { className: 'mat-select-label' }, current.trim() === '' ? (placeholder || t('rootFolder')) : current.trim()),
          h('span', { className: 'mat-select-arrow' }, '▾'),
        ),
        open &&
          h(
            'div',
            { className: 'mat-tree' },
            h(
              'div',
              { className: 'mat-tree-list' },
              rows.map((node) =>
                h(
                  'button',
                  {
                    key: node.path === '' ? '__root' : node.path,
                    className: 'mat-tree-row',
                    type: 'button',
                    style: { paddingLeft: `${6 + node.depth * 14}px` },
                    'data-active': current.trim() === node.path ? 'true' : 'false',
                    onClick: () => {
                      onChange(node.path);
                      setOpen(false);
                    },
                  },
                  h(
                    'span',
                    {
                      className: 'mat-tree-twisty',
                      role: 'presentation',
                      onClick: (event) => {
                        event.stopPropagation();
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(node.path)) next.delete(node.path);
                          else next.add(node.path);
                          return next;
                        });
                      },
                    },
                    node.hasChildren ? (expanded.has(node.path) ? '▾' : '▸') : '',
                  ),
                  h('span', { className: 'mat-tree-name' }, node.label),
                ),
              ),
            ),
            h('input', {
              className: 'mat-input mat-tree-new',
              value: current,
              placeholder: t('collectFolderOther'),
              onChange: (event) => onChange(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') setOpen(false);
              },
            }),
          ),
      );
    }

    /** Dialog that files a folder or file from the conversation into the library. */
    function CollectDialog({ t, sessionId, sessionTitle, cwd, onClose, openLibrary, defaultFolder }) {
      const [current, setCurrent] = useState('');
      const [listing, setListing] = useState(null);
      const [picked, setPicked] = useState(null);
      const [name, setName] = useState('');
      const [nameTouched, setNameTouched] = useState(false);
      const [folder, setFolder] = useState(typeof defaultFolder === 'string' ? defaultFolder : '');
      const [tags, setTags] = useState('');
      const [hidden, setHidden] = useState(false);
      const [busy, setBusy] = useState(false);
      const [error, setError] = useState('');
      const [done, setDone] = useState('');
      const [libFolders, setLibFolders] = useState([]);
      const [libTags, setLibTags] = useState([]);

      useEffect(() => {
        let cancelled = false;
        call('/state')
          .then((next) => {
            if (cancelled) return;
            setLibFolders(Array.isArray(next.folders) ? next.folders : []);
            setLibTags((Array.isArray(next.tags) ? next.tags : []).map((tag) => tag.name));
          })
          .catch(() => {});
        return () => {
          cancelled = true;
        };
      }, []);

      useEffect(() => {
        let cancelled = false;
        (async () => {
          let start = typeof cwd === 'string' ? cwd : '';
          if (start === '') {
            try {
              const home = await call('/home');
              start = home.path;
            } catch {
              start = '';
            }
          }
          if (!cancelled && start !== '') setCurrent(start);
        })();
        return () => {
          cancelled = true;
        };
      }, [cwd]);

      useEffect(() => {
        if (current === '') return undefined;
        let cancelled = false;
        setListing(null);
        call(`/list?path=${encodeURIComponent(current)}${hidden ? '&hidden=1' : ''}`)
          .then((next) => {
            if (cancelled) return;
            setListing(next);
            setError('');
          })
          .catch((failure) => {
            if (!cancelled) setError(describeError(t, failure));
          });
        return () => {
          cancelled = true;
        };
      }, [current, hidden]);

      useEffect(() => {
        if (nameTouched) return;
        setName(baseName(picked === null ? current : picked.path));
      }, [current, picked, nameTouched]);

      const entries = listing !== null && Array.isArray(listing.entries) ? listing.entries : [];
      const absPath = picked === null ? current : picked.path;
      const kind = picked === null ? 'dir' : 'file';
      const steps = useMemo(() => crumbsOf(cwd === '' ? '/' : cwd, current), [cwd, current]);


      const submit = async () => {
        if (absPath === '') return;
        setBusy(true);
        try {
          await call(
            '/ref/add',
            post({
              absPath,
              kind,
              name: name.trim() === '' ? baseName(absPath) : name.trim(),
              folder: folder.trim(),
              tags: parseTags(tags),
              sessionId: typeof sessionId === 'string' ? sessionId : '',
              sessionTitle: typeof sessionTitle === 'string' ? sessionTitle : '',
              cwd: typeof cwd === 'string' ? cwd : '',
            }),
          );
          setDone(t('collectDone'));
          setError('');
          setTimeout(() => {
            if (typeof onClose === 'function') onClose();
          }, 700);
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      return h(
        'div',
        { className: 'mat-overlay', onClick: (event) => { if (event.target === event.currentTarget && typeof onClose === 'function') onClose(); } },
        h('style', null, CSS),
        h(
          'div',
          { className: 'mat-dialog' },
          h(
            'div',
            { className: 'mat-dialog-head' },
            h('span', { className: 'mat-title' }, t('collectTitle')),
            h('span', { className: 'mat-grow' }),
            h('button', { className: 'mat-btn mat-btn-ghost', onClick: onClose, title: t('close') }, '✕'),
          ),
          h('div', { className: 'mat-dialog-sub' }, t('collectHint')),
          h(
            'div',
            { className: 'mat-dialog-body' },
            h(
              'div',
              { className: 'mat-crumbs' },
              current !== '' &&
                h(
                  'button',
                  {
                    className: 'mat-crumb',
                    onClick: () => {
                      const cut = current.replace(/\/+$/, '').lastIndexOf('/');
                      setCurrent(cut <= 0 ? '/' : current.slice(0, cut));
                      setPicked(null);
                    },
                  },
                  `↑ ${t('collectUp')}`,
                ),
              steps.map((step, index) =>
                h(
                  React.Fragment,
                  { key: step.path },
                  index > 0 && h('span', null, '/'),
                  h(
                    'button',
                    {
                      className: 'mat-crumb',
                      onClick: () => {
                        setCurrent(step.path);
                        setPicked(null);
                      },
                    },
                    step.name,
                  ),
                ),
              ),
            ),
            h('div', { className: 'mat-mono', style: { wordBreak: 'break-all' } }, absPath),
            h(
              'div',
              { className: 'mat-pick' },
              listing === null && h('div', { className: 'mat-hint', style: { padding: '8px' } }, t('scanning')),
              listing !== null && entries.length === 0 && h('div', { className: 'mat-hint', style: { padding: '8px' } }, t('collectEmpty')),
              entries.map((entry) =>
                h(
                  'button',
                  {
                    key: entry.path,
                    className: 'mat-pick-row',
                    'data-active': picked !== null && picked.path === entry.path ? 'true' : 'false',
                    onClick: () => {
                      if (entry.type === 'dir') {
                        setCurrent(entry.path);
                        setPicked(null);
                        setNameTouched(false);
                        return;
                      }
                      setPicked(entry);
                      setNameTouched(false);
                    },
                  },
                  h('span', { className: 'mat-pick-meta' }, entry.type === 'dir' ? '▸' : '·'),
                  h('span', { className: 'mat-pick-name' }, entry.name),
                  h('span', { className: 'mat-pick-meta' }, entry.type === 'dir' ? t('refKindDir') : t('refKindFile')),
                ),
              ),
            ),
            h('div', { className: 'mat-hint' }, picked === null ? t('pickHintDir') : t('pickHintFile')),
            h(
              'label',
              null,
              h('span', { className: 'mat-label' }, t('name')),
              h('input', {
                className: 'mat-input',
                value: name,
                onChange: (event) => {
                  setNameTouched(true);
                  setName(event.target.value);
                },
              }),
            ),
            h('span', { className: 'mat-label' }, t('collectLibFolder')),
            h(FolderField, {
              t,
              value: folder,
              folders: libFolders,
              onChange: setFolder,
            }),
            h('span', { className: 'mat-label' }, t('collectTags')),
            libTags.length > 0 &&
              h(
                'div',
                { className: 'mat-chips' },
                libTags.map((tag) =>
                  h(
                    'button',
                    {
                      key: tag,
                      className: 'mat-chip',
                      type: 'button',
                      'data-active': parseTags(tags).some((item) => item.toLowerCase() === tag.toLowerCase()) ? 'true' : 'false',
                      onClick: () => {
                        const current = parseTags(tags);
                        const exists = current.some((item) => item.toLowerCase() === tag.toLowerCase());
                        setTags((exists ? current.filter((item) => item.toLowerCase() !== tag.toLowerCase()) : [tag, ...current]).join(', '));
                      },
                    },
                    tag,
                  ),
                ),
              ),
            h('input', {
              className: 'mat-input',
              value: tags,
              placeholder: t('tags'),
              onChange: (event) => setTags(event.target.value),
            }),
            h(
              'div',
              { className: 'mat-hint' },
              `${t('collectTarget')} ${folder.trim() === '' ? t('root') : folder.trim()}/${name.trim() === '' ? '…' : name.trim()}`,
            ),
            error !== '' && h('div', { className: 'mat-error', style: { padding: '0' } }, error),
            done !== '' && h('div', { className: 'mat-toast' }, done),
          ),
          h(
            'div',
            { className: 'mat-dialog-foot' },
            h(
              'button',
              { className: 'mat-btn mat-btn-primary', onClick: submit, disabled: busy || absPath === '' },
              picked === null ? t('collectFolderHere') : t('collectFileHere'),
            ),
            typeof openLibrary === 'function' &&
              h('button', { className: 'mat-btn', onClick: openLibrary }, t('collectOpenLibrary')),
            h('span', { className: 'mat-grow' }),
            h('button', { className: 'mat-btn mat-btn-ghost', onClick: onClose }, t('cancel')),
          ),
        ),
      );
    }

    /** The session-header entry that opens the collect dialog. */
    function CollectButton(props) {
      const t = translator(props.t);
      const [open, setOpen] = useState(false);
      const sessionId = typeof props.sessionId === 'string' ? props.sessionId : '';
      const useSessions = typeof props.useSessions === 'function' ? props.useSessions : null;
      const session = useSessions !== null ? useSessions((state) => state.byId[sessionId]) : undefined;
      const cwd = session !== null && session !== undefined && typeof session.cwd === 'string' ? session.cwd : '';
      const sessionTitle = session !== null && session !== undefined && typeof session.title === 'string' ? session.title : '';

      return h(
        React.Fragment,
        null,
        h(
          'button',
          {
            className: 'mat-icon-btn',
            title: t('collect'),
            'aria-label': t('collect'),
            onClick: () => setOpen(true),
          },
          h(MaterialsIcon, { size: 16 }),
        ),
        open &&
          h(CollectDialog, {
            t,
            sessionId,
            sessionTitle,
            cwd,
            onClose: () => setOpen(false),
            openLibrary: typeof props.openLibrary === 'function' ? props.openLibrary : undefined,
          }),
      );
    }

    /** Library-side entry: pick a conversation, then file something out of it. */
    function CollectLauncher({ t, useSessions, openLibrary, onClose, defaultFolder }) {
      const select = typeof useSessions === 'function' ? useSessions : null;
      const summaries = select !== null ? select((state) => state.byId) : null;
      const [times, setTimes] = useState(null);
      const [chosen, setChosen] = useState(null);
      const [query, setQuery] = useState('');

      useEffect(() => {
        let cancelled = false;
        call('/session-times')
          .then((result) => {
            if (!cancelled) setTimes(result !== null && typeof result.times === 'object' && result.times !== null ? result.times : {});
          })
          .catch(() => {
            if (!cancelled) setTimes({});
          });
        return () => {
          cancelled = true;
        };
      }, []);

      const rows = useMemo(() => {
        if (summaries === null || summaries === undefined) return [];
        const needle = query.trim().toLowerCase();
        const collected = [];
        for (const id of Object.keys(summaries)) {
          const entry = summaries[id];
          if (entry === null || entry === undefined) continue;
          if (entry.origin === 'subagent') continue;
          if (entry.blank === true) continue;
          const title = typeof entry.title === 'string' && entry.title.trim() !== '' ? entry.title : id;
          const cwd = typeof entry.cwd === 'string' ? entry.cwd : '';
          if (needle !== '' && `${title} ${cwd}`.toLowerCase().indexOf(needle) < 0) continue;
          const stamp = times !== null && typeof times[id] === 'number' ? times[id] : 0;
          collected.push({ id, title, cwd, time: stamp });
        }
        return collected.sort((left, right) => right.time - left.time);
      }, [summaries, times, query]);

      if (chosen !== null) {
        return h(CollectDialog, {
          t,
          sessionId: chosen.id,
          sessionTitle: chosen.title,
          cwd: chosen.cwd,
          onClose,
          openLibrary,
          defaultFolder: typeof defaultFolder === 'string' ? defaultFolder : '',
        });
      }

      return h(
        'div',
        {
          className: 'mat-overlay',
          onClick: (event) => {
            if (event.target === event.currentTarget && typeof onClose === 'function') onClose();
          },
        },
        h('style', null, CSS),
        h(
          'div',
          { className: 'mat-dialog' },
          h(
            'div',
            { className: 'mat-dialog-head' },
            h('span', { className: 'mat-title' }, t('pickSession')),
            h('span', { className: 'mat-grow' }),
            h('button', { className: 'mat-btn mat-btn-ghost', onClick: onClose, title: t('close') }, '✕'),
          ),
          h('div', { className: 'mat-dialog-sub' }, t('pickSessionHint')),
          h(
            'div',
            { className: 'mat-dialog-body' },
            h('input', {
              className: 'mat-input',
              placeholder: t('sessionSearch'),
              value: query,
              onChange: (event) => setQuery(event.target.value),
            }),
            h(
              'div',
              { className: 'mat-pick' },
              summaries === null && h('div', { className: 'mat-hint', style: { padding: '8px' } }, t('scanning')),
              summaries !== null &&
                rows.length === 0 &&
                h('div', { className: 'mat-hint', style: { padding: '8px' } }, t('pickSessionEmpty')),
              rows.map((row) =>
                h(
                  'button',
                  { key: row.id, className: 'mat-pick-row', onClick: () => setChosen(row) },
                  h('span', { className: 'mat-pick-meta' }, '·'),
                  h('span', { className: 'mat-pick-name' }, row.title),
                  h('span', { className: 'mat-pick-meta' }, row.cwd === '' ? t('sessionNoCwd') : shortenPath(row.cwd)),
                ),
              ),
            ),
          ),
          h(
            'div',
            { className: 'mat-dialog-foot' },
            h('span', { className: 'mat-grow' }),
            h('button', { className: 'mat-btn mat-btn-ghost', onClick: onClose }, t('cancel')),
          ),
        ),
      );
    }

    /** The panel: folders, materials, editor. */
    /* --- a small Markdown reader, so a material reads like a message ----- */

    const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|~~[^~\n]+~~|\*[^*\n]+\*|\[[^\]\n]*\]\([^)\s]+\))/g;

    function renderInline(text, seed) {
      if (typeof text !== 'string' || text === '') return null;
      return text
        .split(INLINE_PATTERN)
        .map((part, index) => {
          const key = `${seed}-${index}`;
          if (part === '') return null;
          if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
            return h('strong', { key }, part.slice(2, -2));
          }
          if (part.length > 4 && part.startsWith('__') && part.endsWith('__')) {
            return h('strong', { key }, part.slice(2, -2));
          }
          if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
            return h('code', { key }, part.slice(1, -1));
          }
          if (part.length > 4 && part.startsWith('~~') && part.endsWith('~~')) {
            return h('del', { key }, part.slice(2, -2));
          }
          if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
            return h('em', { key }, part.slice(1, -1));
          }
          const link = /^\[([^\]\n]*)\]\(([^)\s]+)\)$/.exec(part);
          if (link !== null) {
            return h('a', { key, href: link[2], target: '_blank', rel: 'noreferrer' }, link[1] === '' ? link[2] : link[1]);
          }
          return part;
        })
        .filter((node) => node !== null);
    }

    function renderListBlock(block, seed) {
      const items = [];
      for (const raw of block) {
        const match = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(raw);
        if (match !== null) {
          items.push({
            indent: match[1].replace(/\t/g, '  ').length,
            ordered: /^\d/.test(match[2]),
            text: match[3],
          });
          continue;
        }
        if (items.length > 0) items[items.length - 1].text += ` ${raw.trim()}`;
      }
      if (items.length === 0) return null;
      let cursor = 0;
      const build = (base, depth) => {
        const ordered = items[cursor].ordered;
        const tag = ordered ? 'ol' : 'ul';
        const children = [];
        while (cursor < items.length && items[cursor].indent >= base) {
          if (items[cursor].indent > base) {
            const nested = build(items[cursor].indent, depth + 1);
            if (nested !== null) children.push(nested);
            continue;
          }
          const item = items[cursor];
          cursor += 1;
          const key = `${seed}-li${cursor}`;
          const inner = [];
          while (cursor < items.length && items[cursor].indent > base) {
            const nested = build(items[cursor].indent, depth + 1);
            if (nested !== null) inner.push(nested);
          }
          children.push(h('li', { key }, renderInline(item.text, key), inner));
        }
        return h(tag, { key: `${seed}-${tag}-${depth}-${cursor}` }, children);
      };
      return build(items[0].indent, 0);
    }

    function parseDelimited(text, delimiter) {
      const rows = [];
      let row = [];
      let field = '';
      let quoted = false;
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        if (quoted) {
          if (ch === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i += 1;
            } else {
              quoted = false;
            }
          } else {
            field += ch;
          }
          continue;
        }
        if (ch === '"') {
          quoted = true;
        } else if (ch === delimiter) {
          row.push(field);
          field = '';
        } else if (ch === '\n') {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
        } else if (ch !== '\r') {
          field += ch;
        }
      }
      if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
      }
      return rows.filter((entry) => entry.some((cell) => cell.trim() !== '')).slice(0, 500);
    }

    function renderTable(text, delimiter) {
      const rows = parseDelimited(text, delimiter);
      if (rows.length === 0) return h('p', { className: 'fdr-doc-empty' }, 'empty table');
      const head = rows[0];
      const body = rows.slice(1);
      return h(
        'div',
        { className: 'fdr-table-wrap' },
        h(
          'table',
          { className: 'fdr-prose-table fdr-grid' },
          h('thead', null, h('tr', null, head.map((cell, index) => h('th', { key: `h-${index}` }, cell)))),
          h(
            'tbody',
            null,
            body.map((line, r) =>
              h('tr', { key: `r-${r}` }, head.map((_, c) => h('td', { key: `c-${c}` }, line[c] ?? ''))),
            ),
          ),
        ),
      );
    }

    function renderMarkdown(source) {
      const lines = String(source === null || source === undefined ? '' : source).replace(/\r\n?/g, '\n').split('\n');
      const blocks = [];
      let index = 0;
      let seed = 0;
      const nextKey = (tag) => `${tag}-${seed++}`;
      while (index < lines.length) {
        const line = lines[index];
        if (/^\s*$/.test(line)) {
          index += 1;
          continue;
        }
        const fence = /^\s*```(\S*)\s*$/.exec(line);
        if (fence !== null) {
          const body = [];
          index += 1;
          while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
            body.push(lines[index]);
            index += 1;
          }
          index += 1;
          blocks.push(h('pre', { key: nextKey('pre') }, h('code', null, body.join('\n'))));
          continue;
        }
        const heading = /^\s*(#{1,6})\s+(.*)$/.exec(line);
        if (heading !== null) {
          const level = heading[1].length;
          const key = nextKey('h');
          blocks.push(h(`h${level}`, { key }, renderInline(heading[2].trim(), key)));
          index += 1;
          continue;
        }
        if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
          blocks.push(h('hr', { key: nextKey('hr') }));
          index += 1;
          continue;
        }
        if (/^\s*>/.test(line)) {
          const body = [];
          while (index < lines.length && /^\s*>/.test(lines[index])) {
            body.push(lines[index].replace(/^\s*>\s?/, ''));
            index += 1;
          }
          blocks.push(h('blockquote', { key: nextKey('quote') }, renderMarkdown(body.join('\n'))));
          continue;
        }
        if (
          /^\s*\|/.test(line) &&
          index + 1 < lines.length &&
          /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(lines[index + 1])
        ) {
          const cells = (row) =>
            row
              .trim()
              .replace(/^\|/, '')
              .replace(/\|$/, '')
              .split('|')
              .map((cell) => cell.trim());
          const head = cells(line);
          index += 2;
          const rows = [];
          while (index < lines.length && /^\s*\|/.test(lines[index])) {
            rows.push(cells(lines[index]));
            index += 1;
          }
          blocks.push(
            h(
              'table',
              { key: nextKey('table') },
              h(
                'thead',
                null,
                h(
                  'tr',
                  null,
                  head.map((cell, column) => h('th', { key: `th-${column}` }, renderInline(cell, `th-${column}`))),
                ),
              ),
              h(
                'tbody',
                null,
                rows.map((row, rowIndex) =>
                  h(
                    'tr',
                    { key: `tr-${rowIndex}` },
                    row.map((cell, column) => h('td', { key: `td-${rowIndex}-${column}` }, renderInline(cell, `td-${rowIndex}-${column}`))),
                  ),
                ),
              ),
            ),
          );
          continue;
        }
        if (/^\s*(?:[-*+]|\d+[.)])\s+/.test(line)) {
          const block = [];
          while (index < lines.length) {
            const current = lines[index];
            if (/^\s*(?:[-*+]|\d+[.)])\s+/.test(current) || /^\s{2,}\S/.test(current)) {
              block.push(current);
              index += 1;
              continue;
            }
            if (/^\s*$/.test(current) && index + 1 < lines.length && /^\s*(?:[-*+]|\d+[.)])\s+/.test(lines[index + 1])) {
              index += 1;
              continue;
            }
            break;
          }
          const list = renderListBlock(block, nextKey('list'));
          if (list !== null) blocks.push(list);
          continue;
        }
        const paragraph = [];
        while (index < lines.length && !/^\s*$/.test(lines[index])) {
          const current = lines[index];
          if (
            /^\s*(?:[-*+]|\d+[.)])\s+/.test(current) ||
            /^\s*#{1,6}\s+/.test(current) ||
            /^\s*```/.test(current) ||
            /^\s*>/.test(current)
          ) {
            break;
          }
          paragraph.push(current.trim());
          index += 1;
        }
        if (paragraph.length === 0) {
          index += 1;
          continue;
        }
        const key = nextKey('p');
        blocks.push(h('p', { key }, renderInline(paragraph.join('\n'), key)));
      }
      return blocks;
    }

    /** Small line glyphs, so list rows read like a file browser. */
    function glyph(kind, size) {
      const common = {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.25,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
      };
      if (kind === 'folder') {
        return h('svg', common, h('path', { d: 'M1.9 4.4c0-.6.4-1 1-1h2.9l1.3 1.5h5c.6 0 1 .4 1 1v5.9c0 .6-.4 1-1 1H2.9c-.6 0-1-.4-1-1z' }));
      }
      if (kind === 'image') {
        return h(
          'svg',
          common,
          h('rect', { x: '2', y: '3', width: '12', height: '10', rx: '1.6' }),
          h('circle', { cx: '5.9', cy: '6.4', r: '1.1' }),
          h('path', { d: 'M3.2 11.6 6.6 8.4l2.2 2 1.6-1.3 2.4 2.5' }),
        );
      }

      if (kind === 'ref') {
        return h(
          'svg',
          common,
          h('path', { d: 'M6.7 9.3 9.3 6.7' }),
          h('path', { d: 'M7.7 4.9 8.9 3.7a2.4 2.4 0 0 1 3.4 3.4L11.1 8.3' }),
          h('path', { d: 'M8.3 11.1 7.1 12.3a2.4 2.4 0 0 1-3.4-3.4L4.9 7.7' }),
        );
      }
      return h(
        'svg',
        common,
        h('path', { d: 'M3.7 2.4h5.1l3.5 3.5v7.7c0 .5-.4.9-.9.9H3.7c-.5 0-.9-.4-.9-.9V3.3c0-.5.4-.9.9-.9z' }),
        h('path', { d: 'M8.6 2.6v3.4h3.4' }),
      );
    }

    function stampShort(ms) {
      if (typeof ms !== 'number' || !isFinite(ms) || ms <= 0) return '';
      const date = new Date(ms);
      const now = new Date();
      const sameDay =
        date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
      const pad = (value) => String(value).padStart(2, '0');
      const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      if (sameDay) return time;
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      if (
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate()
      ) {
        return `昨天 ${time}`;
      }
      const md = `${date.getMonth() + 1}/${date.getDate()}`;
      if (date.getFullYear() === now.getFullYear()) return md;
      return `${date.getFullYear()}/${md}`;
    }

    function bodyWithoutTitle(text) {
      return String(text === null || text === undefined ? '' : text).replace(/^\s*#\s+[^\n]*\n+/, '');
    }

    /** The panel, laid out like a Finder window: source list, list view, reader. */
    function MaterialsPage({ t: translate, openRef, useSessions }) {
      const t = translator(translate);
      const [snapshot, setSnapshot] = useState(null);
      const [error, setError] = useState('');
      const [toast, setToast] = useState('');
      const [busy, setBusy] = useState(false);
      const [loading, setLoading] = useState(true);
      const [query, setQuery] = useState('');
      const [hits, setHits] = useState(null);
      const [trail, setTrail] = useState(['']);
      const [at, setAt] = useState(0);
      const [selectedTag, setSelectedTag] = useState('');
      const [collapsed, setCollapsed] = useState(() => new Set());
      const [picked, setPicked] = useState('');
      const [draft, setDraft] = useState(null);
      const [editing, setEditing] = useState(false);
      const [newFolder, setNewFolder] = useState(null);
      const [renaming, setRenaming] = useState(null);
      const [pendingDelete, setPendingDelete] = useState(null);
      const [confirming, setConfirming] = useState(null);
      const [collectOpen, setCollectOpen] = useState(false);
      const [sortDesc, setSortDesc] = useState(true);
      const [openMenu, setOpenMenu] = useState(false);
      const [openInfo, setOpenInfo] = useState(null);
      const [openBusy, setOpenBusy] = useState(false);
      const [history, setHistory] = useState(null);
      const [historyBusy, setHistoryBusy] = useState(false);
      const [rules, setRules] = useState([]);

      const selectedDir = trail[at] === undefined ? '' : trail[at];

      /* What a rule's folder holds right now — not what its last run added. */
      const countInFolder = (folder) => {
        const all = [
          ...((snapshot && snapshot.refs) || []),
          ...((snapshot && snapshot.files) || []),
        ];
        const target = folder || '';
        return all.filter((item) => {
          const where = item && typeof item.folder === 'string' ? item.folder : '';
          if (target === '') return where === '';
          return where === target || where.startsWith(`${target}/`);
        }).length;
      };

      const refresh = useCallback(async () => {
        try {
          let next = null;
          try {
            next = await call('/state');
          } catch (first) {
            /* The host may still be coming up right after a plugin reload. */
            await new Promise((resolve) => setTimeout(resolve, 500));
            next = await call('/state');
          }
          setSnapshot(next);
          setError('');
          try {
            const known = await call('/rules');
            setRules(Array.isArray(known.rules) ? known.rules : []);
          } catch {
            setRules([]);
          }
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setLoading(false);
        }
      }, []);

      /* Coming back to the window is the moment a stale panel is most obvious. */
      useEffect(() => {
        const onFocus = () => {
          refresh();
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
      }, [refresh]);

      useEffect(() => {
        refresh();
      }, [refresh]);

      useEffect(() => {
        const needle = query.trim();
        if (needle === '') {
          setHits(null);
          return undefined;
        }
        let cancelled = false;
        const timer = setTimeout(async () => {
          try {
            const result = await call(`/search?q=${encodeURIComponent(needle)}`);
            if (!cancelled) setHits(Array.isArray(result.results) ? result.results : []);
          } catch (failure) {
            if (!cancelled) setError(describeError(t, failure));
          }
        }, 220);
        return () => {
          cancelled = true;
          clearTimeout(timer);
        };
      }, [query]);

      useEffect(() => {
        if (toast === '') return undefined;
        const timer = setTimeout(() => setToast(''), 2200);
        return () => clearTimeout(timer);
      }, [toast]);

      const tree = useMemo(() => buildTree(snapshot ? snapshot.folders : []), [snapshot]);
      const allEntries = useMemo(() => {
        const notes = (snapshot ? snapshot.files : []).map(shapeEntry);
        const refs = snapshot && Array.isArray(snapshot.refs) ? snapshot.refs : [];
        return [...notes, ...refs.map(shapeEntry)];
      }, [snapshot]);
      const counts = useMemo(() => countByFolder(allEntries), [allEntries]);
      const pool = hits === null ? allEntries : hits.map(shapeEntry);
      const visible = useMemo(() => {
        const filtered = pool.filter((file) => {
          if (hits === null && selectedDir !== '') {
            if (file.dir !== selectedDir && !file.dir.startsWith(`${selectedDir}/`)) return false;
          }
          if (hits === null && selectedTag !== '' && !file.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())) {
            return false;
          }
          return true;
        });
        return filtered.slice().sort((left, right) => {
          const delta = (left.updatedAt || 0) - (right.updatedAt || 0);
          return sortDesc ? -delta : delta;
        });
      }, [pool, hits, selectedDir, selectedTag, sortDesc]);

      const tags = snapshot && Array.isArray(snapshot.tags) ? snapshot.tags : [];

      const goTo = (dir) => {
        const trimmed = trail.slice(0, at + 1);
        trimmed.push(dir);
        setTrail(trimmed);
        setAt(trimmed.length - 1);
        setPicked('');
      };

      const goBack = () => {
        if (at > 0) setAt(at - 1);
      };

      const goForward = () => {
        if (at < trail.length - 1) setAt(at + 1);
      };

      const toggleFolder = (path) => {
        setCollapsed((previous) => {
          const next = new Set(previous);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return next;
        });
      };

      const closeDraft = () => {
        setDraft(null);
        setEditing(false);
      };

      const openEntry = async (entry) => {
        try {
          setConfirming(null);
          setPicked(entry.key);
          setEditing(false);
          if (entry.type === 'ref') {
            const ref = entry.ref;
            setDraft({
              mode: 'ref',
              ref,
              id: ref.id,
              path: '',
              name: ref.name,
              dir: ref.folder === undefined || ref.folder === null ? '' : ref.folder,
              content: '',
              preview: null,
              tags: Array.isArray(ref.tags) ? ref.tags : [],
              updatedAt: typeof ref.updatedAt === 'number' ? ref.updatedAt : null,
            });
            setError('');
            if (ref.kind === 'file') {
              try {
                const preview = await call(`/ref/preview?id=${encodeURIComponent(ref.id)}`);
                setDraft((previous) => (previous !== null && previous.id === ref.id ? { ...previous, preview } : previous));
              } catch (failure) {
                setError(describeError(t, failure));
              }
            }
            return;
          }
          const material = await call(`/file?path=${encodeURIComponent(entry.path)}`);
          setDraft({
            mode: 'edit',
            path: material.path,
            name: material.name,
            dir: material.dir,
            content: material.content,
            tags: material.tags,
            updatedAt: material.updatedAt,
          });
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        }
      };

      const startNew = () => {
        setConfirming(null);
        setPicked('');
        setEditing(true);
        setDraft({
          mode: 'new',
          path: '',
          name: '',
          dir: selectedDir,
          content: '',
          tags: selectedTag === '' ? [] : [selectedTag],
          updatedAt: null,
        });
      };

      const saveRef = async () => {
        if (draft === null || typeof draft.id !== 'string') return;
        setBusy(true);
        try {
          await call(
            '/ref/update',
            post({ id: draft.id, name: draft.name.trim(), folder: draft.dir.trim(), tags: draft.tags }),
          );
          await refresh();
          setDraft({ ...draft, name: draft.name.trim(), dir: draft.dir.trim() });
          setEditing(false);
          setToast(t('saved'));
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      const removeRef = async (id) => {
        setBusy(true);
        try {
          await call('/ref/delete', post({ id }));
          if (draft !== null && draft.id === id) closeDraft();
          setConfirming(null);
          await refresh();
          setToast(t('refRemoved'));
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      const save = async () => {
        if (draft === null) return;
        if (draft.mode === 'ref') {
          await saveRef();
          return;
        }
        const name = draft.name.trim();
        if (name === '') {
          setError(t('nameRequired'));
          return;
        }
        setBusy(true);
        try {
          const body = { name, dir: draft.dir.trim(), content: draft.content, tags: draft.tags };
          const result =
            draft.mode === 'new' ? await call('/create', post(body)) : await call('/update', post({ path: draft.path, ...body }));
          await refresh();
          const material = await call(`/file?path=${encodeURIComponent(result.path)}`);
          setPicked(`note:${material.path}`);
          setDraft({
            mode: 'edit',
            path: material.path,
            name: material.name,
            dir: material.dir,
            content: material.content,
            tags: material.tags,
            updatedAt: material.updatedAt,
          });
          setEditing(false);
          setToast(t('saved'));
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      const removeMaterial = async (path) => {
        setBusy(true);
        try {
          await call('/delete', post({ path }));
          if (draft !== null && draft.path === path) closeDraft();
          setConfirming(null);
          await refresh();
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      const createFolder = async () => {
        const name = (newFolder === null ? '' : newFolder).trim();
        if (name === '') return;
        setBusy(true);
        try {
          await call('/folder', post({ dir: selectedDir, name }));
          setNewFolder(null);
          await refresh();
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      const removeFolder = async (path) => {
        setBusy(true);
        try {
          await call('/folder/delete', post({ path }));
          if (selectedDir === path || selectedDir.startsWith(`${path}/`)) goTo('');
          setConfirming(null);
          await refresh();
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      const startRename = (kind, from, value) => {
        setPendingDelete(null);
        setRenaming({ kind, from, value });
      };

      const commitRename = async () => {
        if (renaming === null || busy) return;
        const next = renaming.value.trim();
        const from = renaming.from;
        if (next === '' || next === from) {
          setRenaming(null);
          return;
        }
        setBusy(true);
        try {
          if (renaming.kind === 'folder') {
            const result = await call('/folder/rename', post({ path: from, name: next }));
            const target = result && typeof result.path === 'string' ? result.path : from;
            if (selectedDir === from || selectedDir.startsWith(`${from}/`)) {
              goTo(`${target}${selectedDir.slice(from.length)}`);
            }
            setToast(t('folderRenamed'));
          } else {
            await call('/tag/rename', post({ from, to: next }));
            if (selectedTag.toLowerCase() === from.toLowerCase()) setSelectedTag(next);
            setToast(t('tagRenamed'));
          }
          setRenaming(null);
          await refresh();
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      const dropTag = async (name) => {
        setBusy(true);
        try {
          await call('/tag/delete', post({ name }));
          if (selectedTag.toLowerCase() === name.toLowerCase()) setSelectedTag('');
          setPendingDelete(null);
          setToast(t('tagRemoved'));
          await refresh();
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      const toggleTag = (tag) => {
        setSelectedTag((previous) => (previous.toLowerCase() === tag.toLowerCase() ? '' : tag));
      };

      const crumbs = useMemo(() => {
        const parts = selectedDir === '' ? [] : selectedDir.split('/');
        const items = [{ label: t('title'), dir: '' }];
        let walk = '';
        for (const part of parts) {
          walk = walk === '' ? part : `${walk}/${part}`;
          items.push({ label: part, dir: walk });
        }
        return items;
      }, [selectedDir]);

      /* --- source list --------------------------------------------------- */

      const navRow = (label, count, active, onClick, iconKind, extra) =>
        h(
          'button',
          {
            key: extra || label,
            className: 'fdr-nav',
            'data-active': active ? 'true' : 'false',
            onClick,
            type: 'button',
          },
          h('span', { className: 'fdr-nav-ico' }, glyph(iconKind, 14)),
          h('span', { className: 'fdr-nav-name' }, label),
          h('span', { className: 'fdr-nav-count' }, String(count)),
        );

      const folderRow = (node, depth) => {
        const kids = node.children || [];
        const isCollapsed = collapsed.has(node.path);
        const rows = [
          h(
            'div',
            {
              key: node.path,
              className: 'fdr-nav fdr-nav-folder',
              'data-active': selectedDir === node.path ? 'true' : 'false',
              style: { paddingLeft: `${8 + depth * 12}px` },
              onClick: () => {
                goTo(node.path);
                if (node.path === '') {
                  setSelectedTag('');
                  setQuery('');
                  setHits(null);
                }
              },
              onDoubleClick: () => toggleFolder(node.path),
              role: 'button',
              tabIndex: 0,
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') goTo(node.path);
              },
            },
            h(
              'span',
              {
                className: 'fdr-twisty',
                onClick: (event) => {
                  event.stopPropagation();
                  toggleFolder(node.path);
                },
                role: 'presentation',
              },
              kids.length > 0 ? (isCollapsed ? '▸' : '▾') : '',
            ),
            h('span', { className: 'fdr-nav-ico' }, glyph('folder', 14)),
            renaming !== null && renaming.kind === 'folder' && renaming.from === node.path
              ? h('input', {
                  className: 'fdr-nav-input',
                  value: renaming.value,
                  autoFocus: true,
                  onClick: (event) => event.stopPropagation(),
                  onChange: (event) => setRenaming({ ...renaming, value: event.target.value }),
                  onKeyDown: (event) => {
                    event.stopPropagation();
                    if (event.key === 'Enter') commitRename();
                    if (event.key === 'Escape') setRenaming(null);
                  },
                  onBlur: () => commitRename(),
                })
              : h('span', { className: 'fdr-nav-name' }, node.name),
            h('span', { className: 'fdr-nav-count' }, String(counts.get(node.path) || 0)),
            h(
              'span',
              { className: 'fdr-row-ops' },
              h(
                'button',
                {
                  className: 'fdr-op',
                  type: 'button',
                  title: t('rename'),
                  onClick: (event) => {
                    event.stopPropagation();
                    startRename('folder', node.path, node.name);
                  },
                },
                '\u270e',
              ),
              pendingDelete !== null && pendingDelete.kind === 'folder' && pendingDelete.key === node.path
                ? h(
                    'button',
                    {
                      className: 'fdr-op fdr-op-danger',
                      type: 'button',
                      title: t('deleteFolder'),
                      disabled: busy,
                      onClick: (event) => {
                        event.stopPropagation();
                        removeFolder(node.path);
                      },
                    },
                    t('confirmDeleteFolder'),
                  )
                : h(
                    'button',
                    {
                      className: 'fdr-op',
                      type: 'button',
                      title: t('deleteFolder'),
                      onClick: (event) => {
                        event.stopPropagation();
                        setPendingDelete({ kind: 'folder', key: node.path });
                      },
                    },
                    '\u00d7',
                  ),
            ),
          ),
        ];
        if (!isCollapsed) {
          for (const kid of kids) rows.push(folderRow(kid, depth + 1));
        }
        return rows;
      };

      const sidebar = h(
        'div',
        { className: 'fdr-side' },
        h(
          'div',
          { className: 'fdr-side-head' },
          h('span', { className: 'fdr-side-title' }, t('title')),
          h('span', { className: 'fdr-grow' }),
          h(
            'button',
            { className: 'mat-icon-btn', onClick: refresh, title: t('refresh'), type: 'button', disabled: busy },
            h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', 'aria-hidden': 'true' }, h('path', { d: 'M13 8a5 5 0 1 1-1.6-3.7' }), h('path', { d: 'M13.2 2.6v3.2h-3.2' })),
          ),
        ),
        h(
          'div',
          { className: 'fdr-side-scroll' },
          h('div', { className: 'fdr-group-label' }, t('rootFolder')),
          navRow(
            t('rootFolder'),
            counts.get('') || 0,
            selectedDir === '' && selectedTag === '' && hits === null,
            () => {
              goTo('');
              setSelectedTag('');
              setQuery('');
              setHits(null);
            },
            'doc',
            'root',
          ),
          h(
            'div',
            { className: 'fdr-group-label' },
            t('folders'),
            h(
              'button',
              {
                className: 'fdr-group-add',
                title: t('newFolder'),
                type: 'button',
                onClick: () => setNewFolder(newFolder === null ? '' : null),
              },
              '＋',
            ),
          ),
          newFolder !== null &&
            h(
              'div',
              { className: 'fdr-newfolder' },
              h('input', {
                className: 'fdr-input',
                placeholder: t('folderName'),
                value: newFolder,
                autoFocus: true,
                onChange: (event) => setNewFolder(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') createFolder();
                  if (event.key === 'Escape') setNewFolder(null);
                },
              }),
            ),
          tree.children.map((node) => folderRow(node, 0)),
          tags.length > 0 && h('div', { className: 'fdr-group-label' }, t('tags')),
          tags.map((tag) =>
            h(
              'button',
              {
                key: `tag-${tag.name}`,
                className: 'fdr-nav',
                'data-active': selectedTag.toLowerCase() === tag.name.toLowerCase() ? 'true' : 'false',
                type: 'button',
                onClick: () => toggleTag(tag.name),
              },
              h('span', { className: 'fdr-nav-dot' }),
              renaming !== null && renaming.kind === 'tag' && renaming.from === tag.name
                ? h('input', {
                    className: 'fdr-nav-input',
                    value: renaming.value,
                    autoFocus: true,
                    onClick: (event) => event.stopPropagation(),
                    onChange: (event) => setRenaming({ ...renaming, value: event.target.value }),
                    onKeyDown: (event) => {
                      event.stopPropagation();
                      if (event.key === 'Enter') commitRename();
                      if (event.key === 'Escape') setRenaming(null);
                    },
                    onBlur: () => commitRename(),
                  })
                : h('span', { className: 'fdr-nav-name' }, tag.name),
              h('span', { className: 'fdr-nav-count' }, String(tag.count)),
              h(
                'span',
                { className: 'fdr-row-ops' },
                pendingDelete !== null && pendingDelete.kind === 'tag' && pendingDelete.key === tag.name
                  ? h(
                      'button',
                      {
                        className: 'fdr-op fdr-op-danger',
                        type: 'button',
                        title: t('removeTag'),
                        disabled: busy,
                        onClick: (event) => {
                          event.stopPropagation();
                          dropTag(tag.name);
                        },
                      },
                      t('confirmRemoveTag'),
                    )
                  : [
                      h(
                        'button',
                        {
                          key: 'rename',
                          className: 'fdr-op',
                          type: 'button',
                          title: t('renameTag'),
                          onClick: (event) => {
                            event.stopPropagation();
                            startRename('tag', tag.name, tag.name);
                          },
                        },
                        '\u270e',
                      ),
                      h(
                        'button',
                        {
                          key: 'remove',
                          className: 'fdr-op',
                          type: 'button',
                          title: t('removeTag'),
                          onClick: (event) => {
                            event.stopPropagation();
                            setPendingDelete({ kind: 'tag', key: tag.name });
                          },
                        },
                        '\u00d7',
                      ),
                    ],
              ),
            ),
          ),
          rules.length > 0 && h('div', { className: 'fdr-group-label' }, t('autoRules')),
          rules.map((rule) =>
            h(
              'div',
              {
                key: rule.id,
                className: `fdr-nav fdr-nav-rule${rule.pendingAt > 0 ? ' fdr-nav-rule-pending' : ''}`,
                title: `${rule.root} → ${rule.folder || t('root')}${rule.pendingAt > 0 ? ` · ${t('rulePending')}` : ''}`,
              },
              h('span', { className: 'fdr-nav-dot' }),
              h('span', { className: 'fdr-nav-name' }, rule.root.split('/').filter(Boolean).slice(-1)[0] || rule.root),
              h('span', { className: 'fdr-nav-count' }, String(countInFolder(rule.folder))),
              h(
                'span',
                { className: 'fdr-row-ops' },
                h(
                  'button',
                  {
                    className: 'fdr-op fdr-op-danger',
                    type: 'button',
                    title: t('stopAutoRule'),
                    onClick: async () => {
                      try {
                        await call('/rules/delete', post({ id: rule.id }));
                        await refresh();
                      } catch (failure) {
                        setError(describeError(t, failure));
                      }
                    },
                  },
                  '\u00d7',
                ),
              ),
            ),
          ),
          selectedDir !== '' &&
            h(
              'div',
              { className: 'fdr-side-foot-row' },
              confirming === selectedDir
                ? h('button', { className: 'fdr-btn fdr-btn-danger', onClick: () => removeFolder(selectedDir), disabled: busy, type: 'button' }, t('confirmDeleteFolder'))
                : h('button', { className: 'fdr-btn fdr-btn-quiet', onClick: () => setConfirming(selectedDir), type: 'button' }, t('deleteFolder')),
            ),
        ),
        snapshot !== null &&
          h('div', { className: 'fdr-side-foot', title: snapshot.root }, h('span', { className: 'fdr-side-path' }, shortenPath(snapshot.root))),
      );

      /* --- toolbar ------------------------------------------------------- */

      const breadcrumb = h(
        'div',
        { className: 'fdr-crumbs' },
        crumbs.map((crumb, index) =>
          h(
            'span',
            { key: `crumb-${crumb.dir}` },
            index > 0 && h('span', { className: 'fdr-crumb-sep' }, '›'),
            h(
              'button',
              { className: 'fdr-crumb', type: 'button', onClick: () => goTo(crumb.dir) },
              crumb.label,
            ),
          ),
        ),
      );

      const toolbar = h(
        'div',
        { className: 'fdr-bar' },
        h(
          'div',
          { className: 'fdr-bar-top' },
          h(
            'button',
            { className: 'mat-icon-btn', onClick: goBack, disabled: at <= 0, title: t('back'), type: 'button' },
            '‹',
          ),
          h(
            'button',
            { className: 'mat-icon-btn', onClick: goForward, disabled: at >= trail.length - 1, title: t('forward'), type: 'button' },
            '›',
          ),
          breadcrumb,
        ),
        h(
          'div',
          { className: 'fdr-bar-bottom' },
          h(
            'div',
            { className: 'fdr-search' },
            h('span', { className: 'fdr-search-ico' }, '⌕'),
            h('input', {
              className: 'fdr-search-input',
              placeholder: t('searchPlaceholder'),
              value: query,
              onChange: (event) => setQuery(event.target.value),
            }),
            query !== '' &&
              h(
                'button',
                { className: 'fdr-search-clear', type: 'button', onClick: () => setQuery(''), title: t('close') },
                '✕',
              ),
          ),
          h(
            'button',
            { className: 'fdr-btn fdr-btn-primary fdr-collect', onClick: () => setCollectOpen(true), type: 'button' },
            glyph('ref', 14),
            h('span', null, t('collectFromSession')),
          ),
          h(
            'button',
            { className: 'fdr-btn fdr-btn-quiet fdr-narrow', onClick: startNew, type: 'button', disabled: busy, title: t('newMaterial') },
            '＋',
          ),
        ),
      );

      /* --- list view ----------------------------------------------------- */

      const listHead = h(
        'div',
        { className: 'fdr-thead' },
        h('span', { className: 'fdr-th fdr-th-name' }, t('name')),
        h(
          'span',
          { className: 'fdr-th fdr-th-date', onClick: () => setSortDesc(!sortDesc), role: 'presentation' },
          `${t('updated')} ${sortDesc ? '↓' : '↑'}`,
        ),
      );

      const rows = visible.map((entry) => {
        const selected = picked === entry.key;
        return h(
          'div',
          {
            key: entry.key,
            className: 'fdr-row',
            'data-selected': selected ? 'true' : 'false',
            onClick: () => {
              setPicked(entry.key);
              openEntry(entry);
            },
            onDoubleClick: () => openEntry(entry),
            onKeyDown: (event) => {
              if (event.key === 'Enter') openEntry(entry);
            },
            role: 'button',
            tabIndex: 0,
          },
          h('span', { className: 'fdr-row-ico' }, glyph(entry.type === 'ref' ? 'ref' : 'doc', 15)),
          h(
            'span',
            { className: 'fdr-row-name' },
            h('span', { className: 'fdr-row-title' }, entry.name),
            entry.excerpt !== '' && h('span', { className: 'fdr-row-sub' }, entry.excerpt),
          ),
          h('span', { className: 'fdr-row-date' }, stampShort(entry.updatedAt)),
        );
      });

      const filterActive = selectedTag !== '' || (hits !== null && query.trim() !== '');
      const filterChips =
        filterActive &&
        h(
          'div',
          { className: 'fdr-filters' },
          selectedTag !== '' &&
            h(
              'button',
              {
                className: 'fdr-filter',
                type: 'button',
                onClick: () => setSelectedTag(''),
                title: t('clearFilter'),
              },
              h('span', null, `${t('tagFilter')} ${selectedTag}`),
              h('span', { className: 'fdr-filter-x' }, '✕'),
            ),
          hits !== null &&
            query.trim() !== '' &&
            h(
              'button',
              {
                className: 'fdr-filter',
                type: 'button',
                onClick: () => {
                  setQuery('');
                  setHits(null);
                },
                title: t('clearFilter'),
              },
              h('span', null, `${t('searchFilter')} ${query.trim()}`),
              h('span', { className: 'fdr-filter-x' }, '✕'),
            ),
        );

      const listView = h(
        'div',
        { className: 'fdr-body' },
        filterChips,
        visible.length > 0 && listHead,
        h(
          'div',
          { className: 'fdr-rows' },
          loading && h('div', { className: 'fdr-placeholder' }, t('loading')),
          !loading &&
            visible.length === 0 &&
            h('div', { className: 'fdr-placeholder' }, query.trim() === '' ? t('empty') : t('noResult')),
          rows,
          snapshot !== null && snapshot.truncated && h('div', { className: 'fdr-placeholder' }, t('truncated')),
        ),
      );

      /* --- detail pane --------------------------------------------------- */

      const targetKey = draft === null ? '' : draft.mode === 'ref' ? `ref:${draft.ref ? draft.ref.id : ''}` : `note:${draft.path}`;

      const absoluteOf = (value) => {
        if (value === null || value === undefined) return '';
        if (value.mode === 'ref') return value.ref && value.ref.absPath ? String(value.ref.absPath) : '';
        if (!value.path) return '';
        const root = snapshot && typeof snapshot.root === 'string' ? snapshot.root : '';
        return root === '' ? '' : `${root}/${value.path}`;
      };

      const openTarget = absoluteOf(draft);
      const targetIsDir = draft !== null && draft.mode === 'ref' && draft.ref !== null && draft.ref !== undefined && draft.ref.kind === 'dir';
      const canOpenWith = openTarget !== '' && !targetIsDir;
      const canRevealSession =
        draft !== null && draft.mode === 'ref' && draft.ref !== null && draft.ref !== undefined && typeof draft.ref.sessionId === 'string' && draft.ref.sessionId !== '';

      useEffect(() => {
        if (targetKey === '' || openTarget === '') {
          setOpenInfo(null);
          return undefined;
        }
        let cancelled = false;
        call(`/openers?path=${encodeURIComponent(openTarget)}`)
          .then((info) => {
            if (!cancelled) setOpenInfo(info);
          })
          .catch(() => {
            if (!cancelled) setOpenInfo(null);
          });
        return () => {
          cancelled = true;
        };
      }, [targetKey]);

      useEffect(() => {
        if (!openMenu) return undefined;
        const onDown = (event) => {
          const node = event.target;
          if (node instanceof Element && (node.closest('.fdr-split') || node.closest('.fdr-menu'))) return;
          setOpenMenu(false);
        };
        const onKey = (event) => {
          if (event.key === 'Escape') setOpenMenu(false);
        };
        document.addEventListener('mousedown', onDown, true);
        document.addEventListener('keydown', onKey);
        return () => {
          document.removeEventListener('mousedown', onDown, true);
          document.removeEventListener('keydown', onKey);
        };
      }, [openMenu]);

      const doOpen = async (appPath) => {
        const resolved = absoluteOf(draft);
        if (resolved === '') return;
        setOpenMenu(false);
        setOpenBusy(true);
        try {
          const payload =
            appPath === '__reveal'
              ? { path: resolved, reveal: true }
              : appPath === ''
                ? { path: resolved }
                : { path: resolved, app: appPath };
          const result = await call('/open', post(payload));
          setToast(result.reveal === true ? t('revealed') : t('opened'));
          setError('');
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setOpenBusy(false);
        }
      };

      const openHistory = async () => {
        if (draft === null || draft.mode === 'ref') return;
        setHistoryBusy(true);
        try {
          const listed = await call(`/versions?path=${encodeURIComponent(draft.path)}`);
          setHistory({ path: draft.path, versions: Array.isArray(listed.versions) ? listed.versions : [], body: null, id: '' });
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setHistoryBusy(false);
        }
      };

      const peekVersion = async (id) => {
        if (draft === null || history === null) return;
        try {
          const version = await call(`/version?path=${encodeURIComponent(history.path)}&id=${encodeURIComponent(id)}`);
          setHistory({ ...history, id, body: typeof version.content === 'string' ? version.content : '' });
        } catch (failure) {
          setError(describeError(t, failure));
        }
      };

      const restoreVersion = async (id) => {
        if (draft === null || history === null) return;
        setHistoryBusy(true);
        try {
          await call('/restore', post({ path: history.path, id }));
          setHistory(null);
          await refresh();
          const reopened = await call(`/file?path=${encodeURIComponent(draft.path)}`);
          setDraft({
            mode: 'note',
            path: reopened.path,
            name: reopened.name,
            dir: reopened.dir,
            tags: reopened.tags,
            content: reopened.content,
            updatedAt: reopened.updatedAt,
            preview: null,
            ref: null,
          });
          setToast(t('restored'));
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setHistoryBusy(false);
        }
      };

      const copyRefIntoLibrary = async () => {
        if (draft === null || draft.mode !== 'ref' || !draft.ref) return;
        setBusy(true);
        try {
          await call('/ref/copy', post({ id: draft.ref.id }));
          await refresh();
          setToast(t('copiedIntoLibrary'));
        } catch (failure) {
          setError(describeError(t, failure));
        } finally {
          setBusy(false);
        }
      };

      const kindLabel = (value) => {
        if (value === null) return '';
        if (value.mode === 'ref' && value.ref && value.ref.kind === 'dir') return t('kindFolder');
        const name = value.mode === 'ref' && value.ref ? String(value.ref.absPath || value.ref.name || '') : String(value.name || '');
        const ext = (name.match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.bmp', '.avif', '.svg'].includes(ext)) return t('kindImage');
        if (ext === '.html' || ext === '.htm') return t('kindWeb');
        if (ext === '.pdf') return t('kindPdf');
        if (['.sh', '.command', '.zsh'].includes(ext)) return t('kindShell');
        if (['.md', '.markdown', '.txt'].includes(ext)) return t('kindText');
        return t('kindFile');
      };

      const defaultApp =
        openInfo !== null && Array.isArray(openInfo.items) && openInfo.items.length > 0 ? openInfo.items[0] : null;

      const appIcon = (item) =>
        item !== null && typeof item.icon === 'string' && item.icon !== ''
          ? h('img', { className: 'fdr-app-ico', src: item.icon, alt: '' })
          : h('span', { className: 'fdr-menu-ico' }, glyph('doc', 14));

      const cardGlyph = targetIsDir
        ? 'folder'
        : /[.](png|jpe?g|gif|webp|heic|bmp|ico|avif)$/i.test(openTarget)
          ? 'image'
          : 'doc';
      const fileCard =
        draft === null
          ? null
          : h(
              'div',
              { className: 'fdr-detail-head' },
              h(
                'div',
                { className: 'fdr-filecard' },
                h(
                  'div',
                  { className: 'fdr-filecard-ico', 'data-kind': targetIsDir ? 'folder' : 'file' },
                  targetIsDir ? glyph('folder', 26) : glyph(cardGlyph, 26),
                ),
                h(
                  'div',
                  { className: 'fdr-filecard-main' },
                  h('div', { className: 'fdr-filecard-name' }, draft.mode === 'new' ? t('newMaterial') : draft.name || t('untitled')),
                  h('div', { className: 'fdr-filecard-sub' }, kindLabel(draft)),
                ),
                canOpenWith &&
                  h(
                    'div',
                    { className: 'fdr-split', 'data-open': openMenu ? 'true' : 'false', onClick: (event) => event.stopPropagation() },
                    h(
                      'button',
                      {
                        className: 'fdr-split-main',
                        type: 'button',
                        title: `${t('openDefault')}${defaultApp ? ` · ${defaultApp.name}` : ''}`,
                        onClick: () => doOpen(''),
                        disabled: openBusy,
                      },
                      defaultApp ? appIcon(defaultApp) : glyph('doc', 14),
                    ),
                    h(
                      'button',
                      {
                        className: 'fdr-split-arrow',
                        type: 'button',
                        title: t('openWith'),
                        onClick: () => setOpenMenu(!openMenu),
                      },
                      '▾',
                    ),
                  ),
              ),
              h(
                'div',
                { className: 'fdr-detail-actions' },
                h(
                  'button',
                  {
                    className: 'fdr-btn',
                    type: 'button',
                    disabled: !canRevealSession,
                    title: canRevealSession ? '' : t('noSession'),
                    onClick: () => {
                      if (draft.mode === 'ref' && typeof openRef === 'function') openRef(draft.ref);
                    },
                  },
                  t('openInSession'),
                ),
                canOpenWith &&
                  h(
                    'button',
                    {
                      className: 'fdr-btn fdr-btn-quiet',
                      type: 'button',
                      onClick: () => setOpenMenu(!openMenu),
                    },
                    `${t('openWith')} ▾`,
                  ),
                draft.mode !== 'ref' &&
                  h(
                    'button',
                    { className: 'fdr-btn fdr-btn-quiet', type: 'button', onClick: openHistory, disabled: historyBusy },
                    t('history'),
                  ),
                h('span', { className: 'fdr-grow' }),
                (draft.mode === 'edit' || draft.mode === 'ref') &&
                  h(
                    'button',
                    { className: 'fdr-btn', type: 'button', onClick: () => setEditing(!editing), disabled: busy },
                    editing ? t('doneDoc') : t('editDoc'),
                  ),
                draft.mode !== 'edit' &&
                  h('button', { className: 'mat-icon-btn', type: 'button', onClick: closeDraft, title: t('close') }, '✕'),
              ),
              openMenu &&
                canOpenWith &&
                h(
                  'div',
                  { className: 'fdr-menu', onClick: (event) => event.stopPropagation() },
                  h(
                    'button',
                    { className: 'fdr-menu-item', type: 'button', onClick: () => doOpen('') },
                    defaultApp ? appIcon(defaultApp) : glyph('doc', 14),
                    h('span', { className: 'fdr-menu-name' }, t('openDefault')),
                    h('span', { className: 'fdr-menu-hint' }, defaultApp ? defaultApp.name : ''),
                  ),
                  openInfo !== null &&
                    Array.isArray(openInfo.items) &&
                    openInfo.items.slice(1).map((item) =>
                      h(
                        'button',
                        {
                          key: item.path,
                          className: 'fdr-menu-item',
                          type: 'button',
                          onClick: () => doOpen(item.path),
                        },
                        appIcon(item),
                        h('span', { className: 'fdr-menu-name' }, item.name),
                      ),
                    ),
                  h('div', { className: 'fdr-menu-sep' }),
                  h(
                    'button',
                    { className: 'fdr-menu-item', type: 'button', onClick: () => doOpen('__reveal') },
                    h('span', { className: 'fdr-menu-ico' }, glyph('folder', 14)),
                    h('span', { className: 'fdr-menu-name' }, t('revealInFinder')),
                  ),
                ),
            );

      const docMeta =
        draft === null
          ? null
          : h(
              'div',
              { className: 'fdr-doc-meta' },
              draft.updatedAt !== null && h('span', null, `${t('updated')} ${stamp(draft.updatedAt)}`),
              draft.mode === 'ref'
                ? draft.ref && draft.ref.sessionTitle
                  ? h('span', null, `${t('refSession')} ${draft.ref.sessionTitle}`)
                  : null
                : h('span', null, draft.dir === '' ? t('root') : draft.dir),
              draft.tags.map((tag) => h('span', { key: `meta-${tag}`, className: 'fdr-tag', style: { cursor: 'default' } }, tag)),
            );

      const previewUrl =
        draft === null
          ? ''
          : draft.mode === 'ref'
            ? `/api/dsh-materials/ref/raw?id=${encodeURIComponent(draft.ref.id)}`
            : `/api/dsh-materials/raw?path=${encodeURIComponent(draft.path)}`;

      const renderPreview = (entry, tr) => {
        const target = entry.mode === 'ref' ? String((entry.ref && entry.ref.absPath) || '') : String(entry.path || '');
        const ext = (target.match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase();
        const url = previewUrl;
        if (/^\.(png|jpe?g|gif|webp|heic|bmp|avif|svg|ico)$/.test(ext)) {
          return h('img', { className: 'fdr-thumb', alt: entry.name, src: url });
        }
        if (ext === '.pdf') {
          return h('iframe', { className: 'fdr-embed fdr-embed-pdf', title: entry.name, src: url });
        }
        if (ext === '.html' || ext === '.htm') {
          const body = entry.preview && typeof entry.preview.text === 'string' ? entry.preview.text : '';
          if (body === '') return h('p', { className: 'fdr-doc-empty' }, tr('docNoContent'));
          return h('iframe', {
            className: 'fdr-embed fdr-embed-html',
            title: entry.name,
            sandbox: 'allow-scripts allow-popups allow-forms',
            srcDoc: body,
          });
        }
        if (ext === '.csv' || ext === '.tsv') {
          const body = entry.preview && typeof entry.preview.text === 'string' ? entry.preview.text : '';
          if (body === '') return h('p', { className: 'fdr-doc-empty' }, tr('docNoContent'));
          return renderTable(body, ext === '.tsv' ? '\t' : ',');
        }
        if (entry.mode === 'ref') {
          if (!entry.preview || entry.preview === undefined) return null;
          if (entry.preview.tooLarge === true) return h('p', { className: 'fdr-doc-empty' }, tr('previewTooLarge'));
          if (entry.preview.binary === true) return h('p', { className: 'fdr-doc-empty' }, tr('previewBinary'));
          if (entry.preview.text === '') return h('p', { className: 'fdr-doc-empty' }, tr('docNoContent'));
          if (/\.(md|markdown)$/i.test(String(entry.preview.path || entry.preview.name || ''))) {
            return renderMarkdown(entry.preview.text);
          }
          return h('pre', { className: 'fdr-prose-pre' }, h('code', null, entry.preview.text));
        }
        return entry.content === '' ? h('p', { className: 'fdr-doc-empty' }, tr('docNoContent')) : renderMarkdown(bodyWithoutTitle(entry.content));
      };
      const previewBody = draft === null ? null : renderPreview(draft, t);
      const refBody =
        draft !== null && draft.mode === 'ref'
          ? h(
              'div',
              { className: 'fdr-doc-card' },
              h('div', { className: 'fdr-doc-card-row' }, h('span', { className: 'fdr-label' }, t('refTarget'))),
              h('div', { className: 'fdr-mono' }, String(draft.ref && draft.ref.absPath ? draft.ref.absPath : '')),
              h(
                'div',
                { className: 'fdr-doc-meta' },
                draft.ref && draft.ref.sessionTitle ? `${t('refSession')} ${draft.ref.sessionTitle}` : null,
                draft.ref && draft.ref.counts
                  ? `${draft.ref.counts.files || 0} ${t('refKindFile')} · ${draft.ref.counts.folders || 0} ${t('refKindDir')}`
                  : '',
              ),
              h(
                'button',
                { className: 'fdr-btn fdr-btn-quiet', type: 'button', disabled: busy || !draft.ref || draft.ref.exists === false, onClick: copyRefIntoLibrary },
                t('copyIntoLibrary'),
              ),
            )
          : null;

      const editorFields = h(
        'div',
        { className: 'fdr-fields' },
        h('input', {
          className: 'fdr-input fdr-input-title',
          value: draft === null ? '' : draft.name,
          placeholder: t('name'),
          onChange: (event) => setDraft({ ...draft, name: event.target.value }),
        }),
        h(
          'div',
          { className: 'fdr-fields-row' },
          h(FolderField, {
            t,
            compact: true,
            value: draft === null ? '' : draft.dir,
            folders: snapshot !== null && Array.isArray(snapshot.folders) ? snapshot.folders : [],
            onChange: (next) => setDraft({ ...draft, dir: next }),
            placeholder: t('folderHint'),
          }),
          h('input', {
            className: 'fdr-input',
            value: draft === null ? '' : draft.tags.join(', '),
            placeholder: t('tags'),
            onChange: (event) => setDraft({ ...draft, tags: parseTags(event.target.value) }),
          }),
        ),
      );

      const detailBody =
        draft === null
          ? h(
              'div',
              { className: 'fdr-detail-empty' },
              h('div', { className: 'fdr-detail-empty-ico' }, glyph('doc', 34)),
              h('p', null, t('pickHint')),
              h(
                'div',
                { className: 'fdr-detail-empty-actions' },
                h(
                  'button',
                  {
                    className: 'fdr-btn fdr-btn-primary',
                    type: 'button',
                    onClick: () => setCollectOpen(true),
                  },
                  glyph('ref', 14),
                  h('span', null, t('collectFromSession')),
                ),
                h(
                  'button',
                  { className: 'fdr-btn fdr-btn-quiet', type: 'button', onClick: startNew },
                  t('newMaterial'),
                ),
              ),
            )
          : h(
              'article',
              { className: 'fdr-prose' },
              docMeta,
              editing && editorFields,
              previewBody,
              draft.mode !== 'ref' &&
                (editing
                  ? h('textarea', {
                      className: 'fdr-textarea',
                      value: draft.content,
                      placeholder: t('content'),
                      onChange: (event) => setDraft({ ...draft, content: event.target.value }),
                      onKeyDown: (event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                          event.preventDefault();
                          save();
                        }
                      },
                    })
                  : draft.content.trim() === ''
                    ? h('p', { className: 'fdr-doc-empty' }, t('docNoContent'))
                    : renderMarkdown(bodyWithoutTitle(draft.content))),
              refBody,
            );

      const detailFoot = h(
        'div',
        { className: 'fdr-doc-foot' },
        draft !== null &&
          editing &&
          h('button', { className: 'fdr-btn fdr-btn-primary', type: 'button', onClick: save, disabled: busy }, busy ? t('saving') : t('save')),
        draft !== null &&
          draft.mode === 'edit' &&
          (confirming === draft.path
            ? h('button', { className: 'fdr-btn fdr-btn-danger', type: 'button', onClick: () => removeMaterial(draft.path), disabled: busy }, t('confirmDelete'))
            : h('button', { className: 'fdr-btn fdr-btn-quiet', type: 'button', onClick: () => setConfirming(draft.path) }, t('delete'))),
        draft !== null &&
          draft.mode === 'ref' &&
          (confirming === draft.id
            ? h('button', { className: 'fdr-btn fdr-btn-danger', type: 'button', onClick: () => removeRef(draft.id), disabled: busy }, t('confirmDeleteRef'))
            : h('button', { className: 'fdr-btn fdr-btn-quiet', type: 'button', onClick: () => setConfirming(draft.id) }, t('deleteRef'))),
        toast !== '' && h('span', { className: 'fdr-toast' }, toast),
        h('span', { className: 'fdr-grow' }),
        h('span', { className: 'fdr-status-path' }, draft === null ? '' : draft.path || (draft.ref && draft.ref.absPath) || ''),
      );

      const statusBar = h(
        'div',
        { className: 'fdr-status' },
        h(
          'span',
          null,
          filterActive ? `${visible.length} / ${allEntries.length} ${t('items')}` : `${visible.length} ${t('items')}`,
        ),
        h('span', { className: 'fdr-grow' }),
        h('span', { className: 'fdr-status-path' }, selectedDir === '' ? t('title') : selectedDir),
      );

      return h(
        'div',
        {
          className: 'fdr-root',
          onKeyDown: (event) => {
            if (event.key !== 'Escape') return;
            if (openMenu) {
              event.stopPropagation();
              setOpenMenu(false);
              return;
            }
            if (editing) {
              event.stopPropagation();
              setEditing(false);
              return;
            }
            if (draft !== null) {
              event.stopPropagation();
              closeDraft();
            }
          },
        },
        h('style', null, CSS),
        h('style', null, FDRCSS),
        h(
          'div',
          { className: 'fdr-window' },
          sidebar,
          h('div', { className: 'fdr-listcol' }, toolbar, listView, statusBar),
          h('div', { className: 'fdr-detail' }, fileCard, h('div', { className: 'fdr-detail-scroll' }, detailBody), detailFoot),
        ),
        error !== '' && h('div', { className: 'fdr-error' }, error),
        collectOpen &&
          h(CollectLauncher, {
            t,
            useSessions,
            openLibrary: () => {
              setCollectOpen(false);
            },
            onClose: () => {
              setCollectOpen(false);
              refresh();
            },
            defaultFolder: selectedDir,
          }),
        history !== null &&
          h(
            'div',
            { className: 'mat-overlay', onClick: (event) => { if (event.target === event.currentTarget) setHistory(null); } },
            h(
              'div',
              { className: 'mat-dialog fdr-history' },
              h(
                'div',
                { className: 'mat-dialog-head' },
                h('h2', null, `${t('history')}${history.versions.length > 0 ? ` · ${history.versions.length}` : ''}`),
                h('button', { className: 'mat-icon-btn', type: 'button', onClick: () => setHistory(null), title: t('close') }, '✕'),
              ),
              h('p', { className: 'mat-dialog-sub' }, t('historyHint')),
              history.versions.length === 0
                ? h('p', { className: 'fdr-doc-empty' }, t('historyEmpty'))
                : h(
                    'div',
                    { className: 'fdr-history-body' },
                    h(
                      'div',
                      { className: 'fdr-history-list' },
                      history.versions.map((version) =>
                        h(
                          'button',
                          {
                            key: version.id,
                            className: 'fdr-history-item',
                            type: 'button',
                            'data-active': history.id === version.id ? 'true' : 'false',
                            onClick: () => peekVersion(version.id),
                          },
                          h('span', { className: 'fdr-history-time' }, stamp(version.updatedAt)),
                          h('span', { className: 'fdr-history-size' }, `${Math.max(1, Math.round(version.size / 1024))} KB`),
                        ),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'fdr-history-pane' },
                      history.id === ''
                        ? h('p', { className: 'fdr-doc-empty' }, t('historyPick'))
                        : h('pre', { className: 'fdr-prose-pre' }, h('code', null, history.body ?? '')),
                    ),
                  ),
              h(
                'div',
                { className: 'mat-dialog-foot' },
                h('button', { className: 'mat-btn', type: 'button', onClick: () => setHistory(null) }, t('close')),
                history.id !== '' &&
                  h(
                    'button',
                    { className: 'mat-btn mat-btn-primary', type: 'button', disabled: historyBusy, onClick: () => restoreVersion(history.id) },
                    t('restore'),
                  ),
              ),
            ),
          ),
      );
    }

    return {
      inject: ['slots', 'locale', 'layout', 'uiWorkspace', 'sidebarRight', 'sidebarRightTabs'],
      apply(ctx) {
        try {
          mount(ctx);
        } catch (failure) {
          // eslint-disable-next-line no-console -- a client activation failure is otherwise silent
          console.error('[dsh-materials] activation failed', (failure && failure.stack) || failure);
          throw failure;
        }
      },
    };

    /** Register the sidebar entry and its panel. */
    function mount(ctx) {
        const locale = ctx.locale;
        let t = (key) => (typeof key === 'string' ? key : '');
        if (locale && typeof locale.register === 'function') {
          try {
            locale.register(NS, 'zh', ZH);
            locale.register(NS, 'en', EN);
          } catch {
            /* locale is optional: the panel still renders with raw keys */
          }
          if (typeof locale.bind === 'function') {
            try {
              t = locale.bind(NS);
            } catch {
              /* keep the identity translator */
            }
          }
        }

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 30,
              locale: NS,
              label: () => t('panel'),
            },
            MaterialsIcon,
          ),
        );

        const openLibrary = () => {
          try {
            ctx.layout.selectPanel(PANEL_ID);
          } catch {
            /* an older layout without programmatic panel selection */
          }
        };

        /** One file by absolute path, addressed the way the workspace addresses files. */
        const openFileAt = (_sessionId, absPath) => {
          try {
            const absolute = String(absPath ?? '').replace(/\\/g, '/');
            if (absolute === '') return;
            const encoded = absolute
              .replace(/^\/+/, '')
              .split('/')
              .map((segment) => encodeURIComponent(segment).replace(/%3A/gi, ':'))
              .join('/');
            ctx.sidebarRight.openResource(`dsh-resource://file/absolute/${encoded}`);
          } catch (failure) {
            // eslint-disable-next-line no-console -- a refused address must not break the panel
            console.error('[dsh-materials] could not open file', failure);
          }
        };

        /** Reveal a material's target: its session, then the right panel at that folder or file. */
        const openRef = (ref) => {
          if (ref === null || typeof ref !== 'object') return;
          const sessionId = typeof ref.sessionId === 'string' ? ref.sessionId : '';
          try {
            if (sessionId !== '' && ctx.uiWorkspace && typeof ctx.uiWorkspace.openSession === 'function') {
              ctx.uiWorkspace.openSession(sessionId);
            }
          } catch (failure) {
            // eslint-disable-next-line no-console -- missing session must not block the panel
            console.error('[dsh-materials] could not open session', failure);
          }
          if (ref.kind === 'file') {
            openFileAt(sessionId, ref.absPath);
            return;
          }
          const address = folderAddress(ref);
          let tries = 0;
          const attempt = () => {
            tries += 1;
            try {
              ctx.sidebarRight.openResource(address);
            } catch (failure) {
              if (tries < 60) {
                setTimeout(attempt, 50);
                return;
              }
              // eslint-disable-next-line no-console -- the panel simply stays closed
              console.error('[dsh-materials] could not open folder', failure);
            }
          };
          attempt();
        };

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: PANEL_ID,
              locale: NS,
              inject: () => ({ t, openRef }),
            },
            MaterialsPage,
          ),
        );

        ctx.slots.inject('conversation.session.header.actions', () =>
          ctx.slots.register(
            {
              name: 'conversation.session.header.actions',
              id: 'materials-collect',
              order: 40,
              locale: NS,
              label: () => t('collect'),
              inject: () => ({ t, openLibrary }),
            },
            CollectButton,
          ),
        );

        ctx.effect(
          () =>
            ctx.sidebarRightTabs.register({
              id: 'dsh-material-library',
              kind: 'materials-folder',
              patterns: ['dsh-resource://materials/**'],
              priority: 'builtin',
              canOpen: (address) => typeof address === 'string' && address.startsWith(FOLDER_ADDRESS_PREFIX),
              title: (address) => baseName(parseFolderAddress(address).path) || t('refKindDir'),
            }),
          'dsh-materials: folder tab type',
        );

        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.right.pane.tab', () =>
              ctx.slots.register(
                {
                  name: 'sidebar.right.pane.tab',
                  key: 'dsh-material-library',
                  locale: NS,
                  inject: () => ({ t, openFileAt }),
                },
                FolderTab,
              ),
            ),
          'dsh-materials: folder tab body',
        );
    }
  },
});
