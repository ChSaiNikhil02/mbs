import { useState } from "react";
import { Bill, useBills } from "@/hooks/useBills";
import BillCard from "./BillCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Receipt } from "lucide-react";

interface BillListProps {
  onEdit: (bill: Bill) => void;
}

export default function BillList({ onEdit }: BillListProps) {
  const { bills, isLoading, deleteBill, markAsPaid } = useBills();
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");

  const filteredBills = bills.filter((bill) => {
    if (filter === "pending") return !bill.is_paid;
    if (filter === "paid") return bill.is_paid;
    return true;
  });

  const handleDelete = async (id: number) => {
    await deleteBill.mutateAsync(id);
  };

  const handleMarkPaid = async (id: number) => {
    await markAsPaid.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[220px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const pendingCount = bills.filter(b => !b.is_paid).length;
  const paidCount = bills.filter(b => b.is_paid).length;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-1">
              All
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{bills.length}</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Pending
              <span className="ml-1 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Paid
              <span className="ml-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded-full">{paidCount}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={filter} className="mt-0">
          {filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bills found</h3>
              <p className="text-muted-foreground">
                {filter === "all" 
                  ? "You haven't added any bills yet." 
                  : filter === "pending" 
                    ? "No pending bills. Great job!" 
                    : "No paid bills yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  onMarkPaid={handleMarkPaid}
                  isLoading={deleteBill.isPending || markAsPaid.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

