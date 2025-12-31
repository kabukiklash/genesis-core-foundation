import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/genesis/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import CellsPage from "./pages/CellsPage";
import CellDetailPage from "./pages/CellDetailPage";
import RuntimePage from "./pages/RuntimePage";
import VibeCodePage from "./pages/VibeCodePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cells" element={<CellsPage />} />
            <Route path="/cells/:id" element={<CellDetailPage />} />
            <Route path="/runtime" element={<RuntimePage />} />
            <Route path="/vibecode" element={<VibeCodePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
