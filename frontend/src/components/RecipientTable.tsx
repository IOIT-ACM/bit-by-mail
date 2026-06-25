import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import { Recipient, CampaignData, Config } from "../types";
import { Maximize, Minimize, Eye, Plus } from "lucide-react";
import { useDebouncedEffect } from "../hooks/useDebouncedEffect";
import { apiService } from "../services/apiService";
import { MaximizableView } from "./shared/MaximizableView";
import { EditableCell } from "./shared/EditableCell";
import { queryClient } from "../queryClient";

const RecipientTableContent: React.FC<{ isMaximized: boolean; onToggleMaximize: () => void; campaignId: string }> = ({ isMaximized, onToggleMaximize, campaignId }) => {
  const { data } = useQuery<CampaignData>({ queryKey: ['campaignData', campaignId] });
  const { data: config } = useQuery<Config>({ queryKey: ['config'] });
  const recipients = data?.recipients ?? [];
  const showAttachments = config?.send_attachments ?? true;

  const {
    setPreviewRecipient,
    recipientIssues,
    selectedRecipientIndices,
    toggleRecipientSelection,
    selectAllRecipients,
    clearRecipientSelection,
    setShowAddRecipientModal,
  } = useAppStore();

  const isAllSelected = recipients.length > 0 && selectedRecipientIndices.size === recipients.length;

  const handleSelectAll = () => {
    if (isAllSelected) clearRecipientSelection();
    else selectAllRecipients(recipients.length);
  };

  useDebouncedEffect(() => {
    if (campaignId && recipients.length > 0) {
      apiService.saveRecipients(campaignId, recipients);
    }
  }, 1500, [recipients]);

  const handleCellChange = (index: number, field: keyof Recipient, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = { ...newRecipients[index], [field]: value };
    queryClient.setQueryData<CampaignData>(['campaignData', campaignId], (old) => old ? { ...old, recipients: newRecipients } : old);
  };

  const handleViewAttachment = (index: number, attachmentString: string) => {
    if (campaignId && attachmentString) {
      const files = attachmentString.split(";").map((f) => f.trim()).filter(Boolean);
      if (files.length > 0) window.open(`/attachments/${campaignId}/${index}?file=${encodeURIComponent(files[0])}`, "_blank");
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SENT": return "bg-status-success-bg text-status-success-text";
      case "ERROR": return "bg-status-danger-bg text-status-danger-text";
      case "SKIPPED": return "bg-status-info-bg text-status-info-text";
      default: return "bg-surface-element text-text-secondary";
    }
  };

  const getRowClasses = (status: string, index: number) => {
    const isSelected = selectedRecipientIndices.has(index);
    if (isSelected) return "bg-accent-blue/20 hover:bg-accent-blue/30";
    const issue = recipientIssues[index];
    if (issue?.type === "error") return "bg-status-danger-bg/20 hover:bg-status-danger-bg/30";
    if (issue?.type === "warning") return "bg-accent-orange/20 hover:bg-accent-orange/30";
    if (status?.toUpperCase() === "ERROR") return "bg-status-danger-bg/20 hover:bg-status-danger-bg/30";
    return "hover:bg-surface-element/50";
  };

  return (
    <div className="p-2 flex flex-col h-full overflow-hidden relative">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-heading-3 font-medium text-text-primary">Recipients ({recipients.length})</h2>
            <button onClick={() => setShowAddRecipientModal(true)} className="p-1.5 rounded-full text-text-secondary bg-surface-element hover:bg-surface-element-hover hover:text-text-primary transition-colors">
              <Plus size={16} />
            </button>
          </div>
          {!showAttachments && <p className="text-sm text-text-secondary italic mt-1">Attachments disabled for this mail campaign.</p>}
        </div>
      </div>
      <button onClick={onToggleMaximize} className="absolute top-2 right-2 p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors z-10">
        {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
      </button>
      <div className="overflow-auto flex-grow -mr-3 pr-3">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase sticky top-0 bg-[#1e1e2a] z-10">
            <tr>
              <th scope="col" className="px-4 py-3 w-12 text-center"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="custom-checkbox" /></th>
              <th scope="col" className="px-4 py-3 w-12 text-center"></th>
              <th scope="col" className="px-4 py-3 w-16 text-center">#</th>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Email</th>
              {showAttachments && <th scope="col" className="px-4 py-3">Attachment File</th>}
              <th scope="col" className="px-4 py-3 w-32 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((recipient, index) => (
              <tr key={index} className={`border-b border-borders-primary transition-colors ${getRowClasses(recipient.Status, index)}`} title={recipientIssues[index]?.message}>
                <td className="px-4 py-2 text-center align-middle"><input type="checkbox" checked={selectedRecipientIndices.has(index)} onChange={() => toggleRecipientSelection(index)} className="custom-checkbox" /></td>
                <td className="px-4 py-2 text-center align-middle"><button onClick={() => setPreviewRecipient(recipient)} className="p-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-element-hover transition-colors"><Eye size={16} /></button></td>
                <td className="px-4 py-2 text-center align-middle text-text-secondary">{index + 1}</td>
                <td className="p-1 align-middle"><EditableCell value={recipient.Name} onSave={(val) => handleCellChange(index, "Name", val)} /></td>
                <td className="p-1 align-middle"><EditableCell value={recipient.Email} onSave={(val) => handleCellChange(index, "Email", val)} /></td>
                {showAttachments && <td className="p-1 align-middle"><EditableCell value={recipient.AttachmentFile} onSave={(val) => handleCellChange(index, "AttachmentFile", val)} onView={() => handleViewAttachment(index, recipient.AttachmentFile)} /></td>}
                <td className="px-4 py-2 text-center align-middle"><span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusClasses(recipient.Status)}`}>{recipient.Status || "PENDING"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function RecipientTable({ campaignId }: { campaignId: string }) {
  return (
    <MaximizableView layoutId="recipient-table-container">
      {({ isMaximized, onToggle }) => <RecipientTableContent isMaximized={isMaximized} onToggleMaximize={onToggle} campaignId={campaignId} />}
    </MaximizableView>
  );
}

