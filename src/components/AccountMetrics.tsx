import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { AccountMetric } from "@/types/account";

const AccountMetrics = ({ accountId }: { accountId: string }) => {
  const { toast } = useToast();

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ['account-metrics', accountId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('account_metrics')
          .select('*')
          .eq('account_number', accountId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        // Return default values if no data is found
        if (!data || data.length === 0) {
          return {
            account_number: accountId,
            balance: 0,
            equity: 0,
            floating: 0,
            margin: 0,
            freeMargin: 0,
            marginLevel: 0,
            openPositions: 0,
            created_at: new Date().toISOString()
          } as AccountMetric;
        }

        // Map database column names to component expectations
        const metric = data[0];
        return {
          id: metric.id,
          account_number: metric.account_number,
          balance: Number(metric.balance) || 0,
          equity: Number(metric.equity) || 0,
          floating: Number(metric.floating) || 0,
          margin: 0, // margin column doesn't exist in database yet
          freeMargin: Number(metric.free_margin) || 0,
          marginLevel: 0, // margin_level column doesn't exist in database yet
          openPositions: Number(metric.open_positions) || 0,
          created_at: metric.created_at
        } as AccountMetric;
      } catch (err) {
        console.error('Error fetching account metrics:', err);
        toast({
          title: "Error",
          description: "Failed to fetch account metrics. Please try again later.",
          variant: "destructive",
        });
        throw err;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    const channel = supabase
      .channel('account_metrics_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'account_metrics',
          filter: `account_number=eq.${accountId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, refetch]);

  if (isLoading) {
    return <MetricsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-400">
        Failed to load account metrics. Please try again later.
        <br />
        <small>Error: {error.message}</small>
      </div>
    );
  }

  // Ensure metrics exists before rendering
  if (!metrics) {
    return <MetricsSkeleton />;
  }

  // Show message if all values are zero (likely no real data)
  const hasRealData = metrics.balance > 0 || metrics.equity > 0 || metrics.floating !== 0 || metrics.openPositions > 0;

  return (
    <div>
      {!hasRealData && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm">
            No real-time data available for account {accountId}. 
            This could mean the MT4/MT5 EA is not running or not connected.
          </p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="bg-darkBlue/40 backdrop-blur-sm border-mediumGray/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-softWhite">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-softWhite">${metrics.balance.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="bg-darkBlue/40 backdrop-blur-sm border-mediumGray/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-softWhite">Equity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-softWhite">${metrics.equity.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="bg-darkBlue/40 backdrop-blur-sm border-mediumGray/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-softWhite">Floating P/L</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.floating >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${metrics.floating.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-darkBlue/40 backdrop-blur-sm border-mediumGray/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-softWhite">Margin Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-softWhite">{metrics.marginLevel.toFixed(2)}%</div>
        </CardContent>
      </Card>

      <Card className="bg-darkBlue/40 backdrop-blur-sm border-mediumGray/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-softWhite">Free Margin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-softWhite">${metrics.freeMargin.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="bg-darkBlue/40 backdrop-blur-sm border-mediumGray/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-softWhite">Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-softWhite">{metrics.openPositions}</div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
};

const MetricsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="bg-darkBlue/40 backdrop-blur-sm border-mediumGray/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[120px]" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default AccountMetrics;