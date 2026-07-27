export type ViewMode = "editor" | "graph" | "calendar" | "plugins" | "sync";

export type SyncStatus = "synced" | "pending" | "conflict";

export interface VaultFile {
  path: string;
  name: string;
  isDir: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface Comment {
  id: string;
  notePath: string;
  line: number;
  text: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  resolved: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  notePath?: string;
  color: string;
  updatedAt: string;
  deviceId?: string;
}

export interface CalendarData {
  events: CalendarEvent[];
  version: number;
  updatedAt: string;
}

export interface PluginInfo {
  id: string;
  name: string;
  repo: string;
  enabled: boolean;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SyncthingStatus {
  installed: boolean;
  running: boolean;
  paths: string[];
}

export interface VaultChangeEvent {
  path: string;
  kind: string;
}

export interface SyncConflict {
  notePath: string;
  localContent: string;
  remoteContent: string;
}
