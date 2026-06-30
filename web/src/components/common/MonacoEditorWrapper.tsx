import React, { useEffect, useRef, useState } from 'react'
import { Loader } from 'lucide-react'

export const MonacoEditorWrapper: React.FC<{
  value: string
  onChange: (value: string) => void
}> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoInstance = useRef<any>(null)
  const emmetDisposeRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const latestValueRef = useRef(value)
  latestValueRef.current = value

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let editor: any = null
    let isMounted = true

    const initMonaco = async () => {
      const monaco = await import('monaco-editor')
      const { emmetHTML } = await import('emmet-monaco-es')

      if (!(window as any).MonacoEnvironment) {
        const editorWorker =
          await import('monaco-editor/esm/vs/editor/editor.worker?worker')
        const htmlWorker =
          await import('monaco-editor/esm/vs/language/html/html.worker?worker')

        ;(window as any).MonacoEnvironment = {
          getWorker: function (_moduleId: any, label: string) {
            if (
              label === 'html' ||
              label === 'handlebars' ||
              label === 'razor'
            ) {
              return new htmlWorker.default()
            }
            return new editorWorker.default()
          },
        }
      }

      if (!isMounted) return

      emmetDisposeRef.current = emmetHTML(monaco)

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
          value: latestValueRef.current,
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
        setIsLoading(false)

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
      if (emmetDisposeRef.current) {
        emmetDisposeRef.current()
      }
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

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-element">
          <Loader size={24} className="animate-spin text-accent-blue mb-2" />
        </div>
      )}
      <div ref={editorRef} className="w-full h-full overflow-hidden" />
    </div>
  )
}
