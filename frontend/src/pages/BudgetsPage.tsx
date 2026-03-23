import { useState, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BudgetList from "@/components/BudgetList";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy chart component
const BudgetChart = lazy(() => import("@/components/BudgetChart"));

export default function BudgetsPage() {
  const { token } = useAuth();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToCurrentMonth = () => {
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Budgets</h1>
          <p className="text-muted-foreground mt-1">Track your spending and set monthly limits</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={goToCurrentMonth} className="h-8 px-3 font-medium text-sm">
            {monthNames[month - 1]} {year}
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <BudgetList month={month} year={year} />
        
        <Suspense fallback={
          <div className="space-y-4 p-6 border rounded-xl bg-card">
            <Skeleton className="h-6 w-1/3 mb-4" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        }>
          <BudgetChart month={month} year={year} />
        </Suspense>
      </div>
    </div>
  );
}
