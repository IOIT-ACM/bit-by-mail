import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export const MonacoEditorWrapper: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoInstance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (editorRef.current && !monacoInstance.current) {
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

      monacoInstance.current = monaco.editor.create(editorRef.current, {
        value,
        language: 'html',
        theme: 'BitByMailDark',
        automaticLayout: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 14,
        minimap: { enabled: false },
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        lineNumbers: 'on',
        glyphMargin: false,
        folding: false,
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 0,
        wordWrap: 'off',
        contextmenu: false,
        renderLineHighlight: 'none',
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
      });

      monacoInstance.current.onDidChangeModelContent(() => {
        const currentValue = monacoInstance.current?.getValue();
        if (currentValue !== undefined) {
          onChange(currentValue);
        }
      });
    }

    return () => {
      if (monacoInstance.current) {
        monacoInstance.current.dispose();
        monacoInstance.current = null;
      }
    };
  }, [onChange]);

  useEffect(() => {
    if (monacoInstance.current && monacoInstance.current.getValue() !== value) {
      monacoInstance.current.setValue(value);
    }
  }, [value]);

  return <div ref={editorRef} className="monaco-editor-container" />;
};
