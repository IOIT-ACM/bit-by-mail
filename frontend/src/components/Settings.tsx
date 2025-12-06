import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Config } from '../types';
import { X } from 'lucide-react';
import { Button } from './shared/Button';
import { apiService } from '../services/apiService';
import { toast } from 'sonner';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { config, sender_password, setSenderPassword, isPasswordSet, activeCampaignId, campaigns, setActiveCampaignId } = useAppStore();
  const [formState, setFormState] = useState<Omit<Config, 'sender_password' | 'subject_template'>>(config);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
  const confirmationText = activeCampaign ? `delete ${activeCampaign.name}` : '';
  const isDeleteDisabled = deleteConfirmation !== confirmationText;

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
    apiService.saveAndTestConfig(formState, sender_password);
    toast.success('Configuration saved. Running preflight check.');
    onClose();
  };

  const handleDeleteCampaign = () => {
    if (activeCampaignId && activeCampaign) {
      apiService.deleteCampaign(activeCampaignId);
      setActiveCampaignId(null);
      window.history.pushState({}, '', window.location.pathname);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-borders-primary flex justify-between items-center">
          <h2 className="text-heading-4 sm:text-heading-3 font-medium text-text-primary">Configuration</h2>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 no-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-4">
              <LabeledField label="SMTP Server" description="Enter the address of your outgoing mail server.">
                <InputField name="smtp_server" value={formState.smtp_server} onChange={handleChange} placeholder="SMTP Server" />
              </LabeledField>
              <LabeledField label="SMTP Port" description="Provide the port used by your mail server, typically 465 or 587.">
                <InputField name="smtp_port" type="number" value={formState.smtp_port} onChange={handleChange} placeholder="SMTP Port" />
              </LabeledField>
              <LabeledField label="Sender Email" description="The email address from which the mails will be sent.">
                <InputField name="sender_email" type="email" value={formState.sender_email} onChange={handleChange} placeholder="Sender Email" />
              </LabeledField>
              <LabeledField label="Sender Password" description="The password or app-specific password for the sender email account.">
                <InputField name="sender_password" type="password" value={sender_password} onChange={(e) => setSenderPassword(e.target.value)} placeholder={isPasswordSet ? "Leave blank to use saved password" : "Sender Password"} />
              </LabeledField>
              <div>
                <LabeledField label="Attachment Folder Path" description="Absolute path on the server where attachments are stored.">
                  <InputField name="attachment_folder" value={formState.attachment_folder} onChange={handleChange} placeholder="Attachment Folder Path" />
                </LabeledField>
                <p className="mt-1.5 px-1 text-xs text-text-tertiary">
                  Must be an absolute path on the server where this application is running.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
              <div className="flex items-center">
                <input type="checkbox" name="use_ssl" checked={formState.use_ssl} onChange={handleChange} id="use_ssl" className="h-4 w-4 rounded bg-surface-element border-borders-secondary text-accent-blue focus:ring-accent-blue" />
                <label htmlFor="use_ssl" className="ml-3 text-sm text-text-secondary">Use SSL/TLS</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="send_attachments" checked={formState.send_attachments} onChange={handleChange} id="send_attachments" className="h-4 w-4 rounded bg-surface-element border-borders-secondary text-accent-blue focus:ring-accent-blue" />
                <label htmlFor="send_attachments" className="ml-3 text-sm text-text-secondary">Send attachments</label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" className="w-full sm:w-auto">
                Save Configuration
              </Button>
            </div>
          </form>

          {activeCampaign && (
            <div className="mt-8 p-4 sm:p-6 border-t border-borders-primary bg-status-danger-bg/10 rounded-lg">
              <h3 className="text-base sm:text-lg font-medium text-status-danger-text">Danger Zone</h3>
              <p className="text-sm text-text-secondary mt-1">
                This action is irreversible. It will permanently delete the campaign "{activeCampaign.name}" and all its associated data.
              </p>
              <div className="mt-4">
                <label className="text-sm font-medium text-text-secondary">
                  To confirm, type <code className="text-status-danger-text bg-black/20 px-1.5 py-1 rounded">{confirmationText}</code> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="mt-2 w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-status-danger-text/50 focus:border-status-danger-text transition-colors"
                />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleDeleteCampaign}
                  disabled={isDeleteDisabled}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 h-10 px-4 rounded-button text-sm font-medium transition-colors duration-200 bg-status-danger-text/80 hover:bg-status-danger-text text-white disabled:bg-surface-element disabled:text-text-tertiary disabled:cursor-not-allowed"
                >
                  Delete this campaign
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LabeledField: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-sm font-medium text-text-primary">{label}</label>
    <p className="text-xs text-text-tertiary">{description}</p>
    {children}
  </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors" />
);

export default Settings;
