import { useState } from "react";
import DataTableEnhanced from "@/components/ui/data-table-enhanced";
import DetailsModal from "@/components/ui/details-modal";
import EditModal from "@/components/ui/edit-modal";
import AddMaintenanceForm from "@/components/forms/AddMaintenanceForm";
import PageHeader from "@/components/ui/page-header";
import { useData } from "@/contexts/DataContext";
import { Wrench } from "lucide-react";

export default function MaintenanceSection() {
  const { maintenances, isLoadingMaintenances, maintenanceError, refetchMaintenances } = useData();
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);


  const handleRowClick = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setIsDetailsOpen(true);
  };

  const handleEdit = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setIsEditOpen(true);
  };

  const handleSave = (updatedMaintenance: any) => {
    console.log('Saving maintenance:', updatedMaintenance);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de la Maintenance"
        description="Planification et suivi des interventions techniques"
        icon={<Wrench className="h-6 w-6 text-primary" />}
        breadcrumbs={[
          { label: "Tableau de bord", href: "/" },
          { label: "Maintenance" },
        ]}
        actions={<AddMaintenanceForm />}
      />

      {isLoadingMaintenances ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Chargement des maintenances...</div>
        </div>
      ) : maintenanceError ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">
            Erreur lors du chargement des maintenances: {maintenanceError.message}
          </div>
        </div>
      ) : maintenances.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-lg font-medium mb-2">Aucune maintenance programmée</div>
          <div className="text-sm">Utilisez le bouton "Planifier maintenance" pour créer une nouvelle maintenance</div>
        </div>
      ) : (
        <DataTableEnhanced
          title={`${maintenances.length} maintenances programmées`}
          columns={["Type", "Équipement", "Date début", "Heure", "Durée", "Technicien", "Priorité", "Statut"]}
          data={maintenances.map((maint) => ({
            id: maint.id,
            Type: maint.type,
            Équipement: maint.equipement ? `${maint.equipement.name} (${maint.equipement.equipement_code})` : '-',
            "Date début": maint.date_debut ? new Date(maint.date_debut).toLocaleDateString('fr-FR') : '-',
            Heure: maint.heure_debut || '-',
            Durée: maint.duree || '-',
            Technicien: maint.technicien || '-',
            Priorité: maint.priorite || '-',
            Statut: maint.statut || '-',
          }))}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
        />
      )}

      <DetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        title="Détails de la maintenance"
        data={selectedMaintenance}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      <EditModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier la maintenance"
        data={selectedMaintenance}
        onSave={handleSave}
      />
    </div>
  );
}