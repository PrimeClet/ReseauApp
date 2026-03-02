import { useParams } from "react-router-dom";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import AppShell from "@/components/layout/AppShell";
import EquipementsDetailSection from "@/components/sections/EquipementsDetailSection";
import { Loader2 } from "lucide-react";

const EquipementsDetail = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useRequireAuth();
  const { code } = useParams<{ code: string }>();

  if (isLoadingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell activeSection="equipements">
      <EquipementsDetailSection equipementCode={code} />
    </AppShell>
  );
};

export default EquipementsDetail;
