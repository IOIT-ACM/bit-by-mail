import React from "react";
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./components/Sidebar";
import { useWebSocket } from "./hooks/useWebSocket";
import { SelectionPopup } from "./components/shared/SelectionPopup";
import { RecipientActionPopup } from "./components/shared/RecipientActionPopup";

const App: React.FC = () => {
  useWebSocket();

  return (
    <div className="flex h-screen bg-background-base text-text-primary font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 h-full overflow-hidden relative">
        <Outlet />
      </main>
      <SelectionPopup />
      <RecipientActionPopup />
    </div>
  );
};

export default App;

