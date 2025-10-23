import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export const MonacoEditorWrapper: React.FC<{ value: string; onChange: (value: string) => void }> = ({
  value,
  onChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let editor: monaco.editor.IStandaloneCodeEditor | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const editorNode = editorRef.current;

    if (editorNode) {
      monaco.editor.defineTheme('BitByMailDark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#00000033',
          'editor.foreground': '#FFFFFFE6',
          'editorCursor.foreground': '#3b82f6',
          'editor.selectionBackground': '#3b82f640',
          'editorWidget.background': '#282834',
          'editorWidget.border': '#FFFFFF1A',
        },
      });

      editor = monaco.editor.create(editorNode, {
        value: value,
        language: 'html',
        theme: 'BitByMailDark',
        automaticLayout: false,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 14,
        minimap: { enabled: false },
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        lineNumbers: 'on',
        glyphMargin: false,
        folding: false,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 4,
        wordWrap: 'off',
        contextmenu: false,
        renderLineHighlight: 'none',
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
      });

      monacoInstance.current = editor;

      editor.onDidChangeModelContent(() => {
        const currentValue = editor?.getValue();
        if (currentValue !== undefined) {
          onChangeRef.current(currentValue);
        }
      });

      resizeObserver = new ResizeObserver(() => {
        setTimeout(() => editor?.layout(), 0);
      });
      resizeObserver.observe(editorNode);
    }

    return () => {
      if (resizeObserver && editorNode) {
        resizeObserver.unobserve(editorNode);
        resizeObserver.disconnect();
      }
      if (editor) {
        editor.dispose();
      }
      monacoInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = monacoInstance.current;
    if (editor && editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  return <div ref={editorRef} className="monaco-editor-container" />;
};
