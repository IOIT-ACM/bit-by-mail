import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Config } from '../types';
import { X } from 'lucide-react';

interface SettingsProps {
  sendMessage: (action: string, payload?: any) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ sendMessage, onClose }) => {
  const { config, setConfig, sender_password, setSenderPassword, isPasswordSet } = useAppStore();
  const [formState, setFormState] = useState<Omit<Config, 'sender_password'>>(config);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : (name === 'smtp_port' ? parseInt(value, 10) || 0 : value);
    setFormState(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const configToSave = { ...config, ...formState };
    const fullConfigForBackend = { ...configToSave, sender_password };
    setConfig(configToSave);
    sendMessage('save_config', fullConfigForBackend);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card overflow-hidden">
        <div className="p-6 border-b border-borders-primary flex justify-between items-center">
          <h2 className="text-heading-3 font-medium text-text-primary">Configuration</h2>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField name="smtp_server" value={formState.smtp_server} onChange={handleChange} placeholder="SMTP Server" />
            <InputField name="smtp_port" type="number" value={formState.smtp_port} onChange={handleChange} placeholder="SMTP Port" />
            <InputField name="sender_email" type="email" value={formState.sender_email} onChange={handleChange} placeholder="Sender Email" />
            <InputField name="sender_password" type="password" value={sender_password} onChange={(e) => setSenderPassword(e.target.value)} placeholder={isPasswordSet ? "Leave blank to use saved password" : "Sender Password"} />
            <div className="md:col-span-2">
              <InputField name="attachment_folder" value={formState.attachment_folder} onChange={handleChange} placeholder="Attachment Folder Path" />
            </div>
          </div>
          <div className="flex items-center">
            <input type="checkbox" name="use_ssl" checked={formState.use_ssl} onChange={handleChange} id="use_ssl" className="h-4 w-4 rounded bg-surface-element border-borders-secondary text-accent-blue focus:ring-accent-blue" />
            <label htmlFor="use_ssl" className="ml-3 block text-sm text-text-secondary">Use SSL/TLS</label>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="h-10 px-6 rounded-button text-sm font-medium transition-colors duration-200 bg-accent-blue hover:bg-accent-blue/80 text-white">
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors" />
);

export default Settings;
