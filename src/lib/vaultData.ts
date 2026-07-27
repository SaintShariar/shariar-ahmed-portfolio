import { invoke } from "@tauri-apps/api/core";
import type { CalendarData, Comment, PluginInfo } from "@/types";

export async function readVaultJson<T>(
  vaultPath: string,
  fileName: string,
  fallback: T,
): Promise<T> {
  try {
    const raw = await invoke<string>("read_chameleon_data", {
      vaultPath,
      fileName,
    });
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeVaultJson(
  vaultPath: string,
  fileName: string,
  data: unknown,
): Promise<void> {
  await invoke("write_chameleon_data", {
    vaultPath,
    fileName,
    content: JSON.stringify(data, null, 2),
  });
}

export async function loadComments(vaultPath: string): Promise<Comment[]> {
  const data = await readVaultJson<{ comments?: Comment[] }>(
    vaultPath,
    "comments.json",
    { comments: [] },
  );
  return data.comments ?? [];
}

export async function saveComments(
  vaultPath: string,
  comments: Comment[],
): Promise<void> {
  await writeVaultJson(vaultPath, "comments.json", {
    comments,
    updatedAt: new Date().toISOString(),
  });
}

export async function loadPlugins(vaultPath: string): Promise<PluginInfo[]> {
  const data = await readVaultJson<{ plugins?: PluginInfo[] }>(
    vaultPath,
    "plugins.json",
    { plugins: [] },
  );
  return data.plugins ?? [];
}

export async function savePlugins(
  vaultPath: string,
  plugins: PluginInfo[],
): Promise<void> {
  await writeVaultJson(vaultPath, "plugins.json", {
    plugins,
    updatedAt: new Date().toISOString(),
  });
}

export async function loadCalendar(vaultPath: string): Promise<CalendarData> {
  return readVaultJson<CalendarData>(vaultPath, "calendar.json", {
    events: [],
    version: 1,
    updatedAt: new Date(0).toISOString(),
  });
}

export async function saveCalendar(
  vaultPath: string,
  data: CalendarData,
): Promise<void> {
  await writeVaultJson(vaultPath, "calendar.json", data);
}

export async function getNoteMtime(
  vaultPath: string,
  notePath: string,
): Promise<number | null> {
  try {
    return await invoke<number>("get_note_mtime", { vaultPath, notePath });
  } catch {
    return null;
  }
}

export async function detectSyncthing() {
  return invoke<{ installed: boolean; running: boolean; paths: string[] }>(
    "detect_syncthing",
  );
}

export async function startVaultWatch(vaultPath: string): Promise<void> {
  await invoke("start_vault_watch", { vaultPath });
}

export async function stopVaultWatch(): Promise<void> {
  await invoke("stop_vault_watch");
}
