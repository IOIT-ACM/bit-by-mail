import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Code, Eye, Expand, Maximize, Minimize } from 'lucide-react';
import { MonacoEditorWrapper } from './shared/MonacoEditorWrapper';
import { MaximizableView } from './shared/MaximizableView';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import { apiService } from '../services/apiService';

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

const EditorContent: React.FC<{
  isMaximized: boolean;
  onToggleMaximize: () => void;
}> = ({ isMaximized, onToggleMaximize }) => {
  const { config, emailBody, setConfig, setEmailBody } = useAppStore();
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, subject_template: e.target.value });
  };

  const handleFullscreenPreview = () => {
    const blob = new Blob([emailBody], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-heading-3 font-medium text-text-primary">Email Content</h2>
          {!isMaximized && (
            <p className="text-sm text-text-secondary mt-1">Use placeholders like <code className="text-xs bg-surface-element px-1 py-0.5 rounded">{"{Name}"}</code>. Changes are saved automatically.</p>
          )}
        </div>
        <button
          onClick={onToggleMaximize}
          className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
        >
          {isMaximized ? <Minimize size={20} /> : <Maximize size={16} />}
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
        {isMaximized ? (
          <>
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
          </>
        ) : (
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
        )}
      </div>
    </>
  );
};

const Editor: React.FC = () => {
  const { config, emailBody } = useAppStore();

  useDebouncedEffect(
    () => {
      apiService.saveTemplate(emailBody);
      apiService.saveConfig({ subject_template: config.subject_template });
    },
    1500,
    [emailBody, config.subject_template]
  );

  return (
    <MaximizableView layoutId="editor-container">
      {({ isMaximized, onToggle }) => (
        <EditorContent isMaximized={isMaximized} onToggleMaximize={onToggle} />
      )}
    </MaximizableView>
  );
};

export default Editor;
