import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import ArmoiresSection from "@/components/sections/ArmoiresSection";
import EquipmentsSection from "@/components/sections/EquipmentsSection";
import LiaisonsSection from "@/components/sections/LiaisonsSection";
import PortsSection from "@/components/sections/PortsSection";
import MaintenanceSection from "@/components/sections/MaintenanceSection";
import ParametresSection from "@/components/sections/ParametresSection";
import UsersSection from "@/components/sections/UsersSection";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Récupérer la section active depuis localStorage au chargement
  useEffect(() => {
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection) {
      setActiveSection(savedSection);
      localStorage.removeItem('activeSection');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case "armoires":
        return <ArmoiresSection />;
      case "equipements":
        return <EquipmentsSection />;
      case "liaisons":
        return <LiaisonsSection />;
      case "ports":
        return <PortsSection />;
      case "maintenance":
        return <MaintenanceSection />;
      case "parametres":
        return <ParametresSection />;
      case "users":
        return <UsersSection />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <AppShell activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </AppShell>
  );
};

export default Index;