import { useState } from "react";
import { useAlerts, Alert } from "@/hooks/useAlerts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/FeedbackStates";
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Wallet, 
  CheckCheck, 
  Trash2, 
  Filter,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { parseUtcDate } from "@/lib/utils";

export default function AlertsPage() {
  const { data: alerts = [], isLoading, isError, refetch, markAsRead, markAllAsRead, deleteAlert } = useAlerts();
  const [filter, setFilter] = useState<string>("all");

  const handleMarkAsRead = (id: number) => {
    markAsRead.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteAlert.mutate(id);
  };

  const handleMarkAllAsRead = async () => {
    markAllAsRead.mutate();
  };

  const getAlertIcon = (alert: Alert) => {
    const isUrgent = alert.message.includes("URGENT");
    switch (alert.type) {
      case "budget_exceeded": return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "bill_due": 
        return isUrgent 
          ? <XCircle className="h-5 w-5 text-red-600 animate-pulse" /> 
          : <Calendar className="h-5 w-5 text-warning" />;
      case "low_balance": return <Wallet className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getAlertLabel = (alert: Alert) => {
    const isUrgent = alert.message.includes("URGENT");
    switch (alert.type) {
      case "budget_exceeded": return "Budget Exceeded";
      case "bill_due": return isUrgent ? "CRITICAL: OVERDUE" : "Bill Due";
      case "low_balance": return "Low Balance";
      default: return "Notification";
    }
  };

  const filteredAlerts = alerts.filter(a => filter === "all" || a.type === filter);

  if (isLoading && alerts.length === 0) {
    return <LoadingState message="Loading your alerts..." />;
  }

  if (isError) {
    return (
      <ErrorState 
        title="Failed to load alerts"
        message="We encountered an issue while fetching your notifications."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Alert Center</h1>
          <p className="text-muted-foreground mt-1">Stay updated on your financial health</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMarkAllAsRead} 
            disabled={markAllAsRead.isPending || !alerts.some(a => !a.is_read)}
          >
            <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" /> {filter === "all" ? "All Types" : filter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter("all")}>All Types</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("budget_exceeded")}>Budget Alerts</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("bill_due")}>Bill Reminders</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("low_balance")}>Balance Alerts</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="shadow-banking border-none">
        <CardContent className="p-0">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 opacity-20">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold">No alerts yet</h3>
              <p className="text-sm">We'll notify you here when your financial health needs attention.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredAlerts.map((alert) => {
                const isUrgent = alert.message.includes("URGENT");
                return (
                  <div 
                    key={alert.id} 
                    className={`group px-6 py-5 flex items-start justify-between hover:bg-muted/30 transition-all ${
                      !alert.is_read ? (isUrgent ? "bg-red-50 dark:bg-red-950/10" : "bg-primary/[0.02]") : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center ${
                        !alert.is_read ? "bg-background shadow-sm border" : "bg-muted/50"
                      }`}>
                        {getAlertIcon(alert)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${
                            !alert.is_read ? (isUrgent ? "text-red-600" : "text-foreground") : "text-muted-foreground"
                          }`}>
                            {getAlertLabel(alert)}
                          </span>
                          {!alert.is_read && <Badge className={`h-2 w-2 rounded-full p-0 ${isUrgent ? "bg-red-600" : ""}`} />}
                        </div>
                        <p className={`text-sm leading-relaxed ${
                          !alert.is_read ? (isUrgent ? "text-red-700 dark:text-red-400 font-bold" : "text-foreground font-medium") : "text-muted-foreground"
                        }`}>
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(parseUtcDate(alert.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!alert.is_read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleMarkAsRead(alert.id)}
                        disabled={markAsRead.isPending}
                        title="Mark as read"
                      >
                        <CheckCheck className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(alert.id)}
                      disabled={deleteAlert.isPending}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
