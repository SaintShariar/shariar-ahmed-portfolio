import { EditorView } from "@codemirror/view";

export const oneDark = EditorView.theme(
  {
    "&": {
      color: "#e6edf3",
      backgroundColor: "#0d1117",
      height: "100%",
      fontSize: "15px",
    },
    ".cm-content": {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: "16px 0",
    },
    ".cm-gutters": {
      backgroundColor: "#0d1117",
      color: "#484f58",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#161b22",
    },
    ".cm-activeLine": {
      backgroundColor: "#161b22",
    },
    ".cm-cursor": {
      borderLeftColor: "#58a6ff",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "#264f78",
    },
  },
  { dark: true },
);
