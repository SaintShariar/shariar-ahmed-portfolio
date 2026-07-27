import { memo, useEffect, useRef } from "react";
import { EditorState, Transaction } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
} from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { oneDark } from "./editorTheme";

interface EditorProps {
  notePath: string | null;
  content: string;
  externalRevision?: number;
  onChange: (value: string) => void;
  onLineClick?: (line: number) => void;
}

function EditorInner({
  notePath,
  content,
  externalRevision = 0,
  onChange,
  onLineClick,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onLineClickRef = useRef(onLineClick);
  const lastExternalRev = useRef(externalRevision);
  const isLocalChange = useRef(false);

  onChangeRef.current = onChange;
  onLineClickRef.current = onLineClick;

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          history(),
          markdown(),
          oneDark,
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              isLocalChange.current = true;
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          EditorView.domEventHandlers({
            click(event, view) {
              if (onLineClickRef.current) {
                const pos = view.posAtCoords({
                  x: event.clientX,
                  y: event.clientY,
                });
                if (pos != null) {
                  const line = view.state.doc.lineAt(pos).number;
                  onLineClickRef.current(line);
                }
              }
              return false;
            },
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [notePath]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (isLocalChange.current) {
      isLocalChange.current = false;
      return;
    }

    if (externalRevision !== lastExternalRev.current) {
      lastExternalRev.current = externalRevision;
      const current = view.state.doc.toString();
      if (current !== content) {
        view.dispatch({
          changes: { from: 0, to: current.length, insert: content },
          annotations: Transaction.addToHistory.of(false),
        });
      }
    }
  }, [content, externalRevision]);

  return <div ref={containerRef} className="editor-pane" />;
}

export const Editor = memo(EditorInner);
