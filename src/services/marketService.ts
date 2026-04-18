import { useEffect, useState } from "react";

export interface MarketAsset {
  id: string;
  price: string;
  change: string;
  trend: "up" | "down";
}

export interface MarketUpdate {
  type: string;
  timestamp: string;
  data: any;
  assetId?: string;
  bids?: [number, number][];
  asks?: [number, number][];
}

export function useMarketData() {
  const [data, setData] = useState<MarketAsset[]>([]);
  const [historyData, setHistoryData] = useState<Record<string, { time: string; price: number }[]>>({});
  const [orderBooks, setOrderBooks] = useState<Record<string, { bids: [number, number][]; asks: [number, number][] }>>({});
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}`);

    socket.onmessage = (event) => {
      try {
        const message: MarketUpdate = JSON.parse(event.data);
        if (message.type === "MARKET_UPDATE") {
          setData(message.data);
          setLastUpdate(message.timestamp);
        } else if (message.type === "MARKET_HISTORY") {
          const historyMap: Record<string, { time: string; price: number }[]> = {};
          message.data.forEach((item: any) => {
            historyMap[item.id] = item.history;
          });
          setHistoryData(historyMap);
        } else if (message.type === "ORDER_BOOK_UPDATE") {
          setOrderBooks(prev => ({
            ...prev,
            [message.assetId]: {
              bids: message.bids,
              asks: message.asks
            }
          }));
        }
      } catch (error) {
        console.error("Failed to parse market data:", error);
      }
    };

    socket.onopen = () => {
      console.log("Connected to market feed");
      setIsConnected(true);
    };
    
    socket.onclose = () => {
      console.log("Disconnected from market feed");
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  return { data, historyData, orderBooks, lastUpdate, isConnected };
}

export type Timeframe = "1m" | "5m" | "1H" | "1D" | "1W";

export function useAssetHistory(assetId: string, timeframe: Timeframe = "1m", limit: number = 60) {
  const [history, setHistory] = useState<{ time: string; price: number; volume: number; fullTimestamp: string }[]>([]);
  const { data, historyData } = useMarketData();

  // Reset history when asset or timeframe changes
  useEffect(() => {
    if (historyData[assetId]) {
      setHistory(historyData[assetId] as any);
    } else {
      setHistory([]);
    }
  }, [assetId, timeframe, historyData]);

  // Initialize with mock data
  useEffect(() => {
    if (history.length === 0 && data.length > 0) {
      const asset = data.find(a => a.id === assetId);
      if (asset) {
        const basePrice = parseFloat(asset.price.replace(/,/g, ''));
        
        const getInterval = () => {
          switch(timeframe) {
            case "1m": return 1000;
            case "5m": return 5000;
            case "1H": return 60000;
            case "1D": return 3600000;
            case "1W": return 86400000;
            default: return 1000;
          }
        };

        const getTimeFormat = (date: Date) => {
          switch(timeframe) {
            case "1m": 
            case "5m": return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            case "1H": return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            case "1D": return date.toLocaleTimeString([], { hour: '2-digit', weekday: 'short' });
            case "1W": return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            default: return date.toLocaleTimeString();
          }
        };

        const interval = getInterval();
        const initialHistory = Array.from({ length: limit }).map((_, i) => {
          const time = new Date(Date.now() - (limit - i) * interval);
          return {
            time: getTimeFormat(time),
            fullTimestamp: time.toLocaleString(),
            price: basePrice * (1 + (Math.random() - 0.5) * 0.02),
            volume: Math.random() * (basePrice * 0.1) + (basePrice * 0.05)
          };
        });
        setHistory(initialHistory);
      }
    }
  }, [data, assetId, timeframe, limit, history.length]);

  // Update history with real-time data (only for smaller timeframes)
  useEffect(() => {
    if (timeframe !== "1m" && timeframe !== "5m") return;

    const asset = data.find(a => a.id === assetId);
    if (asset && history.length > 0) {
      setHistory(prev => {
        const now = new Date();
        const newPrice = parseFloat(asset.price.replace(/,/g, ''));
        
        const newPoint = {
          time: now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: timeframe === "1m" ? '2-digit' : undefined 
          }),
          fullTimestamp: now.toLocaleString(),
          price: newPrice,
          volume: Math.random() * (newPrice * 0.1) + (newPrice * 0.05)
        };

        const newHistory = [...prev, newPoint];
        if (newHistory.length > limit) {
          return newHistory.slice(newHistory.length - limit);
        }
        return newHistory;
      });
    }
  }, [data, assetId, timeframe, limit]);

  return history;
}
