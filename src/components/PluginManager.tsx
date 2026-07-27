import { useState } from "react";
import { Download, Github, Power, Search } from "lucide-react";
import { BUILTIN_PLUGINS } from "@/lib/plugins/obsidian-shim";
import type { PluginInfo } from "@/types";

interface PluginManagerProps {
  plugins: PluginInfo[];
  onInstall: (repo: string) => Promise<void>;
  onToggle: (id: string) => void;
}

export function PluginManager({
  plugins,
  onInstall,
  onToggle,
}: PluginManagerProps) {
  const [repo, setRepo] = useState("");
  const [installing, setInstalling] = useState(false);
  const [filter, setFilter] = useState("");

  async function handleInstall(e: React.FormEvent) {
    e.preventDefault();
    if (!repo.trim()) return;
    setInstalling(true);
    try {
      await onInstall(repo.trim());
      setRepo("");
    } finally {
      setInstalling(false);
    }
  }

  const filtered = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.repo.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="plugin-manager">
      <header className="plugin-manager__header">
        <h2>Plugins</h2>
        <p>Install Obsidian community plugins from GitHub</p>
      </header>

      <form className="plugin-manager__install" onSubmit={handleInstall}>
        <Github size={18} />
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repo (e.g. blacksmithgu/obsidian-dataview)"
        />
        <button type="submit" disabled={installing}>
          <Download size={16} />
          {installing ? "Installing…" : "Install"}
        </button>
      </form>

      <div className="plugin-manager__search">
        <Search size={16} />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter installed plugins…"
        />
      </div>

      <section className="plugin-manager__section">
        <h3>Popular Obsidian plugins</h3>
        <div className="plugin-cards">
          {BUILTIN_PLUGINS.map((p) => (
            <article key={p.id} className="plugin-card">
              <div>
                <strong>{p.name}</strong>
                <p>{p.description}</p>
                <code>{p.repo}</code>
              </div>
              <button
                type="button"
                className="btn-sm"
                onClick={() => onInstall(p.repo)}
              >
                Install
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="plugin-manager__section">
        <h3>Installed ({filtered.length})</h3>
        {filtered.length === 0 && (
          <p className="plugin-manager__empty">No plugins installed yet</p>
        )}
        <ul className="plugin-list">
          {filtered.map((p) => (
            <li key={p.id} className="plugin-list__item">
              <div>
                <strong>{p.name}</strong>
                <span>{p.repo}</span>
              </div>
              <button
                type="button"
                className={`icon-btn ${p.enabled ? "icon-btn--active" : ""}`}
                title={p.enabled ? "Disable" : "Enable"}
                onClick={() => onToggle(p.id)}
              >
                <Power size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="plugin-manager__note">
        Chameleon includes an Obsidian API compatibility layer. Plugins using
        common APIs may work; deep integrations may need updates.
      </p>
    </div>
  );
}
