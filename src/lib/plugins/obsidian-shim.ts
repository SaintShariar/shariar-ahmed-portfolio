/**
 * Obsidian Plugin API compatibility shim.
 * Implements a subset of the obsidian module so community plugins
 * targeting common APIs can load in Chameleon.
 *
 * Full compatibility requires ongoing expansion — plugins using
 * deep Obsidian internals may not work yet.
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  minAppVersion?: string;
  description?: string;
  author?: string;
  isDesktopOnly?: boolean;
}

export class Notice {
  constructor(public message: string, public timeout = 4000) {
    console.info(`[Notice] ${message}`);
    window.dispatchEvent(
      new CustomEvent("chameleon-notice", { detail: { message, timeout } }),
    );
  }
}

export class Plugin {
  app: ChameleonApp;
  manifest: PluginManifest;

  constructor(app: ChameleonApp, manifest: PluginManifest) {
    this.app = app;
    this.manifest = manifest;
  }

  async onload() {}
  onunload() {}

  addCommand(_cmd: unknown) {}
  addRibbonIcon(_icon: string, _title: string, _callback: () => void) {}
  registerDomEvent(_el: HTMLElement, _type: string, _callback: EventListener) {}
  registerInterval(id: number) {
    return id;
  }
}

export class ChameleonApp {
  vault = {
    getMarkdownFiles: () => [],
    read: async (_path: string) => "",
    adapter: {
      read: async (_path: string) => "",
      write: async (_path: string, _data: string) => {},
      exists: async (_path: string) => false,
      list: async (_path: string) => ({ files: [], folders: [] }),
    },
  };

  workspace = {
    onLayoutReady: (cb: () => void) => cb(),
    getActiveViewOfType: () => null,
    getLeaf: () => ({ setViewState: () => {} }),
  };

  plugins = {
    plugins: {} as Record<string, Plugin>,
    getPlugin: (id: string) => this.plugins.plugins[id],
  };
}

export async function loadPluginModule(
  code: string,
  app: ChameleonApp,
): Promise<Plugin | null> {
  const obsidian = {
    Plugin,
    Notice,
    App: ChameleonApp,
  };

  const factory = new Function(
    "module",
    "exports",
    "require",
    "obsidian",
    `
    const req = (id) => {
      if (id === 'obsidian') return obsidian;
      throw new Error('Module not found: ' + id);
    };
    ${code}
    return module.exports;
  `,
  );

  const module = { exports: {} as Record<string, unknown> };
  const exports = module.exports;
  const result = factory(module, exports, (id: string) => {
    if (id === "obsidian") return obsidian;
    throw new Error(`Module not found: ${id}`);
  }, obsidian);

  const PluginClass =
    (result?.default as typeof Plugin) ??
    (module.exports.default as typeof Plugin);

  if (typeof PluginClass !== "function") {
    return null;
  }

  const manifest: PluginManifest = {
    id: "unknown",
    name: "Unknown Plugin",
    version: "0.0.0",
  };

  return new PluginClass(app, manifest);
}

export const BUILTIN_PLUGINS = [
  {
    id: "calendar",
    name: "Calendar",
    repo: "liamcain/obsidian-calendar-plugin",
    description: "Calendar view of daily notes",
  },
  {
    id: "dataview",
    name: "Dataview",
    repo: "blacksmithgu/obsidian-dataview",
    description: "Query engine for vault data",
  },
  {
    id: "kanban",
    name: "Kanban",
    repo: "mgmeyers/obsidian-kanban",
    description: "Markdown-backed kanban boards",
  },
];
