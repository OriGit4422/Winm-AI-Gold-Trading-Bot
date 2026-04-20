import { TrendingUp, TrendingDown, ChevronDown, DollarSign, Bitcoin, Activity, BarChart3, X } from "lucide-react";

interface HistoryProps {
  filterAsset?: string | null;
  onClearFilter?: () => void;
}

export function History({ filterAsset, onClearFilter }: HistoryProps) {
  const allTrades = [
    { id: "XAU/USD", type: "BUY", entry: "2024.15", exit: "2038.45", profit: "+$120.50", time: "14:32:01", trend: "up" },
    { id: "BTC/USDT", type: "SELL", entry: "64,210.00", exit: "64,285.50", profit: "-$45.20", time: "12:15:44", trend: "down" },
    { id: "EUR/USD", type: "BUY", entry: "1.0842", exit: "1.0910", profit: "+$312.80", time: "09:04:12", trend: "up" },
    { id: "NVDA", type: "BUY", entry: "842.10", exit: "855.30", profit: "+$94.10", time: "08:45:33", trend: "up" },
  ];

  const trades = filterAsset 
    ? allTrades.filter(t => t.id === filterAsset)
    : allTrades;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Trade History</h2>
            {filterAsset && (
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{filterAsset}</span>
                <button onClick={onClearFilter} className="text-primary hover:text-primary/70">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-on-surface-variant text-sm">Verified audit of autonomous execution cycles.</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-sm border border-outline-variant/10 self-start">
          {["Today", "Week", "Month"].map((filter, i) => (
            <button
              key={filter}
              className={`px-6 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                i === 0 ? "bg-surface-container-highest text-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Net Profit", value: "+$1,842.20", sub: "14.2% VS LAST PERIOD", trend: "up" },
          { label: "Win Rate", value: "68.4%", sub: "Progress bar", trend: "up" },
          { label: "Total Trades", value: "142", sub: "98 WINS / 44 LOSSES", trend: "none" },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-low p-5 rounded-sm flex flex-col justify-between h-32 border-l-2 border-outline-variant">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
            <span className={`text-2xl font-bold tnum ${stat.trend === "up" ? "text-secondary-container" : "text-on-surface"}`}>
              {stat.value}
            </span>
            {stat.label === "Win Rate" ? (
              <div className="w-full bg-surface-container-highest h-1 mt-2">
                <div className="bg-primary h-full w-[68%] shadow-[0_0_8px_rgba(242,202,80,0.4)]" />
              </div>
            ) : (
              <div className={`flex items-center gap-2 text-[10px] ${stat.trend === "up" ? "text-secondary-container/70" : "text-on-surface-variant"}`}>
                {stat.trend === "up" && <TrendingUp className="w-3 h-3" />}
                <span className="uppercase tracking-wider">{stat.sub}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="hidden md:grid grid-cols-6 px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 border-b border-outline-variant/10">
          <div>Asset / Type</div>
          <div>Entry Price</div>
          <div>Exit Price</div>
          <div>Profit/Loss</div>
          <div className="text-right">Timestamp</div>
          <div className="text-right">Details</div>
        </div>

        {trades.map((trade, i) => (
          <div key={i} className="group bg-surface-container-low hover:bg-surface-container transition-all duration-300">
            <div className="grid grid-cols-2 md:grid-cols-6 items-center px-4 md:px-6 py-4 gap-4">
              <div className="col-span-1 flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-surface-container-highest rounded-sm">
                  {trade.id.includes("BTC") ? <Bitcoin className="w-4 h-4 text-primary" /> : <Activity className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <div className="text-sm font-bold font-headline">{trade.id}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-tighter ${trade.type === "BUY" ? "text-secondary-container" : "text-tertiary-container"}`}>
                    {trade.type}
                  </div>
                </div>
              </div>
              <div className="hidden md:block col-span-1 tnum text-sm text-on-surface/80">{trade.entry}</div>
              <div className="hidden md:block col-span-1 tnum text-sm text-on-surface/80">{trade.exit}</div>
              <div className={`col-span-1 tnum text-sm font-bold text-right md:text-left ${trade.trend === "up" ? "text-secondary-container" : "text-tertiary-container"}`}>
                {trade.profit}
              </div>
              <div className="hidden md:block col-span-1 tnum text-[11px] text-on-surface-variant text-right">{trade.time}</div>
              <div className="col-span-1 flex justify-end">
                <button className="w-8 h-8 flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            {i === 0 && (
              <div className="px-6 pb-6 pt-2">
                <div className="h-32 w-full bg-surface-container-lowest relative overflow-hidden flex items-end rounded-sm border border-outline-variant/10">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#4d4635 1px, transparent 1px), linear-gradient(90deg, #4d4635 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                  <svg className="w-full h-full text-secondary-container/30" preserveAspectRatio="none" viewBox="0 0 400 100">
                    <path d="M0,80 L50,85 L100,70 L150,75 L200,40 L250,50 L300,20 L350,30 L400,10" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="absolute left-0 bottom-[20%] w-2 h-2 bg-secondary-container rounded-full shadow-[0_0_8px_#00b954] -translate-x-1" />
                  <div className="absolute right-0 bottom-[90%] w-2 h-2 bg-secondary-container rounded-full shadow-[0_0_8px_#00b954] translate-x-1" />
                  <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-secondary-container/5 to-transparent" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
