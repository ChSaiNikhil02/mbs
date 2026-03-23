import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyRates, CurrencyRate } from "@/hooks/useBills";
import { RefreshCw, TrendingUp, DollarSign } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface CurrencyRatesProps {
  compact?: boolean;
}

export default function CurrencyRates({ compact = false }: CurrencyRatesProps) {
  const { rates, isLoading, lastUpdated, refetch, isFetching } = useCurrencyRates();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {rates.slice(0, 4).map((rate) => (
          <CurrencyRow key={rate.code} rate={rate} compact />
        ))}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Summary
          </CardTitle>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Refresh rates"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Base: INR (₹) · Last updated: {formatDateTime(lastUpdated)}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-1">
        {rates.filter(r => r.code !== "INR").map((rate) => (
          <CurrencyRow key={rate.code} rate={rate} />
        ))}
      </CardContent>
    </Card>
  );
}

function CurrencyRow({ rate, compact = false }: { rate: CurrencyRate; compact?: boolean }) {
  // If base is INR, rate is [Target]/[INR] (e.g. 0.012 USD per 1 INR)
  // To get INR per 1 unit of foreign currency: 1 / rate
  const inrValue = 1 / rate.rate;

  return (
    <div className={`flex items-center justify-between ${compact ? 'py-1' : 'py-2'} ${
      !compact ? 'border-b border-border last:border-0' : ''
    }`}>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
          {rate.symbol}
        </div>
        <div>
          <p className="font-medium text-sm">
            {rate.code} <span className="text-muted-foreground mx-1">→</span> ₹{inrValue.toFixed(2)}
          </p>
          {!compact && <p className="text-xs text-muted-foreground">{rate.name}</p>}
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-xs text-muted-foreground font-mono">1 INR = {rate.rate.toFixed(4)} {rate.code}</p>
      </div>
    </div>
  );
}

