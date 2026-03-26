import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/apiClient";
import CashflowChart from "@/components/insights/CashflowChart";
import CategorySpendChart from "@/components/insights/CategorySpendChart";
import TopMerchantsChart from "@/components/insights/TopMerchantsChart";
import BurnRateCard from "@/components/insights/BurnRateCard";
import { LoadingState, ErrorState } from "@/components/FeedbackStates";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CashflowData, CategorySpendData, TopMerchantData, BurnRateData } from "@/hooks/useInsights";

export default function InsightsPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [cashflowData, setCashflowData] = useState<CashflowData[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySpendData[]>([]);
  const [merchantData, setMerchantData] = useState<TopMerchantData[]>([]);
  const [burnRateData, setBurnRateData] = useState<BurnRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    try {
      const [cf, cs, tm, br] = await Promise.all([
        apiClient<CashflowData[]>("api/insights/cash-flow", { token }),
        apiClient<CategorySpendData[]>("api/insights/category-spend", { token }),
        apiClient<TopMerchantData[]>("api/insights/top-merchants", { token }),
        apiClient<BurnRateData>("api/insights/burn-rate", { token }),
      ]);
      setCashflowData(cf);
      setCategoryData(cs);
      setMerchantData(tm);
      setBurnRateData(br);

      if (cf.length === 0 && cs.length === 0 && tm.length === 0 && (!br || br.burn_rate === 0)) {
        console.log("No financial insights data available for the current user.");
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Step 4: Add Real-Time Feel (Auto-refresh every 60 seconds)
    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [token]);

  const handleExport = async () => {
    if (!token) return;
    if (cashflowData.length === 0 && categoryData.length === 0 && merchantData.length === 0 && (!burnRateData || burnRateData.burn_rate === 0)) {
      toast({ title: "No data to export", description: "Your financial insights are empty.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/export/insights?format=pdf`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial_insights_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  if (loading) {
    return <LoadingState message="Analyzing your finances..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Analysis Failed"
        message="We couldn't generate your financial insights right now."
        onRetry={fetchData}
      />
    );
  }

  const isDataEmpty = cashflowData.length === 0 && categoryData.length === 0 && merchantData.length === 0 && (!burnRateData || burnRateData.burn_rate === 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Financial Insights</h1>
          <p className="text-muted-foreground mt-1">Smart analysis of your spending habits</p>
        </div>
        <Button onClick={handleExport} className="gap-2" disabled={isDataEmpty}>
          <FileText className="h-4 w-4" />
          Download Insights Report (PDF)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column - Charts */}
        <div className="lg:col-span-2 space-y-8">
          <CashflowChart 
            data={cashflowData} 
            isLoading={loading} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CategorySpendChart 
              data={categoryData} 
              isLoading={loading} 
            />
            <TopMerchantsChart 
              data={merchantData} 
              isLoading={loading} 
            />
          </div>
        </div>

        {/* Sidebar - Quick Stats */}
        <div className="space-y-8">
          <BurnRateCard 
            data={burnRateData || undefined} 
            isLoading={loading} 
          />
          
          {/* Quick Tips placeholder */}
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 border-dashed">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Smart Tip
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Based on your top merchants, you could save up to ₹1,200/month by switching to a preferred loyalty partner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
