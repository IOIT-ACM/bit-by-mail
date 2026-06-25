import React from "react";
import { Campaign } from "../types";
import { Button } from "./shared/Button";
import { Download, Upload, TestTube, Send, XCircle } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { apiService } from "../services/apiService";
import { toast } from "sonner";

interface CampaignViewHeaderProps {
  campaign: Campaign;
  campaignId: string;
}

export const CampaignViewHeader: React.FC<CampaignViewHeaderProps> = ({ campaign, campaignId }) => {
  const { isSending, clearRecipientSelection } = useAppStore();

  const handleDownloadSample = () => {
    const csvContent = "Name,Email,AttachmentFile,Status\nJohn Doe,john.doe@example.com,certificate_john.pdf;brochure.pdf,PENDING\nJane Smith,jane.smith@example.com,certificate_jane.pdf,PENDING";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_recipients.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && campaignId) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const base64Content = btoa(text);
        apiService.uploadRecipients(campaignId, base64Content);
      };
      reader.readAsText(file);
    }
  };

  const handlePreflight = () => {
    toast.info("Running preflight check...");
    apiService.runPreflightCheck(campaignId);
  };

  const handleSend = () => {
    if (isSending) return;
    clearRecipientSelection();
    apiService.getCampaignSummary(campaignId);
  };

  const handleStop = () => {
    if (!isSending) return;
    apiService.stopMailing();
    toast.warning("Stop request sent. The process will halt after the current email.");
  };

  return (
    <div className="flex-shrink-0 flex justify-between items-center mb-6 flex-wrap gap-4">
      <h1 className="text-3xl font-bold text-text-primary tracking-tight">
        {campaign.name}
      </h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 mr-2">
          <Button onClick={handleDownloadSample} variant="secondary">
            <Download size={16} />
            <span className="hidden sm:inline">Sample</span>
          </Button>
          <input type="file" id="csv-upload" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <Button as="label" htmlFor="csv-upload" variant="success" className="cursor-pointer">
            <Upload size={16} />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
        <div className="h-6 w-px bg-borders-primary"></div>
        <div className="flex items-center gap-2 ml-2">
          <Button onClick={handlePreflight} disabled={isSending} variant="warning">
            <TestTube size={16} />
            <span className="hidden sm:inline">Preflight</span>
          </Button>
          {isSending ? (
            <Button onClick={handleStop} variant="danger">
              <XCircle size={16} />
              <span>Stop Sending</span>
            </Button>
          ) : (
            <Button onClick={handleSend} variant="primary">
              <Send size={16} />
              <span>Start Sending</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

