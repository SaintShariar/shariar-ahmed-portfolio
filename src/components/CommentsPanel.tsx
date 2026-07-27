import { Check, MessageSquare, X } from "lucide-react";
import type { Comment } from "@/types";

interface CommentsPanelProps {
  comments: Comment[];
  activeNote: string | null;
  selectedLine: number | null;
  onAdd: (text: string, line: number) => void;
  onResolve: (id: string) => void;
}

export function CommentsPanel({
  comments,
  activeNote,
  selectedLine,
  onAdd,
  onResolve,
}: CommentsPanelProps) {
  const noteComments = comments.filter(
    (c) => c.notePath === activeNote && !c.resolved,
  );

  function handleAdd() {
    if (!activeNote || selectedLine == null) return;
    const text = prompt("Comment:");
    if (!text) return;
    onAdd(text, selectedLine);
  }

  return (
    <aside className="comments-panel">
      <header className="comments-panel__header">
        <MessageSquare size={16} />
        <span>Comments</span>
        <button
          type="button"
          className="btn-sm"
          disabled={!activeNote || selectedLine == null}
          onClick={handleAdd}
        >
          Add
        </button>
      </header>

      {selectedLine != null && (
        <p className="comments-panel__line">Line {selectedLine} selected</p>
      )}

      <ul className="comments-panel__list">
        {noteComments.length === 0 && (
          <li className="comments-panel__empty">
            Click a line in the editor, then Add to comment
          </li>
        )}
        {noteComments.map((c) => (
          <li key={c.id} className="comment-card">
            <div className="comment-card__meta">
              <span>L{c.line}</span>
              <span>{c.author}</span>
              <button
                type="button"
                className="icon-btn"
                title="Resolve"
                onClick={() => onResolve(c.id)}
              >
                <Check size={14} />
              </button>
            </div>
            <p>{c.text}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function FloatingAI({
  open,
  messages,
  onToggle,
  onSend,
}: {
  open: boolean;
  messages: { id: string; role: string; content: string }[];
  onToggle: () => void;
  onSend: (text: string) => void;
}) {
  if (!open) {
    return (
      <button type="button" className="floating-ai__orb" onClick={onToggle}>
        <span className="floating-ai__orb-glow" />
        <span className="floating-ai__orb-core">AI</span>
      </button>
    );
  }

  return (
    <div className="floating-ai">
      <header className="floating-ai__header">
        <span>Chameleon AI</span>
        <button type="button" className="icon-btn" onClick={onToggle}>
          <X size={16} />
        </button>
      </header>
      <div className="floating-ai__messages">
        {messages.length === 0 && (
          <p className="floating-ai__placeholder">
            Ask about your vault, summarize notes, or brainstorm ideas.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`floating-ai__msg floating-ai__msg--${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>
      <form
        className="floating-ai__input"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem(
            "prompt",
          ) as HTMLInputElement;
          if (input.value.trim()) {
            onSend(input.value.trim());
            input.value = "";
          }
        }}
      >
        <input name="prompt" placeholder="Ask anything…" autoFocus />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
