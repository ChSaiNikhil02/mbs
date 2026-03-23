import { useState } from "react";
import { useRewards, RedemptionPayload } from "@/hooks/useBills";
import { useAccounts } from "@/hooks/useAccounts";
import { useBills } from "@/hooks/useBills";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Coins, Banknote, Receipt, ArrowRight, Loader2, Info } from "lucide-react";

export default function RedeemCenter() {
  const { data: rewards, redeemMutation } = useRewards();
  const { data: accounts } = useAccounts();
  const { bills } = useBills();
  const { toast } = useToast();

  const [redeemType, setRedeemType] = useState<"money" | "bill" | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedBillId, setSelectedBillId] = useState<string>("");
  const [pointsToRedeem, setPointsToRedeem] = useState<string>("");

  const selectedReward = rewards?.find(r => String(r.id) === selectedRewardId);
  const selectedBill = bills?.find(b => String(b.id) === selectedBillId);
  
  const POINTS_PER_RUPEE = 25;

  const handleRedeem = async () => {
    if (!redeemType || !selectedRewardId) return;

    const payload: RedemptionPayload = {
      reward_id: parseInt(selectedRewardId),
      redemption_type: redeemType,
    };

    if (redeemType === "money") {
      const points = parseInt(pointsToRedeem);
      if (isNaN(points) || points <= 0) {
        toast({ title: "Invalid points", description: "Please enter a valid amount of points.", variant: "destructive" });
        return;
      }
      if (points > (selectedReward?.points_balance || 0)) {
        toast({ title: "Insufficient points", description: "You don't have enough points in this program.", variant: "destructive" });
        return;
      }
      payload.points = points;
      payload.account_id = parseInt(selectedAccountId);
      if (!payload.account_id) {
        toast({ title: "Select account", description: "Please select a target account.", variant: "destructive" });
        return;
      }
    } else if (redeemType === "bill") {
      if (!selectedBillId) {
        toast({ title: "Select bill", description: "Please select a bill to pay.", variant: "destructive" });
        return;
      }
      payload.bill_id = parseInt(selectedBillId);
      const pointsNeeded = Math.ceil(Number(selectedBill?.amount || 0) * POINTS_PER_RUPEE);
      if (pointsNeeded > (selectedReward?.points_balance || 0)) {
        toast({ title: "Insufficient points", description: `You need ${pointsNeeded} points to pay this bill.`, variant: "destructive" });
        return;
      }
    }

    try {
      await redeemMutation.mutateAsync(payload);
      toast({ title: "Redemption Successful", description: "Your rewards have been redeemed." });
      resetForm();
    } catch (error: any) {
      toast({ title: "Redemption Failed", description: error.detail || "An error occurred during redemption.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setRedeemType(null);
    setSelectedRewardId("");
    setSelectedAccountId("");
    setSelectedBillId("");
    setPointsToRedeem("");
  };

  const unpaidBills = bills?.filter(b => !b.is_paid) || [];

  return (
    <Card className="shadow-banking border-none overflow-hidden">
      <CardHeader className="bg-primary/5 pb-6">
        <CardTitle className="font-display flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Redeem Center
        </CardTitle>
        <CardDescription>
          Convert your hard-earned points into real value
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => setRedeemType("money")}
          >
            <Banknote className="h-6 w-6 text-primary" />
            <div className="text-center">
              <p className="font-semibold">Convert to Money</p>
              <p className="text-xs text-muted-foreground">Credit to bank account</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => setRedeemType("bill")}
          >
            <Receipt className="h-6 w-6 text-accent" />
            <div className="text-center">
              <p className="font-semibold">Pay Bills</p>
              <p className="text-xs text-muted-foreground">Use points for utilities</p>
            </div>
          </Button>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-dashed flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">Redemption Rate:</span> 25 Reward Points = ₹1.00. 
            Money redemptions are processed instantly and appear in your transaction history.
          </p>
        </div>
      </CardContent>

      {/* Redemption Dialog */}
      <Dialog open={redeemType !== null} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {redeemType === "money" ? <Banknote className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
              {redeemType === "money" ? "Convert Points to Money" : "Pay Bill with Points"}
            </DialogTitle>
            <DialogDescription>
              {redeemType === "money" 
                ? "Choose how many points to convert and where to send the money."
                : "Select a bill to pay entirely using your reward points."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Reward Program</Label>
              <Select value={selectedRewardId} onValueChange={setSelectedRewardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose program" />
                </SelectTrigger>
                <SelectContent>
                  {rewards?.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.program_name} ({r.points_balance} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {redeemType === "money" && (
              <>
                <div className="space-y-2">
                  <Label>Points to Redeem</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="e.g. 1000"
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(e.target.value)}
                    />
                    {pointsToRedeem && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-success">
                        ≈ ₹{(parseInt(pointsToRedeem) / POINTS_PER_RUPEE).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Deposit To</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.bank_name} · {a.masked_account}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {redeemType === "bill" && (
              <div className="space-y-2">
                <Label>Select Unpaid Bill</Label>
                <Select value={selectedBillId} onValueChange={setSelectedBillId}>
                  <SelectTrigger>
                    <SelectValue placeholder={unpaidBills.length > 0 ? "Choose bill" : "No unpaid bills"} />
                  </SelectTrigger>
                  <SelectContent>
                    {unpaidBills.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.bill_name} (₹{Number(b.amount).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBill && (
                  <div className="p-3 rounded-lg bg-primary/5 text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">Points Required:</span>
                    <span className="font-bold text-primary">
                      {(Number(selectedBill.amount) * POINTS_PER_RUPEE).toLocaleString()} pts
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button 
              onClick={handleRedeem} 
              disabled={redeemMutation.isPending || !selectedRewardId || (redeemType === "money" && !pointsToRedeem) || (redeemType === "bill" && !selectedBillId)}
              className="gradient-primary"
            >
              {redeemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Redemption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
