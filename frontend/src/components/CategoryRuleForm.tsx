import { useState, useEffect } from "react";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface CategoryRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: {
    id: number;
    keyword: string;
    merchant_name: string | null;
    category: string;
  } | null;
  onSuccess: () => void;
}

const filteredRuleCategories = TRANSACTION_CATEGORIES.filter(cat => cat !== "Income");

export default function CategoryRuleForm({
  open,
  onOpenChange,
  editingRule,
  onSuccess,
}: CategoryRuleFormProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setKeyword(editingRule.keyword);
      setMerchantName(editingRule.merchant_name || "");
      setCategory(editingRule.category);
    } else {
      setKeyword("");
      setMerchantName("");
      setCategory("");
    }
  }, [editingRule, open]);

  const handleSave = async () => {
    if (!token || !keyword || !category) return;

    setLoading(true);
    try {
      const payload = {
        keyword,
        merchant_name: merchantName || null,
        category,
      };

      if (editingRule) {
        await apiClient(`api/categories/rules/${editingRule.id}`, {
          method: "PUT",
          data: payload,
          token,
        });
        toast({
          title: "Rule updated",
          description: "Category rule has been updated",
        });
      } else {
        await apiClient("api/categories/rules", {
          method: "POST",
          data: payload,
          token,
        });
        toast({
          title: "Rule created",
          description: "Category rule has been created",
        });
      }

      // Auto-apply rules after creating/updating
      try {
        await apiClient("api/categories/apply-rules", {
          method: "POST",
          token,
        });
      } catch (e) {
        console.error("Failed to auto-apply rules", e);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to save rule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "Edit Category Rule" : "Create Category Rule"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Keyword</label>
            <Input
              placeholder="e.g., Starbucks, Uber, Netflix"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Transactions containing this keyword will be automatically categorized
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Merchant (Optional)</label>
            <Input
              placeholder="Specific merchant name"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {filteredRuleCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!keyword || !category || loading}>
            {loading ? "Saving..." : editingRule ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
