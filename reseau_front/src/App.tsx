import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Batiments from "./pages/Batiments";
import Salles from "./pages/Salles";
import Sites from "./pages/Sites";
import Zones from "./pages/Zones";
import Armoires from "./pages/Armoires";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Lans from "./pages/Lans";
import LanCartography from "./pages/LanCartography";
import Modifications from "./pages/Modifications";
import ValidationModifications from "./pages/ValidationModifications";
import Notifications from "./pages/Notifications";
import ModificationHistory from "./pages/ModificationHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/batiments" element={<Batiments />} />
              <Route path="/salles" element={<Salles />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/zones" element={<Zones />} />
              <Route path="/armoires" element={<Armoires />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/lans" element={<Lans />} />
              <Route path="/cartographie-lan" element={<LanCartography />} />
              <Route path="/modifications" element={<Modifications />} />
              <Route path="/validation-modifications" element={<ValidationModifications />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/modification-history" element={<ModificationHistory />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
