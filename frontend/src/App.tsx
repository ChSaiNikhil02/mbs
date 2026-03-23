import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardOverview from "./pages/DashboardOverview";
import AccountsPage from "./pages/AccountsPage";
import TransactionsPage from "./pages/TransactionsPage";
import ProfilePage from "./pages/ProfilePage";
import KycPage from "./pages/KycPage";
import BudgetsPage from "./pages/BudgetsPage";
import PaymentsPage from "./pages/PaymentsPage";
import AlertsPage from "./pages/AlertsPage";
import BillsPage from "./pages/BillsPage";
import RewardsPage from "./pages/RewardsPage";
import InsightsPage from "./pages/InsightsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" enableSystem attribute="class">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverview />} />
                <Route path="accounts" element={<AccountsPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="kyc" element={<KycPage />} />
                <Route path="budgets" element={<BudgetsPage />} />
                <Route path="bills" element={<BillsPage />} />
                <Route path="rewards" element={<RewardsPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="alerts" element={<AlertsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
