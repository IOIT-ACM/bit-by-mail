import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

interface EditorProps {
  sendMessage: (action: string, payload?: any) => void;
}

const Editor: React.FC<EditorProps> = ({ sendMessage }) => {
  const { config, emailBody, setConfig, setEmailBody } = useAppStore();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      console.log('Autosaving editor content...');
      sendMessage('save_template', emailBody);
      sendMessage('save_config', config);
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [emailBody, config.subject_template, sendMessage, config]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfig = { ...config, subject_template: e.target.value };
    setConfig(newConfig);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col">
      <h2 className="text-xl font-semibold mb-2">Email Content</h2>
      <p className="text-sm text-gray-500 mb-4">Use placeholders like {"{Name}"}, {"{Email}"}, etc. Changes are saved automatically.</p>
      <input
        type="text"
        value={config.subject_template}
        onChange={handleSubjectChange}
        placeholder="Email Subject"
        className="bg-gray-50 border border-gray-300 p-2 rounded mb-4 w-full"
      />
      <textarea
        value={emailBody}
        onChange={(e) => setEmailBody(e.target.value)}
        placeholder="HTML Email Body"
        className="bg-gray-50 border border-gray-300 p-2 rounded w-full flex-grow font-mono text-sm"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
};

export default Editor;
