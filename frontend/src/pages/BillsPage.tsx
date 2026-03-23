import { useState } from "react";
import { useBills, Bill, BillFormData } from "@/hooks/useBills";
import BillList from "@/components/BillList";
import BillForm from "@/components/BillForm";
import BillReminders from "@/components/BillReminders";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillsPage() {
  const { createBill, updateBill, isLoading } = useBills();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const handleAddBill = async (data: BillFormData) => {
    await createBill.mutateAsync(data);
  };

  const handleEditBill = async (data: BillFormData) => {
    if (editingBill) {
      await updateBill.mutateAsync({ id: editingBill.id, data });
      setEditingBill(null);
    }
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBill(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Bills</h1>
          <p className="text-muted-foreground mt-1">Manage and track your recurring bills</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Bill
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <BillList onEdit={handleEdit} />
        </div>
        
        <div className="space-y-6">
          <BillReminders />
          
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickStats />
            </CardContent>
          </Card>
        </div>
      </div>

      <BillForm
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) handleFormClose();
        }}
        onSubmit={editingBill ? handleEditBill : handleAddBill}
        bill={editingBill}
        isLoading={isLoading || createBill.isPending || updateBill.isPending}
      />
    </div>
  );
}

function QuickStats() {
  const { bills } = useBills();
  
  const pendingBills = bills.filter(b => !b.is_paid && b.status !== "paid");
  const paidBills = bills.filter(b => b.is_paid || b.status === "paid");
  const overdueBills = pendingBills.filter(b => b.status === "overdue" || new Date(b.due_date) < new Date());
  
  const totalPending = pendingBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalPaid = paidBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalOverdue = overdueBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Pending</span>
        <div className="text-right">
          <p className="font-semibold">{pendingBills.length} bills</p>
          <p className="text-sm text-orange-600 dark:text-orange-400">${totalPending.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Paid</span>
        <div className="text-right">
          <p className="font-semibold">{paidBills.length} bills</p>
          <p className="text-sm text-green-600 dark:text-green-400">${totalPaid.toFixed(2)}</p>
        </div>
      </div>
      
      {overdueBills.length > 0 && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
          <span className="text-sm font-medium text-destructive">Overdue</span>
          <div className="text-right">
            <p className="font-semibold text-destructive">{overdueBills.length} bills</p>
            <p className="text-sm text-destructive">${totalOverdue.toFixed(2)}</p>
          </div>
        </div>
      )}
    </>
  );
}
