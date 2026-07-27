import { memo } from "react";
import { Check, Copy, ExternalLink, RefreshCw } from "lucide-react";
import type { SyncthingStatus } from "@/types";

interface SyncPanelProps {
  vaultPath: string;
  syncthing: SyncthingStatus | null;
  onCopyPath: () => void;
  onRefresh: () => void;
}

function SyncPanelInner({
  vaultPath,
  syncthing,
  onCopyPath,
  onRefresh,
}: SyncPanelProps) {
  return (
    <div className="sync-panel">
      <header className="sync-panel__header">
        <h2>Sync with Syncthing</h2>
        <p>
          Your vault is a plain markdown folder. Add it to Syncthing on each
          device — notes, calendar, comments, and plugins in{" "}
          <code>.chameleon/</code> sync automatically.
        </p>
      </header>

      <section className="sync-panel__section">
        <h3>Vault path</h3>
        <div className="sync-panel__path">
          <code>{vaultPath}</code>
          <button type="button" className="btn-sm" onClick={onCopyPath}>
            <Copy size={14} /> Copy path
          </button>
        </div>
      </section>

      <section className="sync-panel__section">
        <h3>Syncthing status</h3>
        <ul className="sync-panel__status">
          <li>
            <Check size={14} />
            Installed: {syncthing?.installed ? "Yes" : "Not detected"}
          </li>
          <li>
            <RefreshCw size={14} />
            Running: {syncthing?.running ? "Yes" : "No"}
          </li>
        </ul>
        <a
          className="sync-panel__link"
          href="https://syncthing.net/downloads/"
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={14} /> Download Syncthing
        </a>
      </section>

      <section className="sync-panel__section">
        <h3>Setup steps</h3>
        <ol className="sync-panel__steps">
          <li>Install Syncthing on PC and phone (Syncthing-Android).</li>
          <li>Share your vault folder between devices.</li>
          <li>Open the same vault path in Chameleon on each device.</li>
          <li>
            Calendar lives in <code>.chameleon/calendar.json</code> — events
            merge by ID when both devices edit.
          </li>
          <li>
            If a note changes on disk while you edit, Chameleon prompts: keep
            local or reload from disk.
          </li>
        </ol>
        <button type="button" className="btn-sm" onClick={onRefresh}>
          <RefreshCw size={14} /> Refresh vault now
        </button>
      </section>

      <section className="sync-panel__section">
        <h3>Android</h3>
        <p>
          Install Syncthing from F-Droid or Play Store. Sync the vault folder to
          internal storage, then open that path in Chameleon Android. Calendar
          and daily notes use the same <code>.chameleon/</code> files.
        </p>
      </section>
    </div>
  );
}

export const SyncPanel = memo(SyncPanelInner);
