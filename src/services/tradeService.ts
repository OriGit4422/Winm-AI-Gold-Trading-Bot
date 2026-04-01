import { useEffect, useState, useCallback } from "react";

export interface Trade {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  lotSize: number;
  leverage: number;
  riskLimit: number;
  entryPrice: number;
  exitPrice?: number;
  profit?: string;
  status: "OPEN" | "CLOSED";
  openTime: string;
  closeTime?: string;
}

export interface TradeStats {
  netProfit: string;
  netProfitPct: string;
  winRate: string;
  totalTrades: number;
  wins: number;
  losses: number;
}

function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter(t => t.status === "CLOSED");
  const totalTrades = closed.length;
  const wins = closed.filter(t => parseFloat((t.profit || "0").replace(/[^-\d.]/g, "")) > 0).length;
  const losses = totalTrades - wins;
  const netProfit = closed.reduce((sum, t) => sum + parseFloat((t.profit || "0").replace(/[^-\d.]/g, "")), 0);
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "--";

  return {
    netProfit: (netProfit >= 0 ? "+" : "") + "$" + Math.abs(netProfit).toFixed(2),
    netProfitPct: (netProfit >= 0 ? "+" : "") + ((netProfit / 10000) * 100).toFixed(1) + "%",
    winRate: totalTrades > 0 ? winRate + "%" : "--",
    totalTrades,
    wins,
    losses,
  };
}

export function useTrades(refreshIntervalMs = 15000) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch("/api/trades")
      .then(r => r.json())
      .then(({ trades: data }) => setTrades(data ?? []))
      .catch(() => {/* keep existing */})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refresh, refreshIntervalMs]);

  const stats = computeStats(trades);
  return { trades, loading, stats, refresh };
}

export async function executeTrade(params: {
  symbol: string;
  type: "BUY" | "SELL";
  lotSize: string;
  leverage: string;
  riskLimit: string;
}): Promise<{ success: boolean; trade?: Trade; error?: string }> {
  const resp = await fetch("/api/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return resp.json();
}
