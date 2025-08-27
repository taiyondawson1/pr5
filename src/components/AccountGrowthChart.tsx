import { useMemo } from "react";
import { AreaChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceArea } from "recharts";
import { format } from "date-fns";
const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

interface AccountGrowthChartProps {
  equitySnapshots?: { ts: number; equity: number }[];
  loading?: boolean;
  title?: string;
}

export default function AccountGrowthChart({ equitySnapshots, loading = false, title = "Account Growth" }: AccountGrowthChartProps) {
  const equityCurve = useMemo(() => {
    if (!equitySnapshots || equitySnapshots.length === 0) return [];
    
    console.log("Processing equity curve data:", equitySnapshots);
    
    return equitySnapshots.map((item, index) => {
      const prevEquity = index > 0 ? equitySnapshots[index - 1].equity : item.equity;
      const gain = item.equity - prevEquity;
      
      return {
        ts: item.ts,
        equity: item.equity || 0,
        gain: gain,
        isPositive: gain > 0
      };
    });
  }, [equitySnapshots]);

  const positiveSeries = useMemo(() => {
    return equityCurve.filter(point => point.isPositive);
  }, [equityCurve]);

  const negativeSeries = useMemo(() => {
    return equityCurve.filter(point => !point.isPositive);
  }, [equityCurve]);

  const negativeBands = useMemo(() => {
    const bands = [];
    let currentBand = null;
    
    for (let i = 0; i < equityCurve.length; i++) {
      const point = equityCurve[i];
      if (!point.isPositive) {
        if (!currentBand) {
          currentBand = { x1: point.ts, x2: point.ts };
        } else {
          currentBand.x2 = point.ts;
        }
      } else if (currentBand) {
        bands.push(currentBand);
        currentBand = null;
      }
    }
    
    if (currentBand) {
      bands.push(currentBand);
    }
    
    return bands;
  }, [equityCurve]);

  const yDomain = useMemo(() => {
    if (equityCurve.length === 0) return [0, 100];
    const values = equityCurve.map(d => d.equity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }, [equityCurve]);

  // Generate evenly spaced ticks for X-axis
  const xAxisTicks = useMemo(() => {
    if (equityCurve.length === 0) return [];
    
    const timestamps = equityCurve.map(d => d.ts);
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    
    // Generate 6-8 evenly spaced ticks based on time range
    const numTicks = Math.min(8, Math.max(6, equityCurve.length));
    const ticks = [];
    
    for (let i = 0; i < numTicks; i++) {
      const timeOffset = (maxTs - minTs) * (i / (numTicks - 1));
      const tickTime = minTs + timeOffset;
      ticks.push(tickTime);
    }
    
    return ticks;
  }, [equityCurve]);

  // Generate evenly spaced ticks for Y-axis
  const yAxisTicks = useMemo(() => {
    if (equityCurve.length === 0) return [];
    
    const values = equityCurve.map(d => d.equity);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Generate 5-6 evenly spaced ticks
    const numTicks = 6;
    const ticks = [];
    
    for (let i = 0; i < numTicks; i++) {
      const value = min + (range * i) / (numTicks - 1);
      ticks.push(Math.round(value));
    }
    
    return ticks;
  }, [equityCurve]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="text-sm text-white/70 mb-2">{title}</div>
        <div className="flex-1 min-h-[340px] flex items-center justify-center text-white/70">
          Loading...
        </div>
      </div>
    );
  }

  if (equityCurve.length === 0) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="text-sm text-white/70 mb-2">{title}</div>
        <div className="flex-1 min-h-[340px] flex items-center justify-center text-white/70">
          <div className="text-center">
            <div className="text-lg mb-2">No data available</div>
            <div className="text-sm opacity-60">Connect your MT4/MT5 account to see your trading performance</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-sm text-white/70 mb-2">{title}</div>
      <div className="flex-1 w-full h-full">
        <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 10, bottom: 10 }} width={800} height={400}>
          <defs>
            <linearGradient id="equityArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f8dff" stopOpacity={0.3} />
              <stop offset="35%" stopColor="#4f8dff" stopOpacity={0.2} />
              <stop offset="70%" stopColor="#4f8dff" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#4f8dff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.1} />
          <XAxis
            type="number"
            dataKey="ts"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            dy={6}
            tickMargin={8}
            padding={{ left: 0, right: 0 }}
            tickFormatter={(d) => format(new Date(d), "dd MMM")}
            tick={{ fill: "#ffffff", fontSize: 12, opacity: 0.7 }}
            ticks={xAxisTicks}
            interval={0}
          />
          <YAxis 
            domain={yDomain} 
            dx={-6} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(v) => currency(v).replace(".00", "")}
            tick={{ fill: "#ffffff", fontSize: 12, opacity: 0.7 }}
            ticks={yAxisTicks}
            interval={0}
          />
          <Tooltip 
            cursor={false}
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelFormatter={(d) => format(new Date(d), "MMM dd, yyyy")}
            formatter={(value: any) => [currency(value), "Equity"]}
          />
          {negativeBands.map((b, i) => (
            <ReferenceArea key={i} x1={b.x1} x2={b.x2} y1={yDomain[0]} y2={yDomain[1]} fill="#ef4444" fillOpacity={0.04} strokeOpacity={0} />
          ))}
          <Area type="monotone" dataKey="equity" stroke="#4f8dff" strokeWidth={3} fill="url(#equityArea)" />
          <Line
            type="natural"
            data={positiveSeries}
            dataKey="equity"
            stroke="#22c55e"
            strokeWidth={3}
            dot={(p: any) =>
              p.payload.gain > 0 ? (
                <circle cx={p.cx} cy={p.cy} r={4} fill="#22c55e" stroke="#ffffff" strokeWidth={2} />
              ) : null
            }
            activeDot={{ r: 6, fill: "#22c55e", stroke: "#ffffff", strokeWidth: 2 }}
            connectNulls={false}
          />
          <Line
            type="natural"
            data={negativeSeries}
            dataKey="equity"
            stroke="#ef4444"
            strokeWidth={3}
            dot={(p: any) =>
              p.payload.gain < 0 ? (
                <circle cx={p.cx} cy={p.cy} r={4} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
              ) : null
            }
            activeDot={{ r: 6, fill: "#ef4444", stroke: "#ffffff", strokeWidth: 2 }}
            connectNulls={false}
          />
        </AreaChart>
      </div>
    </div>
  );
}