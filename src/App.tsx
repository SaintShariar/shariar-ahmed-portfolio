import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { listen } from "@tauri-apps/api/event";
import {
  Calendar,
  FolderOpen,
  Globe,
  Menu,
  Puzzle,
  Save,
  Wifi,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { WelcomeAffiliations } from "@/components/WelcomeAffiliations";
import {
  buildGraph,
  createNote,
  installPluginFromGitHub,
  listVaultFiles,
  pickVault,
  readNote,
  updateGraphForNote,
  writeNote,
} from "@/lib/vault";
import {
  detectSyncthing,
  getNoteMtime,
  loadComments,
  loadPlugins,
  saveComments,
  savePlugins,
  startVaultWatch,
  stopVaultWatch,
} from "@/lib/vaultData";
import { dailyNotePath } from "@/lib/calendarSync";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { Sidebar } from "@/components/Sidebar";
import { Editor } from "@/components/Editor";
import { CommentsPanel, FloatingAI } from "@/components/CommentsPanel";
import { Toast, SyncConflictDialog } from "@/components/Toast";
import type { Comment, PluginInfo, VaultChangeEvent } from "@/types";

const GraphGlobe = lazy(() =>
  import("@/components/GraphGlobe").then((m) => ({ default: m.GraphGlobe })),
);
const CalendarView = lazy(() =>
  import("@/components/CalendarView").then((m) => ({
    default: m.CalendarView,
  })),
);
const PluginManager = lazy(() =>
  import("@/components/PluginManager").then((m) => ({
    default: m.PluginManager,
  })),
);
const SyncPanel = lazy(() =>
  import("@/components/SyncPanel").then((m) => ({ default: m.SyncPanel })),
);

export function App() {
  const vaultPath = useAppStore((s) => s.vaultPath);
  const files = useAppStore((s) => s.files);
  const activeNote = useAppStore((s) => s.activeNote);
  const noteContent = useAppStore((s) => s.noteContent);
  const savedContent = useAppStore((s) => s.savedContent);
  const view = useAppStore((s) => s.view);
  const graph = useAppStore((s) => s.graph);
  const graphStale = useAppStore((s) => s.graphStale);
  const comments = useAppStore((s) => s.comments);
  const events = useAppStore((s) => s.events);
  const calendarSyncStatus = useAppStore((s) => s.calendarSyncStatus);
  const plugins = useAppStore((s) => s.plugins);
  const aiOpen = useAppStore((s) => s.aiOpen);
  const aiMessages = useAppStore((s) => s.aiMessages);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const syncthing = useAppStore((s) => s.syncthing);
  const toast = useAppStore((s) => s.toast);
  const syncConflict = useAppStore((s) => s.syncConflict);
  const isDirty = useAppStore((s) => s.isDirty);
  const isSaving = useAppStore((s) => s.isSaving);

  const setVaultPath = useAppStore((s) => s.setVaultPath);
  const setFiles = useAppStore((s) => s.setFiles);
  const setActiveNote = useAppStore((s) => s.setActiveNote);
  const setNoteContent = useAppStore((s) => s.setNoteContent);
  const setSavedContent = useAppStore((s) => s.setSavedContent);
  const setView = useAppStore((s) => s.setView);
  const setGraph = useAppStore((s) => s.setGraph);
  const setGraphStale = useAppStore((s) => s.setGraphStale);
  const setComments = useAppStore((s) => s.setComments);
  const addComment = useAppStore((s) => s.addComment);
  const resolveComment = useAppStore((s) => s.resolveComment);
  const setEvents = useAppStore((s) => s.setEvents);
  const setCalendarSyncStatus = useAppStore((s) => s.setCalendarSyncStatus);
  const setPlugins = useAppStore((s) => s.setPlugins);
  const togglePlugin = useAppStore((s) => s.togglePlugin);
  const setAiOpen = useAppStore((s) => s.setAiOpen);
  const addAiMessage = useAppStore((s) => s.addAiMessage);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setSyncthing = useAppStore((s) => s.setSyncthing);
  const showToast = useAppStore((s) => s.showToast);
  const setSyncConflict = useAppStore((s) => s.setSyncConflict);
  const setIsSaving = useAppStore((s) => s.setIsSaving);

  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [externalRevision, setExternalRevision] = useState(0);
  const noteMtimeRef = useRef<number | null>(null);
  const savingRef = useRef(false);

  const calendar = useCalendarSync(
    vaultPath,
    events,
    setEvents,
    setCalendarSyncStatus,
    showToast,
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => showToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast, showToast]);

  const refreshFileTree = useCallback(
    async (path: string) => {
      const fileList = await listVaultFiles(path);
      setFiles(fileList);
    },
    [setFiles],
  );

  const loadVaultData = useCallback(
    async (path: string) => {
      const [fileList, commentList, pluginList] = await Promise.all([
        listVaultFiles(path),
        loadComments(path),
        loadPlugins(path),
      ]);
      setFiles(fileList);
      setComments(commentList);
      setPlugins(pluginList);
      await calendar.loadFromVault();
      setGraphStale(true);
    },
    [setFiles, setComments, setPlugins, calendar, setGraphStale],
  );

  const saveNote = useCallback(
    async (content: string) => {
      if (!vaultPath || !activeNote || savingRef.current) return;
      savingRef.current = true;
      setIsSaving(true);
      try {
        await writeNote(vaultPath, activeNote, content);
        setSavedContent(content);
        noteMtimeRef.current = await getNoteMtime(vaultPath, activeNote);
        await refreshFileTree(vaultPath);
        if (!useAppStore.getState().graphStale && activeNote.endsWith(".md")) {
          const updated = await updateGraphForNote(
            vaultPath,
            activeNote,
            content,
            useAppStore.getState().graph,
          );
          setGraph(updated);
        } else {
          setGraphStale(true);
        }
      } finally {
        savingRef.current = false;
        setIsSaving(false);
      }
    },
    [
      vaultPath,
      activeNote,
      setSavedContent,
      refreshFileTree,
      setGraph,
      setGraphStale,
      setIsSaving,
    ],
  );

  const debouncedSave = useDebouncedCallback((content: string) => {
    void saveNote(content);
  }, 400);

  useEffect(() => {
    if (!isDirty || !vaultPath || !activeNote) return;
    debouncedSave(noteContent);
  }, [noteContent, isDirty, vaultPath, activeNote, debouncedSave]);

  useEffect(() => {
    if (!vaultPath) return;
    void detectSyncthing().then(setSyncthing);
    void startVaultWatch(vaultPath);

    const unlisten = listen<VaultChangeEvent>("vault-changed", async (ev) => {
      const rel = ev.payload.path.replace(/\\/g, "/");

      if (rel === ".chameleon/calendar.json" || rel.endsWith("/calendar.json")) {
        await calendar.handleExternalChange();
        return;
      }

      if (
        rel === ".chameleon/comments.json" ||
        rel === ".chameleon/plugins.json"
      ) {
        const [commentList, pluginList] = await Promise.all([
          loadComments(vaultPath),
          loadPlugins(vaultPath),
        ]);
        setComments(commentList);
        setPlugins(pluginList);
        showToast("Vault data synced");
        return;
      }

      if (rel.endsWith(".md")) {
        await refreshFileTree(vaultPath);
        setGraphStale(true);

        if (activeNote && rel === activeNote && !savingRef.current) {
          const remote = await readNote(vaultPath, activeNote);
          const mtime = await getNoteMtime(vaultPath, activeNote);
          if (
            remote !== noteContent &&
            remote !== savedContent &&
            mtime !== noteMtimeRef.current
          ) {
            setSyncConflict({ notePath: activeNote, remoteContent: remote });
          }
        }
      }
    });

    return () => {
      void unlisten.then((fn) => fn());
      void stopVaultWatch();
    };
  }, [
    vaultPath,
    activeNote,
    noteContent,
    savedContent,
    calendar,
    refreshFileTree,
    setComments,
    setPlugins,
    setGraphStale,
    setSyncConflict,
    showToast,
  ]);

  async function handleOpenVault() {
    const path = await pickVault();
    if (!path) return;
    setVaultPath(path);
    await loadVaultData(path);
  }

  async function handleSelectNote(path: string) {
    if (!vaultPath) return;
    const content = await readNote(vaultPath, path);
    setActiveNote(path);
    setNoteContent(content);
    setSavedContent(content);
    noteMtimeRef.current = await getNoteMtime(vaultPath, path);
    setExternalRevision((r) => r + 1);
    setView("editor");
  }

  async function handleOpenDailyNote(date: Date) {
    if (!vaultPath) return;
    const path = dailyNotePath(date);
    const exists = files.some((f) => f.path === path);
    if (!exists) {
      await createNote(vaultPath, path);
      await refreshFileTree(vaultPath);
    }
    await handleSelectNote(path);
  }

  async function handleCreate(name: string) {
    if (!vaultPath) return;
    await createNote(vaultPath, name);
    await refreshFileTree(vaultPath);
    setGraphStale(true);
    await handleSelectNote(name);
  }

  async function handleOpenGraph() {
    setView("graph");
    if (vaultPath && (graphStale || graph.nodes.length === 0)) {
      setGraph(await buildGraph(vaultPath));
    }
  }

  async function handleInstallPlugin(repo: string) {
    if (!vaultPath) {
      alert("Open a vault first");
      return;
    }
    const msg = await installPluginFromGitHub(vaultPath, repo);
    const plugin: PluginInfo = {
      id: repo.replace("/", "-"),
      name: repo.split("/").pop() ?? repo,
      repo,
      enabled: true,
      description: msg,
    };
    const next = [...plugins, plugin];
    setPlugins(next);
    await savePlugins(vaultPath, next);
  }

  async function handleAddComment(text: string, line: number) {
    if (!vaultPath || !activeNote) return;
    const comment: Comment = {
      id: crypto.randomUUID(),
      notePath: activeNote,
      line,
      text,
      author: "You",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolved: false,
    };
    const next = [...comments, comment];
    addComment(comment);
    await saveComments(vaultPath, next);
  }

  async function handleResolveComment(id: string) {
    if (!vaultPath) return;
    resolveComment(id);
    const next = useAppStore.getState().comments;
    await saveComments(vaultPath, next);
  }

  function handleAiSend(text: string) {
    addAiMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    });
    addAiMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: generateAiResponse(text, noteContent, activeNote),
      timestamp: new Date().toISOString(),
    });
  }

  async function handleCopyVaultPath() {
    if (!vaultPath) return;
    await navigator.clipboard.writeText(vaultPath);
    showToast("Vault path copied");
  }

  if (!vaultPath) {
    return (
      <div className="welcome">
        <div className="welcome__stack">
          <div className="welcome__card">
            <div className="welcome__logo">SA</div>
            <h1>Shariar Ahmed</h1>
            <p>
              Portfolio website — volunteer with Lions International, pursuing a BS in IT at WGU,
              with education ties to UB and Buffalo State.
            </p>
            <button type="button" className="btn-primary" onClick={handleOpenVault}>
              <FolderOpen size={18} />
              Open Vault
            </button>
          </div>
          <WelcomeAffiliations />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="toolbar">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={18} />
        </button>
        <span className="toolbar__title">
          {activeNote?.replace(/\.md$/, "") ?? "Shariar Ahmed Portfolio"}
          {isDirty && " â€¢"}
          {isSaving && " Savingâ€¦"}
        </span>
        <nav className="toolbar__nav">
          <button
            type="button"
            className={view === "editor" ? "nav-btn nav-btn--active" : "nav-btn"}
            onClick={() => setView("editor")}
          >
            Editor
          </button>
          <button
            type="button"
            className={view === "graph" ? "nav-btn nav-btn--active" : "nav-btn"}
            onClick={() => void handleOpenGraph()}
          >
            <Globe size={14} /> Graph
          </button>
          <button
            type="button"
            className={
              view === "calendar" ? "nav-btn nav-btn--active" : "nav-btn"
            }
            onClick={() => setView("calendar")}
          >
            <Calendar size={14} /> Calendar
          </button>
          <button
            type="button"
            className={view === "sync" ? "nav-btn nav-btn--active" : "nav-btn"}
            onClick={() => setView("sync")}
          >
            <Wifi size={14} /> Sync
          </button>
          <button
            type="button"
            className={
              view === "plugins" ? "nav-btn nav-btn--active" : "nav-btn"
            }
            onClick={() => setView("plugins")}
          >
            <Puzzle size={14} /> Plugins
          </button>
        </nav>
        <button
          type="button"
          className="btn-sm"
          disabled={!activeNote || isSaving}
          onClick={() => void saveNote(noteContent)}
        >
          <Save size={14} />
          Save now
        </button>
      </header>

      <div className="workspace">
        {sidebarOpen && (
          <Sidebar
            files={files}
            activeNote={activeNote}
            onSelect={(p) => void handleSelectNote(p)}
            onCreate={(n) => void handleCreate(n)}
          />
        )}

        <main className="main-pane">
          <Suspense fallback={<div className="view-loading">Loadingâ€¦</div>}>
            {view === "editor" && (
              <div className="editor-layout">
                <Editor
                  notePath={activeNote}
                  content={noteContent}
                  externalRevision={externalRevision}
                  onChange={setNoteContent}
                  onLineClick={setSelectedLine}
                />
                <CommentsPanel
                  comments={comments}
                  activeNote={activeNote}
                  selectedLine={selectedLine}
                  onAdd={(t, l) => void handleAddComment(t, l)}
                  onResolve={(id) => void handleResolveComment(id)}
                />
              </div>
            )}
            {view === "graph" && (
              <GraphGlobe
                data={graph}
                onNodeClick={(id) => {
                  if (!id.startsWith("tag:")) {
                    void handleSelectNote(`${id}.md`);
                  }
                }}
              />
            )}
            {view === "calendar" && (
              <CalendarView
                events={events}
                syncStatus={calendarSyncStatus}
                onAddEvent={calendar.addEvent}
                onOpenNote={(p) => void handleSelectNote(p)}
                onOpenDailyNote={(d) => void handleOpenDailyNote(d)}
              />
            )}
            {view === "sync" && (
              <SyncPanel
                vaultPath={vaultPath}
                syncthing={syncthing}
                onCopyPath={() => void handleCopyVaultPath()}
                onRefresh={() => void loadVaultData(vaultPath)}
              />
            )}
            {view === "plugins" && (
              <PluginManager
                plugins={plugins}
                onInstall={(r) => handleInstallPlugin(r)}
                onToggle={togglePlugin}
              />
            )}
          </Suspense>
        </main>
      </div>

      <FloatingAI
        open={aiOpen}
        messages={aiMessages}
        onToggle={() => setAiOpen(!aiOpen)}
        onSend={handleAiSend}
      />

      <Toast message={toast} />

      {syncConflict && (
        <SyncConflictDialog
          notePath={syncConflict.notePath}
          onKeepLocal={() => {
            setSyncConflict(null);
            void saveNote(noteContent);
          }}
          onReloadRemote={async () => {
            if (!vaultPath) return;
            setNoteContent(syncConflict.remoteContent);
            setSavedContent(syncConflict.remoteContent);
            setExternalRevision((r) => r + 1);
            noteMtimeRef.current = await getNoteMtime(
              vaultPath,
              syncConflict.notePath,
            );
            setSyncConflict(null);
          }}
        />
      )}
    </div>
  );
}

function generateAiResponse(
  prompt: string,
  noteContent: string,
  activeNote: string | null,
): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("summarize") && noteContent) {
    const lines = noteContent.split("\n").filter(Boolean);
    return `Summary of "${activeNote?.replace(/\.md$/, "")}": ${lines.slice(0, 3).join(" ").slice(0, 200)}â€¦`;
  }
  if (lower.includes("link") || lower.includes("connect")) {
    const links = [...noteContent.matchAll(/\[\[([^\]|]+)/g)].map((m) => m[1]);
    return links.length
      ? `This note links to: ${links.join(", ")}`
      : "No wikilinks found in the current note.";
  }
  return `I can help summarize notes, find links, and plan your vault. Connect an API key for full LLM power. You asked: "${prompt}"`;
}

