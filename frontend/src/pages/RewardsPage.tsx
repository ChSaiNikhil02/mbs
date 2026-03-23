import { useRewards, Reward } from "@/hooks/useBills";
import RedeemCenter from "@/components/RedeemCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  Star, 
  TrendingUp, 
  Calendar,
  Award,
  Coins
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function RewardsPage() {
  const { data: rewards, isLoading } = useRewards();

  const totalPoints = rewards?.reduce((sum, reward) => sum + reward.points_balance, 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Rewards</h1>
          <p className="text-muted-foreground mt-1">View your points and redeem rewards</p>
        </div>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PointsCard 
          title="Total Points" 
          value={totalPoints} 
          icon={<Coins className="h-5 w-5" />}
          description="Across all programs"
          color="gold"
        />
        <PointsCard 
          title="This Month" 
          value={120} 
          icon={<TrendingUp className="h-5 w-5" />}
          description="Points earned (mock)"
          color="green"
        />
        <PointsCard 
          title="Available Rewards" 
          value={5} 
          icon={<Gift className="h-5 w-5" />}
          description="Redeemable rewards (mock)"
          color="blue"
        />
        <PointsCard 
          title="Member Status" 
          value="Gold" 
          icon={<Award className="h-5 w-5" />}
          description="Next: Platinum at 5000 pts"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Reward Programs and Redeem Center */}
        <div className="space-y-8">
          <RedeemCenter />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                Your Reward Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewards && rewards.length > 0 ? (
                  rewards.map((reward: Reward) => (
                    <div 
                      key={reward.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Gift className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{reward.program_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Last updated: {formatDateTime(reward.last_updated)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {reward.points_balance.toLocaleString()} pts
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No reward programs found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* How to Earn */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Earn More Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <EarnMethod 
                  title="Pay Bills" 
                  description="Earn 5 points for every bill paid"
                  icon={<Gift className="h-5 w-5" />}
                />
                <EarnMethod 
                  title="Daily Login" 
                  description="Earn 5 points every day you log in"
                  icon={<Calendar className="h-5 w-5" />}
                />
                <EarnMethod 
                  title="Refer Friends" 
                  description="Earn 500 points per referral"
                  icon={<Star className="h-5 w-5" />}
                />
                <EarnMethod 
                  title="Complete KYC" 
                  description="Earn 200 points for verification"
                  icon={<Award className="h-5 w-5" />}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PointsCard({ 
  title, 
  value, 
  icon, 
  description, 
  color 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  description: string;
  color: "gold" | "green" | "blue" | "purple";
}) {
  const colorClasses = {
    gold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    green: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {typeof value === 'number' && (title === "Total Points" || title === "This Month") && (
              <span className="text-sm font-normal text-muted-foreground ml-1">pts</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EarnMethod({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
