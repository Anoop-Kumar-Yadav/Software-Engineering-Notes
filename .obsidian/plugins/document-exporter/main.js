var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DocumentExporterPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian8 = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  defaultProfile: "pdf",
  defaultOutputFolder: "exports",
  includeSourcePathComments: false,
  copyAttachments: true,
  overwriteExisting: false
};

// src/settings/settings.ts
var VALID_PROFILES = /* @__PURE__ */ new Set(["markdown-bundle", "html-document", "pdf", "docx"]);
async function loadSettings(plugin) {
  const data = Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
  if (!VALID_PROFILES.has(data.defaultProfile)) {
    data.defaultProfile = DEFAULT_SETTINGS.defaultProfile;
  }
  return data;
}
async function saveSettings(plugin, settings) {
  await plugin.saveData(settings);
}

// src/settings/settings-tab.ts
var import_obsidian = require("obsidian");
var PROFILE_LABELS = {
  pdf: "PDF",
  docx: "Word document",
  "markdown-bundle": "Markdown bundle",
  "html-document": "HTML document"
};
var DocumentExporterSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const debouncedSaveOutputFolder = (0, import_obsidian.debounce)(async (v) => {
      this.plugin.settings.defaultOutputFolder = v;
      await this.plugin.saveSettings();
    }, 500, true);
    new import_obsidian.Setting(containerEl).setName("Output folder").setDesc("Exported files will be saved here (relative to vault root). You can change this path to any folder in your vault.").addText((text) => {
      text.setPlaceholder("Exports");
      text.setValue(this.plugin.settings.defaultOutputFolder);
      text.onChange((v) => {
        debouncedSaveOutputFolder(v);
      });
    });
    new import_obsidian.Setting(containerEl).setName("Default export format").setDesc("Choose the default format when opening the export dialog.").addDropdown((dd) => {
      dd.addOptions(PROFILE_LABELS);
      dd.setValue(this.plugin.settings.defaultProfile);
      dd.onChange(async (v) => {
        this.plugin.settings.defaultProfile = v;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Advanced").setHeading();
    new import_obsidian.Setting(containerEl).setName("Include source path comments").setDesc("Add HTML comments showing the source path of each section.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.includeSourcePathComments);
      toggle.onChange(async (v) => {
        this.plugin.settings.includeSourcePathComments = v;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Copy attachments").setDesc("Copy referenced images and files into the export bundle.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.copyAttachments);
      toggle.onChange(async (v) => {
        this.plugin.settings.copyAttachments = v;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Overwrite existing exports").setDesc("Overwrite if the output folder already exists. Otherwise a timestamped folder is created.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.overwriteExisting);
      toggle.onChange(async (v) => {
        this.plugin.settings.overwriteExisting = v;
        await this.plugin.saveSettings();
      });
    });
  }
};

// src/ui/ExportModal.ts
var import_obsidian2 = require("obsidian");
var PROFILE_OPTIONS = {
  pdf: "PDF",
  docx: "Word document",
  "markdown-bundle": "Markdown bundle",
  "html-document": "HTML document"
};
var SOURCE_OPTIONS = {
  "current-file": "Current file",
  folder: "Folder",
  files: "Selected files"
};
var ExportModal = class extends import_obsidian2.Modal {
  constructor(app, settings, preselectedFile, preselectedFolder) {
    super(app);
    this.resolve = null;
    this.sourceType = "current-file";
    this.folderPath = "";
    this.selectedFilePaths = [];
    this.outputFolderName = "";
    this.settings = settings;
    this.profile = settings.defaultProfile;
    this.outputFolder = settings.defaultOutputFolder;
    this.outputFilename = this.deriveDefaultFilename();
    this.preselectedFile = preselectedFile;
    this.preselectedFolder = preselectedFolder;
  }
  onOpen() {
    if (this.preselectedFile) {
      this.sourceType = "current-file";
    } else if (this.preselectedFolder) {
      this.sourceType = "folder";
      this.folderPath = this.preselectedFolder.path;
    }
    this.renderForm();
  }
  onClose() {
    var _a;
    this.contentEl.empty();
    (_a = this.resolve) == null ? void 0 : _a.call(this, null);
    this.resolve = null;
  }
  openForResult() {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.open();
    });
  }
  renderForm() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Export documents" });
    const sourceRow = contentEl.createDiv({ cls: "export-modal-row" });
    sourceRow.createEl("label", { text: "Source" });
    const sourceSelect = sourceRow.createEl("select");
    for (const [value, label] of Object.entries(SOURCE_OPTIONS)) {
      const opt = sourceSelect.createEl("option", { text: label });
      opt.value = value;
    }
    sourceSelect.value = this.sourceType;
    const sourceFields = contentEl.createDiv({ cls: "export-modal-source-fields" });
    const renderSourceFields = () => {
      sourceFields.empty();
      if (this.sourceType === "folder") {
        sourceFields.removeClass("export-modal-source-fields");
        this.renderFolderPicker(sourceFields, "Folder path", this.folderPath, (v) => {
          this.folderPath = v;
          renderNameField();
        });
      } else if (this.sourceType === "files") {
        sourceFields.addClass("export-modal-source-fields");
        const count = this.selectedFilePaths.length;
        const btn = sourceFields.createEl("button", {
          text: count > 0 ? `${count} file(s) selected` : "Choose files"
        });
        btn.addEventListener("click", () => {
          const picker = new FilePickerModal(this.app, this.selectedFilePaths, (paths) => {
            this.selectedFilePaths = paths;
            btn.textContent = paths.length > 0 ? `${paths.length} file(s) selected` : "Choose files";
          });
          picker.open();
        });
      } else {
        sourceFields.removeClass("export-modal-source-fields");
      }
    };
    sourceSelect.addEventListener("change", () => {
      this.sourceType = sourceSelect.value;
      renderSourceFields();
      renderNameField();
      updateDefaultFilename();
    });
    renderSourceFields();
    const profileRow = contentEl.createDiv({ cls: "export-modal-row" });
    profileRow.createEl("label", { text: "Format" });
    const profileSelect = profileRow.createEl("select");
    for (const [value, label] of Object.entries(PROFILE_OPTIONS)) {
      const opt = profileSelect.createEl("option", { text: label });
      opt.value = value;
    }
    profileSelect.value = this.profile;
    profileSelect.addEventListener("change", () => {
      this.profile = profileSelect.value;
    });
    this.renderOutputFolderPicker(contentEl);
    const nameFieldContainer = contentEl.createDiv();
    let filenameInput = null;
    const renderNameField = () => {
      nameFieldContainer.empty();
      const isBatch = this.sourceType !== "current-file";
      const row = nameFieldContainer.createDiv({ cls: "export-modal-row" });
      if (isBatch) {
        this.updateDefaultFolderName();
        row.createEl("label", { text: "Folder name" });
        const input = row.createEl("input", {
          type: "text",
          attr: { placeholder: this.sourceType === "folder" ? "folder name" : "files" }
        });
        input.value = this.outputFolderName;
        input.addEventListener("input", (e) => {
          this.outputFolderName = e.target.value;
        });
        filenameInput = null;
      } else {
        row.createEl("label", { text: "File name" });
        const input = row.createEl("input", {
          type: "text",
          attr: { placeholder: "Document" }
        });
        input.value = this.outputFilename;
        input.addEventListener("input", (e) => {
          this.outputFilename = e.target.value;
        });
        filenameInput = input;
      }
    };
    renderNameField();
    const updateDefaultFilename = () => {
      var _a, _b;
      if (this.sourceType === "current-file") {
        const file = (_a = this.preselectedFile) != null ? _a : this.app.workspace.getActiveFile();
        this.outputFilename = (_b = file == null ? void 0 : file.basename) != null ? _b : "export";
        if (filenameInput)
          filenameInput.value = this.outputFilename;
      }
    };
    const buttonRow = contentEl.createDiv({ cls: "export-modal-buttons" });
    const cancelButton = buttonRow.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => {
      this.resolve = null;
      this.close();
    });
    const exportButton = buttonRow.createEl("button", { text: "Next", cls: "mod-cta" });
    exportButton.addEventListener("click", () => {
      const result = this.buildResult();
      this.renderConfirmation(result);
    });
  }
  renderFolderPicker(container, label, currentValue, onChange) {
    const row = container.createDiv({ cls: "export-modal-row" });
    row.createEl("label", { text: label });
    const group = row.createDiv({ cls: "export-modal-input-group" });
    const input = group.createEl("input", { type: "text" });
    input.value = currentValue;
    input.addEventListener("input", (e) => {
      onChange(e.target.value);
    });
    const browseBtn = group.createEl("button", { text: "Browse", cls: "export-modal-browse-btn" });
    browseBtn.addEventListener("click", () => {
      const picker = new FolderPickerModal(this.app, input.value, (selected) => {
        input.value = selected;
        onChange(selected);
      });
      picker.open();
    });
  }
  renderOutputFolderPicker(container) {
    const onChange = (v) => {
      this.outputFolder = v;
    };
    const row = container.createDiv({ cls: "export-modal-row" });
    row.createEl("label", { text: "Output folder" });
    const group = row.createDiv({ cls: "export-modal-input-group" });
    const input = group.createEl("input", {
      type: "text",
      attr: { placeholder: import_obsidian2.Platform.isDesktopApp ? "Exports or /users/you/desktop/exports" : "Exports (vault-relative only)" }
    });
    input.value = this.outputFolder;
    input.addEventListener("input", (e) => {
      onChange(e.target.value);
    });
    const vaultBtn = group.createEl("button", { text: "Vault", cls: "export-modal-browse-btn" });
    vaultBtn.addEventListener("click", () => {
      const picker = new FolderPickerModal(this.app, input.value, (selected) => {
        input.value = selected;
        onChange(selected);
      });
      picker.open();
    });
    if (import_obsidian2.Platform.isDesktopApp) {
      const sysBtn = group.createEl("button", { text: "Choose folder", cls: "export-modal-browse-btn" });
      sysBtn.addEventListener("click", () => {
        void (async () => {
          var _a, _b;
          try {
            const g2 = typeof window !== "undefined" ? window : void 0;
            const electron = g2 && "require" in g2 ? g2["require"]("electron") : void 0;
            const dialog = (_b = (_a = electron == null ? void 0 : electron.remote) == null ? void 0 : _a.dialog) != null ? _b : electron == null ? void 0 : electron.dialog;
            if (!dialog)
              return;
            const result = await dialog.showOpenDialog({
              properties: ["openDirectory", "createDirectory"],
              title: "Select output folder"
            });
            if (!result.canceled && result.filePaths[0]) {
              input.value = result.filePaths[0];
              onChange(result.filePaths[0]);
            }
          } catch (err) {
            console.error("Document Exporter: failed to open folder dialog", err);
          }
        })();
      });
    }
  }
  renderConfirmation(result) {
    var _a;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Confirm export" });
    const summary = contentEl.createDiv({ cls: "export-confirm-summary" });
    summary.createEl("p", { text: `Format: ${PROFILE_OPTIONS[result.profile]}` });
    const isSingleFile = result.source.type === "current-file";
    if (isSingleFile) {
      summary.createEl("p", { text: `Output: ${result.outputFolder}/${result.outputFilename}` });
    } else {
      const folderName = (_a = result.outputFolderName) != null ? _a : "export";
      summary.createEl("p", { text: `Output: ${result.outputFolder}/${folderName}/ (preserving directory structure)` });
    }
    summary.createEl("p", { text: `Source: ${SOURCE_OPTIONS[result.source.type]}` });
    if (result.source.type === "folder") {
      summary.createEl("p", { text: `Folder: ${result.source.path} (recursive: ${result.source.recursive})` });
    }
    const buttonRow = contentEl.createDiv({ cls: "export-modal-buttons" });
    const backButton = buttonRow.createEl("button", { text: "Back" });
    backButton.addEventListener("click", () => {
      this.renderForm();
    });
    const confirmButton = buttonRow.createEl("button", { text: "Export", cls: "mod-cta" });
    confirmButton.addEventListener("click", () => {
      const resolveRef = this.resolve;
      this.resolve = null;
      this.close();
      resolveRef == null ? void 0 : resolveRef(result);
    });
  }
  deriveDefaultFilename() {
    if (this.preselectedFile) {
      return this.preselectedFile.basename;
    }
    if (this.preselectedFolder) {
      return this.preselectedFolder.name;
    }
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      return activeFile.basename;
    }
    return "export";
  }
  updateDefaultFolderName() {
    var _a;
    if (this.sourceType === "folder" && this.folderPath) {
      this.outputFolderName = (_a = this.folderPath.split("/").pop()) != null ? _a : "files";
    } else {
      this.outputFolderName = "files";
    }
  }
  buildSource() {
    var _a, _b;
    switch (this.sourceType) {
      case "current-file": {
        const file = (_a = this.preselectedFile) != null ? _a : this.app.workspace.getActiveFile();
        return { type: "current-file", path: (_b = file == null ? void 0 : file.path) != null ? _b : "" };
      }
      case "folder":
        return { type: "folder", path: this.folderPath, recursive: true };
      case "files":
        return { type: "files", paths: [...this.selectedFilePaths] };
    }
    return { type: "current-file", path: "" };
  }
  buildResult() {
    const isBatch = this.sourceType !== "current-file";
    return {
      source: this.buildSource(),
      profile: this.profile,
      outputFolder: this.outputFolder,
      outputFilename: this.outputFilename || "export",
      outputFolderName: isBatch ? this.outputFolderName || "files" : void 0
    };
  }
};
var FilePickerModal = class extends import_obsidian2.Modal {
  constructor(app, currentPaths, onDone) {
    super(app);
    this.filterText = "";
    this.listEl = null;
    this.chosen = new Set(currentPaths);
    this.onDone = onDone;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("file-picker-modal");
    contentEl.createEl("h3", { text: "Select files" });
    const input = contentEl.createEl("input", {
      type: "text",
      cls: "file-picker-filter",
      attr: { placeholder: "Filter files..." }
    });
    input.addEventListener("input", () => {
      this.filterText = input.value.toLowerCase();
      this.renderList();
    });
    this.listEl = contentEl.createDiv({ cls: "file-picker-list" });
    this.renderList();
    const doneBtn = contentEl.createEl("button", { text: "Done", cls: "mod-cta file-picker-done-btn" });
    doneBtn.addEventListener("click", () => {
      this.close();
    });
  }
  onClose() {
    this.onDone(Array.from(this.chosen));
  }
  renderList() {
    if (!this.listEl)
      return;
    this.listEl.empty();
    const allFiles = collectMarkdownFiles(this.app.vault.getRoot());
    const filtered = this.filterText ? allFiles.filter((f) => f.path.toLowerCase().includes(this.filterText)) : allFiles;
    filtered.sort((a, b) => a.path.localeCompare(b.path));
    for (const file of filtered) {
      const row = this.listEl.createDiv({ cls: "file-picker-item" });
      const label = row.createEl("label");
      const checkbox = label.createEl("input", { type: "checkbox" });
      checkbox.checked = this.chosen.has(file.path);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          this.chosen.add(file.path);
        } else {
          this.chosen.delete(file.path);
        }
      });
      label.appendText(" " + file.path);
    }
  }
};
function collectMarkdownFiles(folder) {
  const files = [];
  for (const child of folder.children) {
    if (child instanceof import_obsidian2.TFile && child.extension === "md") {
      files.push(child);
    } else if (child instanceof import_obsidian2.TFolder) {
      files.push(...collectMarkdownFiles(child));
    }
  }
  return files;
}
var FolderPickerModal = class extends import_obsidian2.FuzzySuggestModal {
  constructor(app, currentPath, onSelect) {
    super(app);
    this.onSelect = onSelect;
    this.setPlaceholder("Search folders...");
    this.setInstructions([{ command: "Enter", purpose: "Select folder" }]);
  }
  getItems() {
    return getAllFolders(this.app.vault.getRoot()).sort((a, b) => a.path.localeCompare(b.path));
  }
  getItemText(item) {
    return item.path === "/" ? "/ (vault root)" : item.path;
  }
  onChooseItem(item) {
    this.onSelect(item.path === "/" ? "" : item.path);
  }
};
function getAllFolders(root) {
  const result = [root];
  for (const child of root.children) {
    if (child instanceof import_obsidian2.TFolder) {
      result.push(...getAllFolders(child));
    }
  }
  return result;
}

// src/export/ExportSourceResolver.ts
function isTFile(f) {
  return f !== null && "extension" in f;
}
function isTFolder(f) {
  return f !== null && "children" in f;
}
var ExportSourceResolver = class {
  constructor(app) {
    this.app = app;
  }
  resolve(source) {
    return this.collectFiles(source);
  }
  collectFiles(source) {
    switch (source.type) {
      case "current-file":
        return this.resolveCurrentFile(source.path);
      case "files":
        return this.resolveFiles(source.paths);
      case "folder":
        return this.resolveFolder(source.path, source.recursive);
    }
  }
  resolveCurrentFile(path) {
    if (!path)
      return [];
    const file = this.app.vault.getAbstractFileByPath(path);
    if (isTFile(file) && file.extension === "md") {
      return [file];
    }
    return [];
  }
  resolveFiles(paths) {
    const files = [];
    for (const path of paths) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (isTFile(file) && file.extension === "md") {
        files.push(file);
      }
    }
    return files;
  }
  resolveFolder(folderPath, recursive) {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!isTFolder(folder))
      return [];
    return this.collectMarkdownFiles(folder, recursive);
  }
  collectMarkdownFiles(folder, recursive) {
    const files = [];
    for (const child of folder.children) {
      if (isTFile(child) && child.extension === "md") {
        files.push(child);
      } else if (recursive && isTFolder(child)) {
        files.push(...this.collectMarkdownFiles(child, true));
      }
    }
    return files;
  }
};

// src/export/utils.ts
function normalizePath(p) {
  const parts = p.split("/").filter(Boolean);
  const stack = [];
  for (const part of parts) {
    if (part === "..") {
      stack.pop();
    } else if (part !== ".") {
      stack.push(part);
    }
  }
  return stack.join("/");
}
var CODE_BLOCK_PLACEHOLDER = "\0CB";
var INLINE_CODE_PLACEHOLDER = "\0IC";
function extractCodeBlocks(md) {
  const blocks = [];
  let text = md.replace(/```[\s\S]*?```/g, (match) => {
    blocks.push(match);
    return `${CODE_BLOCK_PLACEHOLDER}${blocks.length - 1}${CODE_BLOCK_PLACEHOLDER}`;
  });
  text = text.replace(/`([^`\n]+)`/g, (match) => {
    blocks.push(match);
    return `${INLINE_CODE_PLACEHOLDER}${blocks.length - 1}${INLINE_CODE_PLACEHOLDER}`;
  });
  return { text, blocks };
}
function restoreCodeBlocks(text, blocks) {
  let result = text;
  result = result.replace(
    new RegExp(`${escapeRegex(INLINE_CODE_PLACEHOLDER)}(\\d+)${escapeRegex(INLINE_CODE_PLACEHOLDER)}`, "g"),
    (_, idx) => blocks[parseInt(idx)]
  );
  result = result.replace(
    new RegExp(`${escapeRegex(CODE_BLOCK_PLACEHOLDER)}(\\d+)${escapeRegex(CODE_BLOCK_PLACEHOLDER)}`, "g"),
    (_, idx) => blocks[parseInt(idx)]
  );
  return result;
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function extensionForProfile(profile) {
  switch (profile) {
    case "markdown-bundle":
      return "md";
    case "html-document":
      return "html";
    case "pdf":
      return "pdf";
    case "docx":
      return "docx";
  }
}
function longestCommonDirPrefix(paths) {
  if (paths.length === 0)
    return "";
  const split = paths.map((p) => p.split("/"));
  const minLen = Math.min(...split.map((s) => s.length));
  let commonLen = 0;
  for (let i = 0; i < minLen; i++) {
    const seg = split[0][i];
    if (split.every((s) => s[i] === seg))
      commonLen = i + 1;
    else
      break;
  }
  const dirPrefixLen = commonLen < minLen ? commonLen : commonLen - 1;
  if (dirPrefixLen === 0)
    return "";
  return split[0].slice(0, dirPrefixLen).join("/") + "/";
}
function relativePathBetween(from, to) {
  const fromParts = from.split("/");
  const toParts = to.split("/");
  let commonLen = 0;
  while (commonLen < fromParts.length - 1 && commonLen < toParts.length - 1 && fromParts[commonLen] === toParts[commonLen]) {
    commonLen++;
  }
  const upCount = fromParts.length - commonLen - 1;
  const ups = upCount > 0 ? Array(upCount).fill("..").join("/") : "";
  const downParts = toParts.slice(commonLen).join("/");
  return ups ? `${ups}/${downParts}` : downParts;
}

// src/export/ExportPlan.ts
var ExportPlanBuilder = class {
  constructor(app, source, profile, outputRoot, outputFilename, outputFolderName) {
    this.inputFiles = [];
    this.app = app;
    this.source = source;
    this.profile = profile;
    this.outputRoot = outputRoot;
    this.outputFilename = outputFilename;
    this.outputFolderName = outputFolderName;
  }
  setInputFiles(paths) {
    this.inputFiles = paths;
    return this;
  }
  build() {
    return {
      profile: this.profile,
      source: this.source,
      inputFiles: this.inputFiles,
      outputRoot: this.outputRoot,
      outputFilename: this.outputFilename,
      outputFolderName: this.outputFolderName,
      outputFiles: this.computeOutputFiles(),
      attachmentCopies: []
    };
  }
  computeOutputFiles() {
    const ext = extensionForProfile(this.profile);
    if (this.source.type === "current-file") {
      const baseName = this.stripExtension(this.outputFilename);
      return [`${this.outputRoot}/${baseName}.${ext}`];
    }
    const root = this.outputFolderName ? `${this.outputRoot}/${this.outputFolderName}` : this.outputRoot;
    if (this.source.type === "folder") {
      const prefix2 = this.source.path ? this.source.path + "/" : "";
      return this.inputFiles.map((p) => {
        const rel = prefix2 && p.startsWith(prefix2) ? p.slice(prefix2.length) : p;
        return `${root}/${rel.replace(/\.md$/i, `.${ext}`)}`;
      });
    }
    const prefix = longestCommonDirPrefix(this.inputFiles);
    return this.inputFiles.map((p) => {
      const rel = prefix && p.startsWith(prefix) ? p.slice(prefix.length) : p;
      return `${root}/${rel.replace(/\.md$/i, `.${ext}`)}`;
    });
  }
  stripExtension(name) {
    return name.replace(/\.(md|html|htm|pdf|docx)$/i, "");
  }
};
function validatePlan(plan) {
  if (plan.inputFiles.length === 0) {
    return "No files to export. Check your source selection.";
  }
  if (!plan.outputRoot || plan.outputRoot.trim() === "") {
    return "Output folder cannot be empty.";
  }
  const segments = plan.outputRoot.split("/");
  if (segments.some((s) => s === ".." || s === ".")) {
    return "Output folder cannot use parent directory traversal.";
  }
  return null;
}

// src/export/DocumentAssembler.ts
var DocumentAssembler = class {
  constructor(app, includeSourcePaths = false) {
    this.app = app;
    this.includeSourcePaths = includeSourcePaths;
  }
  async assemble(files, title) {
    var _a, _b;
    const sections = [];
    for (const file of files) {
      const section = await this.buildSection(file);
      sections.push(section);
    }
    const docTitle = (_b = title != null ? title : (_a = sections[0]) == null ? void 0 : _a.title) != null ? _b : "Untitled Export";
    return {
      title: docTitle,
      sections,
      attachments: []
    };
  }
  async buildSection(file) {
    const raw = await this.app.vault.read(file);
    const { body, frontmatter } = stripFrontmatter(raw);
    let sectionTitle = deriveTitle(file, frontmatter);
    let contentBody = body;
    if (typeof frontmatter.title !== "string") {
      const extracted = extractLeadingH1(contentBody);
      if (extracted) {
        sectionTitle = extracted.title;
        contentBody = extracted.remaining;
      }
    }
    const normalized = normalizeHeadings(contentBody, 1);
    const markdown = this.includeSourcePaths ? `<!-- source: ${file.path} -->
${normalized}` : normalized;
    return {
      sourcePath: file.path,
      title: sectionTitle,
      markdown,
      frontmatter
    };
  }
};
function stripFrontmatter(content) {
  if (!content.startsWith("---")) {
    return { body: content, frontmatter: {} };
  }
  const closingIndex = content.indexOf("\n---\n", 3);
  if (closingIndex === -1) {
    return { body: content, frontmatter: {} };
  }
  const yamlBlock = content.slice(3, closingIndex).trim();
  const body = content.slice(closingIndex + 5).trimStart();
  const frontmatter = {};
  for (const line of yamlBlock.split("\n")) {
    if (/^\s/.test(line) || line.startsWith("-"))
      continue;
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1)
      continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = parseYamlValue(value);
  }
  return { body, frontmatter };
}
function parseYamlValue(value) {
  if (value === "true")
    return true;
  if (value === "false")
    return false;
  if (value === "null" || value === "")
    return null;
  if (/^-?\d+$/.test(value))
    return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value))
    return parseFloat(value);
  return value;
}
function deriveTitle(file, frontmatter) {
  if (typeof frontmatter.title === "string") {
    return frontmatter.title;
  }
  return file.basename;
}
function extractLeadingH1(body) {
  const match = body.match(/^#\s+(.+?)\s*(?:\n|$)/);
  if (!match)
    return null;
  const title = match[1].trim();
  const remaining = body.slice(match[0].length);
  return { title, remaining };
}
function normalizeHeadings(markdown, minLevel) {
  const lines = markdown.split("\n");
  const result = [];
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }
    if (inCodeBlock) {
      result.push(line);
      continue;
    }
    const match = line.match(/^(#{1,6})\s/);
    if (match) {
      const currentLevel = match[1].length;
      const newLevel = Math.min(currentLevel + minLevel - 1, 6);
      result.push("#".repeat(newLevel) + line.slice(currentLevel));
    } else {
      result.push(line);
    }
  }
  return result.join("\n");
}

// src/export/AttachmentCollector.ts
var MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;
function isFileLike(f) {
  return f !== null && "extension" in f;
}
function isAttachmentExt(ext) {
  const exts = ["png", "jpg", "jpeg", "gif", "bmp", "svg", "webp", "pdf", "mp3", "mp4", "wav", "ogg"];
  return exts.includes(ext);
}
var AttachmentCollector = class {
  constructor(app, exportedPaths) {
    this.knownAttachments = /* @__PURE__ */ new Map();
    this.usedNames = /* @__PURE__ */ new Set();
    this.app = app;
    this.exportedPaths = exportedPaths;
  }
  async collect(files) {
    const seen = /* @__PURE__ */ new Map();
    const warnings = [];
    for (const file of files) {
      const content = await this.app.vault.read(file);
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache == null ? void 0 : cache.embeds) {
        for (const embed of cache.embeds) {
          const target = this.resolveLink(embed.link, file.path);
          if (!target || this.exportedPaths.has(target))
            continue;
          const targetFile = this.app.vault.getAbstractFileByPath(target);
          if (isFileLike(targetFile) && targetFile.extension !== "md") {
            this.addAttachment(target, targetFile, seen);
          }
        }
      }
      if (cache == null ? void 0 : cache.links) {
        for (const link of cache.links) {
          const target = this.resolveLink(link.link, file.path);
          if (!target || this.exportedPaths.has(target))
            continue;
          const targetFile = this.app.vault.getAbstractFileByPath(target);
          if (isFileLike(targetFile) && isAttachmentExt(targetFile.extension)) {
            this.addAttachment(target, targetFile, seen);
          }
        }
      }
      this.collectFromMarkdownImages(content, file.path, seen, warnings);
    }
    return { attachments: Array.from(seen.values()), warnings };
  }
  collectFromMarkdownImages(content, sourcePath, seen, warnings) {
    let match;
    MARKDOWN_IMAGE_RE.lastIndex = 0;
    while ((match = MARKDOWN_IMAGE_RE.exec(content)) !== null) {
      const href = match[2];
      if (href.startsWith("http://") || href.startsWith("https://"))
        continue;
      if (seen.has(href))
        continue;
      const target = this.resolveRelativePath(href, sourcePath);
      if (!target) {
        warnings.push(`Missing attachment: ${href} (referenced from ${sourcePath})`);
        continue;
      }
      if (this.exportedPaths.has(target))
        continue;
      const targetFile = this.app.vault.getAbstractFileByPath(target);
      if (isFileLike(targetFile)) {
        this.addAttachment(target, targetFile, seen);
      }
    }
  }
  addAttachment(target, targetFile, seen) {
    if (seen.has(target))
      return;
    const existing = this.knownAttachments.get(target);
    if (existing) {
      seen.set(target, existing);
      return;
    }
    const outputName = this.uniqueName(targetFile, this.usedNames);
    const attachment = {
      sourcePath: target,
      outputRelativePath: `assets/${outputName}`
    };
    this.knownAttachments.set(target, attachment);
    seen.set(target, attachment);
  }
  resolveLink(link, sourcePath) {
    var _a;
    const cleanLink = link.split("#")[0].split("|")[0];
    if (!cleanLink)
      return null;
    const dest = this.app.metadataCache.getFirstLinkpathDest(
      cleanLink,
      sourcePath
    );
    return (_a = dest == null ? void 0 : dest.path) != null ? _a : null;
  }
  resolveRelativePath(href, sourcePath) {
    const dir = sourcePath.includes("/") ? sourcePath.substring(0, sourcePath.lastIndexOf("/")) : "";
    const resolved = dir ? `${dir}/${href}` : href;
    const normalized = normalizePath(resolved);
    const file = this.app.vault.getAbstractFileByPath(normalized);
    return file ? normalized : null;
  }
  uniqueName(file, usedNames) {
    if (!usedNames.has(file.name)) {
      usedNames.add(file.name);
      return file.name;
    }
    const dir = file.path.includes("/") ? file.path.substring(0, file.path.lastIndexOf("/")).split("/").pop() : "";
    const base = dir ? `${dir}-${file.name}` : file.name;
    if (!usedNames.has(base)) {
      usedNames.add(base);
      return base;
    }
    let n = 1;
    let name;
    do {
      name = `${dir}-${n}-${file.name}`;
      n++;
    } while (usedNames.has(name));
    usedNames.add(name);
    return name;
  }
};

// src/export/LinkRewriter.ts
var WIKI_LINK_RE = /\[\[([^\]]+)]]/g;
var WIKI_EMBED_RE = /!\[\[([^\]]+)]]/g;
var MARKDOWN_IMAGE_RE2 = /!\[([^\]]*)\]\(([^)]+)\)/g;
var LinkRewriter = class {
  constructor(app, exportedPaths, attachments, profile, outputPathMap = /* @__PURE__ */ new Map(), currentOutputPath = "", outputRoot = "") {
    this.app = app;
    this.exportedPaths = exportedPaths;
    this.attachments = new Map(
      attachments.map((a) => [a.sourcePath, a])
    );
    this.profile = profile;
    this.outputPathMap = outputPathMap;
    this.currentOutputPath = currentOutputPath;
    this.outputRoot = outputRoot;
  }
  rewrite(markdown, sourcePath) {
    const warnings = [];
    const { text, blocks } = extractCodeBlocks(markdown);
    let result = text.replace(WIKI_EMBED_RE, (match, link) => {
      const cleanLink = link.split("|")[0].split("#")[0];
      const dest = this.resolvePath(cleanLink, sourcePath);
      if (!dest)
        return match;
      const attachment = this.attachments.get(dest);
      if (attachment) {
        const relPath = this.rewriteAttachmentPath(attachment.outputRelativePath);
        return this.formatEmbed(relPath, cleanLink);
      }
      if (this.exportedPaths.has(dest)) {
        return match;
      }
      warnings.push(`Unresolved embed: ${cleanLink}`);
      return match;
    });
    result = result.replace(WIKI_LINK_RE, (match, link) => {
      const [rawTarget, alias] = link.split("|");
      const [target, heading] = rawTarget.split("#");
      const displayText = alias || target;
      const dest = this.resolvePath(target, sourcePath);
      if (!dest) {
        warnings.push(`Unresolved link: ${target}`);
        return displayText;
      }
      if (this.exportedPaths.has(dest)) {
        const targetOutput = this.outputPathMap.get(dest);
        if (targetOutput && this.currentOutputPath) {
          const relPath = relativePathBetween(this.currentOutputPath, targetOutput);
          const hash = heading ? `#${slugify(heading)}` : "";
          return `[${displayText}](${relPath}${hash})`;
        }
        const anchor = heading ? `#${slugify(target)}-${slugify(heading)}` : `#${slugify(target)}`;
        return `[${displayText}](${anchor})`;
      }
      const attachment = this.attachments.get(dest);
      if (attachment) {
        return `[${displayText}](${this.rewriteAttachmentPath(attachment.outputRelativePath)})`;
      }
      warnings.push(`Unresolved link: ${target}`);
      return displayText;
    });
    result = result.replace(MARKDOWN_IMAGE_RE2, (match, alt, href) => {
      if (href.startsWith("http://") || href.startsWith("https://")) {
        return match;
      }
      const resolved = this.resolveRelativePath(href, sourcePath);
      if (!resolved)
        return match;
      const attachment = this.attachments.get(resolved);
      if (attachment) {
        return `![${alt}](${this.rewriteAttachmentPath(attachment.outputRelativePath)})`;
      }
      return match;
    });
    result = restoreCodeBlocks(result, blocks);
    return { markdown: result, warnings };
  }
  resolvePath(link, sourcePath) {
    var _a;
    const dest = this.app.metadataCache.getFirstLinkpathDest(
      link,
      sourcePath
    );
    return (_a = dest == null ? void 0 : dest.path) != null ? _a : null;
  }
  resolveRelativePath(href, sourcePath) {
    const dir = sourcePath.includes("/") ? sourcePath.substring(0, sourcePath.lastIndexOf("/")) : "";
    const resolved = dir ? `${dir}/${href}` : href;
    const normalized = normalizePath(resolved);
    const file = this.app.vault.getAbstractFileByPath(normalized);
    return file ? normalized : null;
  }
  rewriteAttachmentPath(attRelativePath) {
    if (!this.currentOutputPath || !this.outputRoot)
      return attRelativePath;
    const dirAfterRoot = this.currentOutputPath.startsWith(this.outputRoot + "/") ? this.currentOutputPath.slice(this.outputRoot.length + 1) : this.currentOutputPath;
    const depth = dirAfterRoot.split("/").length - 1;
    if (depth <= 0)
      return attRelativePath;
    return "../".repeat(depth) + attRelativePath;
  }
  formatEmbed(relPath, link) {
    var _a, _b;
    const ext = (_b = (_a = relPath.split(".").pop()) == null ? void 0 : _a.toLowerCase()) != null ? _b : "";
    const safeRelPath = escapeHtmlAttr(relPath);
    const safeLabel = escapeHtmlText(link);
    if (this.profile === "html-document" || this.profile === "pdf") {
      if (isImageExtension(ext)) {
        return `<img src="${safeRelPath}" alt="${escapeHtmlAttr(link)}" />`;
      }
      if (isVideoExtension(ext)) {
        return `<video controls src="${safeRelPath}">${safeLabel}</video>`;
      }
      if (isAudioExtension(ext)) {
        return `<audio controls src="${safeRelPath}">${safeLabel}</audio>`;
      }
      if (ext === "pdf") {
        return `<object data="${safeRelPath}" type="application/pdf"><a href="${safeRelPath}">${safeLabel}</a></object>`;
      }
      return `<a href="${safeRelPath}">${safeLabel}</a>`;
    }
    if (this.profile === "docx" && isImageExtension(ext)) {
      return `![${link}](${relPath})`;
    }
    return `![${link}](${relPath})`;
  }
};
function isImageExtension(ext) {
  return ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext);
}
function isVideoExtension(ext) {
  return ["mp4", "webm", "mov", "m4v"].includes(ext);
}
function isAudioExtension(ext) {
  return ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext);
}
function escapeHtmlAttr(value) {
  return escapeHtmlText(value).replace(/"/g, "&quot;");
}
function escapeHtmlText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9一-鿿぀-ゟ゠-ヿ가-힯_-]+/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// src/export/OutputWriter.ts
var import_obsidian3 = require("obsidian");
var g = typeof window !== "undefined" ? window : void 0;
var nodeFs = g && "require" in g ? g["require"]("fs") : null;
var OutputWriter = class {
  constructor(app) {
    this.app = app;
  }
  static supportsExternalPaths() {
    return import_obsidian3.Platform.isDesktopApp;
  }
  async ensureFolder(folderPath) {
    if (this.isExternal(folderPath)) {
      const fs = this.getExternalFs();
      fs.mkdirSync(folderPath, { recursive: true });
      return;
    }
    const parts = folderPath.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      const existing = this.app.vault.getAbstractFileByPath(current);
      if (!existing) {
        await this.app.vault.createFolder(current);
      }
    }
  }
  async writeText(filePath, content) {
    if (this.isExternal(filePath)) {
      const fs = this.getExternalFs();
      fs.writeFileSync(filePath, content, "utf-8");
      return;
    }
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof import_obsidian3.TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }
  async writeBinary(filePath, data) {
    if (this.isExternal(filePath)) {
      const fs = this.getExternalFs();
      fs.writeFileSync(filePath, data instanceof Uint8Array ? data : new Uint8Array(data));
      return;
    }
    const buffer = data instanceof ArrayBuffer ? data : uint8ArrayToArrayBuffer(data);
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof import_obsidian3.TFile) {
      await this.app.vault.modifyBinary(existing, buffer);
    } else {
      await this.app.vault.createBinary(filePath, buffer);
    }
  }
  async copyBinaryFile(sourcePath, destPath) {
    const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(sourceFile instanceof import_obsidian3.TFile))
      return;
    const content = await this.app.vault.readBinary(sourceFile);
    if (this.isExternal(destPath)) {
      const fs = this.getExternalFs();
      fs.writeFileSync(destPath, new Uint8Array(content));
    } else {
      const existing = this.app.vault.getAbstractFileByPath(destPath);
      if (existing instanceof import_obsidian3.TFile) {
        await this.app.vault.modifyBinary(existing, content);
      } else {
        await this.app.vault.createBinary(destPath, content);
      }
    }
  }
  folderExists(folderPath) {
    var _a;
    if (this.isExternal(folderPath)) {
      return (_a = nodeFs == null ? void 0 : nodeFs.existsSync(folderPath)) != null ? _a : false;
    }
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    return folder !== null && "children" in folder;
  }
  timestampedFolder(basePath) {
    const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `${basePath}-${ts}`;
  }
  isFolderEmpty(folderPath) {
    var _a;
    if (this.isExternal(folderPath)) {
      const entries = (_a = nodeFs == null ? void 0 : nodeFs.readdirSync(folderPath)) != null ? _a : [];
      return entries.length === 0;
    }
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !("children" in folder))
      return true;
    return folder.children.length === 0;
  }
  isExternal(p) {
    if (p.startsWith("/"))
      return true;
    if (/^[A-Za-z]:/.test(p))
      return true;
    return false;
  }
  getExternalFs() {
    if (!nodeFs) {
      throw new Error("External file system access is not available");
    }
    return nodeFs;
  }
};
function uint8ArrayToArrayBuffer(data) {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
}

// src/formats/markdown-bundle.ts
async function renderMarkdownBundle(doc, plan, writer, outputFilePath) {
  const warnings = [];
  await writer.ensureFolder(plan.outputRoot);
  const parts = [];
  parts.push(`# ${doc.title}
`);
  const isSingleSection = doc.sections.length === 1;
  for (const section of doc.sections) {
    if (!(isSingleSection && section.title === doc.title)) {
      parts.push(`## ${section.title}
`);
    }
    parts.push(section.markdown);
    parts.push("");
  }
  const content = parts.join("\n");
  await writer.writeText(outputFilePath, content);
  return warnings;
}

// src/formats/native-renderer.ts
var import_obsidian4 = require("obsidian");
var POST_PROCESSOR_TIMEOUT = 5e3;
var DEBOUNCE_INTERVAL = 200;
async function renderMarkdownNative(app, markdown, sourcePath, timeout = POST_PROCESSOR_TIMEOUT) {
  const warnings = [];
  const container = activeDocument.body.createDiv();
  container.setCssProps({
    position: "fixed",
    left: "-9999px",
    top: "-9999px",
    width: "800px",
    visibility: "hidden"
  });
  const component = new import_obsidian4.Component();
  component.load();
  try {
    await import_obsidian4.MarkdownRenderer.render(app, markdown, container, sourcePath, component);
    const completed = await waitForPostProcessors(container, timeout);
    if (!completed) {
      warnings.push(`Post-processor timeout for "${sourcePath}" \u2014 some content may be incomplete`);
    }
    const html = container.innerHTML;
    return { html, warnings };
  } finally {
    component.unload();
    container.remove();
  }
}
function extractObsidianStyles() {
  const sheets = [];
  for (let i = 0; i < activeDocument.styleSheets.length; i++) {
    const sheet = activeDocument.styleSheets[i];
    try {
      for (let j = 0; j < sheet.cssRules.length; j++) {
        const rule = sheet.cssRules[j];
        const text = rule.cssText;
        if (shouldIncludeRule(text)) {
          sheets.push(text);
        }
      }
    } catch (e) {
    }
  }
  return sheets.join("\n");
}
var EXCLUDED_PREFIXES = [
  ".cm-",
  ".\u037C",
  ".CodeMirror",
  ".workspace-",
  ".mod-root",
  ".mod-left-split",
  ".mod-right-split",
  ".titlebar",
  ".sidebar-toggle",
  ".status-bar",
  ".nav-header",
  ".nav-folder",
  ".nav-file",
  ".tree-item",
  ".menu",
  ".modal-container",
  ".modal-bg",
  ".prompt",
  ".suggestion-",
  ".setting-item",
  ".horizontal-tab",
  ".vertical-tab",
  ".tooltip",
  ".workspace-tab",
  ".workspace-leaf",
  ".workspace-split",
  ".workspace-drawer",
  ".view-header",
  ".view-action"
];
function shouldIncludeRule(cssText) {
  for (const prefix of EXCLUDED_PREFIXES) {
    if (cssText.startsWith(prefix))
      return false;
  }
  if (cssText.startsWith("@keyframes cm-blink"))
    return false;
  return true;
}
function rewriteAppProtocolUrls(html, attachments) {
  var _a;
  const attachmentMap = /* @__PURE__ */ new Map();
  for (const att of attachments) {
    const filename = (_a = att.sourcePath.split("/").pop()) != null ? _a : "";
    attachmentMap.set(filename, att.outputRelativePath);
  }
  return html.replace(
    /src="app:\/\/[^"]*\/([^"/?]+)(?:\?[^"]*)?"/g,
    (match, filename) => {
      const decodedName = decodeURIComponent(filename);
      const relPath = attachmentMap.get(decodedName);
      if (relPath) {
        return `src="${relPath}"`;
      }
      return match;
    }
  );
}
async function waitForPostProcessors(el, timeout) {
  return new Promise((resolve) => {
    let timer;
    let overallTimer;
    const clearTimer = (timerId) => {
      if (timerId !== void 0) {
        window.clearTimeout(timerId);
      }
    };
    const observer = new MutationObserver(() => {
      clearTimer(timer);
      timer = window.setTimeout(() => {
        observer.disconnect();
        clearTimer(overallTimer);
        resolve(true);
      }, DEBOUNCE_INTERVAL);
    });
    observer.observe(el, { childList: true, subtree: true, attributes: true });
    timer = window.setTimeout(() => {
      observer.disconnect();
      clearTimer(overallTimer);
      resolve(true);
    }, DEBOUNCE_INTERVAL);
    overallTimer = window.setTimeout(() => {
      observer.disconnect();
      clearTimer(timer);
      resolve(false);
    }, timeout);
  });
}

// src/formats/html-document.ts
async function renderHtmlDocument(doc, plan, writer, app = null, outputFilePath) {
  const warnings = [];
  await writer.ensureFolder(plan.outputRoot);
  const toc = doc.sections.length > 1 ? generateToc(doc.sections) : "";
  const { html: body, warnings: renderWarnings } = await renderSections(doc.sections, app, doc.title, doc.attachments);
  warnings.push(...renderWarnings);
  const customCss = app ? extractObsidianStyles() : null;
  const html = buildHtmlDoc(doc.title, toc, body, customCss);
  const resolvedOutput = outputFilePath != null ? outputFilePath : `${plan.outputRoot}/${plan.outputFilename.replace(/\.(md|html|htm)$/i, "")}.html`;
  await writer.ensureFolder(resolvedOutput.substring(0, resolvedOutput.lastIndexOf("/")));
  await writer.writeText(resolvedOutput, html);
  return warnings;
}
function generateToc(sections) {
  const items = sections.map((s, i) => {
    const id = `section-${i}`;
    return `<li><a href="#${id}">${escapeHtml(s.title)}</a></li>`;
  });
  return `<nav class="toc"><h2>Table of Contents</h2><ol>${items.join("")}</ol></nav>`;
}
async function renderSections(sections, app, docTitle, attachments) {
  const allWarnings = [];
  const parts = [];
  const isSingleSection = sections.length === 1;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const id = `section-${i}`;
    let sectionHtml;
    if (app && typeof document !== "undefined") {
      try {
        const result = await renderMarkdownNative(app, s.markdown, s.sourcePath);
        sectionHtml = rewriteAppProtocolUrls(result.html, attachments);
        allWarnings.push(...result.warnings);
      } catch (e) {
        sectionHtml = markdownToBasicHtml(s.markdown);
        allWarnings.push(`Native rendering failed for "${s.sourcePath}", using basic converter`);
      }
    } else {
      sectionHtml = markdownToBasicHtml(s.markdown);
    }
    const skipHeading = isSingleSection && s.title === docTitle;
    const heading = skipHeading ? "" : `<h2>${escapeHtml(s.title)}</h2>`;
    parts.push(`<section id="${id}">${heading}${sectionHtml}</section>`);
  }
  return { html: parts.join("\n"), warnings: allWarnings };
}
function markdownToBasicHtml(md) {
  const codeBlocks = [];
  let html = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`);
    return `CB${codeBlocks.length - 1}`;
  });
  const mediaBlocks = [];
  html = html.replace(SAFE_MEDIA_TAG_RE, (match) => {
    mediaBlocks.push(match);
    return `MB${mediaBlocks.length - 1}`;
  });
  const inlineCode = [];
  html = html.replace(/`([^`\n]+)`/g, (_match, code) => {
    inlineCode.push(`<code>${escapeHtml(code)}</code>`);
    return `IC${inlineCode.length - 1}`;
  });
  html = escapeHtml(html);
  html = html.replace(/^(\|.+\|)\n(\|[-:| ]+\|)\n((?:\|.+\|\n?)+)/gm, (_, header, _align, body) => {
    const ths = header.split("|").slice(1, -1).map((c) => `<th>${c.trim()}</th>`).join("");
    const rows = body.trim().split("\n").map((row) => {
      const tds = row.split("|").slice(1, -1).map((c) => `<td>${c.trim()}</td>`).join("");
      return `<tr>${tds}</tr>`;
    }).join("");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
  });
  html = html.replace(/^(&gt; .+(?:\n&gt; .+)*)/gm, (match) => {
    const content = match.replace(/^&gt; /gm, "");
    return `<blockquote>${content}</blockquote>`;
  });
  html = html.replace(/^- \[x\] (.+)$/gm, '<li class="task-done"><input type="checkbox" checked disabled> $1</li>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<li class="task"><input type="checkbox" disabled> $1</li>');
  html = html.replace(/^(?:[*-] .+(?:\n[*-] .+)*)/gm, (match) => {
    const items = match.split("\n").map((line) => `<li>${line.replace(/^[*-] /, "")}</li>`).join("");
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/^(?:\d+\. .+(?:\n\d+\. .+)*)/gm, (match) => {
    const items = match.split("\n").map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`).join("");
    return `<ol>${items}</ol>`;
  });
  html = html.replace(/^[-*_]{3,}\s*$/gm, "<hr>");
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    return renderEmbeddedImage(src, alt);
  });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.split("\n\n").map((block) => {
    const trimmed = block.trim();
    if (!trimmed)
      return "";
    if (/^<(h[1-6]|pre|ul|ol|li|section|div|img|blockquote|table|nav|hr)/.test(trimmed)) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");
  html = html.replace(/IC(\d+)/g, (_match, idx) => inlineCode[parseInt(idx)]);
  html = html.replace(/MB(\d+)/g, (_match, idx) => mediaBlocks[parseInt(idx)]);
  html = html.replace(/CB(\d+)/g, (_match, idx) => codeBlocks[parseInt(idx)]);
  return html;
}
function renderEmbeddedImage(src, alt) {
  const safeSrc = escapeHtmlAttr2(src);
  const safeAlt = escapeHtmlAttr2(alt);
  return `<img src="${safeSrc}" alt="${safeAlt}" />`;
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeHtmlAttr2(text) {
  return escapeHtml(text);
}
var SAFE_MEDIA_TAG_RE = /<img src="[^"]+" alt="[^"]*" \/>|<video controls src="[^"]+">[^<]*<\/video>|<audio controls src="[^"]+">[^<]*<\/audio>|<object data="[^"]+" type="application\/pdf"><a href="[^"]+">[^<]*<\/a><\/object>/g;
var DEFAULT_CSS = `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1a1a1a; }
h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
section { margin-top: 2em; }
pre { background: #f5f5f5; padding: 1em; overflow-x: auto; border-radius: 4px; }
code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
img, video, object { display: block; max-width: min(100%, 560px); height: auto; margin: 1rem auto; }
audio { width: 100%; }
a { color: #0366d6; }
.toc { background: #f8f9fa; padding: 1em 1.5em; border-radius: 4px; margin-bottom: 2em; }
.toc h2 { margin-top: 0; }
.toc ol { padding-left: 1.5em; }
.toc li { margin: 0.3em 0; }
blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding: 0.5em 1em; color: #555; }`;
function buildHtmlDoc(title, toc, body, customCss = null) {
  const css = customCss != null ? customCss : DEFAULT_CSS;
  const contentClass = customCss ? ' class="markdown-rendered"' : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
${css}
${customCss ? HTML_EXPORT_RESET_CSS : ""}
</style>
</head>
<body>
<main${contentClass}>
<h1>${escapeHtml(title)}</h1>
${toc}
${body}
</main>
</body>
</html>`;
}
var HTML_EXPORT_RESET_CSS = `html, body { height: auto !important; min-height: 100% !important; overflow: auto !important; contain: none !important; overscroll-behavior: auto !important; }
body { display: block !important; box-sizing: border-box; padding: 2rem; max-width: 800px; margin: 0 auto; }
main.markdown-rendered, main.markdown-rendered section { display: block !important; visibility: visible !important; height: auto !important; overflow: visible !important; }
main.markdown-rendered img { max-width: 384px; height: auto; }`;

// src/formats/pdf.ts
var import_obsidian5 = require("obsidian");
async function renderPdf(doc, plan, writer, app, outputFilePath) {
  var _a, _b;
  const warnings = [];
  if (!import_obsidian5.Platform.isDesktopApp) {
    warnings.push("PDF export requires the desktop app.");
    return warnings;
  }
  await writer.ensureFolder(plan.outputRoot);
  const toc = doc.sections.length > 1 ? generateToc2(doc.sections) : "";
  const { html: body, warnings: renderWarnings } = await renderSections2(doc.sections, app, doc.title, doc.attachments);
  warnings.push(...renderWarnings);
  let finalBody = body;
  if (doc.attachments.length > 0) {
    for (const att of doc.attachments) {
      try {
        const file = app.vault.getAbstractFileByPath(att.sourcePath);
        if (file instanceof import_obsidian5.TFile) {
          const buffer = await app.vault.readBinary(file);
          const ext = (_b = (_a = att.sourcePath.split(".").pop()) == null ? void 0 : _a.toLowerCase()) != null ? _b : "";
          const dataUri = encodeAttachmentDataUri(buffer, ext);
          finalBody = finalBody.split(att.outputRelativePath).join(dataUri);
        }
      } catch (e) {
        warnings.push(`Failed to embed attachment for PDF: ${att.sourcePath}`);
      }
    }
  }
  const cssText = DEFAULT_CSS2;
  const printCss = PRINT_CSS;
  const htmlBody = `<h1>${escapeHtml(doc.title)}</h1>
${toc}
${finalBody}`;
  const pdfBuffer = await printViaBrowserWindow(htmlBody, cssText + "\n" + printCss);
  if (pdfBuffer.byteLength < MIN_VALID_PDF_BYTES) {
    throw new Error("PDF generation failed: generated PDF is unexpectedly small; the print page may be blank");
  }
  const resolved = outputFilePath != null ? outputFilePath : `${plan.outputRoot}/${plan.outputFilename.replace(/\.(md|html|htm|pdf|docx)$/i, "")}.pdf`;
  await writer.ensureFolder(resolved.substring(0, resolved.lastIndexOf("/")));
  await writer.writeBinary(resolved, pdfBuffer);
  return warnings;
}
function generateToc2(sections) {
  const items = sections.map((s, i) => {
    const id = `section-${i}`;
    return `<li><a href="#${id}">${escapeHtml(s.title)}</a></li>`;
  });
  return `<nav class="toc"><h2>Table of Contents</h2><ol>${items.join("")}</ol></nav>`;
}
async function renderSections2(sections, app, docTitle, attachments) {
  const allWarnings = [];
  const parts = [];
  const isSingleSection = sections.length === 1;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const id = `section-${i}`;
    let sectionHtml;
    if (typeof document !== "undefined") {
      try {
        const result = await renderMarkdownNative(app, s.markdown, s.sourcePath);
        sectionHtml = rewriteAppProtocolUrls(result.html, attachments);
        allWarnings.push(...result.warnings);
      } catch (e) {
        sectionHtml = markdownToBasicHtml(s.markdown);
        allWarnings.push(`Native rendering failed for "${s.sourcePath}", using basic converter`);
      }
    } else {
      sectionHtml = markdownToBasicHtml(s.markdown);
    }
    const skipHeading = isSingleSection && s.title === docTitle;
    const heading = skipHeading ? "" : `<h2>${escapeHtml(s.title)}</h2>`;
    parts.push(`<section id="${id}">${heading}${sectionHtml}</section>`);
  }
  return { html: parts.join("\n"), warnings: allWarnings };
}
function buildPdfHtml(htmlBody, css) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Export</title><style>${css}
${PDF_PAGE_RESET_CSS}</style></head>
<body><main class="pdf-export-page markdown-rendered">${htmlBody}</main></body></html>`;
}
function buildPdfDocumentWriteScript(html) {
  return `document.open(); document.write(${JSON.stringify(html)}); document.close();`;
}
function createPdfBrowserWindowOptions() {
  return {
    show: false,
    frame: false,
    skipTaskbar: true,
    focusable: false,
    transparent: true,
    backgroundColor: "#ffffff",
    opacity: 0.01,
    width: 800,
    height: 1200,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false
    }
  };
}
function createPdfPrintOptions() {
  return {
    printBackground: true,
    pageSize: "A4",
    // Let CSS @page own ALL physical margins (see PAGE_MARGIN_*). When
    // preferCSSPageSize is true, Chromium reads margins from @page; but if the
    // printToPDF margins option is also non-zero, Chromium uses THOSE for the
    // page box, which on continuation pages drops the top margin to 0. Keeping
    // the option at zero lets @page margins apply on every page.
    preferCSSPageSize: true,
    margins: {
      marginType: "custom",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  };
}
async function printViaBrowserWindow(htmlBody, css) {
  if (!import_obsidian5.Platform.isDesktop) {
    throw new Error("PDF export requires the desktop app.");
  }
  const fullHtml = buildPdfHtml(htmlBody, css);
  const electron = getElectronModule();
  const remote = electron.remote;
  if (!remote) {
    throw new Error("electron.remote not available - cannot create BrowserWindow");
  }
  const BrowserWindow = remote.BrowserWindow;
  if (!BrowserWindow) {
    throw new Error("BrowserWindow not found on electron.remote");
  }
  const win = new BrowserWindow(createPdfBrowserWindowOptions());
  try {
    await win.loadURL("about:blank");
    await win.webContents.executeJavaScript(buildPdfDocumentWriteScript(fullHtml));
    await waitForPrintableContent(win);
    const pdfData = await win.webContents.printToPDF(createPdfPrintOptions());
    return pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);
  } finally {
    win.close();
  }
}
function getElectronModule() {
  var _a, _b;
  const desktopWindow = window;
  const electron = (_b = desktopWindow.electron) != null ? _b : (_a = desktopWindow.require) == null ? void 0 : _a.call(desktopWindow, "electron");
  if (!isElectronModule(electron)) {
    throw new Error("electron module not available");
  }
  return electron;
}
function isElectronModule(value) {
  if (!value || typeof value !== "object")
    return false;
  const remote = value.remote;
  if (!remote || typeof remote !== "object")
    return false;
  const BrowserWindow = remote.BrowserWindow;
  return typeof BrowserWindow === "function";
}
async function waitForPrintableContent(win) {
  const printable = await win.webContents.executeJavaScript(
    `new Promise((resolve) => {
			const done = () => {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						const rect = document.body.getBoundingClientRect();
						resolve({
							textLength: document.body.innerText.trim().length,
							width: rect.width,
							height: rect.height,
						});
					});
				});
			};
			if (document.readyState === "complete") {
				done();
			} else {
				window.addEventListener("load", done, { once: true });
			}
		})`
  );
  if (printable.textLength === 0 || printable.width === 0 || printable.height === 0) {
    throw new Error("print page has no visible content");
  }
}
var DEFAULT_CSS2 = `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #1a1a1a; }
h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
section { margin-top: 2em; }
pre { background: #f5f5f5; padding: 1em; overflow-x: auto; border-radius: 4px; }
code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
img { max-width: 100%; height: auto; }
a { color: #0366d6; }
.toc { background: #f8f9fa; padding: 1em 1.5em; border-radius: 4px; margin-bottom: 2em; }
.toc h2 { margin-top: 0; }
.toc ol { padding-left: 1.5em; }
.toc li { margin: 0.3em 0; }
blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding: 0.5em 1em; color: #555; }`;
var PRINT_CSS = `
@media print {
	body { max-width: 100%; margin: 0; padding: 1cm; }
	section { page-break-before: auto; }
	h2 { page-break-after: avoid; }
	img { max-width: 100%; page-break-inside: avoid; }
	.toc { page-break-after: always; }
}`;
var PAGE_MARGIN_TOP_PX = 52;
var PAGE_MARGIN_BOTTOM_PX = 52;
var PAGE_MARGIN_LEFT_PX = 60;
var PAGE_MARGIN_RIGHT_PX = 60;
var PDF_PAGE_RESET_CSS = `
@page {
	/* CSS @page owns physical page margins \u2014 reliable on every page including
	   continuation pages. Units are CSS px (96/inch). */
	margin: ${PAGE_MARGIN_TOP_PX}px ${PAGE_MARGIN_RIGHT_PX}px ${PAGE_MARGIN_BOTTOM_PX}px ${PAGE_MARGIN_LEFT_PX}px;
}

html,
body {
	width: auto !important;
	height: auto !important;
	min-height: 100% !important;
	margin: 0 !important;
	padding: 0 !important;
	overflow: visible !important;
	contain: none !important;
	user-select: text !important;
	background: #fff !important;
	color: #1a1a1a !important;
}

body,
.pdf-export-page {
	display: block !important;
}

.pdf-export-page {
	box-sizing: border-box;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	line-height: 1.6;
	max-width: 800px;
	margin: 0 auto;
	padding: 0;
}

.pdf-export-page p {
	margin: 0 0 0.65rem;
}

/* Collapse spacing for any paragraph that contains media. Obsidian renders
   consecutive image embeds without a blank line into a single <p> separated by
   <br>, and each embed is wrapped in .internal-embed/.media-embed/.image-embed.
   Use descendant :has() so multi-media paragraphs are tightened too. The
   line-height: 1 here also shrinks the <br> line-boxes between consecutive
   embeds, so media spacing is governed by the per-media margin below \u2014 without
   hiding <br> entirely (which would also kill legitimate soft line breaks in
   mixed text+media paragraphs). */
.pdf-export-page p:has(img),
.pdf-export-page p:has(video),
.pdf-export-page p:has(object),
.pdf-export-page p:has(.internal-embed),
.pdf-export-page p:has(.media-embed),
.pdf-export-page p:has(.image-embed) {
	line-height: 1;
	margin: 0.25rem 0;
}

.pdf-export-page img {
	display: block;
	max-width: min(100%, 384px);
	height: auto;
	margin: 0.25rem 0;
	page-break-inside: avoid;
}

.pdf-export-page .internal-embed,
.pdf-export-page .media-embed,
.pdf-export-page .image-embed {
	display: block;
	line-height: 1;
	margin: 0.25rem 0 !important;
	page-break-inside: avoid;
}

.pdf-export-page .internal-embed img,
.pdf-export-page .media-embed img,
.pdf-export-page .image-embed img {
	margin: 0;
}
`;
var MIN_VALID_PDF_BYTES = 1024;
function mimeFromExt(ext) {
  var _a;
  const map = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    bmp: "image/bmp"
  };
  return (_a = map[ext]) != null ? _a : "application/octet-stream";
}
function encodeAttachmentDataUri(buffer, ext) {
  const bytes = new Uint8Array(buffer);
  const base64 = encodeBase64(bytes);
  return `data:${mimeFromExt(ext)};base64,${base64}`;
}
function encodeBase64(bytes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const first = bytes[i];
    const second = bytes[i + 1];
    const third = bytes[i + 2];
    const hasSecond = i + 1 < bytes.length;
    const hasThird = i + 2 < bytes.length;
    const value = first << 16 | (second != null ? second : 0) << 8 | (third != null ? third : 0);
    output += alphabet[value >> 18 & 63];
    output += alphabet[value >> 12 & 63];
    output += hasSecond ? alphabet[value >> 6 & 63] : "=";
    output += hasThird ? alphabet[value & 63] : "=";
  }
  return output;
}

// src/formats/docx.ts
var import_obsidian6 = require("obsidian");
var encoder = new TextEncoder();
var CRC32_TABLE = buildCrc32Table();
var PX_TO_EMU = 9525;
var MAX_WIDTH_EMU = 3657600;
async function renderDocx(doc, plan, writer, app = null, outputFilePath) {
  const warnings = [];
  const images = await collectImages(doc.attachments, app, warnings);
  const paragraphs = buildDocxParagraphs(doc, images);
  const documentXml = buildDocumentXml(paragraphs);
  const files = [
    { name: "[Content_Types].xml", data: encodeXml(buildContentTypes(images)) },
    { name: "_rels/.rels", data: encodeXml(PACKAGE_RELS_XML) },
    { name: "word/document.xml", data: encodeXml(documentXml) },
    { name: "word/styles.xml", data: encodeXml(STYLES_XML) }
  ];
  if (images.length > 0) {
    files.push({ name: "word/_rels/document.xml.rels", data: encodeXml(buildRels(images)) });
    for (const img of images) {
      files.push({ name: img.mediaPath, data: img.data });
    }
  }
  const buffer = createZip(files);
  const resolved = outputFilePath != null ? outputFilePath : `${plan.outputRoot}/${plan.outputFilename.replace(/\.(md|html|htm|pdf|docx)$/i, "")}.docx`;
  await writer.ensureFolder(resolved.substring(0, resolved.lastIndexOf("/")));
  await writer.writeBinary(resolved, buffer);
  return warnings;
}
async function collectImages(attachments, app, warnings) {
  var _a, _b;
  if (!app)
    return [];
  const images = [];
  let rIdCounter = 2;
  for (const att of attachments) {
    if (!isImagePath(att.sourcePath))
      continue;
    try {
      const file = app.vault.getAbstractFileByPath(att.sourcePath);
      if (!(file instanceof import_obsidian6.TFile))
        continue;
      const buffer = await app.vault.readBinary(file);
      const data = new Uint8Array(buffer);
      const ext = (_b = (_a = att.sourcePath.split(".").pop()) == null ? void 0 : _a.toLowerCase()) != null ? _b : "png";
      const dims = readImageDimensions(data, ext);
      images.push({
        rId: `rId${rIdCounter++}`,
        sourcePath: att.sourcePath,
        outputRelativePath: att.outputRelativePath,
        mediaPath: `word/media/image${images.length + 1}.${ext}`,
        data,
        width: dims.width,
        height: dims.height,
        ext
      });
    } catch (e) {
      warnings.push(`Failed to embed image in DOCX: ${att.sourcePath}`);
    }
  }
  return images;
}
function readImageDimensions(data, ext) {
  try {
    if (ext === "png" && data.length > 24) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      return {
        width: view.getUint32(16, false),
        height: view.getUint32(20, false)
      };
    }
    if ((ext === "jpg" || ext === "jpeg") && data.length > 10) {
      let offset = 2;
      while (offset < data.length - 9) {
        if (data[offset] !== 255)
          break;
        const marker = data[offset + 1];
        if (marker === 192 || marker === 194) {
          const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
          return {
            height: view.getUint16(offset + 5, false),
            width: view.getUint16(offset + 7, false)
          };
        }
        const segLen = data[offset + 2] << 8 | data[offset + 3];
        offset += 2 + segLen;
      }
    }
  } catch (e) {
  }
  return { width: 400, height: 300 };
}
function buildDocxParagraphs(doc, images) {
  var _a, _b;
  const imageMap = /* @__PURE__ */ new Map();
  for (const img of images) {
    imageMap.set(img.mediaPath, img);
    imageMap.set(img.sourcePath, img);
    imageMap.set(img.outputRelativePath, img);
    imageMap.set((_a = img.sourcePath.split("/").pop()) != null ? _a : img.sourcePath, img);
    imageMap.set((_b = img.outputRelativePath.split("/").pop()) != null ? _b : img.outputRelativePath, img);
  }
  const paragraphs = [
    { style: "Title", runs: [{ text: doc.title }] }
  ];
  const isSingleSection = doc.sections.length === 1;
  for (const section of doc.sections) {
    if (!(isSingleSection && section.title === doc.title)) {
      paragraphs.push({ style: "Heading1", runs: [{ text: section.title }] });
    }
    paragraphs.push(...parseMarkdownToParagraphs(section.markdown, imageMap));
  }
  return paragraphs;
}
function parseMarkdownToParagraphs(markdown, imageMap) {
  const paragraphs = [];
  const lines = markdown.split("\n");
  let i = 0;
  const isSpecialLine = (line, idx) => {
    if (line.startsWith("```"))
      return true;
    if (/^(#{1,6})\s+(.+)$/.test(line))
      return true;
    if (line.includes("|") && idx + 1 < lines.length && /^\|[-:| ]+\|$/.test(lines[idx + 1]))
      return true;
    if (/^[\s]*[-*+]\s/.test(line))
      return true;
    if (/^[\s]*\d+\.\s/.test(line))
      return true;
    if (line.startsWith("> "))
      return true;
    if (/^[-*_]{3,}\s*$/.test(line))
      return true;
    if (/^<!--.*-->\s*$/.test(line))
      return true;
    return false;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (/^<!--.*-->\s*$/.test(line)) {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        paragraphs.push({ style: "Code", runs: [{ text: lines[i] || " ", code: true }] });
        i++;
      }
      i++;
      continue;
    }
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6);
      paragraphs.push({ style: `Heading${level}`, runs: parseInline(headingMatch[2], imageMap) });
      i++;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\|[-:| ]+\|$/.test(lines[i + 1])) {
      const tableLines = [];
      const headerCells = parseTableRow(line);
      tableLines.push(line);
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      paragraphs.push(...buildTableParagraphs(headerCells, tableLines.slice(1), imageMap));
      continue;
    }
    if (/^[\s]*[-*+]\s/.test(line)) {
      const text = line.replace(/^[\s]*[-*+]\s/, "");
      paragraphs.push({ style: "ListParagraph", runs: parseInline(`\u2022 ${text}`, imageMap) });
      i++;
      continue;
    }
    if (/^[\s]*\d+\.\s/.test(line)) {
      const text = line.replace(/^[\s]*\d+\.\s/, "");
      paragraphs.push({ style: "ListParagraph", runs: parseInline(text, imageMap) });
      i++;
      continue;
    }
    if (line.startsWith("> ")) {
      paragraphs.push({ style: "Quote", runs: parseInline(line.replace(/^>\s?/, ""), imageMap) });
      i++;
      continue;
    }
    if (/^[-*_]{3,}\s*$/.test(line)) {
      paragraphs.push({ runs: [{ text: "------" }] });
      i++;
      continue;
    }
    if (line.trim() === "") {
      paragraphs.push({ runs: [{ text: "" }] });
      i++;
      continue;
    }
    const textLines = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !isSpecialLine(lines[i], i)) {
      textLines.push(lines[i]);
      i++;
    }
    const runs = [];
    for (let li = 0; li < textLines.length; li++) {
      const lineRuns = parseInline(textLines[li], imageMap);
      if (li > 0 && lineRuns.length > 0) {
        lineRuns[0] = { ...lineRuns[0], break: true };
      }
      runs.push(...lineRuns);
    }
    paragraphs.push({ runs });
  }
  return paragraphs;
}
function buildTableParagraphs(headerCells, bodyLines, imageMap) {
  const result = [];
  const headerRuns = headerCells.map((cell) => ({
    runs: parseInline(cell.trim(), imageMap),
    isHeader: true
  }));
  result.push({ style: "TableRow", runs: buildTableRowXml(headerRuns) });
  for (const bodyLine of bodyLines) {
    const cells = parseTableRow(bodyLine);
    const cellRuns = cells.map((cell) => ({
      runs: parseInline(cell.trim(), imageMap),
      isHeader: false
    }));
    result.push({ style: "TableRow", runs: buildTableRowXml(cellRuns) });
  }
  return result;
}
function buildTableRowXml(_cells) {
  return [{ text: "" }];
}
function parseInline(text, imageMap) {
  const runs = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))|(!\[([^\]]*)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(createTextRun(text.slice(lastIndex, match.index)));
    }
    if (match[1]) {
      runs.push(createTextRun(match[2], { bold: true }));
    } else if (match[3]) {
      runs.push(createTextRun(match[4], { italics: true }));
    } else if (match[5]) {
      runs.push(createTextRun(match[6], { code: true }));
    } else if (match[10]) {
      const altText = match[11] || "image";
      const imgRef = match[12];
      const img = findImage(imgRef, imageMap);
      if (img) {
        runs.push({ text: "", drawing: buildDrawingXml(img, altText) });
      } else {
        runs.push(createTextRun(`[Image: ${altText}]`, { italics: true }));
      }
    } else if (match[7]) {
      runs.push(createTextRun(match[8]));
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    runs.push(createTextRun(text.slice(lastIndex)));
  }
  return runs.length > 0 ? runs : [createTextRun(text)];
}
function createTextRun(text, options = {}) {
  return {
    text,
    ...options,
    emoji: containsEmoji(text)
  };
}
function findImage(ref, imageMap) {
  if (imageMap.size === 0)
    return null;
  if (imageMap.has(ref))
    return imageMap.get(ref);
  for (const [key, img] of imageMap) {
    if (key.endsWith("/" + ref.split("/").pop()) || ref.endsWith("/" + key.split("/").pop())) {
      return img;
    }
  }
  if (imageMap.size === 1) {
    const onlyImage = imageMap.values().next();
    return onlyImage.done ? null : onlyImage.value;
  }
  return null;
}
function buildDrawingXml(img, altText) {
  let cx = img.width * PX_TO_EMU;
  let cy = img.height * PX_TO_EMU;
  if (cx > MAX_WIDTH_EMU) {
    const scale = MAX_WIDTH_EMU / cx;
    cx = MAX_WIDTH_EMU;
    cy = Math.round(cy * scale);
  }
  return `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${img.rId.replace("rId", "")}" name="${escapeXml(altText)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="${escapeXml(altText)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${img.rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
}
function parseTableRow(line) {
  return line.split("|").slice(1, -1).map((cell) => cell.trim());
}
function buildDocumentXml(paragraphs) {
  const body = paragraphs.map((p) => paragraphToXml(p)).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body>
</w:document>`;
}
function paragraphToXml(paragraph) {
  if (paragraph.style === "TableRow") {
    const cells = paragraph.runs.map(
      () => `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:pPr><w:rPr><w:b/></w:rPr></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p></w:tc>`
    ).join("");
    return `<w:p><w:pPr><w:rPr><w:b/></w:rPr></w:pPr>${cells}</w:p>`;
  }
  const style = paragraph.style ? `<w:pPr><w:pStyle w:val="${paragraph.style}"/></w:pPr>` : "";
  const runs = paragraph.runs.map(runToXml).join("");
  return `<w:p>${style}${runs}</w:p>`;
}
function runToXml(run) {
  if (run.drawing) {
    return `<w:r>${run.drawing}</w:r>`;
  }
  const props = [];
  if (run.emoji)
    props.push('<w:rFonts w:ascii="Apple Color Emoji" w:hAnsi="Apple Color Emoji" w:eastAsia="Apple Color Emoji" w:cs="Apple Color Emoji"/>');
  if (run.bold)
    props.push("<w:b/>");
  if (run.italics)
    props.push("<w:i/>");
  if (run.code)
    props.push('<w:rStyle w:val="CodeChar"/>');
  const runProps = props.length > 0 ? `<w:rPr>${props.join("")}</w:rPr>` : "";
  const br = run.break ? "<w:br/>" : "";
  return `<w:r>${runProps}${br}<w:t xml:space="preserve">${escapeXml(run.text)}</w:t></w:r>`;
}
function buildContentTypes(images) {
  const imageTypes = /* @__PURE__ */ new Set();
  for (const img of images) {
    imageTypes.add(img.ext);
  }
  const imageEntries = Array.from(imageTypes).map((ext) => {
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
    return `<Default Extension="${ext}" ContentType="${mime}"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
${imageEntries}
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
}
function buildRels(images) {
  const rels = images.map(
    (img) => `<Relationship Id="${img.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${img.mediaPath.replace("word/", "")}"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
${rels}
</Relationships>`;
}
function encodeXml(xml) {
  return encoder.encode(xml);
}
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function containsEmoji(value) {
  return /[\p{Extended_Pictographic}\uFE0F]/u.test(value);
}
function createZip(files) {
  const chunks = [];
  const entries = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const entry = {
      name: file.name,
      data: file.data,
      crc32: crc32(file.data),
      localHeaderOffset: offset
    };
    const header = createLocalFileHeader(name, entry);
    chunks.push(header, file.data);
    offset += header.byteLength + file.data.byteLength;
    entries.push(entry);
  }
  const centralDirectoryOffset = offset;
  const centralDirectoryChunks = entries.map((entry) => {
    const header = createCentralDirectoryHeader(encoder.encode(entry.name), entry);
    offset += header.byteLength;
    return header;
  });
  chunks.push(...centralDirectoryChunks);
  const centralDirectorySize = offset - centralDirectoryOffset;
  chunks.push(createEndOfCentralDirectory(entries.length, centralDirectorySize, centralDirectoryOffset));
  return concat(chunks);
}
function createLocalFileHeader(name, entry) {
  const header = new Uint8Array(30 + name.byteLength);
  const view = new DataView(header.buffer);
  view.setUint32(0, 67324752, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 2048, true);
  view.setUint16(8, 0, true);
  view.setUint32(14, entry.crc32, true);
  view.setUint32(18, entry.data.byteLength, true);
  view.setUint32(22, entry.data.byteLength, true);
  view.setUint16(26, name.byteLength, true);
  header.set(name, 30);
  return header;
}
function createCentralDirectoryHeader(name, entry) {
  const header = new Uint8Array(46 + name.byteLength);
  const view = new DataView(header.buffer);
  view.setUint32(0, 33639248, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 2048, true);
  view.setUint16(10, 0, true);
  view.setUint32(16, entry.crc32, true);
  view.setUint32(20, entry.data.byteLength, true);
  view.setUint32(24, entry.data.byteLength, true);
  view.setUint16(28, name.byteLength, true);
  view.setUint32(42, entry.localHeaderOffset, true);
  header.set(name, 46);
  return header;
}
function createEndOfCentralDirectory(entryCount, directorySize, directoryOffset) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, 101010256, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, directorySize, true);
  view.setUint32(16, directoryOffset, true);
  return header;
}
function concat(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
function crc32(data) {
  let crc = 4294967295;
  for (const byte of data) {
    crc = CRC32_TABLE[(crc ^ byte) & 255] ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
}
function buildCrc32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < table.length; i++) {
    let crc = i;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? 3988292384 ^ crc >>> 1 : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
}
function isImagePath(path) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(path);
}
var PACKAGE_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
var STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="heading 4"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="140" w:after="60"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading5"><w:name w:val="heading 5"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="120" w:after="40"/></w:pPr><w:rPr><w:b/><w:i/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading6"><w:name w:val="heading 6"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="100" w:after="40"/></w:pPr><w:rPr><w:i/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="720"/></w:pPr><w:rPr><w:i/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="720"/></w:pPr></w:style>
<w:style w:type="character" w:styleId="CodeChar"><w:name w:val="Code Char"/><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="20"/></w:rPr></w:style>
</w:styles>`;

// src/export/ExportRunner.ts
var SINGLE_FILE_PHASES = [
  "Assembling document",
  "Collecting attachments",
  "Rewriting links",
  "Rendering output",
  "Copying attachments"
];
var ExportRunner = class {
  constructor(app) {
    this.cancelled = false;
    this.app = app;
  }
  cancel() {
    this.cancelled = true;
  }
  async run(plan, settings, callbacks) {
    var _a;
    const writer = new OutputWriter(this.app);
    const allWarnings = [];
    this.cancelled = false;
    if (!OutputWriter.supportsExternalPaths() && writer.isExternal(plan.outputRoot)) {
      return {
        success: false,
        outputRoot: plan.outputRoot,
        warnings: ["External paths are not supported on mobile. Use a vault-relative path."]
      };
    }
    const files = plan.inputFiles.map((p) => this.app.vault.getAbstractFileByPath(p)).filter(
      (f) => f !== null && "extension" in f && f.extension === "md"
    );
    if (files.length === 0) {
      return {
        success: false,
        outputRoot: plan.outputRoot,
        warnings: ["No valid files found for export."]
      };
    }
    if (files.length > 500) {
      allWarnings.push(`Large export: ${files.length} files. This may take a while.`);
    }
    let outputRoot = plan.outputRoot;
    if (!settings.overwriteExisting && !writer.isExternal(outputRoot)) {
      if (writer.folderExists(outputRoot)) {
        outputRoot = writer.timestampedFolder(outputRoot);
      }
    }
    const effectivePlan = { ...plan, outputRoot };
    const exportedPaths = new Set(plan.inputFiles);
    const assetsRoot = effectivePlan.outputFolderName ? `${outputRoot}/${effectivePlan.outputFolderName}` : outputRoot;
    const outputPathMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < plan.inputFiles.length; i++) {
      outputPathMap.set(plan.inputFiles[i], plan.outputFiles[i]);
    }
    const assembler = new DocumentAssembler(this.app, settings.includeSourcePathComments);
    const copiedAttachments = /* @__PURE__ */ new Set();
    const collector = settings.copyAttachments ? new AttachmentCollector(this.app, exportedPaths) : null;
    const isSingleFile = files.length === 1;
    let completedFiles = 0;
    for (let i = 0; i < files.length; i++) {
      if (this.cancelled)
        return this.cancelledResult(outputRoot, completedFiles, files.length);
      const file = files[i];
      const outputFilePath = (_a = outputPathMap.get(file.path)) != null ? _a : plan.outputFiles[i];
      callbacks == null ? void 0 : callbacks.onFileStart(i, files.length, file.basename);
      callbacks == null ? void 0 : callbacks.onPhase(isSingleFile ? SINGLE_FILE_PHASES[0] : `Assembling ${file.basename}`);
      const doc = await assembler.assemble([file]);
      if (this.cancelled)
        return this.cancelledResult(outputRoot, completedFiles, files.length);
      let attachments = plan.attachmentCopies;
      if (collector) {
        callbacks == null ? void 0 : callbacks.onPhase(isSingleFile ? SINGLE_FILE_PHASES[1] : `Collecting attachments for ${file.basename}`);
        const collectResult = await collector.collect([file]);
        attachments = collectResult.attachments;
        allWarnings.push(...collectResult.warnings);
      }
      doc.attachments = attachments;
      if (this.cancelled)
        return this.cancelledResult(outputRoot, completedFiles, files.length);
      callbacks == null ? void 0 : callbacks.onPhase(isSingleFile ? SINGLE_FILE_PHASES[2] : `Rewriting links in ${file.basename}`);
      const rewriter = new LinkRewriter(
        this.app,
        exportedPaths,
        attachments,
        effectivePlan.profile,
        outputPathMap,
        outputFilePath,
        assetsRoot
      );
      for (const section of doc.sections) {
        const result = rewriter.rewrite(section.markdown, section.sourcePath);
        section.markdown = result.markdown;
        allWarnings.push(...result.warnings);
      }
      if (this.cancelled)
        return this.cancelledResult(outputRoot, completedFiles, files.length);
      const outputDir = outputFilePath.substring(0, outputFilePath.lastIndexOf("/"));
      await writer.ensureFolder(outputDir);
      callbacks == null ? void 0 : callbacks.onPhase(isSingleFile ? SINGLE_FILE_PHASES[3] : `Rendering ${file.basename}`);
      let formatWarnings = [];
      try {
        switch (effectivePlan.profile) {
          case "markdown-bundle":
            formatWarnings = await renderMarkdownBundle(doc, effectivePlan, writer, outputFilePath);
            break;
          case "html-document":
            formatWarnings = await renderHtmlDocument(doc, effectivePlan, writer, this.app, outputFilePath);
            break;
          case "pdf":
            formatWarnings = await renderPdf(doc, effectivePlan, writer, this.app, outputFilePath);
            break;
          case "docx":
            formatWarnings = await renderDocx(doc, effectivePlan, writer, this.app, outputFilePath);
            break;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          outputRoot,
          warnings: [msg]
        };
      }
      allWarnings.push(...formatWarnings);
      if (this.cancelled)
        return this.cancelledResult(outputRoot, completedFiles, files.length);
      if (doc.attachments.length > 0) {
        callbacks == null ? void 0 : callbacks.onPhase(isSingleFile ? SINGLE_FILE_PHASES[4] : `Copying attachments for ${file.basename}`);
        await writer.ensureFolder(`${assetsRoot}/assets`);
        for (const att of doc.attachments) {
          if (copiedAttachments.has(att.outputRelativePath))
            continue;
          copiedAttachments.add(att.outputRelativePath);
          try {
            await writer.copyBinaryFile(
              att.sourcePath,
              `${assetsRoot}/${att.outputRelativePath}`
            );
          } catch (e) {
            allWarnings.push(`Failed to copy attachment: ${att.sourcePath}`);
          }
        }
      }
      completedFiles++;
      callbacks == null ? void 0 : callbacks.onFileComplete(i, files.length);
    }
    if (allWarnings.length > 0) {
      const report = allWarnings.map((w, i) => `${i + 1}. ${w}`).join("\n");
      await writer.writeText(
        `${assetsRoot}/export-report.md`,
        `# Export Warnings

${report}
`
      );
    }
    return {
      success: true,
      outputRoot: effectivePlan.outputRoot,
      warnings: allWarnings
    };
  }
  cancelledResult(outputRoot, completed, total) {
    const msg = total === 1 ? "Export was cancelled." : `Export was cancelled. ${completed} of ${total} file(s) exported.`;
    return {
      success: completed > 0,
      outputRoot,
      warnings: [msg]
    };
  }
};

// src/ui/ProgressNotice.ts
var import_obsidian7 = require("obsidian");
var PROGRESS_BAR_CLASS = "de-progress-bar";
var PROGRESS_FILL_CLASS = "de-progress-fill";
var PROGRESS_PCT_CLASS = "de-progress-pct";
var PROGRESS_TITLE_CLASS = "de-progress-title";
var PROGRESS_PHASE_CLASS = "de-progress-phase";
var PROGRESS_CANCEL_CLASS = "de-progress-cancel";
var ProgressNotice = class {
  constructor(title) {
    this.notice = null;
    this.title = "";
    this.count = 0;
    this.total = 0;
    this.phase = "";
    this.onCancel = null;
    this.titleEl = null;
    this.fillEl = null;
    this.pctEl = null;
    this.phaseEl = null;
    this.title = title;
  }
  start(total) {
    this.total = total;
    this.count = 0;
    this.phase = "";
    this.show();
  }
  setTitle(title) {
    this.title = title;
    if (this.titleEl)
      this.titleEl.textContent = title;
  }
  setProgress(current, total) {
    this.count = current;
    this.total = total;
    this.updateBar();
  }
  setPhase(phase) {
    this.phase = phase;
    if (this.phaseEl)
      this.phaseEl.textContent = phase;
  }
  increment() {
    this.count++;
    this.updateBar();
  }
  finish(finalMessage) {
    var _a;
    (_a = this.notice) == null ? void 0 : _a.hide();
    this.notice = null;
    this.titleEl = null;
    this.fillEl = null;
    this.pctEl = null;
    this.phaseEl = null;
    new import_obsidian7.Notice(finalMessage, 5e3);
    this.notifyWhenUnfocused(finalMessage);
  }
  notifyWhenUnfocused(message) {
    if (typeof activeDocument === "undefined" || activeDocument.hasFocus())
      return;
    try {
      if (this.notifyViaWebNotification(message))
        return;
      this.notifyViaElectron(message);
    } catch (e) {
    }
  }
  notifyViaWebNotification(message) {
    const notifier = typeof window !== "undefined" ? window.Notification : void 0;
    if (!notifier || notifier.permission !== "granted")
      return false;
    new notifier("Document Exporter", { body: message });
    return true;
  }
  notifyViaElectron(message) {
    var _a, _b, _c;
    const desktopWindow = window;
    const electron = (_b = desktopWindow.electron) != null ? _b : (_a = desktopWindow.require) == null ? void 0 : _a.call(desktopWindow, "electron");
    if (!electron || typeof electron !== "object")
      return;
    const remote = electron.remote;
    if (!remote || typeof remote !== "object")
      return;
    const NotificationCtor = remote.Notification;
    if (typeof NotificationCtor !== "function")
      return;
    const notification = new NotificationCtor({
      title: "Document Exporter",
      body: message
    });
    (_c = notification.show) == null ? void 0 : _c.call(notification);
  }
  show() {
    if (this.notice) {
      this.notice.hide();
    }
    this.notice = new import_obsidian7.Notice("", 0);
    const noticeEl = this.notice.noticeEl;
    noticeEl.empty();
    noticeEl.classList.add("de-progress-notice");
    const content = noticeEl.createDiv({ cls: "de-progress-content" });
    this.titleEl = content.createDiv({ cls: PROGRESS_TITLE_CLASS, text: this.title });
    const barContainer = content.createDiv({ cls: PROGRESS_BAR_CLASS });
    this.fillEl = barContainer.createDiv({ cls: PROGRESS_FILL_CLASS });
    this.pctEl = barContainer.createDiv({ cls: PROGRESS_PCT_CLASS, text: "0%" });
    const bottomRow = content.createDiv({ cls: PROGRESS_PHASE_CLASS });
    this.phaseEl = bottomRow.createSpan({ text: this.phase });
    const cancelBtn = bottomRow.createEl("button", {
      text: "Cancel",
      cls: PROGRESS_CANCEL_CLASS
    });
    cancelBtn.addEventListener("click", (e) => {
      var _a;
      e.stopPropagation();
      (_a = this.onCancel) == null ? void 0 : _a.call(this);
      cancelBtn.disabled = true;
      cancelBtn.textContent = "Cancelling...";
    });
    this.updateBar();
  }
  updateBar() {
    if (!this.fillEl || !this.pctEl)
      return;
    const pct = this.total > 0 ? Math.round(this.count / this.total * 100) : 0;
    this.fillEl.style.width = `${pct}%`;
    this.pctEl.textContent = `${pct}%`;
  }
};

// src/main.ts
function isNotebookNavigatorMenus(value) {
  if (!value || typeof value !== "object")
    return false;
  const menus = value;
  return (typeof menus.registerFileMenu === "function" || typeof menus.registerFileMenu === "undefined") && (typeof menus.registerFolderMenu === "function" || typeof menus.registerFolderMenu === "undefined");
}
var DocumentExporterPlugin = class extends import_obsidian8.Plugin {
  async onload() {
    this.settings = await loadSettings(this);
    this.addRibbonIcon("file-output", "Export documents", () => {
      this.openExportModal();
    });
    this.addCommand({
      id: "export-documents",
      name: "Export documents",
      callback: () => this.openExportModal()
    });
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof import_obsidian8.TFile && file.extension === "md") {
          menu.addItem((item) => {
            item.setTitle("Export this file").setIcon("file-output").onClick(() => this.openExportModal(file, void 0));
          });
        }
        if (file instanceof import_obsidian8.TFolder) {
          menu.addItem((item) => {
            item.setTitle("Export this folder").setIcon("file-output").onClick(() => this.openExportModal(void 0, file));
          });
        }
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu) => {
        menu.addItem((item) => {
          item.setTitle("Export current file").setIcon("file-output").onClick(() => this.openExportModal());
        });
      })
    );
    this.registerNotebookNavigatorMenus();
    this.addSettingTab(new DocumentExporterSettingTab(this.app, this));
  }
  onunload() {
  }
  registerNotebookNavigatorMenus() {
    const nnMenus = this.getNotebookNavigatorMenus();
    if (!nnMenus)
      return;
    if (typeof nnMenus.registerFileMenu === "function") {
      const dispose = nnMenus.registerFileMenu((context) => {
        var _a;
        if (((_a = context.selection) == null ? void 0 : _a.mode) !== "single")
          return;
        const file = context.file;
        if (!(file instanceof import_obsidian8.TFile) || file.extension !== "md")
          return;
        context.addItem((item) => {
          item.setTitle("Export this file").setIcon("file-output").onClick(() => this.openExportModal(file, void 0));
        });
      });
      this.register(() => dispose());
    }
    if (typeof nnMenus.registerFolderMenu === "function") {
      const dispose = nnMenus.registerFolderMenu((context) => {
        const folder = context.folder;
        if (!(folder instanceof import_obsidian8.TFolder))
          return;
        context.addItem((item) => {
          item.setTitle("Export this folder").setIcon("file-output").onClick(() => this.openExportModal(void 0, folder));
        });
      });
      this.register(() => dispose());
    }
  }
  getNotebookNavigatorMenus() {
    var _a;
    const app = this.app;
    const registry = (_a = app.plugins) == null ? void 0 : _a.plugins;
    if (!registry)
      return null;
    const notebookNavigator = registry["notebook-navigator"];
    if (!notebookNavigator || typeof notebookNavigator !== "object")
      return null;
    const api = notebookNavigator.api;
    if (!api || typeof api !== "object")
      return null;
    const menus = api.menus;
    if (!isNotebookNavigatorMenus(menus))
      return null;
    return menus;
  }
  async saveSettings() {
    await saveSettings(this, this.settings);
  }
  openExportModal(preselectedFile, preselectedFolder) {
    const modal = new ExportModal(this.app, this.settings, preselectedFile, preselectedFolder);
    void modal.openForResult().then((result) => {
      if (result)
        void this.executeExport(result);
    });
  }
  async executeExport(result) {
    const title = this.buildProgressTitle(result);
    const progress = new ProgressNotice(title);
    try {
      const resolver = new ExportSourceResolver(this.app);
      const files = resolver.resolve(result.source);
      const plan = new ExportPlanBuilder(
        this.app,
        result.source,
        result.profile,
        result.outputFolder,
        result.outputFilename,
        result.outputFolderName
      ).setInputFiles(files.map((f) => f.path)).build();
      const error = validatePlan(plan);
      if (error) {
        progress.finish(`Export failed: ${error}`);
        return;
      }
      const runner = new ExportRunner(this.app);
      const isSingleFile = files.length === 1;
      let singleFileStep = 0;
      const callbacks = {
        onFileStart: () => {
          if (isSingleFile) {
            singleFileStep = 0;
          }
        },
        onFileComplete: (i, total) => {
          if (isSingleFile)
            return;
          progress.setProgress(i + 1, total);
        },
        onPhase: (phase) => {
          progress.setPhase(phase);
          if (isSingleFile) {
            singleFileStep++;
            progress.setProgress(singleFileStep, SINGLE_FILE_PHASES.length);
          }
        }
      };
      progress.onCancel = () => {
        runner.cancel();
      };
      if (isSingleFile) {
        progress.start(SINGLE_FILE_PHASES.length);
      } else {
        progress.start(files.length);
      }
      const exportResult = await runner.run(plan, this.settings, callbacks);
      if (exportResult.success) {
        const msg = exportResult.warnings.length > 0 ? `Export complete with ${exportResult.warnings.length} warning(s): ${exportResult.outputRoot}` : `Export complete: ${exportResult.outputRoot}`;
        progress.finish(msg);
      } else {
        progress.finish(`Export failed: ${exportResult.warnings.join(", ")}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      progress.finish(`Export error: ${message}`);
    }
  }
  buildProgressTitle(result) {
    var _a, _b, _c;
    switch (result.source.type) {
      case "current-file": {
        const name = (_b = (_a = result.source.path.split("/").pop()) == null ? void 0 : _a.replace(/\.md$/, "")) != null ? _b : "file";
        return `Exporting: ${name}`;
      }
      case "folder": {
        const name = (_c = result.source.path.split("/").pop()) != null ? _c : "folder";
        return `Exporting folder: ${name}`;
      }
      case "files":
        return `Exporting ${result.source.paths.length} files`;
    }
  }
};

/* nosourcemap */