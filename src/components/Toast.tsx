export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

export function SyncConflictDialog({
  notePath,
  onKeepLocal,
  onReloadRemote,
}: {
  notePath: string;
  onKeepLocal: () => void;
  onReloadRemote: () => void;
}) {
  return (
    <div className="conflict-overlay">
      <div className="conflict-dialog">
        <h3>Sync conflict</h3>
        <p>
          <strong>{notePath}</strong> was changed on disk (likely via
          Syncthing) while you were editing.
        </p>
        <div className="conflict-dialog__actions">
          <button type="button" className="btn-sm" onClick={onKeepLocal}>
            Keep my version
          </button>
          <button type="button" className="btn-primary" onClick={onReloadRemote}>
            Reload from disk
          </button>
        </div>
      </div>
    </div>
  );
}
