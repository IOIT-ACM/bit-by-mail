import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Code, Eye, Expand, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

interface EditorProps {
  sendMessage: (action: string, payload?: any) => void;
}

const MonacoEditorWrapper: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
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

const Editor: React.FC<EditorProps> = ({ sendMessage }) => {
  const { config, emailBody, setConfig, setEmailBody } = useAppStore();
  const isFirstRender = useRef(true);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      sendMessage('save_template', emailBody);
      sendMessage('save_config', config);
    }, 1500);

    return () => clearTimeout(handler);
  }, [emailBody, config.subject_template, sendMessage, config]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, subject_template: e.target.value });
  };

  const handleFullscreenPreview = () => {
    const blob = new Blob([emailBody], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const TabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        isActive
          ? 'text-text-primary border-accent-blue'
          : 'text-text-secondary border-transparent hover:text-text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <>
      <motion.div
        layoutId="editor-container"
        className="bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card p-6 flex flex-col h-full"
        style={{ visibility: isMaximized ? 'hidden' : 'visible' }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-heading-3 font-medium text-text-primary mb-1">Email Content</h2>
            <p className="text-sm text-text-secondary mb-4">Use placeholders like <code className="text-xs bg-surface-element px-1 py-0.5 rounded">{"{Name}"}</code>. Changes are saved automatically.</p>
          </div>
          <button
            onClick={() => setIsMaximized(true)}
            className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors -mr-2 -mt-2"
          >
            <Maximize size={16} />
          </button>
        </div>
		<h3 className="text-sm font-medium text-text-secondary mb-2 px-1">Email Subject</h3>
        <input
          type="text"
          value={config.subject_template}
          onChange={handleSubjectChange}
          placeholder="Email Subject Template"
          className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors mb-4"
        />

        <div className="flex-grow flex flex-col min-h-0">
          <div className="flex items-center border-b border-borders-primary">
            <TabButton label="Code" icon={<Code size={16} />} isActive={activeTab === 'code'} onClick={() => setActiveTab('code')} />
            <TabButton label="Preview" icon={<Eye size={16} />} isActive={activeTab === 'preview'} onClick={() => setActiveTab('preview')} />
          </div>

          <div className="flex-grow relative mt-4" style={{ minHeight: '300px' }}>
            {activeTab === 'code' && (
              <div className="absolute inset-0 bg-surface-element border border-borders-primary rounded-b-lg rounded-tr-lg overflow-hidden">
                <MonacoEditorWrapper value={emailBody} onChange={setEmailBody} />
              </div>
            )}
            {activeTab === 'preview' && (
              <div className="absolute inset-0 flex flex-col bg-surface-element border border-borders-primary rounded-b-lg rounded-tr-lg overflow-hidden">
                <div className="flex justify-end p-2 border-b border-borders-primary bg-surface-element-hover/50">
                  <button
                    onClick={handleFullscreenPreview}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-text-secondary bg-surface-element hover:bg-black/30 hover:text-text-primary transition-colors"
                  >
                    <Expand size={14} />
                    Fullscreen
                  </button>
                </div>
                <iframe
                  srcDoc={emailBody}
                  title="Email Preview"
                  className="w-full h-full flex-grow bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMaximized && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMaximized(false)}
            />
            <motion.div
              layoutId="editor-container"
              className="relative w-full h-full bg-surface-card border border-borders-primary rounded-card shadow-card p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-heading-3 font-medium text-text-primary">Email Content</h2>
                <button
                  onClick={() => setIsMaximized(false)}
                  className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
                >
                  <Minimize size={20} />
                </button>
              </div>
			  <h3 className="text-sm font-medium text-text-secondary mb-2 px-1">Email Subject</h3>
              <input
                type="text"
                value={config.subject_template}
                onChange={handleSubjectChange}
                placeholder="Email Subject Template"
                className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors mb-4 flex-shrink-0"
              />
              <div className="flex-grow flex flex-col md:flex-row gap-4 min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  <h3 className="text-sm font-medium text-text-secondary mb-2 px-1">Code</h3>
                  <div className="w-full h-full bg-surface-element border border-borders-primary rounded-lg overflow-hidden">
                    <MonacoEditorWrapper value={emailBody} onChange={setEmailBody} />
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                  <h3 className="text-sm font-medium text-text-secondary mb-2 px-1">Preview</h3>
                  <iframe
                    srcDoc={emailBody}
                    title="Email Preview"
                    className="w-full h-full bg-white border border-borders-primary rounded-lg"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Editor;
