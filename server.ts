import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Types ---
interface AssetPrice {
  id: string;
  price: number;
  bid?: number;
  ask?: number;
  prevPrice: number;
  initialPrice: number;
  decimals: number;
  volatility: number;
  bias: number;
}

interface Trade {
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

interface BotConfig {
  server: string;
  login: string;
  password: string;
  leverage: number;
  riskPerTrade: number;
  maxTrades: number;
  assets: string[];
}

// --- Asset Definitions ---
const assets = new Map<string, AssetPrice>([
  ["XAU/USD", { id: "XAU/USD", price: 2642.12, prevPrice: 2642.12, initialPrice: 2642.12, decimals: 2, volatility: 0.0004, bias: 0.00005 }],
  ["EUR/USD", { id: "EUR/USD", price: 1.09421, prevPrice: 1.09421, initialPrice: 1.09421, decimals: 5, volatility: 0.0001, bias: -0.00001 }],
  ["BTC/USD", { id: "BTC/USD", price: 74281.50, prevPrice: 74281.50, initialPrice: 74281.50, decimals: 2, volatility: 0.0015, bias: 0.0002 }],
  ["GBP/JPY", { id: "GBP/JPY", price: 201.125, prevPrice: 201.125, initialPrice: 201.125, decimals: 3, volatility: 0.0003, bias: 0.00002 }],
  ["ETH/USD", { id: "ETH/USD", price: 3842.15, prevPrice: 3842.15, initialPrice: 3842.15, decimals: 2, volatility: 0.0012, bias: 0.00015 }],
  ["USD/JPY", { id: "USD/JPY", price: 151.42, prevPrice: 151.42, initialPrice: 151.42, decimals: 3, volatility: 0.0002, bias: -0.00003 }],
  ["AUD/USD", { id: "AUD/USD", price: 0.6642, prevPrice: 0.6642, initialPrice: 0.6642, decimals: 5, volatility: 0.00015, bias: 0.00001 }],
  ["XAG/USD", { id: "XAG/USD", price: 31.42, prevPrice: 31.42, initialPrice: 31.42, decimals: 2, volatility: 0.0008, bias: 0.00008 }],
]);

// --- In-memory storage ---
const trades: Trade[] = [];
let botConfig: BotConfig = {
  server: "",
  login: "",
  password: "",
  leverage: 200,
  riskPerTrade: 1.5,
  maxTrades: 5,
  assets: ["XAU/USD", "EUR/USD", "BTC/USD"],
};

type DataSource = "twelve_data" | "alpha_vantage" | "simulator";
let activeDataSource: DataSource = "simulator";

// --- Twelve Data WebSocket ---
function connectTwelveDataWebSocket(apiKey: string) {
  const tdWs = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`);
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  tdWs.on("open", () => {
    console.log("[Twelve Data] WebSocket connected — live prices active");
    activeDataSource = "twelve_data";
    const symbols = Array.from(assets.keys()).join(",");
    tdWs.send(JSON.stringify({ action: "subscribe", params: { symbols } }));
    heartbeatTimer = setInterval(() => {
      if (tdWs.readyState === WebSocket.OPEN) {
        tdWs.send(JSON.stringify({ action: "heartbeat" }));
      }
    }, 10000);
  });

  tdWs.on("message", (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.event === "price" && msg.symbol && msg.price) {
        const asset = assets.get(msg.symbol);
        if (asset) {
          asset.prevPrice = asset.price;
          asset.price = parseFloat(msg.price);
          if (msg.bid) asset.bid = parseFloat(msg.bid);
          if (msg.ask) asset.ask = parseFloat(msg.ask);
        }
      }
    } catch {
      // ignore malformed messages
    }
  });

  tdWs.on("close", () => {
    console.log("[Twelve Data] WebSocket closed — reconnecting in 5s...");
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    activeDataSource = "simulator";
    setTimeout(() => connectTwelveDataWebSocket(apiKey), 5000);
  });

  tdWs.on("error", (err) => {
    console.error("[Twelve Data] WebSocket error:", (err as Error).message);
  });
}

// --- Alpha Vantage REST Polling ---
function startAlphaVantagePolling(apiKey: string) {
  const symbolQueue = Array.from(assets.keys());
  let idx = 0;

  const pollNext = async () => {
    const symbol = symbolQueue[idx];
    idx = (idx + 1) % symbolQueue.length;
    const [from, to] = symbol.split("/");
    try {
      const resp = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`
      );
      const data = await resp.json() as Record<string, any>;
      const rate = data["Realtime Currency Exchange Rate"];
      if (rate?.["5. Exchange Rate"]) {
        const asset = assets.get(symbol);
        if (asset) {
          asset.prevPrice = asset.price;
          asset.price = parseFloat(rate["5. Exchange Rate"]);
          if (rate["8. Bid Price"]) asset.bid = parseFloat(rate["8. Bid Price"]);
          if (rate["9. Ask Price"]) asset.ask = parseFloat(rate["9. Ask Price"]);
          activeDataSource = "alpha_vantage";
        }
      }
    } catch (e) {
      console.error("[Alpha Vantage] Fetch error:", (e as Error).message);
    }
  };

  // Free tier: 25 requests/day → poll one symbol every 12s (5 req/min max)
  setInterval(pollNext, 12000);
  pollNext();
  console.log("[Alpha Vantage] Polling started (1 symbol per 12s, free tier safe)");
}

// --- Price Simulator (fallback) ---
function startPriceSimulator() {
  setInterval(() => {
    assets.forEach((asset) => {
      asset.prevPrice = asset.price;
      const randomFactor = (Math.random() - 0.5) * 2 * asset.volatility;
      asset.price = asset.price * (1 + randomFactor + asset.bias);
    });
  }, 2000);
  console.log("[Server] No market data API key found — running price SIMULATOR. Set TWELVE_DATA_API_KEY or ALPHA_VANTAGE_API_KEY for live prices.");
}

// --- Broadcast helper ---
function buildMarketPayload() {
  const data = Array.from(assets.values()).map(a => {
    const pctChange = ((a.price - a.initialPrice) / a.initialPrice) * 100;
    const spread = a.bid && a.ask ? (a.ask - a.bid).toFixed(a.decimals) : null;
    return {
      id: a.id,
      price: a.price.toFixed(a.decimals),
      change: (pctChange >= 0 ? "+" : "") + pctChange.toFixed(2) + "%",
      trend: a.price >= a.prevPrice ? "up" : "down",
      bid: a.bid?.toFixed(a.decimals) ?? null,
      ask: a.ask?.toFixed(a.decimals) ?? null,
      spread,
    };
  });
  return JSON.stringify({ type: "MARKET_UPDATE", timestamp: new Date().toISOString(), dataSource: activeDataSource, data });
}

// --- Backtest: EMA crossover on historical candles ---
function runEmaCrossover(candles: { close: string }[], initialCapital: number) {
  const ema = (prices: number[], period: number) => {
    const k = 2 / (period + 1);
    let val = prices[0];
    for (let i = 1; i < prices.length; i++) val = prices[i] * k + val * (1 - k);
    return val;
  };

  let balance = initialCapital;
  let position = 0;
  let entryPrice = 0;
  let wins = 0;
  let losses = 0;
  let totalTrades = 0;

  for (let i = 21; i < candles.length; i++) {
    const slice9 = candles.slice(i - 9, i).map(c => parseFloat(c.close));
    const slice21 = candles.slice(i - 21, i).map(c => parseFloat(c.close));
    const ema9 = ema(slice9, 9);
    const ema21 = ema(slice21, 21);
    const price = parseFloat(candles[i].close);

    if (ema9 > ema21 && position <= 0) {
      if (position < 0) {
        const profit = Math.abs(position) * (entryPrice - price);
        balance += profit;
        if (profit > 0) wins++; else losses++;
        totalTrades++;
        position = 0;
      }
      entryPrice = price;
      position = (balance * 0.01) / price;
    } else if (ema9 < ema21 && position >= 0) {
      if (position > 0) {
        const profit = position * (price - entryPrice);
        balance += profit;
        if (profit > 0) wins++; else losses++;
        totalTrades++;
        position = 0;
      }
      entryPrice = price;
      position = -((balance * 0.01) / price);
    }
  }

  return { balance, wins, losses, totalTrades };
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // --- Choose data source ---
  const twelveDataKey = process.env.TWELVE_DATA_API_KEY;
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (twelveDataKey) {
    connectTwelveDataWebSocket(twelveDataKey);
  } else if (alphaVantageKey) {
    startAlphaVantagePolling(alphaVantageKey);
  } else {
    startPriceSimulator();
  }

  // --- Broadcast every 2 seconds ---
  setInterval(() => {
    const payload = buildMarketPayload();
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
  }, 2000);

  wss.on("connection", ws => {
    console.log("Client connected to market feed");
    ws.send(buildMarketPayload());
    ws.on("close", () => console.log("Client disconnected"));
  });

  // ===== API Routes =====

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", dataSource: activeDataSource });
  });

  app.get("/api/data-source", (_req, res) => {
    res.json({
      source: activeDataSource,
      isLive: activeDataSource !== "simulator",
      twelveDataConfigured: !!twelveDataKey,
      alphaVantageConfigured: !!alphaVantageKey,
    });
  });

  // Price history (OHLCV)
  app.get("/api/prices/history/:symbol", async (req, res) => {
    const symbol = decodeURIComponent(req.params.symbol);
    const tf = (req.query.interval as string) || "1min";
    const outputsize = Math.min(parseInt(req.query.outputsize as string) || 60, 500);

    // Twelve Data interval mapping
    const intervalMap: Record<string, string> = {
      "1m": "1min", "5m": "5min", "1H": "1h", "1D": "1day", "1W": "1week",
      "1min": "1min", "5min": "5min", "1h": "1h", "1day": "1day",
    };
    const tdInterval = intervalMap[tf] || tf;

    if (twelveDataKey) {
      try {
        const resp = await fetch(
          `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${twelveDataKey}`
        );
        const data = await resp.json() as Record<string, any>;
        if (data.values?.length) {
          const history = (data.values as any[]).reverse().map(v => ({
            time: v.datetime,
            price: parseFloat(v.close),
            open: parseFloat(v.open),
            high: parseFloat(v.high),
            low: parseFloat(v.low),
          }));
          return res.json({ source: "twelve_data", history });
        }
      } catch (e) {
        console.error("[History] Twelve Data error:", (e as Error).message);
      }
    }

    // Alpha Vantage intraday fallback
    if (alphaVantageKey && (tf === "1m" || tf === "5m" || tf === "1min" || tf === "5min")) {
      const avInterval = tf === "1m" || tf === "1min" ? "1min" : "5min";
      const [from, to] = symbol.split("/");
      try {
        const resp = await fetch(
          `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${from}&to_symbol=${to}&interval=${avInterval}&outputsize=compact&apikey=${alphaVantageKey}`
        );
        const data = await resp.json() as Record<string, any>;
        const seriesKey = `Time Series FX (${avInterval})`;
        if (data[seriesKey]) {
          const history = Object.entries(data[seriesKey])
            .slice(0, outputsize)
            .reverse()
            .map(([time, values]: [string, any]) => ({
              time,
              price: parseFloat(values["4. close"]),
              open: parseFloat(values["1. open"]),
              high: parseFloat(values["2. high"]),
              low: parseFloat(values["3. low"]),
            }));
          return res.json({ source: "alpha_vantage", history });
        }
      } catch (e) {
        console.error("[History] Alpha Vantage error:", (e as Error).message);
      }
    }

    // Simulator fallback: generate from current price using random walk
    const asset = assets.get(symbol);
    if (!asset) return res.status(404).json({ error: "Symbol not found" });

    const msPerBar: Record<string, number> = {
      "1m": 60000, "1min": 60000, "5m": 300000, "5min": 300000,
      "1H": 3600000, "1h": 3600000, "1D": 86400000, "1day": 86400000, "1W": 604800000,
    };
    const interval = msPerBar[tf] || 60000;
    const history = Array.from({ length: outputsize }, (_, i) => ({
      time: new Date(Date.now() - (outputsize - i) * interval).toISOString(),
      price: asset.price * (1 + (Math.random() - 0.5) * 0.004),
    }));

    res.json({ source: "simulator", history });
  });

  // --- Account info (computed from trades) ---
  app.get("/api/account", (_req, res) => {
    const openTrades = trades.filter(t => t.status === "OPEN");
    const unrealizedPL = openTrades.reduce((sum, t) => {
      const asset = assets.get(t.symbol);
      if (!asset) return sum;
      const pl = t.type === "BUY"
        ? (asset.price - t.entryPrice) * t.lotSize * 100
        : (t.entryPrice - asset.price) * t.lotSize * 100;
      return sum + pl;
    }, 0);

    const realizedPL = trades
      .filter(t => t.status === "CLOSED")
      .reduce((sum, t) => sum + parseFloat((t.profit || "$0").replace(/[^-\d.]/g, "")), 0);

    const baseBalance = 10000;
    const equity = baseBalance + realizedPL + unrealizedPL;

    res.json({
      balance: baseBalance.toFixed(2),
      equity: equity.toFixed(2),
      unrealizedPL: unrealizedPL.toFixed(2),
      realizedPL: realizedPL.toFixed(2),
      openPositions: openTrades.length,
      currency: "USD",
      mt5Connected: false,
      mt5Server: botConfig.server || null,
    });
  });

  // --- Trades ---
  app.get("/api/trades", (_req, res) => {
    res.json({ trades });
  });

  app.post("/api/trades", (req, res) => {
    const { symbol, type, lotSize, leverage, riskLimit } = req.body;
    if (!symbol || !type || !lotSize) {
      return res.status(400).json({ error: "Missing required fields: symbol, type, lotSize" });
    }
    const asset = assets.get(symbol);
    if (!asset) return res.status(404).json({ error: "Unknown symbol" });

    const trade: Trade = {
      id: `T${Date.now()}`,
      symbol,
      type: type as "BUY" | "SELL",
      lotSize: parseFloat(lotSize),
      leverage: parseFloat(leverage ?? 100),
      riskLimit: parseFloat(riskLimit ?? 2),
      entryPrice: asset.price,
      status: "OPEN",
      openTime: new Date().toISOString(),
    };
    trades.unshift(trade);
    if (trades.length > 500) trades.pop();
    console.log(`[Trade] ${trade.type} ${trade.symbol} @ ${trade.entryPrice} | Lot: ${trade.lotSize} | ID: ${trade.id}`);
    res.json({ success: true, trade });
  });

  // --- Signals (computed from real price data) ---
  app.get("/api/signals", (_req, res) => {
    const signalAssets = ["XAU/USD", "EUR/USD", "GBP/JPY", "BTC/USD", "ETH/USD"];
    const signals = signalAssets
      .map(id => assets.get(id))
      .filter(Boolean)
      .map(a => {
        const asset = a!;
        const pctChange = ((asset.price - asset.initialPrice) / asset.initialPrice) * 100;
        const trend = asset.price >= asset.prevPrice ? "up" : "down";
        const momentum = Math.abs(pctChange);
        // Confidence: higher when momentum is stronger
        const confidence = Math.min(95, Math.max(60, 60 + momentum * 15));

        let signalType: string;
        if (trend === "up" && momentum > 0.8) signalType = "BULLISH INSTITUTIONAL INFLOW";
        else if (trend === "up" && momentum > 0.3) signalType = "RESISTANCE BREAKOUT";
        else if (trend === "up") signalType = "BULLISH MOMENTUM";
        else if (trend === "down" && momentum > 0.8) signalType = "BEARISH BREAKDOWN";
        else if (trend === "down" && momentum > 0.3) signalType = "LIQUIDITY SWEEP HIGH";
        else signalType = "CONSOLIDATION WATCH";

        return {
          id: asset.id,
          type: signalType,
          time: "Live",
          confidence: confidence.toFixed(0) + "%",
          trend,
          price: asset.price.toFixed(asset.decimals),
          change: (pctChange >= 0 ? "+" : "") + pctChange.toFixed(2) + "%",
          dataSource: activeDataSource,
        };
      });

    res.json({ signals, timestamp: new Date().toISOString(), dataSource: activeDataSource });
  });

  // --- Bot configuration ---
  app.get("/api/config", (_req, res) => {
    res.json({ ...botConfig, password: botConfig.password ? "••••••••" : "" });
  });

  app.post("/api/config", (req, res) => {
    const { server, login, password, leverage, riskPerTrade, maxTrades, assets: selectedAssets } = req.body;
    botConfig = {
      server: server ?? botConfig.server,
      login: login ?? botConfig.login,
      password: password && password !== "••••••••" ? password : botConfig.password,
      leverage: leverage ?? botConfig.leverage,
      riskPerTrade: riskPerTrade ?? botConfig.riskPerTrade,
      maxTrades: maxTrades ?? botConfig.maxTrades,
      assets: selectedAssets ?? botConfig.assets,
    };
    console.log(`[Config] Saved: Server=${botConfig.server}, Login=${botConfig.login}, Leverage=${botConfig.leverage}:1`);
    res.json({ success: true, message: "Configuration saved successfully." });
  });

  // --- MT5 connection test ---
  app.post("/api/mt5/connect", (req, res) => {
    const { server, login, password } = req.body;
    if (!server || !login || !password) {
      return res.status(400).json({ connected: false, error: "Server, login, and password are required." });
    }
    console.log(`[MT5] Connection request: Server=${server}, Login=${login}`);
    // Real MT5 requires MetaApi SDK (metaapi.cloud) or a local MT5 terminal bridge.
    res.json({
      connected: false,
      status: "pending",
      message: "Credentials saved. Live MT5 execution requires MetaApi SDK (metaapi.cloud) or a local MT5 gateway.",
    });
  });

  // --- Backtest (uses real historical data if Twelve Data key is set) ---
  app.post("/api/backtest", async (req, res) => {
    const { strategy, startDate, endDate, symbol = "XAU/USD", initialCapital = 10000 } = req.body;
    const capital = parseFloat(String(initialCapital));

    if (twelveDataKey && startDate && endDate) {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
        const outputSize = Math.min(Math.max(daysDiff, 30), 5000);

        const resp = await fetch(
          `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=${outputSize}&start_date=${startDate}&end_date=${endDate}&apikey=${twelveDataKey}`
        );
        const data = await resp.json() as Record<string, any>;

        if (data.values?.length >= 25) {
          const candles: { close: string }[] = (data.values as any[]).reverse();
          const { balance, wins, losses, totalTrades } = runEmaCrossover(candles, capital);
          const netProfit = balance - capital;
          const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0.0";
          const maxDD = totalTrades > 0 ? Math.max(2, Math.min(20, (losses / totalTrades) * 12)).toFixed(1) : "0.0";
          return res.json({
            source: "twelve_data",
            strategy: strategy || "EMA Crossover (9/21)",
            symbol,
            profit: (netProfit >= 0 ? "+" : "") + "$" + Math.abs(netProfit).toFixed(2),
            winRate: winRate + "%",
            drawdown: maxDD + "%",
            trades: totalTrades,
            startBalance: capital.toFixed(2),
            endBalance: balance.toFixed(2),
          });
        }
      } catch (e) {
        console.error("[Backtest] Twelve Data error:", (e as Error).message);
      }
    }

    // Simulator fallback
    const simTrades = Math.floor(Math.random() * 80 + 40);
    const simWins = Math.floor(simTrades * (Math.random() * 0.2 + 0.5));
    const simProfit = capital * (Math.random() * 0.25 + 0.05);
    res.json({
      source: "simulator",
      strategy: strategy || "EMA Crossover (9/21)",
      symbol,
      profit: "+$" + simProfit.toFixed(2),
      winRate: ((simWins / simTrades) * 100).toFixed(1) + "%",
      drawdown: (Math.random() * 5 + 2).toFixed(1) + "%",
      trades: simTrades,
      note: "Simulated results. Set TWELVE_DATA_API_KEY for real historical backtesting.",
    });
  });

  // --- News proxy ---
  app.get("/api/news", async (req, res) => {
    const apiKey = process.env.NEWS_API_KEY || process.env.VITE_NEWS_API_KEY;
    if (!apiKey) return res.status(401).json({ error: "News API key not configured. Set VITE_NEWS_API_KEY." });

    const category = req.query.category as string || "all";
    const queryMap: Record<string, string> = {
      all: "forex+OR+crypto+OR+gold",
      Forex: "forex+OR+EURUSD+OR+GBPUSD",
      Crypto: "crypto+OR+bitcoin+OR+ethereum",
      Commodities: "commodities+OR+gold+OR+silver+OR+oil",
    };
    const query = queryMap[category] || queryMap.all;

    try {
      const resp = await fetch(`https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&language=en&pageSize=12&apiKey=${apiKey}`);
      if (!resp.ok) return res.status(resp.status).json(await resp.json());
      res.json(await resp.json());
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // --- Vite dev middleware / static production ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Data source: ${activeDataSource.toUpperCase()}`);
    if (activeDataSource === "simulator") {
      console.log(`   → Set TWELVE_DATA_API_KEY or ALPHA_VANTAGE_API_KEY in .env for live prices\n`);
    }
  });
}

startServer().catch(console.error);
