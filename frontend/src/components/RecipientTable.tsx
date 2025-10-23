import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Recipient } from '../types';
import { Upload, Download, Maximize, Minimize } from 'lucide-react';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import { apiService } from '../services/apiService';
import { Button } from './shared/Button';
import { MaximizableView } from './shared/MaximizableView';
import { EditableCell } from './shared/EditableCell';

const RecipientTableContent: React.FC<{
  isMaximized: boolean;
  onToggleMaximize: () => void;
}> = ({ isMaximized, onToggleMaximize }) => {
  const { recipients, updateRecipient, setPreviewRecipient, config, recipientIssues } = useAppStore();
  const showAttachments = config.send_attachments;

  useDebouncedEffect(
    () => {
      if (recipients.length > 0) {
        apiService.saveRecipients(recipients);
      }
    },
    1500,
    [recipients]
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const base64Content = btoa(text);
        apiService.uploadRecipients(base64Content);
      };
      reader.readAsText(file);
    }
  };

  const handleCellChange = (index: number, field: keyof Recipient, value: string) => {
    const recipient = recipients[index];
    updateRecipient(index, { ...recipient, [field]: value });
  };

  const handleViewEmail = (recipient: Recipient) => {
    setPreviewRecipient(recipient);
  };

  const handleViewAttachment = (filename: string) => {
    if (filename) {
      window.open(`/attachments/${filename}`, '_blank');
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SENT':
        return 'bg-status-success-bg text-status-success-text';
      case 'ERROR':
        return 'bg-status-danger-bg text-status-danger-text';
      case 'SKIPPED':
        return 'bg-status-info-bg text-status-info-text';
      default:
        return 'bg-surface-element text-text-secondary';
    }
  };

  const getRowClasses = (status: string, index: number) => {
    const issue = recipientIssues[index];
    if (issue?.type === 'error') {
      return 'bg-status-danger-bg/20 hover:bg-status-danger-bg/30';
    }
    if (issue?.type === 'warning') {
      return 'bg-accent-orange/20 hover:bg-accent-orange/30';
    }
    if (status?.toUpperCase() === 'ERROR') {
      return 'bg-status-danger-bg/20 hover:bg-status-danger-bg/30';
    }
    return 'hover:bg-surface-element/50';
  };

  const handleDownloadSample = () => {
    const csvContent =
      'Name,Email,AttachmentFile,Status\nJohn Doe,john.doe@example.com,certificate_john.pdf,PENDING\nJane Smith,jane.smith@example.com,certificate_jane.pdf,PENDING';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_recipients.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-2 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-heading-3 font-medium text-text-primary">Recipients ({recipients.length})</h2>
            <button
              onClick={onToggleMaximize}
              className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
            >
              {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
          {!showAttachments && (
            <p className="text-sm text-text-secondary italic mt-1">Attachments disabled for this mail campaign.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadSample} variant="secondary">
            <Download size={16} />
            <span>Sample Data</span>
          </Button>
          <input type="file" id="csv-upload" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <Button as="label" htmlFor="csv-upload" variant="success" className="cursor-pointer">
            <Upload size={16} />
            <span>Upload Data</span>
          </Button>
        </div>
      </div>
      <div className="overflow-auto flex-grow -mr-3 pr-3" style={!isMaximized ? { maxHeight: '400px' } : {}}>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase sticky top-0 bg-surface-card">
            <tr>
              <th scope="col" className="px-4 py-3 w-16 text-center">
                #
              </th>
              <th scope="col" className="px-4 py-3">
                Name
              </th>
              <th scope="col" className="px-4 py-3">
                Email
              </th>
              {showAttachments && (
                <th scope="col" className="px-4 py-3">
                  Attachment File
                </th>
              )}
              <th scope="col" className="px-4 py-3 w-32 text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((recipient, index) => (
              <tr
                key={index}
                className={`border-b border-borders-primary transition-colors ${getRowClasses(
                  recipient.Status,
                  index
                )}`}
                title={recipientIssues[index]?.message}
              >
                <td className="px-4 py-2 text-center align-middle text-text-secondary">{index + 1}</td>
                <td className="p-1 align-middle">
                  <EditableCell
                    value={recipient.Name}
                    onSave={(newValue) => handleCellChange(index, 'Name', newValue)}
                    onView={() => handleViewEmail(recipient)}
                  />
                </td>
                <td className="p-1 align-middle">
                  <EditableCell
                    value={recipient.Email}
                    onSave={(newValue) => handleCellChange(index, 'Email', newValue)}
                  />
                </td>
                {showAttachments && (
                  <td className="p-1 align-middle">
                    <EditableCell
                      value={recipient.AttachmentFile}
                      onSave={(newValue) => handleCellChange(index, 'AttachmentFile', newValue)}
                      onView={() => handleViewAttachment(recipient.AttachmentFile)}
                    />
                  </td>
                )}
                <td className="px-4 py-2 text-center align-middle">
                  <span
                    className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusClasses(
                      recipient.Status
                    )}`}
                  >
                    {recipient.Status || 'PENDING'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RecipientTable: React.FC = () => {
  return (
    <MaximizableView layoutId="recipient-table-container">
      {({ isMaximized, onToggle }) => <RecipientTableContent isMaximized={isMaximized} onToggleMaximize={onToggle} />}
    </MaximizableView>
  );
};

export default RecipientTable;
