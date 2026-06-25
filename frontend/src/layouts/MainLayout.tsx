import React from "react";
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { useWebSocket } from "@/hooks/useWebSocket";
import { SelectionPopup } from "@/features/campaigns/components/SelectionPopup";
import { RecipientActionPopup } from "@/features/campaigns/components/RecipientActionPopup";

const MainLayout: React.FC = () => {
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

export default MainLayout;