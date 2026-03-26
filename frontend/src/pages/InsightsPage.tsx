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
      const response = await fetch(`${"https://mbs-production.up.railway.app"}/export/insights?format=pdf`, {
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

  const generateSuggestions = () => {
    const suggestions = [];
    
    // 1. Burn Rate Suggestions
    if (burnRateData) {
      if (burnRateData.is_over_pacing) {
        suggestions.push({
          title: "High Spending Pace",
          text: `You've used ${burnRateData.budget_usage_percent}% of your budget, but the month is only ${burnRateData.month_progress_percent}% complete. Try to reduce non-essential spending.`,
          type: "warning"
        });
      } else if (burnRateData.budget_usage_percent > 90) {
        suggestions.push({
          title: "Budget Alert",
          text: "You are very close to your monthly budget limit. Monitor your next few transactions closely.",
          type: "warning"
        });
      }
    }

    // 2. Cashflow Suggestions
    if (cashflowData.length > 0) {
      const latestMonth = cashflowData[0].month;
      const monthlyData = cashflowData.filter(d => d.month === latestMonth);
      const income = monthlyData.find(d => d.txn_type === "credit")?.total_amount || 0;
      const expense = monthlyData.find(d => d.txn_type === "debit")?.total_amount || 0;

      if (expense > income && income > 0) {
        suggestions.push({
          title: "Negative Cashflow",
          text: "This month's expenses exceed your income. Consider reviewing your subscriptions or recurring bills.",
          type: "danger"
        });
      } else if (income > expense) {
        const savings = income - expense;
        const savingsRate = (savings / income) * 100;
        if (savingsRate > 20) {
          suggestions.push({
            title: "Great Savings!",
            text: `You've saved ${savingsRate.toFixed(1)}% of your income this month. Consider moving ₹${(savings * 0.5).toFixed(0)} to a high-yield savings account.`,
            type: "success"
          });
        }
      }
    }

    // 3. Category Suggestions
    if (categoryData.length > 0) {
      const topCategory = categoryData[0];
      if (topCategory.total_amount > 5000) {
        suggestions.push({
          title: `Focus on ${topCategory.category}`,
          text: `Your highest spending is in ${topCategory.category}. Check for cheaper alternatives or bulk buying options in this category.`,
          type: "info"
        });
      }
    }

    // Default if no data-driven suggestions
    if (suggestions.length === 0) {
      suggestions.push({
        title: "All Systems Clear",
        text: "Your finances are looking great! No immediate actions needed. Keep going and maintain your healthy spending habits.",
        type: "success"
      });
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

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
          
          {/* Dynamic Suggestions */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg px-1">Personalized Tips</h3>
            {suggestions.map((tip, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-2xl border border-dashed animate-fade-in`}
                style={{ 
                  backgroundColor: tip.type === 'warning' ? 'rgba(245, 158, 11, 0.05)' : 
                                   tip.type === 'danger' ? 'rgba(239, 68, 68, 0.05)' : 
                                   tip.type === 'success' ? 'rgba(16, 185, 129, 0.05)' : 
                                   'rgba(59, 130, 246, 0.05)',
                  borderColor: tip.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 
                               tip.type === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 
                               tip.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 
                               'rgba(59, 130, 246, 0.2)'
                }}
              >
                <h4 className="font-semibold mb-1 flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${
                    tip.type === 'warning' ? 'bg-amber-500' : 
                    tip.type === 'danger' ? 'bg-red-500' : 
                    tip.type === 'success' ? 'bg-emerald-500' : 
                    'bg-blue-500'
                  }`} />
                  {tip.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tip.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
