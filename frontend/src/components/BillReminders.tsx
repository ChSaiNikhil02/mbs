import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, Clock, CheckCircle2, Bell } from "lucide-react";
import { Bill, useBills } from "@/hooks/useBills";
import { differenceInDays, isValid } from "date-fns";
import { parseUtcDate, formatDate } from "@/lib/utils";

interface BillRemindersProps {
  maxItems?: number;
  compact?: boolean;
}

export default function BillReminders({ maxItems = 5, compact = false }: BillRemindersProps) {
  const { bills, isLoading, getUpcomingBills, getOverdueBills } = useBills();
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);
  const [overdueBills, setOverdueBills] = useState<Bill[]>([]);

  useEffect(() => {
    setUpcomingBills(getUpcomingBills().slice(0, maxItems));
    setOverdueBills(getOverdueBills());
  }, [bills, getUpcomingBills, getOverdueBills, maxItems]);

  const getDaysText = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  };

  const getSafeDate = (dateStr: string) => {
    const d = parseUtcDate(dateStr);
    return isValid(d) ? d : new Date();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalDue = overdueBills.length + upcomingBills.length;

  if (totalDue === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bill Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-muted-foreground">No upcoming bills</p>
            <p className="text-sm text-muted-foreground">All bills are paid!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Bill Reminders
          {overdueBills.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {overdueBills.length} overdue
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Overdue Bills */}
        {overdueBills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </p>
            {overdueBills.map((bill) => {
              const dueDate = getSafeDate(bill.due_date);
              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{bill.bill_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">
                      {formatCurrency(bill.amount)}
                    </p>
                    <p className="text-xs text-destructive">
                      {Math.abs(differenceInDays(new Date(), dueDate))} days late
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <div className="space-y-2">
            {overdueBills.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Upcoming
              </p>
            )}
            {upcomingBills.map((bill) => {
              const dueDate = getSafeDate(bill.due_date);
              const daysUntil = differenceInDays(dueDate, new Date());
              const isDueSoon = daysUntil <= 3;
              
              return (
                <div
                  key={bill.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDueSoon 
                      ? "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800" 
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      isDueSoon 
                        ? "bg-orange-100 dark:bg-orange-900" 
                        : "bg-muted"
                    }`}>
                      {isDueSoon ? (
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{bill.bill_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(bill.amount)}
                    </p>
                    <p className={`text-xs ${isDueSoon ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                      {getDaysText(daysUntil)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      
      {totalDue > maxItems && !compact && (
        <CardContent className="pt-0">
          <Button variant="outline" className="w-full" asChild>
            <a href="/dashboard/bills">View All Bills ({totalDue})</a>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
