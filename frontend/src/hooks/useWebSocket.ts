import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store/useAppStore";

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const { setInitialData, setRecipients, addLog, setIsSending } = useAppStore();

  const onMessage = useCallback(
    (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      const { action, payload } = data;

      switch (action) {
        case "initial_data":
          setInitialData(payload);
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
          break;
        case "log":
          addLog({ level: payload.level, message: payload.message });
          break;
        case "finish":
          setIsSending(false);
          break;
        case "preflight_result":
          addLog({ level: "info", message: "--- PREFLIGHT CHECK RESULTS ---" });
          if (payload.ok) {
            addLog({
              level: "success",
              message: "All preflight checks passed.",
            });
          } else {
            addLog({
              level: "error",
              message:
                "Preflight checks failed. Please review the errors below.",
            });
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
              addLog({ level: "warn", message: `- ${warn}` }),
            );
          }
          addLog({ level: "info", message: "-----------------------------" });
          break;
        case "notify":
          break;
      }
    },
    [setInitialData, setRecipients, addLog, setIsSending],
  );

  useEffect(() => {
    const socket = new WebSocket(`ws://${window.location.host}/ws`);
    ws.current = socket;

    socket.onopen = () => {
      console.log("WebSocket Connected");
      socket.send(JSON.stringify({ action: "get_initial_data" }));
    };
    socket.onclose = () => console.log("WebSocket Disconnected");
    socket.onerror = (error) => console.error("WebSocket Error:", error);
    socket.onmessage = onMessage;

    return () => {
      socket.close();
    };
  }, [onMessage]);

  const sendMessage = useCallback((action: string, payload?: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action, payload }));
    } else {
      console.error("WebSocket is not connected.");
    }
  }, []);

  return { sendMessage };
};
