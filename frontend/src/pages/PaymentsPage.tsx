import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/integrations/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, CheckCircle2, Clock, Banknote, ArrowRight, ArrowLeftRight, Receipt, Shield } from "lucide-react";
import { TRANSACTION_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface Account {
  id: number;
  bank_name: string;
  masked_account: string;
  balance: number;
  currency: string;
}

interface Bill {
  id: number;
  biller_name: string;
  amount_due: number;
  due_date: string;
  status: string;
}

interface PaymentRecord {
  id: number;
  description: string;
  amount: number;
  currency: string;
  merchant: string | null;
  txn_date: string;
  account_id: number;
  bank_name?: string;
  masked_account?: string;
}

const filteredPaymentCategories = TRANSACTION_CATEGORIES.filter(cat => cat !== "Income" && cat !== "Transfer");

export default function PaymentsPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("payment");

  const [form, setForm] = useState({
    from_account: "",
    to_account: "", // For self-transfer
    payee_name: "", // For standard payment
    amount: "",
    category: "Bill Payment",
    note: "",
    currency: "INR",
    bill_id: "", // For bill payment
  });

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [accountsData, transactionsData, billsData] = await Promise.all([
        apiClient<Account[]>("users/me/accounts/", { token }),
        apiClient<any[]>("transactions/me/", { token }),
        apiClient<any[]>("api/bills/", { token }),
      ]);
      
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      const validBills = Array.isArray(billsData) ? billsData : [];
      setBills(validBills.filter(b => b.status !== "paid" && !b.paid));

      // Filter for debit transactions and enrich with account info
      const validTxns = Array.isArray(transactionsData) ? transactionsData : [];
      const enriched = validTxns
        .filter((t: any) => t.txn_type === "debit")
        .slice(0, 10)
        .map((t: any) => {
          const acc = (Array.isArray(accountsData) ? accountsData : []).find((a) => a.id === t.account_id);
          return { ...t, bank_name: acc?.bank_name, masked_account: acc?.masked_account };
        });
      
      setPayments(enriched);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({ 
        title: "Error", 
        description: "Failed to load payment data.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedFromAccount = accounts.find((a) => a.id === parseInt(form.from_account));
  const selectedToAccount = accounts.find((a) => a.id === parseInt(form.to_account));
  const selectedBill = bills.find((b) => b.id === parseInt(form.bill_id));

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !form.from_account) return;

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    if (selectedFromAccount && amount > selectedFromAccount.balance) {
      toast({ title: "Insufficient balance", description: "The amount exceeds your account balance.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      if (activeTab === "transfer") {
        if (!form.to_account || form.from_account === form.to_account) {
          throw new Error("Please select a different destination account.");
        }
        await apiClient("transactions/transfer", {
          token,
          data: {
            from_account_id: parseInt(form.from_account),
            to_account_id: parseInt(form.to_account),
            amount: amount,
            description: form.note || "Self Transfer",
          }
        });
      } else {
        const payload: any = {
          account_id: parseInt(form.from_account),
          txn_type: "debit",
          amount: amount,
          description: activeTab === "bill" ? `Bill Payment: ${selectedBill?.biller_name}` : `Payment to ${form.payee_name} - ${form.note}`,
          category: activeTab === "bill" ? "Bills & Utilities" : form.category,
          currency: "INR",
          merchant: activeTab === "bill" ? selectedBill?.biller_name : form.payee_name.trim(),
        };

        if (activeTab === "bill" && form.bill_id) {
          payload.bill_id = parseInt(form.bill_id);
        }

        await apiClient("transactions/", { token, data: payload });
      }

      setSuccess(true);
      toast({ 
        title: "Success!", 
        description: "Your request has been processed successfully." 
      });
      setForm({ from_account: "", to_account: "", payee_name: "", amount: "", category: "Bill Payment", note: "", currency: "INR", bill_id: "" });
      setTimeout(() => setSuccess(false), 3000);
      fetchData();
    } catch (error: any) {
      toast({ 
        title: "Action failed", 
        description: error.message || error.detail || "An error occurred.", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Payments & Transfers</h1>
        <p className="text-muted-foreground mt-1">Move your money securely in INR (₹)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Main Action Form */}
        <div className="lg:col-span-3">
          <Card className="shadow-banking border-none">
            <CardHeader className="pb-0">
              <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v);
                setForm(prev => ({ ...prev, amount: "", bill_id: "", to_account: "", payee_name: "" }));
              }} className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="payment" className="flex items-center gap-2">
                    <Send className="h-4 w-4" /> Pay
                  </TabsTrigger>
                  <TabsTrigger value="transfer" className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" /> Transfer
                  </TabsTrigger>
                  <TabsTrigger value="bill" className="flex items-center gap-2 relative">
                    <Receipt className="h-4 w-4" /> Bills
                    {bills.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
                        {bills.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <p className="text-lg font-display font-semibold text-success">Transaction Complete!</p>
                  <p className="text-sm text-muted-foreground">Your financial record has been updated.</p>
                </div>
              ) : (
                <form onSubmit={handleProcessAction} className="space-y-5">
                  {/* From Account - Always needed */}
                  <div className="space-y-2">
                    <Label>From Account</Label>
                    <Select
                      value={form.from_account}
                      onValueChange={(v) => setForm({ ...form, from_account: v })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4 text-muted-foreground" />
                              <span>{a.bank_name || 'Bank'} · {a.masked_account || a.id}</span>
                              <span className="ml-auto text-muted-foreground text-xs">
                                {formatCurrency(a.balance)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedFromAccount && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Available balance:
                        <span className="font-medium text-foreground">
                          {formatCurrency(selectedFromAccount.balance)}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Context Specific Fields */}
                  {activeTab === "payment" && (
                    <>
                      <div className="space-y-2">
                        <Label>Recipient Name</Label>
                        <Input
                          placeholder="e.g. John Doe, Amazon"
                          value={form.payee_name}
                          onChange={(e) => setForm({ ...form, payee_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {filteredPaymentCategories.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {activeTab === "transfer" && (
                    <div className="space-y-2">
                      <Label>To Account (Self)</Label>
                      <Select
                        value={form.to_account}
                        onValueChange={(v) => setForm({ ...form, to_account: v })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.filter(a => String(a.id) !== form.from_account).map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                                <span>{a.bank_name || 'Bank'} · {a.masked_account || a.id}</span>
                                <span className="ml-auto text-muted-foreground text-xs">
                                  {formatCurrency(a.balance)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {activeTab === "bill" && (
                    <div className="space-y-2">
                      <Label>Unpaid Bill</Label>
                      <Select
                        value={form.bill_id}
                        onValueChange={(v) => {
                          const bill = bills.find(b => String(b.id) === v);
                          setForm({ ...form, bill_id: v, amount: bill ? String(bill.amount_due) : "" });
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={bills.length > 0 ? "Select a bill to pay" : "No unpaid bills found"} />
                        </SelectTrigger>
                        <SelectContent>
                          {bills.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              <div className="flex items-center gap-2 w-full">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{b.biller_name}</span>
                                  <span className="text-[10px] text-muted-foreground">Due: {new Date(b.due_date).toLocaleDateString()}</span>
                                </div>
                                <span className="ml-auto font-bold">{formatCurrency(b.amount_due)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Amount - Always needed */}
                  <div className="space-y-2">
                    <Label>Amount (INR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        className="pl-8 text-lg font-bold"
                        required
                        disabled={activeTab === "bill" && !!form.bill_id}
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      placeholder={activeTab === "transfer" ? "Internal movement" : "Payment reference"}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      maxLength={120}
                    />
                  </div>

                  {/* Summary Preview */}
                  {form.from_account && (form.payee_name || form.to_account || form.bill_id) && form.amount && (
                    <div className="rounded-xl bg-muted/50 border border-border p-4 flex items-center justify-between text-sm animate-pulse">
                      <div className="flex-1">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">From</p>
                        <p className="font-medium truncate">{selectedFromAccount?.bank_name} · {selectedFromAccount?.masked_account}</p>
                      </div>
                      <div className="px-4 text-primary">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">To</p>
                        <p className="font-medium truncate">
                          {activeTab === "transfer" ? (selectedToAccount?.bank_name + " · " + selectedToAccount?.masked_account) : 
                           activeTab === "bill" ? selectedBill?.biller_name : form.payee_name}
                        </p>
                      </div>
                      <div className="ml-6 border-l pl-6">
                        <p className="text-muted-foreground text-[10px] uppercase font-bold">Amount</p>
                        <p className="font-bold text-destructive whitespace-nowrap">
                          {formatCurrency(parseFloat(form.amount) || 0)}
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full gradient-primary text-primary-foreground h-12 text-lg font-display"
                    disabled={submitting || !form.from_account || (!form.payee_name && !form.to_account && !form.bill_id) || !form.amount}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2"><Clock className="h-5 w-5 animate-spin" /> Processing…</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {activeTab === "transfer" ? <ArrowLeftRight className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                        {activeTab === "transfer" ? "Confirm Transfer" : activeTab === "bill" ? "Pay Bill Now" : "Send Payment"}
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent History Side Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-banking border-none">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="p-8 text-center">
                  <Send className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">No recent payments.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {payments.map((p) => (
                    <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                          p.category === 'Transfer' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {p.category === 'Transfer' ? <ArrowLeftRight className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">{p.merchant || p.description}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium">
                            {p.bank_name} · {formatDate(p.txn_date)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-destructive shrink-0 ml-3 tabular-nums">
                        -{formatCurrency(Math.abs(p.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Help */}
          <Card className="bg-primary/5 border-primary/10 border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Secure Transfers</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All transactions are encrypted. Self-transfers are instant and free of charge within VaultBank.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
