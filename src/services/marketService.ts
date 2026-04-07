import { useEffect, useState } from "react";

export interface MarketAsset {
  id: string;
  price: string;
  change: string;
  trend: "up" | "down";
  bid?: string;
  ask?: string;
  spread?: string;
  dataSource?: "twelve_data" | "alpha_vantage" | "simulator";
}

export interface MarketUpdate {
  type: string;
  timestamp: string;
  dataSource: string;
  data: MarketAsset[];
}

export function useMarketData() {
  const [data, setData] = useState<MarketAsset[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [dataSource, setDataSource] = useState<string>("simulator");

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onmessage = (event) => {
      try {
        const message: MarketUpdate = JSON.parse(event.data);
        if (message.type === "MARKET_UPDATE") {
          setData(message.data);
          setLastUpdate(message.timestamp);
          setDataSource(message.dataSource || "simulator");
        }
      } catch {
        console.error("Failed to parse market data");
      }
    };

    socket.onopen = () => console.log("Connected to market feed");
    socket.onclose = () => console.log("Disconnected from market feed");
    socket.onerror = () => console.error("WebSocket error");

    return () => socket.close();
  }, []);

  return { data, lastUpdate, dataSource };
}

export type Timeframe = "1m" | "5m" | "1H" | "1D" | "1W";

const timeframeToInterval: Record<Timeframe, string> = {
  "1m": "1min",
  "5m": "5min",
  "1H": "1h",
  "1D": "1day",
  "1W": "1week",
};

const timeframeToMs: Record<Timeframe, number> = {
  "1m": 60000,
  "5m": 300000,
  "1H": 3600000,
  "1D": 86400000,
  "1W": 604800000,
};

function formatTime(date: Date, timeframe: Timeframe): string {
  switch (timeframe) {
    case "1m":
    case "5m":
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    case "1H":
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    case "1D":
      return date.toLocaleDateString([], { weekday: "short", hour: "2-digit" });
    case "1W":
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

export function useAssetHistory(assetId: string, timeframe: Timeframe = "1m", limit: number = 60) {
  const [history, setHistory] = useState<{ time: string; price: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const { data } = useMarketData();

  // Fetch real history from backend when asset or timeframe changes
  useEffect(() => {
    if (!assetId) return;
    setLoading(true);
    setHistory([]);

    const interval = timeframeToInterval[timeframe];
    fetch(`/api/prices/history/${encodeURIComponent(assetId)}?interval=${interval}&outputsize=${limit}`)
      .then(r => r.json())
      .then(({ history: fetchedHistory }) => {
        if (fetchedHistory?.length) {
          setHistory(
            fetchedHistory.map((p: { time: string; price: number }) => ({
              time: p.time.includes("T")
                ? formatTime(new Date(p.time), timeframe)
                : p.time,
              price: p.price,
            }))
          );
        }
      })
      .catch(() => {
        // If fetch fails, seed with current price and a flat line
        const asset = data.find(a => a.id === assetId);
        if (asset) {
          const basePrice = parseFloat(asset.price.replace(/,/g, ""));
          const ms = timeframeToMs[timeframe];
          setHistory(
            Array.from({ length: limit }, (_, i) => ({
              time: formatTime(new Date(Date.now() - (limit - i) * ms), timeframe),
              price: basePrice,
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, [assetId, timeframe, limit]);

  // Append live price updates from WebSocket (only for short timeframes)
  useEffect(() => {
    if (timeframe !== "1m" && timeframe !== "5m") return;
    if (loading || history.length === 0) return;

    const asset = data.find(a => a.id === assetId);
    if (!asset) return;

    const newPrice = parseFloat(asset.price.replace(/,/g, ""));
    setHistory(prev => {
      const newPoint = {
        time: formatTime(new Date(), timeframe),
        price: newPrice,
      };
      const updated = [...prev, newPoint];
      return updated.length > limit ? updated.slice(updated.length - limit) : updated;
    });
  }, [data, assetId, timeframe, limit]);

  return history;
}
