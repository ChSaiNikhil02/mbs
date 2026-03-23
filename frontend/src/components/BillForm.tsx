import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Bill, BillFormData } from "@/hooks/useBills";

const billSchema = z.object({
  bill_name: z.string().min(1, "Bill name is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  due_date: z.string().min(1, "Due date is required"),
  auto_pay: z.boolean().default(false),
  status: z.string().default("pending"),
});

interface BillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BillFormData) => void;
  bill?: Bill | null;
  isLoading?: boolean;
}

// Get today's date in YYYY-MM-DD format for min date
const today = new Date().toISOString().split('T')[0];

export default function BillForm({ open, onOpenChange, onSubmit, bill, isLoading }: BillFormProps) {
  const form = useForm<z.infer<typeof billSchema>>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      bill_name: bill?.bill_name || "",
      amount: bill?.amount || 0,
      due_date: bill?.due_date ? bill.due_date.split('T')[0] : "",
      auto_pay: bill?.auto_pay || false,
      status: bill?.status || "pending",
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && bill) {
      form.reset({
        bill_name: bill.bill_name,
        amount: bill.amount,
        due_date: bill.due_date ? bill.due_date.split('T')[0] : "",
        auto_pay: bill.auto_pay || false,
        status: bill.status || "pending",
      });
    } else if (isOpen) {
      form.reset({
        bill_name: "",
        amount: 0,
        due_date: "",
        auto_pay: false,
        status: "pending",
      });
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (data: z.infer<typeof billSchema>) => {
    onSubmit({
      bill_name: data.bill_name,
      amount: data.amount,
      due_date: data.due_date,
      status: data.status,
      auto_pay: data.auto_pay
    } as BillFormData);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bill ? "Edit Bill" : "Add New Bill"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bill_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Electricity Bill" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" min={today} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center space-x-2">
               <FormField
                control={form.control}
                name="auto_pay"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Auto Pay
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {bill ? "Update Bill" : "Add Bill"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
