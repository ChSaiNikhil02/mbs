 import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSACTION_CATEGORIES } from "@/lib/constants";

interface TransactionCategorizeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: number;
  currentCategory: string | null;
  isCredit?: boolean;
  onSuccess: () => void;
}

export default function TransactionCategorize({
  open,
  onOpenChange,
  transactionId,
  currentCategory,
  isCredit,
  onSuccess,
}: TransactionCategorizeProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState(isCredit ? "Income" : (currentCategory || ""));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCategory(isCredit ? "Income" : (currentCategory || ""));
  }, [currentCategory, open, isCredit]);

  const handleSave = async () => {
    if (!token || !category) return;

    setLoading(true);
    try {
      await apiClient(`transactions/${transactionId}/category`, {
        method: "PUT",
        data: { category },
        token,
      });
      toast({
        title: "Category updated",
        description: `Transaction categorized as ${category}`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: typeof error.detail === 'string' ? error.detail : "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = isCredit 
    ? TRANSACTION_CATEGORIES.filter(cat => cat === "Income") 
    : TRANSACTION_CATEGORIES.filter(cat => cat !== "Income");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Categorize Transaction</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={category} onValueChange={setCategory} disabled={isCredit}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isCredit && (
            <p className="text-xs text-muted-foreground mt-2">
              Credit transactions are automatically categorized as Income.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!category || loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
