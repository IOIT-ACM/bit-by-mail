import React, { useEffect, useRef } from 'react'

export const MonacoEditorWrapper: React.FC<{
  value: string
  onChange: (value: string) => void
}> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoInstance = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    let editor: any = null
    let isMounted = true

    const initMonaco = async () => {
      const monaco = await import('monaco-editor')
      if (!isMounted) return

      const editorNode = editorRef.current

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
        })

        editor = monaco.editor.create(editorNode, {
          value: value,
          language: 'html',
          theme: 'BitByMailDark',
          automaticLayout: true,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
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
        })

        monacoInstance.current = editor

        editor.onDidChangeModelContent(() => {
          const currentValue = editor?.getValue()
          if (currentValue !== undefined) {
            onChangeRef.current(currentValue)
          }
        })
      }
    }

    initMonaco()

    return () => {
      isMounted = false
      if (monacoInstance.current) {
        monacoInstance.current.dispose()
      }
      monacoInstance.current = null
    }
  }, [])

  useEffect(() => {
    const editor = monacoInstance.current
    if (editor && editor.getValue() !== value) {
      editor.setValue(value)
    }
  }, [value])

  return <div ref={editorRef} className="w-full h-full overflow-hidden" />
}

