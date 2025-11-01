import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import GamePlay from "./pages/GamePlay";
import Transactions from "./pages/Transactions";
import Referral from "./pages/Referral";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminBets from "./pages/AdminBets";
import AdminTransactions from "./pages/AdminTransactions";
import AdminSettings from "./pages/AdminSettings";
import AllGames from "./pages/AllGames";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/jogo/:gameCode" element={<GamePlay />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/bets" element={<AdminBets />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/all-games" element={<AllGames />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
