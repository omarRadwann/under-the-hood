"use client";
import { useEffect, useRef } from "react";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  drawSelection,
  keymap,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import {
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";

const highlightEventLine = StateEffect.define<number | null>();
const codeColors = HighlightStyle.define([
  { tag: tags.keyword, color: "#c9b3ed" },
  { tag: [tags.string, tags.regexp], color: "#cfdfa6" },
  { tag: [tags.number, tags.bool, tags.null], color: "#edc78e" },
  { tag: tags.comment, color: "#99aa8c", fontStyle: "italic" },
  { tag: [tags.variableName, tags.propertyName], color: "#dce5d2" },
  { tag: tags.function(tags.variableName), color: "#94d4d8" },
  { tag: [tags.typeName, tags.className], color: "#c6dba8" },
  { tag: tags.tagName, color: "#9dcede" },
  { tag: tags.attributeName, color: "#e4c794" },
  { tag: [tags.operator, tags.punctuation], color: "#bdcbb2" },
]);
const recordedLine = StateField.define({
  create: () => Decoration.none,
  update(value, transaction) {
    value = value.map(transaction.changes);
    for (const effect of transaction.effects)
      if (effect.is(highlightEventLine)) {
        const line = effect.value;
        value =
          line && line <= transaction.state.doc.lines
            ? Decoration.set([
                Decoration.line({ class: "cm-recorded-line" }).range(
                  transaction.state.doc.line(line).from,
                ),
              ])
            : Decoration.none;
      }
    return value;
  },
  provide: (field) => EditorView.decorations.from(field),
});
const theme = EditorView.theme(
  {
    "&": { fontSize: "13px", backgroundColor: "#121a10", color: "#d7e4c9", height: "460px" },
    ".cm-content": {
      fontFamily: "'IBM Plex Mono',Consolas,monospace",
      padding: "16px 0",
      lineHeight: "1.85",
      caretColor: "#d8e7aa",
    },
    ".cm-gutters": {
      backgroundColor: "#151e11",
      color: "#82966f",
      borderRight: "1px solid #33452a",
      fontSize: "11px",
    },
    ".cm-line": { paddingLeft: "12px" },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#a4bf6810" },
    ".cm-recorded-line": { backgroundColor: "#bed7811d", boxShadow: "inset 3px 0 #bed781" },
    ".cm-cursor": { borderLeftColor: "#d8e7aa" },
    "&.cm-focused": { outline: "none" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "#4d673780 !important",
    },
    ".cm-panels": { backgroundColor: "#23321a", color: "#cedfb9" },
    ".cm-searchMatch": { backgroundColor: "#697a3550" },
    ".cm-scroller": { overflow: "auto" },
  },
  { dark: true },
);

export function SourceEditor({
  value,
  onChange,
  onRun,
  activeLine,
  label = "Playground code editor",
}: {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  activeLine: number | null;
  label?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const changeRef = useRef(onChange);
  const runRef = useRef(onRun);
  changeRef.current = onChange;
  runRef.current = onRun;
  useEffect(() => {
    if (!container.current) return;
    const view = new EditorView({
      parent: container.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          javascript({ jsx: true, typescript: true }),
          syntaxHighlighting(codeColors),
          theme,
          recordedLine,
          EditorView.contentAttributes.of({
            "aria-label": label,
            "aria-multiline": "true",
            spellcheck: "false",
          }),
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                runRef.current();
                return true;
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) changeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
  }, []);
  useEffect(() => {
    const view = editor.current;
    if (view && value !== view.state.doc.toString())
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);
  useEffect(() => {
    editor.current?.dispatch({ effects: highlightEventLine.of(activeLine) });
  }, [activeLine]);
  return <div className="source-editor" ref={container} />;
}
