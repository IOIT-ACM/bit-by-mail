import { useQuery } from '@tanstack/react-query';
import { Braces, Code, Expand, Eye, Maximize, Minimize } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect';
import { apiService } from '@/services/apiService';
import { CampaignData } from '@/types';
import { MaximizableView } from '@/components/common/MaximizableView';
import { MonacoEditorWrapper } from '@/components/common/MonacoEditorWrapper';

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; }> = ({ label, icon, isActive, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${isActive ? 'text-text-primary border-accent-blue' : 'text-text-secondary border-transparent hover:text-text-primary'}`}>
    {icon}
    {label}
  </button>
);

const PlaceholderList: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const { data } = useQuery<CampaignData>({ queryKey: ['campaignData', campaignId] });
  const recipients = data?.recipients ?? [];
  const availablePlaceholders = recipients.length > 0 ? Object.keys(recipients[0]) : [];

  const handleCopy = (placeholderName: string) => {
    navigator.clipboard.writeText(`{{${placeholderName}}}`);
    toast.success(`Placeholder "${placeholderName}" copied to clipboard`);
  };

  if (availablePlaceholders.length === 0) return <p className="text-sm text-text-tertiary italic">No recipients uploaded yet.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {availablePlaceholders.map(placeholder => (
        <code key={placeholder} className="text-xs bg-black/30 px-2 py-1 rounded cursor-pointer hover:bg-accent-blue/50 transition-colors" title={`Click to copy {{${placeholder}}}`} onClick={() => handleCopy(placeholder)}>
          {`{{${placeholder}}}`}
        </code>
      ))}
    </div>
  );
};

const EditorContent: React.FC<{ isMaximized: boolean; onToggleMaximize: () => void; campaignId: string; initialSubject: string }> = ({ isMaximized, onToggleMaximize, campaignId, initialSubject }) => {
  const { data } = useQuery<CampaignData>({ queryKey: ['campaignData', campaignId] });
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'placeholders'>('code');
  const [localSubject, setLocalSubject] = useState(initialSubject);
  const [localBody, setLocalBody] = useState('');

  useEffect(() => {
    if (data?.emailBody !== undefined) setLocalBody(data.emailBody);
  }, [data?.emailBody]);

  useDebouncedEffect(() => {
    if (localBody !== data?.emailBody) apiService.saveTemplate(campaignId, localBody);
  }, 1500, [localBody, campaignId]);

  useDebouncedEffect(() => {
    if (localSubject !== initialSubject) apiService.updateCampaign(campaignId, { subject: localSubject });
  }, 1500, [localSubject, campaignId, initialSubject]);

  const handleFullscreenPreview = () => {
    const blob = new Blob([localBody], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const isLikelyHtml = (text: string) => /<\s*\/?\s*(html|body|div|p|h[1-6]|table|ul|ol|a|img|br)\b/i.test(text);

  const preparePreviewContent = (content: string) => {
    if (isLikelyHtml(content)) return content;
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;margin:20px;color:#333;word-wrap:break-word}pre{white-space:pre-wrap;word-wrap:break-word;margin:0;font-family:inherit;font-size:inherit}</style></head><body><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
  };

  const previewContent = preparePreviewContent(localBody);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div><h2 className="text-heading-3 font-medium text-text-primary">Email Content</h2></div>
        <button onClick={onToggleMaximize} className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors">
          {isMaximized ? <Minimize size={20} /> : <Maximize size={16} />}
        </button>
      </div>
      <h3 className="text-sm font-medium text-text-secondary mb-2 px-1">Email Subject</h3>
      <input type="text" value={localSubject} onChange={(e) => setLocalSubject(e.target.value)} placeholder="Email Subject Template" className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors mb-4 flex-shrink-0" maxLength={100} />
      <div className="flex-grow flex flex-col md:flex-row gap-4 min-h-0">
        {isMaximized ? (
          <>
            <div className="flex-1 flex flex-col min-h-0 gap-4">
              <div className="flex-grow flex flex-col min-h-0">
                <h3 className="text-sm font-medium text-text-secondary mb-2 px-1">Code</h3>
                <div className="w-full flex-grow bg-surface-element border border-borders-primary rounded-lg overflow-hidden">
                  <MonacoEditorWrapper value={localBody} onChange={setLocalBody} />
                </div>
              </div>
              <div className="flex-shrink-0 p-3 bg-surface-element border border-borders-primary rounded-lg">
                <h4 className="text-sm font-medium text-text-secondary mb-2">Available Placeholders</h4>
                <PlaceholderList campaignId={campaignId} />
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium text-text-secondary mb-2 px-1">Preview</h3>
              <iframe srcDoc={previewContent} title="Email Preview" className="w-full h-full bg-white border border-borders-primary rounded-lg" sandbox="allow-same-origin" />
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex items-center border-b border-borders-primary">
              <TabButton label="Code" icon={<Code size={16} />} isActive={activeTab === 'code'} onClick={() => setActiveTab('code')} />
              <TabButton label="Preview" icon={<Eye size={16} />} isActive={activeTab === 'preview'} onClick={() => setActiveTab('preview')} />
              <TabButton label="Placeholders" icon={<Braces size={16} />} isActive={activeTab === 'placeholders'} onClick={() => setActiveTab('placeholders')} />
            </div>
            <div className="flex-grow relative mt-4" style={{ minHeight: '300px' }}>
              {activeTab === 'code' && <div className="absolute inset-0 bg-surface-element border border-borders-primary rounded-b-lg rounded-tr-lg overflow-hidden"><MonacoEditorWrapper value={localBody} onChange={setLocalBody} /></div>}
              {activeTab === 'preview' && (
                <div className="absolute inset-0 flex flex-col bg-surface-element border border-borders-primary rounded-b-lg rounded-tr-lg overflow-hidden">
                  <div className="flex justify-end p-2 border-b border-borders-primary bg-surface-element-hover/50">
                    <button onClick={handleFullscreenPreview} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-text-secondary bg-surface-element hover:bg-black/30 hover:text-text-primary transition-colors"><Expand size={14} />Fullscreen</button>
                  </div>
                  <iframe srcDoc={previewContent} title="Email Preview" className="w-full h-full flex-grow bg-white" sandbox="allow-same-origin" />
                </div>
              )}
              {activeTab === 'placeholders' && (
                <div className="absolute inset-0 bg-surface-element border border-borders-primary rounded-b-lg rounded-tr-lg overflow-auto p-4">
                  <h4 className="text-sm font-medium text-text-secondary mb-3">Available Placeholders</h4>
                  <PlaceholderList campaignId={campaignId} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default function Editor({ campaignId, subject }: { campaignId: string; subject: string }) {
  return (
    <MaximizableView layoutId="editor-container">
      {({ isMaximized, onToggle }) => <EditorContent isMaximized={isMaximized} onToggleMaximize={onToggle} campaignId={campaignId} initialSubject={subject} />}
    </MaximizableView>
  );
}

