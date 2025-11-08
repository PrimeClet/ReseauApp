import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddLiaisonForm from "@/components/forms/AddLiaisonForm";
import { useData } from "@/contexts/DataContext";

export default function LiaisonsSection() {
  const { liaisons } = useData();
  const [selectedLiaison, setSelectedLiaison] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleRowClick = (liaison: any) => {
    setSelectedLiaison(liaison);
    setIsDetailsOpen(true);
  };

  const handleEdit = (liaison: any) => {
    setSelectedLiaison(liaison);
    setIsEditOpen(true);
  };

  const handleSave = (updatedLiaison: any) => {
    console.log('Saving liaison:', updatedLiaison);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Liaisons</h2>
          <div className="text-sm text-muted-foreground mt-1">
            Configuration et monitoring des connexions réseau
          </div>
        </div>
        <AddLiaisonForm />
      </div>

      <DataTableEnhanced
        title={`${liaisons.length} liaisons configurées`}
        columns={["nom", "type", "origine", "destination", "etat", "bande", "latence"]}
        data={liaisons}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
      />

      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Détails de la liaison"
        data={selectedLiaison}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier la liaison"
        data={selectedLiaison}
        onSave={handleSave}
      />
    </div>
  );
}