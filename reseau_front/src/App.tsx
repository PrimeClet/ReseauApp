import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages chargees immediatement (critiques pour le premier rendu)
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Pages chargees en lazy loading
const Profile = lazy(() => import("./pages/Profile"));
const Batiments = lazy(() => import("./pages/Batiments"));
const Salles = lazy(() => import("./pages/Salles"));
const Sites = lazy(() => import("./pages/Sites"));
const Zones = lazy(() => import("./pages/Zones"));
const Armoires = lazy(() => import("./pages/Armoires"));
const ArmoiresDetail = lazy(() => import("./pages/ArmoiresDetail"));
const Equipements = lazy(() => import("./pages/Equipements"));
const EquipementsDetail = lazy(() => import("./pages/EquipementsDetail"));
const Ports = lazy(() => import("./pages/Ports"));
const Liaisons = lazy(() => import("./pages/Liaisons"));
const Roles = lazy(() => import("./pages/Roles"));
const Permissions = lazy(() => import("./pages/Permissions"));
const Users = lazy(() => import("./pages/Users"));
const Vlans = lazy(() => import("./pages/Vlans"));
const LanCartography = lazy(() => import("./pages/LanCartography"));
const Maintenances = lazy(() => import("./pages/Maintenances"));
const Modifications = lazy(() => import("./pages/Modifications"));
const ValidationModifications = lazy(() => import("./pages/ValidationModifications"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ModificationHistory = lazy(() => import("./pages/ModificationHistory"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const ActivityLogs = lazy(() => import("./pages/ActivityLogs"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Routes publiques */}
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Routes protegees - authentification requise */}
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                {/* Infrastructure - permission batiments.voir */}
                <Route path="/sites" element={<ProtectedRoute permission="batiments.voir"><Sites /></ProtectedRoute>} />
                <Route path="/zones" element={<ProtectedRoute permission="batiments.voir"><Zones /></ProtectedRoute>} />
                <Route path="/batiments" element={<ProtectedRoute permission="batiments.voir"><Batiments /></ProtectedRoute>} />
                <Route path="/salles" element={<ProtectedRoute permission="salles.voir"><Salles /></ProtectedRoute>} />

                {/* Inventaire reseau */}
                <Route path="/armoires" element={<ProtectedRoute permission="armoires.voir"><Armoires /></ProtectedRoute>} />
                <Route path="/armoires/:code/details" element={<ProtectedRoute permission="armoires.voir"><ArmoiresDetail /></ProtectedRoute>} />
                <Route path="/equipements" element={<ProtectedRoute permission="equipements.voir"><Equipements /></ProtectedRoute>} />
                <Route path="/equipements/:code/details" element={<ProtectedRoute permission="equipements.voir"><EquipementsDetail /></ProtectedRoute>} />
                <Route path="/ports" element={<ProtectedRoute permission="ports.voir"><Ports /></ProtectedRoute>} />
                <Route path="/liaisons" element={<ProtectedRoute permission="liaisons.voir"><Liaisons /></ProtectedRoute>} />
                <Route path="/vlans" element={<ProtectedRoute permission="equipements.voir"><Vlans /></ProtectedRoute>} />

                {/* Cartographie */}
                <Route path="/cartographie-lan" element={<ProtectedRoute permission="cartographie.voir"><LanCartography /></ProtectedRoute>} />

                {/* Maintenance & Modifications */}
                <Route path="/maintenances" element={<ProtectedRoute permission="maintenances.voir"><Maintenances /></ProtectedRoute>} />
                <Route path="/modifications" element={<ProtectedRoute permission="modifications.voir"><Modifications /></ProtectedRoute>} />
                <Route path="/validation-modifications" element={<ProtectedRoute anyRole={['Super Admin', 'Administrateur']}><ValidationModifications /></ProtectedRoute>} />
                <Route path="/modification-history" element={<ProtectedRoute permission="modifications.voir"><ModificationHistory /></ProtectedRoute>} />

                {/* Administration */}
                <Route path="/users" element={<ProtectedRoute anyRole={['Super Admin', 'Administrateur']}><Users /></ProtectedRoute>} />
                <Route path="/roles" element={<ProtectedRoute anyRole={['Super Admin', 'Administrateur']}><Roles /></ProtectedRoute>} />
                <Route path="/permissions" element={<ProtectedRoute anyRole={['Super Admin', 'Administrateur']}><Permissions /></ProtectedRoute>} />
                <Route path="/activity-logs" element={<ProtectedRoute anyRole={['Super Admin', 'Administrateur']}><ActivityLogs /></ProtectedRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
