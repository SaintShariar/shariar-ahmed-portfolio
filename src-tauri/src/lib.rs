use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebouncedEvent, Debouncer};
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;

static WATCHER: Lazy<Mutex<Option<Debouncer<notify::RecommendedWatcher>>>> =
    Lazy::new(|| Mutex::new(None));

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultFile {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphNode {
    pub id: String,
    pub label: String,
    pub group: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphLink {
    pub source: String,
    pub target: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphData {
    pub nodes: Vec<GraphNode>,
    pub links: Vec<GraphLink>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultChangeEvent {
    pub path: String,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncthingStatus {
    pub installed: bool,
    pub running: bool,
    pub paths: Vec<String>,
}

fn is_ignored(path: &Path) -> bool {
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
    name == "node_modules" || name == ".git"
}

fn chameleon_dir(vault_path: &str) -> PathBuf {
    PathBuf::from(vault_path).join(".chameleon")
}

fn chameleon_file(vault_path: &str, file_name: &str) -> PathBuf {
    chameleon_dir(vault_path).join(file_name)
}

#[tauri::command]
fn read_chameleon_data(vault_path: String, file_name: String) -> Result<String, String> {
    let path = chameleon_file(&vault_path, &file_name);
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_chameleon_data(
    vault_path: String,
    file_name: String,
    content: String,
) -> Result<(), String> {
    let dir = chameleon_dir(&vault_path);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(&file_name);
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_note_mtime(vault_path: String, note_path: String) -> Result<u64, String> {
    let full = PathBuf::from(&vault_path).join(&note_path);
    let meta = fs::metadata(&full).map_err(|e| e.to_string())?;
    Ok(meta
        .modified()
        .map_err(|e| e.to_string())?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis() as u64)
}

#[tauri::command]
fn list_vault_files(vault_path: String) -> Result<Vec<VaultFile>, String> {
    let root = PathBuf::from(&vault_path);
    if !root.exists() {
        return Err("Vault path does not exist".into());
    }

    let mut files = Vec::new();
    for entry in WalkDir::new(&root)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| !is_ignored(e.path()))
    {
        let rel = entry
            .path()
            .strip_prefix(&root)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .replace('\\', "/");

        if rel.is_empty() {
            continue;
        }

        // Skip .chameleon internals in sidebar listing
        if rel.starts_with(".chameleon/") || rel == ".chameleon" {
            continue;
        }

        files.push(VaultFile {
            path: rel.clone(),
            name: entry.file_name().to_string_lossy().to_string(),
            is_dir: entry.file_type().is_dir(),
        });
    }

    files.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(files)
}

#[tauri::command]
fn read_note(vault_path: String, note_path: String) -> Result<String, String> {
    let full = PathBuf::from(&vault_path).join(&note_path);
    fs::read_to_string(&full).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_note(vault_path: String, note_path: String, content: String) -> Result<(), String> {
    let full = PathBuf::from(&vault_path).join(&note_path);
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&full, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_note(vault_path: String, note_path: String) -> Result<(), String> {
    let full = PathBuf::from(&vault_path).join(&note_path);
    if full.exists() {
        return Err("Note already exists".into());
    }
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let title = full
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled");
    fs::write(&full, format!("# {}\n\n", title)).map_err(|e| e.to_string())
}

fn index_note_links(
    content: &str,
    id: &str,
    wiki_re: &Regex,
    tag_re: &Regex,
    nodes: &mut HashMap<String, GraphNode>,
    links: &mut Vec<GraphLink>,
    link_set: &mut HashSet<(String, String)>,
) {
    for cap in wiki_re.captures_iter(content) {
        let target = cap.get(1).unwrap().as_str().trim().to_string();
        if !target.is_empty() {
            nodes.entry(target.clone()).or_insert_with(|| GraphNode {
                id: target.clone(),
                label: target.clone(),
                group: "ghost".into(),
            });
            let pair = (id.to_string(), target);
            if link_set.insert(pair.clone()) {
                links.push(GraphLink {
                    source: pair.0,
                    target: pair.1,
                });
            }
        }
    }

    for cap in tag_re.captures_iter(content) {
        let tag = cap.get(1).unwrap().as_str().to_string();
        let tag_id = format!("tag:{}", tag);
        nodes.entry(tag_id.clone()).or_insert_with(|| GraphNode {
            id: tag_id.clone(),
            label: format!("#{}", tag),
            group: "tag".into(),
        });
        let pair = (id.to_string(), tag_id);
        if link_set.insert(pair.clone()) {
            links.push(GraphLink {
                source: pair.0,
                target: pair.1,
            });
        }
    }
}

#[tauri::command]
fn build_graph(vault_path: String) -> Result<GraphData, String> {
    let root = PathBuf::from(&vault_path);
    let wiki_re = Regex::new(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]").unwrap();
    let tag_re = Regex::new(r"(?<!\w)#([a-zA-Z0-9_/-]+)").unwrap();

    let mut nodes: HashMap<String, GraphNode> = HashMap::new();
    let mut links: Vec<GraphLink> = Vec::new();
    let mut link_set: HashSet<(String, String)> = HashSet::new();

    for entry in WalkDir::new(&root)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter(|e| {
            e.path()
                .extension()
                .and_then(|x| x.to_str())
                .map(|x| x.eq_ignore_ascii_case("md"))
                .unwrap_or(false)
        })
        .filter(|e| !is_ignored(e.path()))
    {
        let rel = entry
            .path()
            .strip_prefix(&root)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .replace('\\', "/");

        let id = rel.trim_end_matches(".md").to_string();
        let label = entry
            .path()
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(&id)
            .to_string();

        nodes.insert(
            id.clone(),
            GraphNode {
                id: id.clone(),
                label,
                group: "note".into(),
            },
        );

        let content = fs::read_to_string(entry.path()).unwrap_or_default();
        index_note_links(&content, &id, &wiki_re, &tag_re, &mut nodes, &mut links, &mut link_set);
    }

    Ok(GraphData {
        nodes: nodes.into_values().collect(),
        links,
    })
}

#[tauri::command]
fn update_graph_for_note(
    _vault_path: String,
    note_path: String,
    content: String,
    mut graph: GraphData,
) -> Result<GraphData, String> {
    let id = note_path.trim_end_matches(".md").to_string();
    let wiki_re = Regex::new(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]").unwrap();
    let tag_re = Regex::new(r"(?<!\w)#([a-zA-Z0-9_/-]+)").unwrap();

    graph.links.retain(|l| l.source != id);
    graph.nodes.retain(|n| n.group != "ghost" || graph.links.iter().any(|l| l.target == n.id));

    let label = PathBuf::from(&note_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(&id)
        .to_string();

    graph.nodes.retain(|n| n.id != id);
    graph.nodes.push(GraphNode {
        id: id.clone(),
        label,
        group: "note".into(),
    });

    let mut nodes_map: HashMap<String, GraphNode> =
        graph.nodes.into_iter().map(|n| (n.id.clone(), n)).collect();
    let mut link_set: HashSet<(String, String)> =
        graph.links.iter().map(|l| (l.source.clone(), l.target.clone())).collect();
    let mut links = graph.links;

    index_note_links(
        &content,
        &id,
        &wiki_re,
        &tag_re,
        &mut nodes_map,
        &mut links,
        &mut link_set,
    );

    Ok(GraphData {
        nodes: nodes_map.into_values().collect(),
        links,
    })
}

#[tauri::command]
fn detect_syncthing() -> SyncthingStatus {
    let mut paths = Vec::new();
    let candidates = [
        r"C:\Program Files\Syncthing\syncthing.exe",
        r"C:\Program Files (x86)\Syncthing\syncthing.exe",
        r"C:\Users\Public\Syncthing\syncthing.exe",
    ];

    for p in candidates {
        if Path::new(p).exists() {
            paths.push(p.to_string());
        }
    }

    let running = std::process::Command::new("tasklist")
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).contains("syncthing"))
        .unwrap_or(false);

    SyncthingStatus {
        installed: !paths.is_empty() || running,
        running,
        paths,
    }
}

#[tauri::command]
fn start_vault_watch(app: AppHandle, vault_path: String) -> Result<(), String> {
    stop_vault_watch()?;

    let root = PathBuf::from(&vault_path);
    if !root.exists() {
        return Err("Vault path does not exist".into());
    }

    let app_handle = app.clone();
    let vault = vault_path.clone();

    let mut debouncer = new_debouncer(Duration::from_millis(400), move |res: Result<Vec<DebouncedEvent>, notify::Error>| {
        if let Ok(events) = res {
            for event in events {
                let rel = event
                    .path
                    .strip_prefix(&vault)
                    .map(|p| p.to_string_lossy().replace('\\', "/"))
                    .unwrap_or_else(|_| event.path.to_string_lossy().to_string());

                // notify-debouncer-mini only exposes Any / AnyContinuous
                let kind = match event.kind {
                    notify_debouncer_mini::DebouncedEventKind::AnyContinuous => "modify",
                    _ => "change",
                };

                let _ = app_handle.emit(
                    "vault-changed",
                    VaultChangeEvent {
                        path: rel,
                        kind: kind.into(),
                    },
                );
            }
        }
    })
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(&root, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    *WATCHER.lock().unwrap() = Some(debouncer);
    Ok(())
}

#[tauri::command]
fn stop_vault_watch() -> Result<(), String> {
    *WATCHER.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
fn install_plugin_from_github(
    vault_path: String,
    repo: String,
    branch: Option<String>,
) -> Result<String, String> {
    let branch = branch.unwrap_or_else(|| "master".into());
    let plugins_dir = chameleon_dir(&vault_path).join("plugins");
    fs::create_dir_all(&plugins_dir).map_err(|e| e.to_string())?;

    let repo_name = repo
        .trim()
        .trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or("plugin")
        .to_string();

    let dest = plugins_dir.join(&repo_name);
    if dest.exists() {
        return Err(format!("Plugin '{}' already installed", repo_name));
    }

    let archive_url = format!(
        "https://github.com/{}/archive/refs/heads/{}.zip",
        repo.trim(),
        branch
    );

    Ok(format!(
        "Plugin queued: {} -> {} (download from {})",
        repo_name,
        dest.display(),
        archive_url
    ))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_chameleon_data,
            write_chameleon_data,
            get_note_mtime,
            list_vault_files,
            read_note,
            write_note,
            create_note,
            build_graph,
            update_graph_for_note,
            detect_syncthing,
            start_vault_watch,
            stop_vault_watch,
            install_plugin_from_github,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Chameleon");
}
