import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import React, { createContext, useContext, useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const noop = () => {};

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarToggle = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarToggle must be used within AppShell");
  }
  return context;
};

export default function AppShell({
  children,
  activeSection = "",
  onSectionChange = noop,
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
  };

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, setSidebarOpen }}>
      <div className="flex h-screen bg-background flex-col overflow-hidden relative">
        <Navbar />
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {isSidebarOpen && (
            <div className="absolute top-0 left-0 z-40 h-full">
              <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
            </div>
          )}
          <main className={`flex-1 overflow-auto min-w-0 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <div className="p-8">{children}</div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

