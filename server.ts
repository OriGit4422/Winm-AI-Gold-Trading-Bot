import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const GOLD_SYMBOL = "XAU/USD";

type Trend = "bullish" | "bearish" | "neutral";

interface GoldTick {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  timestamp: string;
}

interface Mt5Config {
  bridgeUrl: string;
  accountLogin: string;
  accountServer: string;
  accountPassword: string;
}

interface Mt5Status {
  configured: boolean;
  connected: boolean;
  lastError: string | null;
  lastConnectedAt: string | null;
}

interface AutoTradingConfig {
  enabled: boolean;
  lotSize: number;
  maxRiskPercent: number;
}

let latestTick: GoldTick | null = null;
let mt5Config: Mt5Config = {
  bridgeUrl: process.env.MT5_BRIDGE_URL || "",
  accountLogin: "",
  accountServer: "",
  accountPassword: "",
};

let mt5Status: Mt5Status = {
  configured: false,
  connected: false,
  lastError: null,
  lastConnectedAt: null,
};

let autoTrading: AutoTradingConfig = {
  enabled: false,
  lotSize: 0.1,
  maxRiskPercent: 1,
};

function getTwelveDataKey() {
  return process.env.TWELVE_DATA_API_KEY || "";
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json() as Promise<T>;
}

function calcSignal(prices: number[]) {
  if (prices.length < 30) {
    return { trend: "neutral" as Trend, confidence: 0, reason: "Not enough live candle data yet." };
  }

  const sma = (period: number, offset = 0) => {
    const slice = prices.slice(prices.length - period - offset, prices.length - offset);
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  };

  const rsi = (period: number) => {
    let gains = 0;
    let losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - 100 / (1 + rs);
  };

  const sma9 = sma(9);
  const sma21 = sma(21);
  const sma9Prev = sma(9, 1);
  const sma21Prev = sma(21, 1);
  const momentum = ((prices.at(-1)! - prices.at(-6)!) / prices.at(-6)!) * 100;
  const rsi14 = rsi(14);

  const bullishCross = sma9 > sma21 && sma9Prev <= sma21Prev;
  const bearishCross = sma9 < sma21 && sma9Prev >= sma21Prev;

  if ((bullishCross || sma9 > sma21) && rsi14 < 70 && momentum > 0) {
    const confidence = Math.min(95, Math.round(60 + Math.abs(momentum) * 8));
    return { trend: "bullish" as Trend, confidence, reason: "SMA(9) above SMA(21), positive momentum, RSI below overbought." };
  }

  if ((bearishCross || sma9 < sma21) && rsi14 > 30 && momentum < 0) {
    const confidence = Math.min(95, Math.round(60 + Math.abs(momentum) * 8));
    return { trend: "bearish" as Trend, confidence, reason: "SMA(9) below SMA(21), negative momentum, RSI above oversold." };
  }

  return {
    trend: "neutral" as Trend,
    confidence: Math.max(40, Math.round(50 - Math.abs(momentum) * 2)),
    reason: "No clean directional edge from SMA/RSI filter right now.",
  };
}

async function fetchGoldHistory(interval: "1min" | "5min" | "15min" = "1min", outputsize = 120) {
  const apiKey = getTwelveDataKey();
  if (!apiKey) {
    throw new Error("TWELVE_DATA_API_KEY is missing.");
  }

  const data = await fetchJson<{ values?: Array<{ datetime: string; close: string }> }>(
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(GOLD_SYMBOL)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`
  );

  const values = data.values ?? [];
  if (!values.length) {
    throw new Error("No live historical candles returned by Twelve Data.");
  }

  return values
    .reverse()
    .map((v) => ({
      time: v.datetime,
      price: Number(v.close),
    }))
    .filter((v) => Number.isFinite(v.price));
}

async function tryMt5BridgeConnect() {
  if (!mt5Config.bridgeUrl) {
    mt5Status = { ...mt5Status, configured: false, connected: false, lastError: "MT5 bridge URL is required." };
    return mt5Status;
  }

  try {
    mt5Status.configured = true;
    const result = await fetchJson<{ connected?: boolean; message?: string }>(`${mt5Config.bridgeUrl}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: mt5Config.accountLogin,
        password: mt5Config.accountPassword,
        server: mt5Config.accountServer,
      }),
    });

    mt5Status.connected = !!result.connected;
    mt5Status.lastConnectedAt = result.connected ? new Date().toISOString() : mt5Status.lastConnectedAt;
    mt5Status.lastError = result.connected ? null : result.message || "MT5 bridge refused connection.";
  } catch (error) {
    mt5Status.connected = false;
    mt5Status.lastError = (error as Error).message;
  }

  return mt5Status;
}

async function placeAutoTrade(signal: ReturnType<typeof calcSignal>) {
  if (!autoTrading.enabled || !mt5Status.connected || signal.trend === "neutral") return;

  const side = signal.trend === "bullish" ? "BUY" : "SELL";

  try {
    await fetchJson(`${mt5Config.bridgeUrl}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: GOLD_SYMBOL,
        side,
        lotSize: autoTrading.lotSize,
        maxRiskPercent: autoTrading.maxRiskPercent,
        comment: "WINM live signal auto-trade",
      }),
    });
  } catch (error) {
    mt5Status.lastError = `Auto-trade failed: ${(error as Error).message}`;
  }
}

function connectTwelveDataPriceStream(wss: WebSocketServer) {
  const key = getTwelveDataKey();
  if (!key) {
    console.warn("[market] TWELVE_DATA_API_KEY missing. Live stream disabled.");
    return;
  }

  const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${key}`);
  let heartbeat: NodeJS.Timeout | null = null;

  ws.on("open", () => {
    ws.send(JSON.stringify({ action: "subscribe", params: { symbols: GOLD_SYMBOL } }));
    heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: "heartbeat" }));
      }
    }, 10_000);
    console.log("[market] Twelve Data stream connected for XAU/USD");
  });

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as { event?: string; symbol?: string; price?: string; bid?: string; ask?: string };
      if (msg.event !== "price" || msg.symbol !== GOLD_SYMBOL || !msg.price) return;

      latestTick = {
        symbol: GOLD_SYMBOL,
        price: Number(msg.price),
        bid: msg.bid ? Number(msg.bid) : undefined,
        ask: msg.ask ? Number(msg.ask) : undefined,
        timestamp: new Date().toISOString(),
      };

      const payload = JSON.stringify({ type: "GOLD_TICK", data: latestTick });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
      });

      const history = await fetchGoldHistory("1min", 80);
      const signal = calcSignal(history.map((h) => h.price));
      await placeAutoTrade(signal);
    } catch {
      // ignore malformed events
    }
  });

  ws.on("close", () => {
    if (heartbeat) clearInterval(heartbeat);
    console.warn("[market] Twelve Data stream closed. Reconnecting in 5s...");
    setTimeout(() => connectTwelveDataPriceStream(wss), 5000);
  });

  ws.on("error", (error) => {
    console.error("[market] Twelve Data stream error:", (error as Error).message);
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  wss.on("connection", (client) => {
    if (latestTick) {
      client.send(JSON.stringify({ type: "GOLD_TICK", data: latestTick }));
    }
  });

  connectTwelveDataPriceStream(wss);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, hasLiveKey: !!getTwelveDataKey(), goldSymbol: GOLD_SYMBOL });
  });

  app.get("/api/gold/history", async (req, res) => {
    try {
      const interval = (req.query.interval as "1min" | "5min" | "15min") || "1min";
      const outputsize = Math.min(Number(req.query.outputsize || 120), 500);
      const history = await fetchGoldHistory(interval, outputsize);
      res.json({ symbol: GOLD_SYMBOL, interval, history });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/signals/gold", async (_req, res) => {
    try {
      const history = await fetchGoldHistory("1min", 120);
      const prices = history.map((h) => h.price);
      const signal = calcSignal(prices);
      const lastPrice = prices.at(-1) ?? null;
      const change1h = prices.length > 60 ? (((prices.at(-1)! - prices.at(-61)!) / prices.at(-61)!) * 100).toFixed(2) : null;

      res.json({
        symbol: GOLD_SYMBOL,
        signal,
        lastPrice,
        change1h: change1h ? `${change1h}%` : "n/a",
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/mt5/config", (req, res) => {
    const { bridgeUrl, accountLogin, accountServer, accountPassword } = req.body as Partial<Mt5Config>;

    mt5Config = {
      bridgeUrl: bridgeUrl ?? mt5Config.bridgeUrl,
      accountLogin: accountLogin ?? mt5Config.accountLogin,
      accountServer: accountServer ?? mt5Config.accountServer,
      accountPassword: accountPassword ?? mt5Config.accountPassword,
    };

    mt5Status.configured = !!mt5Config.bridgeUrl;

    res.json({
      success: true,
      config: {
        bridgeUrl: mt5Config.bridgeUrl,
        accountLogin: mt5Config.accountLogin,
        accountServer: mt5Config.accountServer,
        accountPassword: mt5Config.accountPassword ? "••••••••" : "",
      },
    });
  });

  app.post("/api/mt5/connect", async (_req, res) => {
    const status = await tryMt5BridgeConnect();
    res.json(status);
  });

  app.get("/api/mt5/status", (_req, res) => {
    res.json({
      ...mt5Status,
      bridgeUrl: mt5Config.bridgeUrl,
      accountLogin: mt5Config.accountLogin,
      accountServer: mt5Config.accountServer,
    });
  });

  app.post("/api/auto-trading", (req, res) => {
    const { enabled, lotSize, maxRiskPercent } = req.body as Partial<AutoTradingConfig>;
    autoTrading = {
      enabled: enabled ?? autoTrading.enabled,
      lotSize: lotSize ?? autoTrading.lotSize,
      maxRiskPercent: maxRiskPercent ?? autoTrading.maxRiskPercent,
    };
    res.json({ success: true, autoTrading });
  });

  app.get("/api/auto-trading", (_req, res) => {
    res.json(autoTrading);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  server.listen(PORT, HOST, () => {
    console.log(`Server running: http://${HOST}:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal server error:", error);
  process.exit(1);
});
