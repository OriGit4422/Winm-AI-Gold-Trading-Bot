import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Play, 
  BarChart3, 
  TrendingUp, 
  ArrowDownRight, 
  Target, 
  ShieldAlert, 
  History, 
  ChevronRight,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  Activity
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";

interface TradeRecord {
  id: string;
  time: string;
  entry: number;
  sl: number;
  tp: number;
  outcome: 'WIN' | 'LOSS';
  pnl: number;
  type: 'LONG' | 'SHORT';
  equityBefore: number;
  equityAfter: number;
}

interface BacktestStats {
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  totalPnl: number;
  avgPnl: number;
  sharpeRatio: number;
  finalEquity: number;
}

export function BacktestView({ onClose }: { onClose: () => void }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showChartType, setShowChartType] = useState<'equity' | 'drawdown'>('equity');
  
  // Config
  const [strategy, setStrategy] = useState('AI SMC/FVG Pattern');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [maxTrades, setMaxTrades] = useState(100);
  const [lookback, setLookback] = useState('90D');

  const [results, setResults] = useState<{
    stats: BacktestStats;
    trades: TradeRecord[];
    equityCurve: { time: string; equity: number; drawdown: number }[];
  } | null>(null);

  const runBacktest = () => {
    setIsSimulating(true);
    setResults(null);

    // Simulated backtest logic
    setTimeout(() => {
      const generatedTrades: TradeRecord[] = [];
      let currentEquity = initialCapital;
      let peakEquity = initialCapital;
      let maxDrawdown = 0;
      let winningTrades = 0;
      let totalProfit = 0;
      let totalLoss = 0;
      const pnls: number[] = [];

      for (let i = 0; i < maxTrades; i++) {
        const type = Math.random() > 0.5 ? 'LONG' : 'SHORT';
        const outcome = Math.random() > 0.4 ? 'WIN' : 'LOSS';
        const risk = currentEquity * 0.02; // 2% risk
        const rr = 1.5 + Math.random(); // 1.5 to 2.5 RR
        
        let pnl = 0;
        if (outcome === 'WIN') {
          pnl = risk * rr;
          winningTrades++;
          totalProfit += pnl;
        } else {
          pnl = -risk;
          totalLoss += Math.abs(pnl);
        }
        
        const equityBefore = currentEquity;
        currentEquity += pnl;
        pnls.push(pnl);

        if (currentEquity > peakEquity) peakEquity = currentEquity;
        const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;

        generatedTrades.push({
          id: `T-${1000 + i}`,
          time: new Date(Date.now() - (maxTrades - i) * 3600000 * 4).toLocaleDateString(),
          entry: 2000 + Math.random() * 100,
          sl: 1990,
          tp: 2020,
          outcome,
          pnl,
          type,
          equityBefore,
          equityAfter: currentEquity
        });
      }

      const avgPnl = pnls.reduce((a, b) => a + b, 0) / maxTrades;
      const stdDev = Math.sqrt(pnls.reduce((a, b) => a + Math.pow(b - avgPnl, 2), 0) / maxTrades);
      const sharpe = stdDev === 0 ? 0 : avgPnl / stdDev;

      const equityCurve = generatedTrades.map((t, idx) => ({
        time: t.time,
        equity: t.equityAfter,
        drawdown: ((maxDrawdown_at_step(generatedTrades.slice(0, idx + 1), initialCapital) / initialCapital) * 100) // This is simplified
      }));

      // A better way to calculate historical drawdown for the chart
      let runningPeak = initialCapital;
      const betterEquityCurve = generatedTrades.map(t => {
          if (t.equityAfter > runningPeak) runningPeak = t.equityAfter;
          return {
              time: t.time,
              equity: t.equityAfter,
              drawdown: -((runningPeak - t.equityAfter) / runningPeak) * 100
          };
      });

      setResults({
        trades: generatedTrades,
        equityCurve: betterEquityCurve,
        stats: {
          totalTrades: maxTrades,
          winningTrades,
          winRate: (winningTrades / maxTrades) * 100,
          profitFactor: totalLoss === 0 ? totalProfit : totalProfit / totalLoss,
          maxDrawdown,
          totalPnl: currentEquity - initialCapital,
          avgPnl,
          sharpeRatio: sharpe,
          finalEquity: currentEquity
        }
      });
      setIsSimulating(false);
    }, 2000);
  };

  const maxDrawdown_at_step = (trades: TradeRecord[], initial: number) => {
      let peak = initial;
      let maxDD = 0;
      let curr = initial;
      trades.forEach(t => {
          curr = t.equityAfter;
          if (curr > peak) peak = curr;
          const dd = peak - curr;
          if (dd > maxDD) maxDD = dd;
      });
      return maxDD;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-surface/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="w-full max-w-6xl min-h-[90vh] bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <History className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Neural Backtester</h2>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Historical Performance Simulation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Controls Panel */}
          <div className="w-full lg:w-80 border-r border-outline-variant/10 p-6 space-y-6 bg-surface-container-lowest/50 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Execution Strategy</label>
                <select 
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="AI SMC/FVG Pattern">AI SMC/FVG Pattern</option>
                  <option value="Trend Momentum">Trend Momentum</option>
                  <option value="Mean Reversion">Mean Reversion</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Initial Capital</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:border-primary transition-all tnum"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant">USD</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Max Simulations</label>
                <input 
                  type="number"
                  value={maxTrades}
                  onChange={(e) => setMaxTrades(Number(e.target.value))}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm font-bold outline-none focus:border-primary transition-all tnum"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Lookback Period</label>
                <div className="grid grid-cols-2 gap-2">
                  {['90D', '180D', '1Y', 'MAX'].map(p => (
                    <button
                      key={p}
                      onClick={() => setLookback(p)}
                      className={`py-2 text-[10px] font-bold rounded border transition-all ${lookback === p ? 'bg-primary border-primary text-on-primary' : 'bg-surface-container-highest border-outline-variant/10 text-on-surface-variant hover:border-primary/40'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={runBacktest}
              disabled={isSimulating}
              className="w-full py-4 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-8"
            >
              {isSimulating ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isSimulating ? 'Simulating Neural Flow...' : 'Launch Simulation'}
            </button>
          </div>

          {/* Results Main Section */}
          <div className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto">
            {!results && !isSimulating && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <BarChart3 className="w-16 h-16 mb-6 text-primary" />
                <h3 className="text-xl font-bold mb-2 text-on-surface">No Active Simulation</h3>
                <p className="text-sm max-w-sm text-on-surface-variant px-4">Configure your neural strategy parameters on the left and launch the engine to begin historical performance auditing.</p>
              </div>
            )}

            {isSimulating && (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center"
                >
                  <Activity className="w-10 h-10 text-primary" />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-on-surface">Computing Trade Outcomes</h3>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest font-black animate-pulse">Syncing with Historical Node...</p>
                </div>
              </div>
            )}

            {results && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-10"
              >
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Net Profit', value: `$${results.stats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: results.stats.totalPnl >= 0 ? 'text-secondary-container' : 'text-tertiary-container' },
                    { label: 'Win Rate', value: `${results.stats.winRate.toFixed(1)}%`, color: 'text-on-surface' },
                    { label: 'Profit Factor', value: results.stats.profitFactor.toFixed(2), color: 'text-primary' },
                    { label: 'Max Drawdown', value: `-${results.stats.maxDrawdown.toFixed(1)}%`, color: 'text-tertiary-container' },
                    { label: 'Sharpe Ratio', value: results.stats.sharpeRatio.toFixed(2), color: 'text-on-surface' },
                    { label: 'Avg P&L / Trade', value: `$${results.stats.avgPnl.toFixed(2)}`, color: 'text-on-surface' },
                    { label: 'Total Trades', value: results.stats.totalTrades, color: 'text-on-surface' },
                    { label: 'Final Equity', value: `$${results.stats.finalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'text-on-surface' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-surface-container-high/40 p-4 rounded-xl border border-outline-variant/10 shadow-sm relative overflow-hidden group">
                      <p className="text-[10px] font-black text-on-surface/30 uppercase mb-2 tracking-widest">{stat.label}</p>
                      <p className={`text-xl font-mono font-black ${stat.color} tnum`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Chart Section */}
                <div className="bg-surface-container-high/40 rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-outline-variant/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <BarChart3 className="w-4 h-4 text-primary" />
                       <h4 className="text-xs font-bold uppercase tracking-widest">Growth Analytics</h4>
                    </div>
                    <div className="flex bg-surface-container-highest rounded-lg p-1">
                      <button 
                        onClick={() => setShowChartType('equity')}
                        className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-tighter transition-all ${showChartType === 'equity' ? 'bg-primary text-on-primary' : 'text-on-surface/40 hover:text-on-surface'}`}
                      >
                        Equity Curve
                      </button>
                      <button 
                        onClick={() => setShowChartType('drawdown')}
                        className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-tighter transition-all ${showChartType === 'drawdown' ? 'bg-tertiary-container text-on-tertiary-container' : 'text-on-surface/40 hover:text-on-surface'}`}
                      >
                        Drawdown %
                      </button>
                    </div>
                  </div>
                  <div className="h-72 w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results.equityCurve}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={showChartType === 'equity' ? "var(--color-primary)" : "var(--color-tertiary-container)"} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={showChartType === 'equity' ? "var(--color-primary)" : "var(--color-tertiary-container)"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                          minTickGap={30}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }}
                          orientation="right"
                        />
                        <Tooltip 
                           contentStyle={{ backgroundColor: 'rgba(30, 30, 30, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                           itemStyle={{ color: showChartType === 'equity' ? 'var(--color-primary)' : 'var(--color-tertiary-container)' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey={showChartType} 
                          stroke={showChartType === 'equity' ? "var(--color-primary)" : "var(--color-tertiary-container)"} 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#chartGradient)" 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trade Audit Log */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        Detailed Trade Audit Log
                      </h4>
                      <span className="text-[9px] font-bold text-on-surface/30 uppercase">{results.trades.length} Executions Recorded</span>
                   </div>

                   <div className="bg-surface-container-high/40 rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm">
                      <div className="grid grid-cols-8 px-6 py-3 border-b border-outline-variant/10 text-[9px] font-black text-on-surface/40 uppercase tracking-widest">
                        <span>Trade ID</span>
                        <span>Type</span>
                        <span className="text-right">Entry</span>
                        <span className="text-right">SL</span>
                        <span className="text-right">TP</span>
                        <span className="text-right">Result</span>
                        <span className="text-right">P&L ($)</span>
                        <span className="text-right">Equity After</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto divide-y divide-outline-variant/5">
                        {results.trades.map((trade) => (
                          <div key={trade.id} className="grid grid-cols-8 px-6 py-4 items-center hover:bg-surface-container-highest/30 transition-colors group">
                            <span className="text-[10px] font-bold text-on-surface/60 font-mono">{trade.id}</span>
                            <div className="flex items-center gap-2">
                               <div className={`w-1 h-1 rounded-full ${trade.type === 'LONG' ? 'bg-secondary-container' : 'bg-tertiary-container'}`} />
                               <span className={`text-[10px] font-black ${trade.type === 'LONG' ? 'text-secondary-container' : 'text-tertiary-container'}`}>{trade.type}</span>
                            </div>
                            <span className="text-[10px] font-mono text-on-surface/80 text-right">{trade.entry.toFixed(2)}</span>
                            <span className="text-[10px] font-mono text-tertiary-container/60 text-right">{trade.sl.toFixed(2)}</span>
                            <span className="text-[10px] font-mono text-secondary-container/60 text-right">{trade.tp.toFixed(2)}</span>
                            <div className="text-right">
                               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${trade.outcome === 'WIN' ? 'bg-secondary-container/10 text-secondary-container border border-secondary-container/20' : 'bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20'}`}>
                                 {trade.outcome}
                               </span>
                            </div>
                            <span className={`text-[10px] font-mono font-black text-right ${trade.pnl >= 0 ? 'text-secondary-container' : 'text-tertiary-container'}`}>
                              {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-mono text-on-surface/40 text-right">${trade.equityAfter.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
