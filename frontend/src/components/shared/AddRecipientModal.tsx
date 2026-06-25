import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../../store/useAppStore";
import { CampaignData, Recipient } from "../../types";
import { Button } from "./Button";
import { UserPlus, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { queryClient } from "../../queryClient";
import { apiService } from "../../services/apiService";

export const AddRecipientModal: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const { setShowAddRecipientModal } = useAppStore();
  const { data } = useQuery<CampaignData>({ queryKey: ['campaignData', campaignId] });
  const recipients = data?.recipients ?? [];

  const availableColumns = useMemo(() => {
    if (recipients.length > 0) return Object.keys(recipients[0]).filter((key) => key !== "Status" && key !== "SentTimestamp");
    return ["Name", "Email", "AttachmentFile"];
  }, [recipients]);

  const [formState, setFormState] = useState<Record<string, string>>(() => availableColumns.reduce((acc, key) => ({ ...acc, [key]: "" }), {}));

  const handleClose = () => setShowAddRecipientModal(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.Email || !formState.Name) {
      toast.error("Name and Email are required fields.");
      return;
    }
    const newRecipientData: { [key: string]: string } = {};
    availableColumns.forEach((col) => { newRecipientData[col] = formState[col] || ""; });
    const newRecipient = { ...newRecipientData, Status: "PENDING" } as Recipient;

    const newRecipients = [...recipients, newRecipient];
    queryClient.setQueryData<CampaignData>(['campaignData', campaignId], (old) => old ? { ...old, recipients: newRecipients } : old);

    apiService.saveRecipients(campaignId, newRecipients);
    apiService.runPreflightCheck(campaignId);

    toast.success(`Recipient "${formState.Name}" added.`);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} />
      <motion.div className="relative w-full max-w-lg bg-surface-card border border-borders-primary rounded-card shadow-card p-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-heading-3 font-medium text-text-primary">Add New Recipient</h2>
          <button onClick={handleClose} className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {availableColumns.map((column) => (
            <div key={column}>
              <label className="text-sm font-medium text-text-secondary mb-1 block">{column}</label>
              <input type={column.toLowerCase() === "email" ? "email" : "text"} name={column} value={formState[column] || ""} onChange={(e) => setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }))} placeholder={`Enter ${column}...`} className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors" required={column === "Name" || column === "Email"} />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="primary"><UserPlus size={16} />Add Recipient</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

