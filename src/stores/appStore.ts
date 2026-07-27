import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
  CalendarEvent,
  ChatMessage,
  Comment,
  GraphData,
  PluginInfo,
  SyncStatus,
  SyncthingStatus,
  VaultFile,
  ViewMode,
} from "@/types";

interface AppState {
  vaultPath: string | null;
  files: VaultFile[];
  activeNote: string | null;
  noteContent: string;
  savedContent: string;
  view: ViewMode;
  graph: GraphData;
  graphStale: boolean;
  comments: Comment[];
  events: CalendarEvent[];
  calendarSyncStatus: SyncStatus;
  plugins: PluginInfo[];
  aiOpen: boolean;
  aiMessages: ChatMessage[];
  sidebarOpen: boolean;
  syncthing: SyncthingStatus | null;
  toast: string | null;
  syncConflict: { notePath: string; remoteContent: string } | null;
  isDirty: boolean;
  isSaving: boolean;

  setVaultPath: (path: string | null) => void;
  setFiles: (files: VaultFile[]) => void;
  setActiveNote: (path: string | null) => void;
  setNoteContent: (content: string) => void;
  setSavedContent: (content: string) => void;
  setView: (view: ViewMode) => void;
  setGraph: (graph: GraphData) => void;
  setGraphStale: (stale: boolean) => void;
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  resolveComment: (id: string) => void;
  setEvents: (events: CalendarEvent[]) => void;
  setCalendarSyncStatus: (status: SyncStatus) => void;
  setPlugins: (plugins: PluginInfo[]) => void;
  togglePlugin: (id: string) => void;
  setAiOpen: (open: boolean) => void;
  addAiMessage: (message: ChatMessage) => void;
  setSidebarOpen: (open: boolean) => void;
  setSyncthing: (status: SyncthingStatus | null) => void;
  showToast: (msg: string | null) => void;
  setSyncConflict: (
    conflict: { notePath: string; remoteContent: string } | null,
  ) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  vaultPath: null,
  files: [],
  activeNote: null,
  noteContent: "",
  savedContent: "",
  view: "editor",
  graph: { nodes: [], links: [] },
  graphStale: true,
  comments: [],
  events: [],
  calendarSyncStatus: "synced",
  plugins: [],
  aiOpen: false,
  aiMessages: [],
  sidebarOpen: true,
  syncthing: null,
  toast: null,
  syncConflict: null,
  isDirty: false,
  isSaving: false,

  setVaultPath: (vaultPath) => set({ vaultPath }),
  setFiles: (files) => set({ files }),
  setActiveNote: (activeNote) => set({ activeNote }),
  setNoteContent: (noteContent) => set({ noteContent, isDirty: true }),
  setSavedContent: (savedContent) => set({ savedContent, isDirty: false }),
  setView: (view) => set({ view }),
  setGraph: (graph) => set({ graph, graphStale: false }),
  setGraphStale: (graphStale) => set({ graphStale }),
  setComments: (comments) => set({ comments }),
  addComment: (comment) =>
    set((s) => ({ comments: [...s.comments, comment] })),
  resolveComment: (id) =>
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === id ? { ...c, resolved: true } : c,
      ),
    })),
  setEvents: (events) => set({ events }),
  setCalendarSyncStatus: (calendarSyncStatus) => set({ calendarSyncStatus }),
  setPlugins: (plugins) => set({ plugins }),
  togglePlugin: (id) =>
    set((s) => ({
      plugins: s.plugins.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p,
      ),
    })),
  setAiOpen: (aiOpen) => set({ aiOpen }),
  addAiMessage: (message) =>
    set((s) => ({ aiMessages: [...s.aiMessages, message] })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSyncthing: (syncthing) => set({ syncthing }),
  showToast: (toast) => set({ toast }),
  setSyncConflict: (syncConflict) => set({ syncConflict }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
}));

export function useVaultState() {
  return useAppStore(
    useShallow((s) => ({
      vaultPath: s.vaultPath,
      files: s.files,
      activeNote: s.activeNote,
      sidebarOpen: s.sidebarOpen,
    })),
  );
}

export function useEditorState() {
  return useAppStore(
    useShallow((s) => ({
      noteContent: s.noteContent,
      savedContent: s.savedContent,
      isDirty: s.isDirty,
      isSaving: s.isSaving,
      activeNote: s.activeNote,
    })),
  );
}

export function useCalendarState() {
  return useAppStore(
    useShallow((s) => ({
      events: s.events,
      calendarSyncStatus: s.calendarSyncStatus,
    })),
  );
}
