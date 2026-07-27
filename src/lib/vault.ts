import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { GraphData, VaultFile } from "@/types";

export async function pickVault(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Open Chameleon Vault",
  });
  if (selected === null || Array.isArray(selected)) return null;
  return selected;
}

export async function listVaultFiles(vaultPath: string): Promise<VaultFile[]> {
  return invoke<VaultFile[]>("list_vault_files", { vaultPath });
}

export async function readNote(
  vaultPath: string,
  notePath: string,
): Promise<string> {
  return invoke<string>("read_note", { vaultPath, notePath });
}

export async function writeNote(
  vaultPath: string,
  notePath: string,
  content: string,
): Promise<void> {
  await invoke("write_note", { vaultPath, notePath, content });
}

export async function createNote(
  vaultPath: string,
  notePath: string,
): Promise<void> {
  await invoke("create_note", { vaultPath, notePath });
}

export async function buildGraph(vaultPath: string): Promise<GraphData> {
  return invoke<GraphData>("build_graph", { vaultPath });
}

export async function updateGraphForNote(
  vaultPath: string,
  notePath: string,
  content: string,
  graph: GraphData,
): Promise<GraphData> {
  return invoke<GraphData>("update_graph_for_note", {
    vaultPath,
    notePath,
    content,
    graph,
  });
}

export async function installPluginFromGitHub(
  vaultPath: string,
  repo: string,
  branch?: string,
): Promise<string> {
  return invoke<string>("install_plugin_from_github", {
    vaultPath,
    repo,
    branch,
  });
}

export function extractWikiLinks(content: string): string[] {
  const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

export function extractTags(content: string): string[] {
  const re = /(?<!\w)#([a-zA-Z0-9_/-]+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    tags.push(match[1]);
  }
  return tags;
}
