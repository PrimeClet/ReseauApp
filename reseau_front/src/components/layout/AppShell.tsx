import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import React from "react";

interface AppShellProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const noop = () => {};

export default function AppShell({
  children,
  activeSection = "",
  onSectionChange = noop,
}: AppShellProps) {
  return (
    <div className="flex h-screen bg-background flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        <main className="flex-1 overflow-auto">
          <div className="p-8 h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

