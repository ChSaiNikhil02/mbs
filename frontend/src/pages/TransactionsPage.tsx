import { useEffect, useState, useCallback, useMemo } from "react";
import { apiClient } from "@/integrations/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  ArrowLeftRight, 
  Tag, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/useDebounce";
import TransactionCategorize from "@/components/TransactionCategorize";
import CategoryRulesList from "@/components/CategoryRulesList";
import { Badge } from "@/components/ui/badge";
import { TRANSACTION_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface Transaction {
  id: number;
  account_id: number;
  txn_type: string;
  amount: number;
  description: string | null;
  txn_date: string;
  category: string | null;
}

const ITEMS_PER_PAGE = 15;

export default function TransactionsPage() {
  const { token, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const [categorizeModal, setCategorizeModal] = useState<{ 
    open: boolean; 
    transactionId: number; 
    category: string | null; 
    isCredit: boolean 
  }>({
    open: false,
    transactionId: 0,
    category: null,
    isCredit: false,
  });
  
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const transactionsData: Transaction[] = await apiClient("transactions/me/", { token });
      setTransactions(transactionsData);
    } catch (error: any) {
      toast({ 
        title: "Error fetching transactions", 
        description: error.detail || "Failed to load transactions.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const transactionCategories = useMemo(() => ["all", ...TRANSACTION_CATEGORIES, "Uncategorized"], []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const isCredit = t.txn_type === "credit";
      const effectiveCategory = isCredit ? "Income" : (t.category || "Uncategorized");
      
      const matchesSearch = 
        (t.description || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.txn_type.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        effectiveCategory.toLowerCase().includes(debouncedSearch.toLowerCase());
        
      const matchesCategory = 
        categoryFilter === "all" || 
        effectiveCategory === categoryFilter;
        
      return matchesSearch && matchesCategory;
    });
  }, [transactions, debouncedSearch, categoryFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [debouncedSearch, categoryFilter]);

  const formatCurrency = useCallback((amount: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount), []);

  const handleCategorize = useCallback((transaction: Transaction) => {
    const isCredit = transaction.txn_type === "credit";
    setCategorizeModal({
      open: true,
      transactionId: transaction.id,
      category: transaction.category,
      isCredit,
    });
  }, []);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/export/transactions?format=${format}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">View and categorize all your transaction history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export Transactions (CSV)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export Transactions (PDF)
          </Button>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 mr-2" />
            Category Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                {transactionCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredTransactions.length} transactions
            </div>
          </div>

          <Card className="shadow-banking overflow-hidden border-none">
            <CardContent className="p-0">
              {paginatedTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-display font-semibold mb-2">No transactions found</h3>
                  <p className="text-muted-foreground text-sm">
                    {transactions.length === 0
                      ? "Transactions will appear here once you add accounts."
                      : "No transactions match your search criteria."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {paginatedTransactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          txn.txn_type === "credit" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}>
                          {txn.txn_type === "credit" ? (
                            <ArrowDownRight className="h-5 w-5" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{txn.description || txn.txn_type}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="capitalize">{txn.txn_type}</span> · {formatDate(txn.txn_date)}
                            {(txn.category || txn.txn_type === "credit") && (
                              <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-medium bg-primary/5 text-primary border-primary/10">
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {txn.txn_type === "credit" ? "Income" : txn.category}
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {txn.txn_type !== "credit" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCategorize(txn)}
                            title="Categorize"
                          >
                            <Tag className="h-4 w-4" />
                          </Button>
                        )}
                        <span className={`text-sm font-bold tabular-nums ${
                          txn.txn_type === "credit" ? "text-success" : "text-destructive"
                        }`}>
                          {txn.txn_type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(txn.amount), "INR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules">
          <CategoryRulesList onRuleChange={fetchTransactions} />
        </TabsContent>
      </Tabs>

      <TransactionCategorize
        open={categorizeModal.open}
        onOpenChange={(open) => setCategorizeModal({ ...categorizeModal, open })}
        transactionId={categorizeModal.transactionId}
        currentCategory={categorizeModal.category}
        isCredit={categorizeModal.isCredit}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
