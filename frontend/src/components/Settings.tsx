import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Config } from '../types';

interface SettingsProps {
  sendMessage: (action: string, payload?: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ sendMessage }) => {
  const { config, setConfig, sender_password, setSenderPassword } = useAppStore();
  const [formState, setFormState] = useState<Omit<Config, 'sender_password'>>({
    smtp_server: '', smtp_port: 587, use_ssl: false, sender_email: '',
    subject_template: '', attachment_folder: ''
  });

  useEffect(() => {
    if (config) {
      setFormState(config);
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : (name === 'smtp_port' ? parseInt(value, 10) : value);
    setFormState(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const configToSave = { ...config, ...formState };
    const fullConfigForBackend = { ...configToSave, sender_password };
    setConfig(configToSave);
    sendMessage('save_config', fullConfigForBackend);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Configuration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="smtp_server" value={formState.smtp_server} onChange={handleChange} placeholder="SMTP Server" className="bg-gray-100 border border-gray-300 p-2 rounded" />
          <input type="number" name="smtp_port" value={formState.smtp_port} onChange={handleChange} placeholder="SMTP Port" className="bg-gray-100 border border-gray-300 p-2 rounded" />
          <input type="email" name="sender_email" value={formState.sender_email} onChange={handleChange} placeholder="Sender Email" className="bg-gray-100 border border-gray-300 p-2 rounded" />
          <input type="password" name="sender_password" value={sender_password} onChange={(e) => setSenderPassword(e.target.value)} placeholder="New Sender Password (optional)" className="bg-gray-100 border border-gray-300 p-2 rounded" />
          <input type="text" name="attachment_folder" value={formState.attachment_folder} onChange={handleChange} placeholder="Attachment Folder Path" className="bg-gray-100 border border-gray-300 p-2 rounded" />
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="use_ssl" checked={formState.use_ssl} onChange={handleChange} id="use_ssl" className="mr-2 h-4 w-4" />
          <label htmlFor="use_ssl">Use SSL/TLS</label>
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save Configuration</button>
      </form>
    </div>
  );
};

export default Settings;
