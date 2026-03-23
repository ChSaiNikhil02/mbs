import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Sparkles } from "lucide-react";
import CategoryRuleForm from "./CategoryRuleForm";

interface CategoryRule {
  id: number;
  keyword: string;
  merchant_name: string | null;
  category: string;
  created_at: string;
}

interface CategoryRulesListProps {
  onRuleChange?: () => void;
}

export default function CategoryRulesList({ onRuleChange }: CategoryRulesListProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);

  const fetchRules = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data: CategoryRule[] = await apiClient("api/categories/rules", { token });
      setRules(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to load category rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleApplyRules = async () => {
    if (!token) return;
    try {
      setApplying(true);
      const result: any = await apiClient("api/categories/apply-rules", {
        method: "POST",
        token,
      });
      toast({
        title: "Rules applied",
        description: result.message || "Transactions have been updated based on rules.",
      });
      onRuleChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to apply rules",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (!token) return;
    try {
      await apiClient(`api/categories/rules/${ruleId}`, {
        method: "DELETE",
        token,
      });
      toast({
        title: "Rule deleted",
        description: "Category rule has been deleted",
      });
      fetchRules();
      onRuleChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.detail || "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (rule: CategoryRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  const handleFormSuccess = () => {
    fetchRules();
    onRuleChange?.();
    handleFormClose();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Category Rules</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={handleApplyRules} 
              size="sm" 
              variant="outline"
              disabled={applying || rules.length === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {applying ? "Applying..." : "Apply Rules"}
            </Button>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No category rules yet.</p>
              <p className="text-sm">Create rules to automatically categorize transactions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.keyword}</span>
                      {rule.merchant_name && (
                        <Badge variant="outline">{rule.merchant_name}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      → {rule.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(rule)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <CategoryRuleForm
          open={showForm}
          onOpenChange={handleFormClose}
          editingRule={editingRule}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
