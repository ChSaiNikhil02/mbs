import { useAlerts } from "@/hooks/useAlerts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, BellOff, Check, AlertTriangle, Calendar, Wallet, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { parseUtcDate } from "@/lib/utils";

export default function AlertsDropdown() {
  const { data: alerts = [], markAsRead } = useAlerts();

  const handleMarkAsRead = (id: number) => {
    markAsRead.mutate(id);
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "budget_exceeded": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "bill_due": return <Calendar className="h-4 w-4 text-warning" />;
      case "low_balance": return <Wallet className="h-4 w-4 text-primary" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-background"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-xl border-border/50">
        <DropdownMenuLabel className="flex items-center justify-between p-4 border-b">
          <span className="font-display font-bold text-base">Notifications</span>
          <Link to="/dashboard/alerts" className="text-xs text-primary hover:underline">
            View All
          </Link>
        </DropdownMenuLabel>
        <ScrollArea className="h-[350px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BellOff className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">All caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-4 border-b last:border-0 transition-colors hover:bg-muted/30 ${
                    !alert.is_read ? "bg-primary/[0.02]" : "opacity-60"
                  }`}
                >
                  <div className={`mt-1 p-2 rounded-lg ${!alert.is_read ? "bg-background shadow-sm border" : "bg-transparent"}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p className={`text-sm leading-tight truncate ${!alert.is_read ? "font-semibold" : "font-normal"}`}>
                      {alert.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {formatDistanceToNow(parseUtcDate(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!alert.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 hover:text-success"
                      onClick={() => handleMarkAsRead(alert.id)}
                      disabled={markAsRead.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t bg-muted/20">
          <Button 
            variant="ghost" 
            className="w-full text-xs h-8 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/dashboard/alerts">See all activity</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
