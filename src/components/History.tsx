import { TrendingUp, TrendingDown, ChevronDown, Activity, Bitcoin, RefreshCw, Clock } from "lucide-react";
import { useTrades } from "../services/tradeService";
import { useState } from "react";

type Period = "Today" | "Week" | "Month" | "All";

export function History() {
  const { trades, loading, stats, refresh } = useTrades(10000);
  const [period, setPeriod] = useState<Period>("Today");

  const filterTrades = () => {
    const now = new Date();
    return trades.filter(t => {
      const opened = new Date(t.openTime);
      if (period === "Today") {
        return opened.toDateString() === now.toDateString();
      } else if (period === "Week") {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        return opened >= weekAgo;
      } else if (period === "Month") {
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        return opened >= monthAgo;
      }
      return true; // All
    });
  };

  const filteredTrades = filterTrades();
  const closedFiltered = filteredTrades.filter(t => t.status === "CLOSED");
  const filteredWins = closedFiltered.filter(t => parseFloat((t.profit || "0").replace(/[^-\d.]/g, "")) > 0).length;
  const filteredNetProfit = closedFiltered.reduce((s, t) => s + parseFloat((t.profit || "0").replace(/[^-\d.]/g, "")), 0);
  const filteredWinRate = closedFiltered.length > 0
    ? ((filteredWins / closedFiltered.length) * 100).toFixed(1)
    : "--";

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Trade History</h2>
          <p className="text-on-surface-variant text-sm">Verified audit of executed trade cycles.</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={refresh}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface/40 hover:text-primary"
            title="Refresh trades"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex bg-surface-container-low p-1 rounded-sm border border-outline-variant/10">
            {(["Today", "Week", "Month", "All"] as Period[]).map((filter, i) => (
              <button
                key={filter}
                onClick={() => setPeriod(filter)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  period === filter
                    ? "bg-surface-container-highest text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Net Profit",
            value: closedFiltered.length > 0
              ? (filteredNetProfit >= 0 ? "+" : "") + "$" + Math.abs(filteredNetProfit).toFixed(2)
              : "--",
            sub: period + " Period",
            trend: filteredNetProfit >= 0 ? "up" : "down",
          },
          {
            label: "Win Rate",
            value: closedFiltered.length > 0 ? filteredWinRate + "%" : "--",
            sub: "Progress bar",
            trend: "up",
          },
          {
            label: "Total Trades",
            value: String(closedFiltered.length || "--"),
            sub: closedFiltered.length > 0
              ? `${filteredWins} WINS / ${closedFiltered.length - filteredWins} LOSSES`
              : "No closed trades yet",
            trend: "none",
          },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-low p-5 rounded-sm flex flex-col justify-between h-32 border-l-2 border-outline-variant">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
            <span className={`text-2xl font-bold tnum ${stat.trend === "up" ? "text-secondary-container" : stat.trend === "down" ? "text-tertiary-container" : "text-on-surface"}`}>
              {stat.value}
            </span>
            {stat.label === "Win Rate" && closedFiltered.length > 0 ? (
              <div className="w-full bg-surface-container-highest h-1 mt-2">
                <div
                  className="bg-primary h-full shadow-[0_0_8px_rgba(242,202,80,0.4)]"
                  style={{ width: `${filteredWinRate}%` }}
                />
              </div>
            ) : (
              <div className={`flex items-center gap-2 text-[10px] ${stat.trend === "up" ? "text-secondary-container/70" : stat.trend === "down" ? "text-tertiary-container/70" : "text-on-surface-variant"}`}>
                {stat.trend === "up" && <TrendingUp className="w-3 h-3" />}
                {stat.trend === "down" && <TrendingDown className="w-3 h-3" />}
                <span className="uppercase tracking-wider">{stat.sub}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trade Table */}
      <div className="space-y-3">
        <div className="hidden md:grid grid-cols-6 px-6 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 border-b border-outline-variant/10">
          <div>Asset / Type</div>
          <div>Entry Price</div>
          <div>Status</div>
          <div>Profit/Loss</div>
          <div className="text-right">Opened</div>
          <div className="text-right">Details</div>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-container-low px-6 py-4 animate-pulse rounded">
              <div className="h-4 bg-outline-variant/20 rounded w-1/4" />
            </div>
          ))
        ) : filteredTrades.length === 0 ? (
          <div className="px-6 py-12 text-center bg-surface-container-low rounded">
            <Clock className="w-8 h-8 text-on-surface/10 mx-auto mb-3" />
            <p className="text-on-surface/60 text-sm font-medium">No trades in this period.</p>
            <p className="text-[10px] text-on-surface/30 uppercase tracking-widest mt-2">
              {period === "Today" ? "Switch to 'All' to see all trades, or execute a trade from the Alpha Alerts tab." : "Execute trades from the Alpha Alerts tab to build your history."}
            </p>
          </div>
        ) : (
          filteredTrades.map((trade, i) => (
            <div key={trade.id} className="group bg-surface-container-low hover:bg-surface-container transition-all duration-300">
              <div className="grid grid-cols-2 md:grid-cols-6 items-center px-4 md:px-6 py-4 gap-4">
                <div className="col-span-1 flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-surface-container-highest rounded-sm">
                    {trade.symbol.includes("BTC") || trade.symbol.includes("ETH")
                      ? <Bitcoin className="w-4 h-4 text-primary" />
                      : <Activity className="w-4 h-4 text-primary" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold font-headline">{trade.symbol}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-tighter ${trade.type === "BUY" ? "text-secondary-container" : "text-tertiary-container"}`}>
                      {trade.type}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block col-span-1 tnum text-sm text-on-surface/80">
                  {trade.entryPrice.toFixed(trade.symbol.includes("JPY") ? 3 : trade.symbol.includes("BTC") || trade.symbol.includes("XAU") ? 2 : 5)}
                </div>
                <div className="hidden md:block col-span-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${trade.status === "OPEN" ? "bg-primary/10 text-primary" : "bg-surface-container-highest text-on-surface/60"}`}>
                    {trade.status}
                  </span>
                </div>
                <div className={`col-span-1 tnum text-sm font-bold text-right md:text-left ${
                  trade.profit
                    ? parseFloat(trade.profit.replace(/[^-\d.]/g, "")) >= 0 ? "text-secondary-container" : "text-tertiary-container"
                    : "text-on-surface/40"
                }`}>
                  {trade.profit || (trade.status === "OPEN" ? "Open" : "--")}
                </div>
                <div className="hidden md:block col-span-1 tnum text-[11px] text-on-surface-variant text-right">
                  {new Date(trade.openTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button className="w-8 h-8 flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
