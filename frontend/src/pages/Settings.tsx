import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { Config } from '@/types';
import { Button } from '@/components/common/Button';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';

export default function Settings() {
  const { sender_password, setSenderPassword, isPasswordSet } = useAppStore();

  const { data: config } = useQuery<Config>({
    queryKey: ['config'],
    queryFn: () => apiService.request('get_campaigns', null, 'initial_data').then(d => d.config)
  });

  const [formState, setFormState] = useState<Omit<Config, 'sender_password' | 'subject_template'>>({
    smtp_server: '',
    smtp_port: 587,
    sender_email: '',
    use_ssl: false,
    attachment_folder: '',
    send_attachments: true
  });

  useEffect(() => {
    if (config) {
      setFormState({
        smtp_server: config.smtp_server || '',
        smtp_port: config.smtp_port || 587,
        sender_email: config.sender_email || '',
        use_ssl: config.use_ssl || false,
        attachment_folder: config.attachment_folder || '',
        send_attachments: config.send_attachments ?? true
      });
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : (name === 'smtp_port' ? parseInt(value, 10) || 0 : value);
    setFormState(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apiService.saveAndTestConfig(formState, sender_password);
    toast.success('Configuration saved. Global settings applied.');
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 lg:p-12">
      <div className="max-w-3xl mx-auto bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card p-6 md:p-8">
        <h2 className="text-3xl font-bold text-text-primary tracking-tight mb-8">Global Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-5">
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
              <p className="mt-1.5 px-1 text-xs text-text-tertiary">Must be an absolute path on the server where this application is running.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 pt-4 border-t border-borders-primary">
            <div className="flex items-center">
              <input type="checkbox" name="use_ssl" checked={formState.use_ssl} onChange={handleChange} id="use_ssl" className="h-4 w-4 rounded bg-surface-element border-borders-secondary text-accent-blue focus:ring-accent-blue" />
              <label htmlFor="use_ssl" className="ml-3 text-sm text-text-secondary">Use SSL/TLS</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="send_attachments" checked={formState.send_attachments} onChange={handleChange} id="send_attachments" className="h-4 w-4 rounded bg-surface-element border-borders-secondary text-accent-blue focus:ring-accent-blue" />
              <label htmlFor="send_attachments" className="ml-3 text-sm text-text-secondary">Send attachments</label>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" className="w-full sm:w-auto px-8">Save Configuration</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

