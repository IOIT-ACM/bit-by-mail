import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store/useAppStore";
import { apiService } from "../services/apiService";
import { Recipient, RecipientIssue } from "../types";

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const {
    setInitialData,
    setRecipients,
    addLog,
    setIsSending,
    clearLogs,
    setConnectionStatus,
    setProgress,
    setRecipientIssues,
    clearRecipientIssues,
    setCampaignSummary,
    setShowCampaignSummaryModal,
  } = useAppStore();

  const onMessage = useCallback(
    (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      const { action, payload } = data;

      switch (action) {
        case "initial_data":
          setInitialData(payload);
          clearLogs();
          apiService.runPreflightCheck(payload.config);
          break;
        case "recipients_updated":
          setRecipients(payload);
          break;
        case "status_update":
          const statusLevelMap: { [key: string]: string } = {
            SENT: "success",
            ERROR: "error",
            SKIPPED: "warn",
          };
          const level = statusLevelMap[payload.status.toUpperCase()] || "info";
          addLog({
            level,
            message: `To: ${payload.email} - ${payload.details}`,
          });
          setRecipients(payload.recipients);

          const updatedRecipients = payload.recipients as Recipient[];
          const total = updatedRecipients.length;
          if (total > 0) {
            const processed = updatedRecipients.filter(
              (r) => r.Status && r.Status.toUpperCase() !== "PENDING",
            ).length;
            setProgress((processed / total) * 100);
          }
          break;
        case "log":
          addLog({ level: payload.level, message: payload.message });
          break;
        case "finish":
          setIsSending(false);
          setProgress(100);
          break;
        case "preflight_result":
          clearRecipientIssues();
          addLog({ level: "info", message: "--- PREFLIGHT CHECK RESULTS ---" });

          if (payload.successes && payload.successes.length > 0) {
            addLog({ level: "info", message: "CHECKS PASSED:" });
            payload.successes.forEach((msg: string) =>
              addLog({ level: "success", message: `+ ${msg}` }),
            );
          }

          if (payload.errors && payload.errors.length > 0) {
            addLog({ level: "info", message: "ERRORS:" });
            payload.errors.forEach((err: string) =>
              addLog({ level: "error", message: `- ${err}` }),
            );
          }

          if (payload.warnings && payload.warnings.length > 0) {
            addLog({ level: "info", message: "WARNINGS:" });
            payload.warnings.forEach((warn: string) =>
              addLog({ level: "warn", message: `! ${warn}` }),
            );
          }

          if (payload.ok) {
            addLog({
              level: "success",
              message: "Preflight complete. System is ready.",
            });
          } else {
            addLog({
              level: "error",
              message: "Preflight failed. Please resolve the errors above.",
            });
          }
          addLog({ level: "info", message: "-----------------------------" });

          const issues: Record<number, RecipientIssue> = {};
          if (
            payload.recipient_issues &&
            Array.isArray(payload.recipient_issues)
          ) {
            payload.recipient_issues.forEach((issue: any) => {
              if (typeof issue.index === "number") {
                issues[issue.index] = {
                  type: issue.type,
                  message: issue.message,
                };
              }
            });
          }
          setRecipientIssues(issues);
          break;
        case "campaign_summary":
          setCampaignSummary(payload);
          setShowCampaignSummaryModal(true);
          break;
      }
    },
    [
      setInitialData,
      setRecipients,
      addLog,
      setIsSending,
      clearLogs,
      setProgress,
      setRecipientIssues,
      clearRecipientIssues,
      setConnectionStatus,
      setCampaignSummary,
      setShowCampaignSummaryModal,
    ],
  );

  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === "development";
    const wsHost = isDevelopment ? "localhost:8888" : window.location.host;
    const socket = new WebSocket(`ws://${wsHost}/ws`);
    ws.current = socket;
    apiService.setSocket(socket);

    socket.onopen = () => {
      console.log("WebSocket Connected");
      setConnectionStatus("open");
      apiService.sendMessage("get_initial_data");
    };
    socket.onclose = () => {
      console.log("WebSocket Disconnected");
      setConnectionStatus("closed");
    };
    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setConnectionStatus("closed");
    };
    socket.onmessage = onMessage;

    return () => {
      socket.close();
      apiService.setSocket(null);
    };
  }, [onMessage, setConnectionStatus]);
};
