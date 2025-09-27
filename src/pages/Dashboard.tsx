
import { TrendingUp, TrendingDown, Droplets, Activity, DollarSign, Target, Clock } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts";
import AccountGrowthChart from "@/components/AccountGrowthChart";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

type StatCardProps = {
  title: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  subAsBadge?: boolean;
};

const StatCard = ({ title, value, sub, icon, subAsBadge = false }: StatCardProps) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 flex items-center gap-3 sm:gap-4 min-h-[80px] sm:min-h-[96px] group"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-galaxy-blue-500/20 via-purple-500/20 to-galaxy-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="text-white/90 group-hover:text-white transition-colors">
          {icon}
        </div>
      </div>
      
      <div className="relative z-10 flex-1">
        <div className="text-xs sm:text-sm text-white/70 group-hover:text-white transition-colors">{title}</div>
        <div className="mt-1 flex items-center gap-2">
          <div className="text-lg sm:text-xl md:text-2xl font-semibold text-white group-hover:text-white/95 transition-colors">{value}</div>
          {sub && (
            subAsBadge ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-galaxy-blue-500/20 to-purple-500/20 text-galaxy-blue-300 border border-galaxy-blue-500/30 backdrop-blur-sm">{sub}</span>
            ) : (
              <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">{sub}</span>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

const mockSeries = Array.from({ length: 30 }).map((_, i) => {
  const base = 103000;
  const drift = i * 200 + Math.max(0, i - 18) * 600;
  const noise = Math.sin(i / 2) * 300 + (i % 7 === 0 ? -800 : 0);
  return { date: i + 1, value: base + drift + noise };
});

const tableRows = [
  { date: "24 Aug", dd: "0.00%", result: "0.00%", total: "$98,060", color: "" },
  { date: "22 Aug", dd: "-0.13%", result: "+1.03%", total: "$99,070", color: "text-emerald-400" },
  { date: "21 Aug", dd: "0.00%", result: "+1.91%", total: "$100,960", color: "text-emerald-400" },
  { date: "20 Aug", dd: "-1.31%", result: "-1.16%", total: "$99,800", color: "text-rose-400" },
  { date: "19 Aug", dd: "-0.04%", result: "+1.07%", total: "$100,880", color: "text-emerald-400" },
  { date: "18 Aug", dd: "0.00%", result: "0.00%", total: "$100,880", color: "" },
  { date: "15 Aug", dd: "-0.41%", result: "-0.18%", total: "$100,700", color: "text-rose-400" },
  { date: "13 Aug", dd: "-0.31%", result: "-0.30%", total: "$100,400", color: "text-rose-400" },
  { date: "12 Aug", dd: "-0.47%", result: "+0.58%", total: "$101,000", color: "text-emerald-400" },
  { date: "11 Aug", dd: "0.00%", result: "+0.86%", total: "$101,860", color: "text-emerald-400" },
];

const Dashboard = () => {
  const TRADE_ROW_HEIGHT_PX = 50; // Must match .leading-[50px] and .h-[50px]
  const TRADE_VISIBLE_ROWS = 30; // Adjust to show exact number of full rows
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const accountId = params.get("accountId") || undefined;
  
  // Debug logging
  console.log("Dashboard component loaded", { accountId, location: location.pathname });
  const [equitySnapshots, setEquitySnapshots] = useState<{ ts: number; equity: number }[]>([]);
  const [dailyRows, setDailyRows] = useState<Array<{ day: string; drawdown_pct: number; result_usd: number; result_pct: number }>>([]);
  const [kpis, setKpis] = useState<{
    balance: number;
    equity: number;
    floating: number;
    maxDrawdownPct: number;
    profitFactor?: number;
    winRate?: number;
    averageWin?: number;
    averageLoss?: number;
    totalOrders?: number;
    totalResult?: number;
    lastTradeDaysAgo?: number;
    lastTradeCount?: number;
    recentResultPct: number;
  } | null>(null);
  const [trades, setTrades] = useState<Array<any>>([]);
  const [glowOpacity, setGlowOpacity] = useState(1);
  const [glowColor, setGlowColor] = useState<'red' | 'green'>('red');


  useEffect(() => {
    const load = async () => {
      try {
        if (!accountId) {
          // Resolve latest linked account for the current user and redirect with accountId
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data: latest } = await supabase
            .from('mt_accounts')
            .select('login, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (latest?.login) {
            navigate(`/dashboard?accountId=${encodeURIComponent(latest.login)}`, { replace: true });
          }
          return;
        }

        // Validate that the accountId belongs to the current user OR has data in account_metrics
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // First check if account is explicitly linked to user
        const { data: accountExists } = await supabase
          .from('mt_accounts')
          .select('id')
          .eq('user_id', user.id)
          .eq('login', accountId)
          .maybeSingle();
        
        // If not explicitly linked, check if there's data in account_metrics
        if (!accountExists) {
          const { data: metricsData } = await supabase
            .from('account_metrics')
            .select('id')
            .eq('account_number', accountId)
            .limit(1);
          
          if (!metricsData || metricsData.length === 0) {
            navigate('/accounts', { replace: true });
            return;
          }
          
          toast({
            title: "Account Access",
            description: `Account ${accountId} is not explicitly linked to your account but has data available. Consider adding it to your accounts for better tracking.`,
            variant: "default",
          });
        }
        
        // Build time range
        const since = new Date();
        since.setDate(since.getDate() - 30);

        // Query KPI view and snapshots
        const [
          { data: kpiRow, error: kpiErr },
          { data: snapsRows, error: snapsErr },
          { data: daily, error: dailyErr },
          { data: tradesRows, error: tradesErr }
        ] = await Promise.all([
          supabase.from('account_kpi_view').select('*').eq('account_number', accountId).maybeSingle(),
          supabase
            .from('account_snapshots')
            .select('equity, balance, floating, created_at')
            .eq('account_number', accountId)
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: true }),
          supabase
            .from('account_daily_results_view')
            .select('day, drawdown_pct, result_usd, result_pct')
            .eq('account_number', accountId)
            .order('day', { ascending: false })
            .limit(30),
          supabase
            .from('trade_events')
            .select('id,ticket,entry_time,exit_time,type,symbol,size,result')
            .eq('account_number', accountId)
            .order('exit_time', { ascending: false })
            .limit(1000)
        ]);
        if (kpiErr) throw kpiErr;
        if (snapsErr) throw snapsErr;
        if (dailyErr) throw dailyErr;
        if (tradesErr) throw tradesErr;

        // Set KPIs even if no data found (for new accounts)
        setKpis(kpiRow ? {
          balance: Number(kpiRow.balance) || 0,
          equity: Number(kpiRow.equity) || 0,
          floating: Number(kpiRow.floating) || 0,
          maxDrawdownPct: Number(kpiRow.max_drawdown_pct) || 0,
          profitFactor: Number(kpiRow.profit_factor) || 0,
          winRate: Number(kpiRow.win_rate) || 0,
          averageWin: Number(kpiRow.average_win) || 0,
          averageLoss: Number(kpiRow.average_loss) || 0,
          totalOrders: Number(kpiRow.total_orders) || 0,
          totalResult: Number(kpiRow.total_result) || 0,
          lastTradeDaysAgo: Number(kpiRow.last_trade_days_ago) || 0,
          lastTradeCount: Number(kpiRow.last_trade_count) || 0,
          recentResultPct: Number(kpiRow.recent_result_pct) || 0,
        } : {
          balance: 0,
          equity: 0,
          floating: 0,
          maxDrawdownPct: 0,
          profitFactor: 0,
          winRate: 0,
          averageWin: 0,
          averageLoss: 0,
          totalOrders: 0,
          totalResult: 0,
          lastTradeDaysAgo: 0,
          lastTradeCount: 0,
          recentResultPct: 0,
        });

        const snaps = (snapsRows || []).map((d: any) => ({ ts: new Date(d.created_at as string).getTime(), equity: Number(d.equity) || 0 }));
        
        // If snapshots only cover a single day, derive a per-day equity curve from daily results so the chart shows each trading day
        const distinctSnapDays = Array.from(new Set(snaps.map((s) => new Date(s.ts).toDateString())));
        let chartSnaps = snaps;
        
        // Always use daily results to reconstruct the full 30-day equity curve for consistent chart display
        if ((daily || []).length > 0) {
          const equityNowTmp = (snapsRows || []).slice(-1)[0]?.equity;
          const baseNow = Number(equityNowTmp || 0);
          
          if (baseNow > 0) {
            // daily is ordered desc; reconstruct close-of-day equity going backwards
            let runningEq = baseNow;
            const perDayDesc = (daily || []).map((d: any) => ({ day: d.day, result_usd: Number(d.result_usd) || 0 }));
            const equityPerDayDesc = perDayDesc.map((d) => {
              const entry = { day: d.day, equity: runningEq };
              runningEq = runningEq - d.result_usd;
              return entry;
            });
            chartSnaps = equityPerDayDesc
              .slice()
              .reverse()
              .map((d) => ({ ts: new Date(d.day).getTime(), equity: d.equity }));
          } else {
            // If no current equity, use the daily results to build a relative equity curve
            const perDayDesc = (daily || []).map((d: any) => ({ day: d.day, result_usd: Number(d.result_usd) || 0 }));
            let runningEq = 100000; // Start with a base value
            const equityPerDayDesc = perDayDesc.map((d) => {
              const entry = { day: d.day, equity: runningEq };
              runningEq = runningEq + d.result_usd;
              return entry;
            });
            chartSnaps = equityPerDayDesc
              .slice()
              .reverse()
              .map((d) => ({ ts: new Date(d.day).getTime(), equity: d.equity }));
          }
        }
        
        // Set state variables
        setEquitySnapshots(chartSnaps);
        setDailyRows((daily || []).map((d: any) => ({ day: d.day, drawdown_pct: Number(d.drawdown_pct) || 0, result_usd: Number(d.result_usd) || 0, result_pct: Number(d.result_pct) || 0 })));
        setTrades(tradesRows || []);

        const latestSnap = (snapsRows || []).slice(-1)[0];
        const prevSnap = (snapsRows || []).slice(-2)[0];
        const equityNow = latestSnap ? Number(latestSnap.equity) || 0 : 0;
        const balanceNow = latestSnap ? Number(latestSnap.balance) || 0 : 0;
        const floatingNow = latestSnap ? Number(latestSnap.floating) || 0 : 0;
        const prevEq = prevSnap ? Number(prevSnap.equity) || equityNow : equityNow;
        // Calculate percentage based on current balance for more accurate representation
        let recentResultPct = 0;
        if (daily && (daily as any[]).length > 0) {
          const dailyData = (daily as any[])[0];
          const resultUsd = Number(dailyData.result_usd) || 0;
          
          // Use current balance as denominator for percentage calculation
          // This gives a more accurate percentage relative to current account size
          recentResultPct = balanceNow > 0 ? (resultUsd / balanceNow) * 100 : 0;
          
          // Debug logging for percentage calculation
          console.log('Daily percentage calculation:', {
            result_usd: resultUsd,
            balance_now: balanceNow,
            calculated_pct: recentResultPct,
            db_result_pct: dailyData.result_pct,
            start_equity: dailyData.start_equity || 'not available'
          });
        } else {
          // Fallback to snapshot-based calculation
          recentResultPct = prevEq > 0 ? ((equityNow - prevEq) / prevEq) * 100 : 0;
        }

        // Max drawdown over snapshots
        let peak = snaps.length > 0 ? snaps[0].equity : equityNow;
        let maxDd = 0;
        for (const r of snaps) {
          const eq = r.equity;
          peak = Math.max(peak, eq);
          if (peak > 0) maxDd = Math.min(maxDd, (eq - peak) / peak);
        }

        setKpis({
          balance: balanceNow,
          equity: equityNow,
          floating: floatingNow,
          maxDrawdownPct: Math.abs(maxDd) * 100,
          profitFactor: kpiRow?.profit_factor ?? undefined,
          winRate: kpiRow?.win_rate ?? undefined,
          averageWin: kpiRow?.average_win ?? undefined,
          averageLoss: kpiRow?.average_loss ?? undefined,
          totalOrders: kpiRow?.total_orders ?? undefined,
          totalResult: kpiRow ? (Number(kpiRow.gross_profit || 0) - Number(kpiRow.gross_loss || 0)) : undefined,
          lastTradeDaysAgo: kpiRow?.last_trade_days_ago ?? undefined,
          lastTradeCount: kpiRow?.last_trade_count ?? undefined,
          recentResultPct,
        });
      } catch (e) {
        console.error(e);
      }
    };
    load();
    if (!accountId) return;
    const channel = supabase
      .channel('account_metrics_chart')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'account_metrics', filter: `account_number=eq.${accountId}` },
        (payload) => {
          console.log('Account metrics updated:', payload);
          // Re-load on any changes to account metrics
          load();
        }
      )
      .subscribe();
    const tradesChannel = supabase
      .channel('trade_events_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trade_events', filter: `account_number=eq.${accountId}` },
        () => {
          load();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); supabase.removeChannel(tradesChannel); };
  }, [accountId]);

  useEffect(() => {
    const rafId = { current: 0 } as { current: number };
    const onScroll = () => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const fadeDistance = 520; // longer distance for smoother fade
        const t = Math.min(1, y / fadeDistance);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        const next = Math.max(0, 1 - eased);
        setGlowOpacity(next);
        rafId.current = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Check if account is in negative or positive status
  const accountStatus = useMemo(() => {
    if (!kpis) return { isNegative: false, isPositive: false };
    
    // Primary indicator: total result
    const totalResult = kpis.totalResult ?? 0;
    const recentResultPct = kpis.recentResultPct ?? 0;
    const floating = kpis.floating ?? 0;
    
    // Show red if total result is negative OR if recent performance is negative
    const isNegative = totalResult < 0 || recentResultPct < 0;
    
    // Show green if total result is positive AND recent performance is not negative
    const isPositive = totalResult > 0 && recentResultPct >= 0;
    
    return { isNegative, isPositive };
  }, [kpis]);

  // Update glow color based on account status
  useEffect(() => {
    if (accountStatus.isNegative) {
      setGlowColor('red');
    } else if (accountStatus.isPositive) {
      setGlowColor('green');
    }
  }, [accountStatus]);

  return (
    <main className="flex-1 relative dashboard-container mobile-content">
      {/* Purple background overlay removed - now handled by GalaxyShell */}
      
      {(accountStatus.isNegative || accountStatus.isPositive) && (
        <div className="pointer-events-none fixed top-0 right-0 left-0 lg:left-[92px] h-[40vh] z-10 transition-opacity duration-300 ease-out" style={{opacity: glowOpacity}}>
          <div className={`absolute inset-0 bg-gradient-to-b ${
            glowColor === 'red' 
              ? 'from-red-500/60 via-red-500/30 to-transparent' 
              : 'from-green-500/60 via-green-500/30 to-transparent'
          }`} />
          <div className={`absolute inset-0 ${
            glowColor === 'red' ? 'bg-red-400/20' : 'bg-green-400/20'
          } blur-2xl`} />
        </div>
      )}
      
      <div className="mx-auto max-w-[1400px] w-full space-y-4 sm:space-y-6 relative z-20 p-3 sm:p-4 md:p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          minHeight: '100vh'
        }}
      >

        {/* Header */}
        <div className="flex justify-between items-center px-2 sm:px-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Trading Dashboard
            {accountId && (
              <span className="text-lg text-gray-400 ml-2">#{accountId}</span>
            )}
          </h1>
        </div>
        
        {/* Top stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-0">
          <StatCard title="Result (prev period)" value={`${kpis ? (kpis.recentResultPct >= 0 ? '+' : '') + kpis.recentResultPct.toFixed(2) + '%' : '—'}`} subAsBadge icon={<TrendingUp className="h-5 w-5 text-galaxy-blue-400" />} />
          <StatCard title="Max drawdown" value={`${kpis ? '-' + kpis.maxDrawdownPct.toFixed(2) + '%' : '—'}`} subAsBadge icon={<TrendingDown className="h-5 w-5 text-rose-400" />} />
          <StatCard title="Float" value={kpis ? `$${Math.round(kpis.floating).toLocaleString()}` : '—'} icon={<Droplets className="h-5 w-5 text-cyan-300" />} />
        </div>

        {/* Chart + side table */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl p-3 sm:p-4 md:p-6 xl:col-span-2 min-h-[400px] sm:min-h-[480px] md:min-h-[520px] relative overflow-hidden group"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-galaxy-blue-500/20 via-purple-500/20 to-galaxy-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <AccountGrowthChart title="Account growth (last 30 days)" equitySnapshots={equitySnapshots} />
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl overflow-hidden min-h-[400px] sm:min-h-[480px] md:min-h-[520px] relative group"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-galaxy-blue-500/20 via-purple-500/20 to-galaxy-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="grid grid-cols-4 text-xs text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.18)] border-b glass-divider">
              <div className="px-2 sm:px-4 py-2 sm:py-3">Date</div>
              <div className="px-2 sm:px-4 py-2 sm:py-3">Drawdown %</div>
              <div className="px-2 sm:px-4 py-2 sm:py-3">Result $</div>
              <div className="px-2 sm:px-4 py-2 sm:py-3">Result %</div>
            </div>
            <div>
              {dailyRows.map((row, idx) => {
                const dateStr = new Date(row.day).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
                const pos = row.result_usd >= 0;
                const resClass = pos ? 'text-emerald-500' : 'text-red-500';
                
                // Calculate percentage based on current balance for more accurate representation
                const calculatedPct = kpis && kpis.balance > 0 ? (row.result_usd / kpis.balance) * 100 : 0;
                const pctClass = calculatedPct >= 0 ? 'text-emerald-500' : 'text-red-500';
                const ddClass = 'text-white';
                
                return (
                  <div key={idx} className={`grid grid-cols-4 text-sm ${idx > 0 ? 'border-t border-border/50' : ''}`}>
                    <div className="px-2 sm:px-4 py-2 text-white">{dateStr}</div>
                    <div className={`px-2 sm:px-4 py-2 ${ddClass}`}>{`${row.drawdown_pct.toFixed(2)}%`}</div>
                    <div className={`px-2 sm:px-4 py-2 font-medium ${resClass}`}>{`${pos ? '+' : ''}$${row.result_usd.toFixed(2)}`}</div>
                    <div className={`px-2 sm:px-4 py-2 font-medium ${pctClass}`}>{`${calculatedPct >= 0 ? '+' : ''}${calculatedPct.toFixed(2)}%`}</div>
                  </div>
                );
              })}
            </div>
            </div>
          </motion.div>
        </div>

        {/* Summary cards rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-0">
          <StatCard
            title="Total result"
            value={(
              <span className={kpis?.totalResult !== undefined ? (kpis.totalResult >= 0 ? 'text-emerald-400' : 'text-rose-400') : ''}>
                {kpis?.totalResult !== undefined ? `${kpis.totalResult >= 0 ? '+' : ''}$${Math.round(kpis.totalResult).toLocaleString()}` : '—'}
              </span>
            )}
            icon={<TrendingUp className="h-5 w-5 text-galaxy-blue-400" />}
          />
          <StatCard
            title="Profit factor"
            value={<span className="text-emerald-400">{kpis?.profitFactor !== undefined ? `${kpis.profitFactor.toFixed(2)}` : '—'}</span>}
            icon={<TrendingUp className="h-5 w-5 text-galaxy-blue-400" />}
          />
          <StatCard
            title="Max drawdown"
            value={<span className="text-rose-400">{kpis ? `-${kpis.maxDrawdownPct.toFixed(2)}%` : '—'}</span>}
            icon={<TrendingDown className="h-5 w-5 text-rose-400" />}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-0">
          <StatCard title="Balance" value={kpis ? `$${Math.round(kpis.balance).toLocaleString()}` : '—'} icon={<Droplets className="h-5 w-5 text-cyan-300" />} />
          <StatCard title="Equity" value={kpis ? `$${Math.round(kpis.equity).toLocaleString()}` : '—'} icon={<Droplets className="h-5 w-5 text-cyan-300" />} />
          <StatCard title="Total withdrawals" value="$0" icon={<Droplets className="h-5 w-5 text-cyan-300" />} />
        </div>

        {/* Additional KPIs row (bottom) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-2 sm:px-0">
          <StatCard title="Average win" value={kpis?.averageWin !== undefined ? `$${Math.round(kpis.averageWin).toLocaleString()}` : '—'} icon={<TrendingUp className="h-5 w-5 text-galaxy-blue-400" />} />
          <StatCard title="Average loss" value={kpis?.averageLoss !== undefined ? `-$${Math.round(kpis.averageLoss).toLocaleString()}` : '—'} icon={<TrendingDown className="h-5 w-5 text-rose-400" />} />
          <StatCard title="Win rate" value={<span className="text-emerald-400">{kpis?.winRate !== undefined ? `${kpis.winRate.toFixed(2)}%` : '—'}</span>} icon={<TrendingUp className="h-5 w-5 text-emerald-400" />} />
          <StatCard title="Total orders" value={kpis?.totalOrders !== undefined ? `${kpis.totalOrders}` : '—'} icon={<Droplets className="h-5 w-5 text-cyan-300" />} />
          <StatCard title={`Trades ${kpis?.lastTradeDaysAgo ?? '—'} days ago`} value={kpis?.lastTradeCount !== undefined ? String(kpis.lastTradeCount) : '—'} icon={<Droplets className="h-5 w-5 text-cyan-300" />} />
          <StatCard title="Last update" value="a few seconds ago" icon={<Droplets className="h-5 w-5 text-cyan-300" />} />
        </div>

        {/* Trades table (bottom) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl overflow-hidden pt-[40px] px-3 sm:px-4 md:px-5 relative group"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-galaxy-blue-500/20 via-purple-500/20 to-galaxy-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative z-10">
          <div className="grid grid-cols-[1.1fr_2.6fr_1.1fr_0.9fr_1.2fr_0.8fr_1.2fr] text-[10px] sm:text-[12.5px] leading-[12.5px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.18)]">
            <div className="px-1 sm:px-2 py-0">ID</div>
            <div className="px-1 sm:px-2 py-0">Dates</div>
            <div className="px-1 sm:px-2 py-0">Duration</div>
            <div className="px-1 sm:px-2 py-0">Type</div>
            <div className="px-1 sm:px-2 py-0">Symbol</div>
            <div className="px-1 sm:px-2 py-0">Size</div>
            <div className="pl-1 sm:pl-2 pr-[5px] sm:pr-[10px] py-0 text-right justify-self-end">Result</div>
          </div>
          <div className="overflow-y-auto no-scrollbar" style={{maxHeight: TRADE_ROW_HEIGHT_PX * TRADE_VISIBLE_ROWS}}>
          {trades.map((t: any) => {
            const idStr = t.ticket != null ? String(t.ticket).padStart(7, '0') : (t.id ? String(t.id).slice(0, 7) : '');
            const entry = t.entry_time ? new Date(t.entry_time) : null;
            const exit = t.exit_time ? new Date(t.exit_time) : null;
            const d1 = entry ? `${entry.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} ${entry.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : '';
            const d2 = exit ? `${exit.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} ${exit.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : '';
            const durMs = entry && exit ? Math.max(0, exit.getTime() - entry.getTime()) : 0;
            const totalSeconds = Math.floor(durMs / 1000);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            const dur = `${hours}:${minutes}:${seconds}`;
            const typeStr = (t.type || '').toString();
            const isBuy = typeStr.toLowerCase() === 'buy';
            const resultNum = Number(t.result) || 0;
            const resultClass = resultNum >= 0 ? 'text-emerald-400' : 'text-rose-400';
            const typeClass = isBuy ? 'text-emerald-300' : 'text-rose-300';
            const fmt = `${resultNum >= 0 ? '+' : ''}${Math.round(resultNum).toLocaleString()}`;
            return (
              <div key={`${t.account_number}-${t.ticket ?? t.id}`} className="grid grid-cols-[1.1fr_2.6fr_1.1fr_0.9fr_1.2fr_0.8fr_1.2fr] text-[10px] sm:text-[12.5px] leading-[50px] h-[50px] overflow-hidden border-b border-border/30 last:border-0">
                <div className="px-1 sm:px-2 py-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.12)]">{idStr}</div>
                <div className="px-1 sm:px-2 py-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.12)]">
                  <div>{d1}</div>
                  <div className="text-[10px] sm:text-[12.5px] leading-[12.5px] text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.12)]">{d2}</div>
                </div>
                <div className="px-1 sm:px-2 py-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.12)]">{dur}</div>
                <div className={"px-1 sm:px-2 py-0 font-medium " + typeClass}>{isBuy ? 'Buy' : 'Sell'}</div>
                <div className="px-1 sm:px-2 py-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.12)]">{t.symbol}</div>
                <div className="px-1 sm:px-2 py-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.12)]">{t.size}</div>
                <div className={"pl-1 sm:pl-2 pr-[5px] sm:pr-[10px] py-0 text-right justify-self-end font-medium " + resultClass}>{fmt}</div>
              </div>
            );
          })}
          </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default Dashboard;
