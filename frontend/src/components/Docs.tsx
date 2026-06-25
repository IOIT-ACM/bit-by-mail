import React from 'react';
import { Plus, Settings, FileUp, TestTube, Send } from 'lucide-react';

const InfoStep: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="flex items-start gap-4 p-6 bg-surface-card border border-borders-primary rounded-xl shadow-sm">
    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-surface-element text-accent-blue">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary leading-relaxed">{children}</p>
    </div>
  </div>
);

export const Docs: React.FC = () => {
  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-4">How to Use bit-by-mail</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            A quick guide to setting up your environment, managing campaigns, and safely dispatching your emails.
          </p>
        </header>

        <div className="space-y-6">
          <InfoStep icon={<Plus size={24} />} title="1. Create a Campaign">
            Go to the Dashboard and click <strong>"New Campaign"</strong>. Give your campaign a memorable name. Each campaign has its own unique HTML template, subject line, and recipient list.
          </InfoStep>

          <InfoStep icon={<Settings size={24} />} title="2. Configure SMTP (Global Settings)">
            Navigate to <strong>Global Settings</strong>. Enter your SMTP details (e.g., Gmail, SendGrid, Amazon SES) along with your App Password. Make sure to define an absolute path for your attachments folder if you plan on sending files.
          </InfoStep>

          <InfoStep icon={<FileUp size={24} />} title="3. Add Content & Upload Recipients">
            Open your campaign. Edit your email structure in the live HTML editor. You can use placeholders like <code className="text-sm bg-surface-element px-1.5 py-0.5 rounded text-text-primary">{"{{Name}}"}</code> or <code className="text-sm bg-surface-element px-1.5 py-0.5 rounded text-text-primary">{"{{AnyColumn}}"}</code>. Next, upload a <code className="text-sm bg-surface-element px-1.5 py-0.5 rounded text-text-primary">.csv</code> file where the columns exactly match your placeholders.
          </InfoStep>

          <InfoStep icon={<TestTube size={24} />} title="4. Run a Preflight Check">
            Before hitting send, click <strong>Preflight</strong>. The system will analyze your configuration, verify the template against your CSV placeholders, and confirm that all specified attachment files actually exist in your attachment folder.
          </InfoStep>

          <InfoStep icon={<Send size={24} />} title="5. Start Sending">
            Once preflight validation passes with no errors, click <strong>Start Sending</strong>. Review the Campaign Summary modal, confirm, and watch the live logs as emails are dispatched in real time.
          </InfoStep>
        </div>
      </div>
    </div>
  );
};

