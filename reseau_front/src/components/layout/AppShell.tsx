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
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Fixed Sidebar - full height, on top */}
        {isSidebarOpen && (
          <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card overflow-y-auto z-[60]">
            <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
          </aside>
        )}

        {/* Main content area with navbar */}
        <div className={`flex flex-col flex-1 min-h-0 overflow-hidden ${isSidebarOpen ? 'ml-64' : ''} transition-all duration-300`}>
          {/* Navbar inside content area */}
          <Navbar />

          {/* Main content */}
          <main className="flex-1 overflow-auto min-w-0">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

