import { memo, useMemo, useState } from "react";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Plus,
} from "lucide-react";
import type { VaultFile } from "@/types";

interface SidebarProps {
  files: VaultFile[];
  activeNote: string | null;
  onSelect: (path: string) => void;
  onCreate: (name: string) => void;
}

const VIRTUAL_THRESHOLD = 200;

function buildTree(files: VaultFile[]) {
  const root: Record<string, unknown> = {};
  for (const f of files.filter((x) => !x.isDir)) {
    if (!f.path.endsWith(".md")) continue;
    const parts = f.path.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        (node as Record<string, VaultFile>)[part] = f;
      } else {
        if (!(node as Record<string, unknown>)[part]) {
          (node as Record<string, unknown>)[part] = {};
        }
        node = (node as Record<string, unknown>)[part] as Record<
          string,
          unknown
        >;
      }
    }
  }
  return root;
}

function flattenFiles(files: VaultFile[]): VaultFile[] {
  return files.filter((f) => !f.isDir && f.path.endsWith(".md"));
}

function TreeNode({
  name,
  node,
  depth,
  activeNote,
  onSelect,
  defaultOpen = false,
}: {
  name: string;
  node: unknown;
  depth: number;
  activeNote: string | null;
  onSelect: (path: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (node && typeof node === "object" && "path" in (node as VaultFile)) {
    const file = node as VaultFile;
    return (
      <button
        type="button"
        className={`tree-item ${activeNote === file.path ? "tree-item--active" : ""}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(file.path)}
      >
        <FileText size={14} />
        <span>{name.replace(/\.md$/, "")}</span>
      </button>
    );
  }

  const children = Object.entries(node as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );

  return (
    <div>
      <button
        type="button"
        className="tree-item tree-item--folder"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => setOpen(!open)}
      >
        {open ? <FolderOpen size={14} /> : <Folder size={14} />}
        <span>{name}</span>
        <ChevronRight
          size={14}
          className={`tree-chevron ${open ? "tree-chevron--open" : ""}`}
        />
      </button>
      {open &&
        children.map(([childName, childNode]) => (
          <TreeNode
            key={childName}
            name={childName}
            node={childNode}
            depth={depth + 1}
            activeNote={activeNote}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function SidebarInner({ files, activeNote, onSelect, onCreate }: SidebarProps) {
  const mdCount = useMemo(
    () => files.filter((f) => !f.isDir && f.path.endsWith(".md")).length,
    [files],
  );
  const useFlat = mdCount > VIRTUAL_THRESHOLD;
  const tree = useMemo(() => buildTree(files), [files]);
  const flat = useMemo(() => flattenFiles(files), [files]);

  function handleCreate() {
    const name = prompt("New note name:");
    if (!name) return;
    onCreate(name.endsWith(".md") ? name : `${name}.md`);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <span>Notes {useFlat ? `(${mdCount})` : ""}</span>
        <button type="button" className="icon-btn" onClick={handleCreate}>
          <Plus size={16} />
        </button>
      </div>
      <nav className="sidebar__tree">
        {useFlat ? (
          flat.map((f) => (
            <button
              key={f.path}
              type="button"
              className={`tree-item ${activeNote === f.path ? "tree-item--active" : ""}`}
              onClick={() => onSelect(f.path)}
            >
              <FileText size={14} />
              <span>{f.name.replace(/\.md$/, "")}</span>
            </button>
          ))
        ) : (
          Object.entries(tree)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, node]) => (
              <TreeNode
                key={name}
                name={name}
                node={node}
                depth={0}
                activeNote={activeNote}
                onSelect={onSelect}
                defaultOpen
              />
            ))
        )}
      </nav>
    </aside>
  );
}

export const Sidebar = memo(SidebarInner);
