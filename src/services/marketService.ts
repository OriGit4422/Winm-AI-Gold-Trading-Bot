import { useEffect, useState } from "react";

export interface MarketAsset {
  id: string;
  price: string;
  change: string;
  trend: "up" | "down";
}

export interface COTData {
  assetId: string;
  date: string;
  commercials: { long: number; short: number; net: number };
  nonCommercials: { long: number; short: number; net: number };
  retail: { long: number; short: number; net: number };
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface OrderFlowPoint {
  price: number;
  buyVol: number;
  sellVol: number;
  delta: number;
  isPOC?: boolean;
}

export interface FootprintCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  levels: OrderFlowPoint[];
  totalDelta: number;
  totalVolume: number;
  cvd: number;
}

export interface IntermarketData {
  yield10Y: string;
  dxy: string;
  timestamp: string;
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

export function useCOTData(assetId: string) {
  const [cotData, setCotData] = useState<COTData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCOT = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/cot");
        const contentType = res.headers.get("content-type");

        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.error) throw new Error(data.error);

          setCotData({
            assetId,
            date: data.date || new Date().toLocaleDateString(),
            commercials: data.commercials,
            nonCommercials: data.nonCommercials,
            retail: { long: 0, short: 0, net: 0 },
            sentiment: (data.nonCommercials?.net || 0) > 0 ? 'bullish' : 'bearish'
          });
        } else {
          throw new Error(`Invalid response: ${res.status}`);
        }
      } catch (e) {
        console.error("COT fetch failed, using fallback:", e);
        setCotData({
          assetId,
          date: new Date().toLocaleDateString(),
          commercials: { long: 245000, short: 85000, net: 160000 },
          nonCommercials: { long: 110000, short: 190000, net: -80000 },
          retail: { long: 45000, short: 48000, net: -3000 },
          sentiment: 'bullish'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCOT();
  }, [assetId]);

  return { cotData, loading };
}

export function useIntermarketData() {
  const [intermarket, setIntermarket] = useState<IntermarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntermarket = async () => {
      try {
        const res = await fetch("/api/intermarket");
        const contentType = res.headers.get("content-type");
        
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setIntermarket({
            ...data,
            timestamp: new Date().toISOString()
          });
        } else if (!res.ok) {
          console.error("Intermarket API error:", res.status);
        }
      } catch (e) {
        console.error("Intermarket fetch failed:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchIntermarket();
    const interval = setInterval(fetchIntermarket, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  return { intermarket, loading };
}

export function useOrderFlow(assetId: string, timeframe: Timeframe = "1m") {
  const [footprints, setFootprints] = useState<FootprintCandle[]>([]);
  const [latestCVD, setLatestCVD] = useState(0);

  useEffect(() => {
    // Determine Binance symbol
    const symbol = assetId === "BTC/USD" ? "BTCUSDT" : assetId === "ETH/USD" ? "ETHUSDT" : assetId === "XAU/USD" ? "PAXGUSDT" : null;
    
    if (!symbol) {
      // Fallback to simulation if not a binance-supported asset in this context
      return; 
    }

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@aggTrade`);
    let currentCandle: FootprintCandle | null = null;
    let cvdAccumulator = 0;

    ws.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      const price = parseFloat(trade.p);
      const quantity = parseFloat(trade.q);
      const isBuyerMaker = trade.m; // true means seller, false means buyer
      const delta = isBuyerMaker ? -quantity : quantity;

      setFootprints(prev => {
        const now = new Date();
        const timeKey = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const lastCandle = prev[prev.length - 1];
        
        if (!lastCandle || lastCandle.time !== timeKey) {
          // New candle
          const newCandle: FootprintCandle = {
            time: timeKey,
            open: price,
            high: price,
            low: price,
            close: price,
            levels: [{ price, buyVol: !isBuyerMaker ? quantity : 0, sellVol: isBuyerMaker ? quantity : 0, delta: delta, isPOC: true }],
            totalDelta: delta,
            totalVolume: quantity,
            cvd: cvdAccumulator + delta
          };
          
          cvdAccumulator += delta;
          setLatestCVD(cvdAccumulator);
          
          const next = [...prev, newCandle];
          return next.slice(-20); // Keep last 20 candles
        } else {
          // Update existing candle
          const updatedLevels = [...lastCandle.levels];
          const levelIdx = updatedLevels.findIndex(l => Math.abs(l.price - price) < 0.5); // Price binning
          
          if (levelIdx === -1) {
            updatedLevels.push({ price, buyVol: !isBuyerMaker ? quantity : 0, sellVol: isBuyerMaker ? quantity : 0, delta: delta });
          } else {
            updatedLevels[levelIdx] = {
              ...updatedLevels[levelIdx],
              buyVol: updatedLevels[levelIdx].buyVol + (!isBuyerMaker ? quantity : 0),
              sellVol: updatedLevels[levelIdx].sellVol + (isBuyerMaker ? quantity : 0),
              delta: updatedLevels[levelIdx].delta + delta
            };
          }

          // Recalculate POC immutably
          const maxVol = Math.max(...updatedLevels.map(l => l.buyVol + l.sellVol));
          const levelsWithPOC = updatedLevels.map(l => ({
            ...l,
            isPOC: (l.buyVol + l.sellVol === maxVol)
          }));

          cvdAccumulator += delta;
          setLatestCVD(cvdAccumulator);

          const updatedCandle: FootprintCandle = {
            ...lastCandle,
            high: Math.max(lastCandle.high, price),
            low: Math.min(lastCandle.low, price),
            close: price,
            levels: levelsWithPOC,
            totalDelta: lastCandle.totalDelta + delta,
            totalVolume: lastCandle.totalVolume + quantity,
            cvd: cvdAccumulator
          };

          return [...prev.slice(0, -1), updatedCandle];
        }
      });
    };

    return () => ws.close();
  }, [assetId]);

  return { footprints, latestCVD };
}
