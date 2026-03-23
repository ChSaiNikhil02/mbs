import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/integrations/apiClient"; // Import apiClient
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Wallet, Building2, CreditCard, TrendingUp, Landmark, PiggyBank } from "lucide-react";

interface Account {
  id: number;
  user_id?: number; // Optional as it's not always returned or needed directly by frontend
  account_number: string;
  account_type: string;
  balance: number;
  created_at: string;
}

const accountTypeIcons: Record<string, any> = {
  savings: PiggyBank,
  checking: Wallet,
  credit_card: CreditCard, // This type is not directly in our backend Account type, but leaving for frontend display consistency if needed
  loan: Landmark, // Same as above
  investment: TrendingUp, // Same as above
};

const accountTypeColors: Record<string, string> = {
  savings: "bg-success/10 text-success",
  checking: "bg-primary/10 text-primary",
  credit_card: "bg-warning/10 text-warning",
  loan: "bg-destructive/10 text-destructive",
  investment: "bg-info/10 text-info",
};

export default function AccountsPage() {
  const { user, token, isAuthenticated } = useAuth(); // Get token and isAuthenticated
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Updated form state to match backend AccountCreate schema
  const [form, setForm] = useState({ account_type: "checking", account_number: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const accountsData: Account[] = await apiClient("users/me/accounts/", { token: token });
      setAccounts(accountsData);
    } catch (error: any) {
      toast({ title: "Error fetching accounts", description: error.detail || "Failed to load accounts.", variant: "destructive" });
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      // Adjusted data to match FastAPI's AccountCreate schema
      const newAccount = await apiClient("accounts/", {
        method: "POST",
        token: token,
        data: {
          account_type: form.account_type,
          account_number: form.account_number,
        },
      });
      toast({ title: "Account added" });
      setForm({ account_type: "checking", account_number: "" }); // Reset form
      setDialogOpen(false);
      fetchAccounts(); // Refresh accounts list
    } catch (error: any) {
      toast({ title: "Error", description: error.detail || "Failed to add account.", variant: "destructive" });
      console.error("Error adding account:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your linked bank accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Add New Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              {/* Removed Bank Name and Currency as they are not in our backend Account model */}
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}>
                  <SelectTrigger ><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Business</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    {/* Other account types might be added to backend or frontend for display only */}
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem> 
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label> {/* Changed label */}
                <Input placeholder="e.g., 1234567890" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting}>
                {submitting ? "Adding..." : "Add Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card className="shadow-banking">
          <CardContent className="p-12 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-display font-semibold mb-2">No accounts yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Add your first bank account to start tracking your finances.</p>
            <Button className="gradient-primary text-primary-foreground" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => {
            const Icon = accountTypeIcons[account.account_type] || Wallet;
            const colorClass = accountTypeColors[account.account_type] || "bg-primary/10 text-primary";
            return (
              <Card key={account.id} className="shadow-banking hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Account: {account.account_number}</h3> {/* Display account_number */}
                        <p className="text-xs text-muted-foreground capitalize">{account.account_type.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-2xl font-display font-bold">{formatCurrency(Number(account.balance), "INR")}</p> {/* Assuming USD */}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
