import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Receipt
} from "lucide-react";
import { Bill } from "@/hooks/useBills";
import { differenceInDays, isPast } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { formatDate, formatDateTime, parseUtcDate } from "@/lib/utils";

interface BillCardProps {
  bill: Bill;
  onEdit: (bill: Bill) => void;
  onDelete: (id: number) => void;
  onMarkPaid: (id: number) => void;
  isLoading?: boolean;
}

export default function BillCard({ bill, onEdit, onDelete, onMarkPaid, isLoading }: BillCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const dueDate = bill.due_date ? parseUtcDate(bill.due_date) : new Date();
  const isPaid = bill.is_paid || bill.status === "paid";
  const isOverdue = !isPaid && isPast(dueDate);
  const daysUntilDue = differenceInDays(dueDate, new Date());
  const isDueSoon = !isPaid && daysUntilDue >= 0 && daysUntilDue <= 3;

  const getStatusBadge = () => {
    if (isPaid) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Paid</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (isDueSoon) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300">Due Soon</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const getDueDateInfo = () => {
    if (isPaid) {
      return (
        <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Paid {bill.paid_at ? `on ${formatDateTime(bill.paid_at)}` : ""}
        </div>
      );
    }
    if (isOverdue) {
      return (
        <div className="flex items-center text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          Overdue by {Math.abs(daysUntilDue)} days
        </div>
      );
    }
    if (daysUntilDue === 0) {
      return (
        <div className="flex items-center text-orange-600 dark:text-orange-400 text-sm">
          <Clock className="h-4 w-4 mr-1" />
          Due today
        </div>
      );
    }
    return (
      <div className="flex items-center text-muted-foreground text-sm">
        <Calendar className="h-4 w-4 mr-1" />
        Due {formatDate(dueDate)}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  const amount = typeof bill.amount === 'number' ? bill.amount : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);

  return (
    <>
      <Card className={`w-full transition-all hover:shadow-md ${isOverdue ? 'border-destructive/50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">{bill.bill_name || "Unnamed Bill"}</CardTitle>
            </div>
            {getStatusBadge()}
          </div>
          {bill.category && <p className="text-sm text-muted-foreground">{bill.category}</p>}
        </CardHeader>
        
        <CardContent className="pb-3">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold">
              {formatCurrency(amount)}
            </span>
          </div>
          {getDueDateInfo()}
          {bill.notes && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {bill.notes}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="pt-3 border-t">
          <div className="flex w-full flex-wrap items-center gap-2">
            {!isPaid && (
              <Button 
                variant="default" 
                size="sm" 
                className="min-w-[110px] flex-1 xs:flex-none bg-green-600 hover:bg-green-700"
                onClick={() => onMarkPaid(bill.id)}
                disabled={isLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Paid
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="min-w-[70px]"
              onClick={() => onEdit(bill)}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-destructive min-w-[40px]"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{bill.bill_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDelete(bill.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
