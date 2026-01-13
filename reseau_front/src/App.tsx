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
import Armoires from "./pages/Armoires";
import ArmoiresDetail from "./pages/ArmoiresDetail";
import Equipements from "./pages/Equipements";
import Ports from "./pages/Ports";
import Liaisons from "./pages/Liaisons";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import Users from "./pages/Users";
import Lans from "./pages/Lans";
import LanCartography from "./pages/LanCartography";

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
              <Route path="/armoires" element={<Armoires />} />
              <Route path="/armoires-detail" element={<ArmoiresDetail />} />
              <Route path="/equipements" element={<Equipements />} />
              <Route path="/ports" element={<Ports />} />
              <Route path="/liaisons" element={<Liaisons />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/users" element={<Users />} />
              <Route path="/lans" element={<Lans />} />
              <Route path="/cartographie-lan" element={<LanCartography />} />
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
