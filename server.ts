import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import {
  fetchLiveQuotes,
  fetchHistory,
  hasLiveProvider,
  activeProviderName,
} from "./marketFeed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Simple logger
  app.use((req, res, next) => {
    if (req.url.startsWith("/api")) {
      console.log(`[API Request] ${req.method} ${req.url}`);
    }
    next();
  });

  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // Live-provider availability determines which assets stream authentic vendor
  // data and which fall back to clearly-labelled simulation.
  const liveProvider = hasLiveProvider();
  const providerName = activeProviderName();
  console.log(
    liveProvider
      ? `[Market Feed] Authentic forex/metals provider active: ${providerName}`
      : "[Market Feed] No forex/metals provider key set — FX & silver run in SIMULATION mode. " +
          "Set TWELVE_DATA_API_KEY (or FINNHUB_API_KEY) for live quotes."
  );

  type Owner = "binance" | "provider" | "sim";

  interface Asset {
    id: string;
    price: number;
    initialPrice: number;
    percentChange: number; // authoritative change % from the data source
    volatility: number;
    bias: number;
    history: { time: string; price: number }[];
    owner: Owner;
    source: string;
    // True once this asset has received at least one authentic update (a Binance
    // tick or a successful provider quote). Until then it still holds its seed
    // price, so it must not be advertised as live.
    hasLiveData?: boolean;
  }

  // Ownership:
  //   binance  -> real-time trade/ticker stream from Binance (crypto + gold via PAXG)
  //   provider -> polled authentic quotes from Twelve Data / Finnhub
  //   sim      -> local simulation (only when no provider key is configured)
  const goldOwner: Owner = liveProvider ? "provider" : "binance";
  const goldSource = liveProvider ? providerName : "Binance (PAXG)";
  const fxOwner: Owner = liveProvider ? "provider" : "sim";
  const fxSource = liveProvider ? providerName : "Simulated";

  const assets: Asset[] = [
    { id: "XAU/USD", price: 2642.12, initialPrice: 2642.12, percentChange: 0, volatility: 0.0004, bias: 0.00005, history: [], owner: goldOwner, source: goldSource },
    { id: "EUR/USD", price: 1.09421, initialPrice: 1.09421, percentChange: 0, volatility: 0.0001, bias: -0.00001, history: [], owner: fxOwner, source: fxSource },
    { id: "BTC/USD", price: 74281.50, initialPrice: 74281.50, percentChange: 0, volatility: 0.0015, bias: 0.0002, history: [], owner: "binance", source: "Binance" },
    { id: "GBP/JPY", price: 201.125, initialPrice: 201.125, percentChange: 0, volatility: 0.0003, bias: 0.00002, history: [], owner: fxOwner, source: fxSource },
    { id: "ETH/USD", price: 3842.15, initialPrice: 3842.15, percentChange: 0, volatility: 0.0012, bias: 0.00015, history: [], owner: "binance", source: "Binance" },
    { id: "USD/JPY", price: 151.42, initialPrice: 151.42, percentChange: 0, volatility: 0.0002, bias: -0.00003, history: [], owner: fxOwner, source: fxSource },
    { id: "AUD/USD", price: 0.6642, initialPrice: 0.6642, percentChange: 0, volatility: 0.00015, bias: 0.00001, history: [], owner: fxOwner, source: fxSource },
    { id: "XAG/USD", price: 31.42, initialPrice: 31.42, percentChange: 0, volatility: 0.0008, bias: 0.00008, history: [], owner: liveProvider ? "provider" : "sim", source: fxSource },
  ];

  // Symbols we ask the authentic REST provider to quote (everything not on Binance).
  const providerSymbols = assets.filter(a => a.owner === "provider").map(a => a.id);

  // Poll the vendor for real forex/metals quotes. Each poll spends one credit
  // per symbol, and free tiers allow only a few credits/min (Twelve Data free
  // ~8). Derive the default interval from the symbol count so following the
  // defaults never trips the rate limit; MARKET_POLL_INTERVAL_MS overrides it
  // (lower on paid plans for faster refresh, raise if you add symbols).
  const CREDITS_PER_MIN = Math.max(1, parseInt(process.env.MARKET_CREDITS_PER_MIN || "8", 10));
  const symbolCount = providerSymbols.length || 1;
  // interval (ms) so that symbolCount credits are spent at most CREDITS_PER_MIN/min,
  // rounded up to whole seconds. 6 symbols @ 8 credits/min -> 45000ms.
  const safeDefaultInterval = Math.ceil((symbolCount / CREDITS_PER_MIN) * 60) * 1000;
  const POLL_INTERVAL = Math.max(2000, parseInt(process.env.MARKET_POLL_INTERVAL_MS || String(safeDefaultInterval), 10));
  if (providerSymbols.length > 0) {
    console.log(
      `[Market Feed] Polling ${symbolCount} symbol(s) every ${POLL_INTERVAL}ms ` +
      `(~${((symbolCount * 60000) / POLL_INTERVAL).toFixed(1)} credits/min; budget ${CREDITS_PER_MIN}/min).`
    );
  }
  const pollLiveQuotes = async () => {
    if (providerSymbols.length === 0) return;
    try {
      const quotes = await fetchLiveQuotes(providerSymbols);
      for (const q of quotes) {
        const asset = assets.find(a => a.id === q.id);
        if (asset) {
          asset.price = q.price;
          asset.percentChange = q.percentChange;
          asset.source = q.source;
          asset.hasLiveData = true;
        }
      }
    } catch (err) {
      console.error("[Market Feed] Live quote poll failed:", err instanceof Error ? err.message : err);
    }
  };
  if (providerSymbols.length > 0) {
    pollLiveQuotes();
    setInterval(pollLiveQuotes, POLL_INTERVAL);
  }

  // Real-time WebSocket Integration (Binance for Crypto & Gold Proxy).
  // Uses the @ticker stream so both last price (c) and the *real* 24h percent
  // change (P) come straight from the exchange.
  const connectToBinance = () => {
    const streams = [
      "btcusdt@ticker", "ethusdt@ticker", "paxgusdt@ticker",
      "btcusdt@depth10@100ms", "ethusdt@depth10@100ms", "paxgusdt@depth10@100ms"
    ].join("/");

    const binanceWs = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

    binanceWs.on("message", (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.e === "24hrTicker") {
        const symbol = msg.s;
        const price = parseFloat(msg.c);        // last price
        const percentChange = parseFloat(msg.P); // real 24h % change
        const assetId = symbol === "BTCUSDT" ? "BTC/USD"
          : symbol === "ETHUSDT" ? "ETH/USD"
          : symbol === "PAXGUSDT" ? "XAU/USD" : null;

        if (assetId) {
          const asset = assets.find(a => a.id === assetId);
          // Only apply Binance data to assets it owns (gold is provider-owned
          // when an authentic spot provider is configured).
          if (asset && asset.owner === "binance") {
            asset.price = price;
            asset.percentChange = percentChange;
            asset.hasLiveData = true;
          }
        }
      } else if (msg.bids && msg.asks) {
        // Depth update
        const symbol = msg.s || (msg.stream ? msg.stream.split('@')[0].toUpperCase() : "");
        const assetId = symbol === "BTCUSDT" ? "BTC/USD" : symbol === "ETHUSDT" ? "ETH/USD" : symbol === "PAXGUSDT" ? "XAU/USD" : null;
        
        if (assetId) {
          const payload = JSON.stringify({
            type: "ORDER_BOOK_UPDATE",
            assetId,
            bids: msg.bids.slice(0, 10).map((b: any) => [parseFloat(b[0]), parseFloat(b[1])]),
            asks: msg.asks.slice(0, 10).map((a: any) => [parseFloat(a[0]), parseFloat(a[1])])
          });

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
      }
    });

    binanceWs.on("error", (err) => console.error("Binance WS Error:", err));
    binanceWs.on("close", () => {
      console.log("Binance WS Closed. Reconnecting...");
      setTimeout(connectToBinance, 5000);
    });
  };

  connectToBinance();

  // Price precision: FX majors need 5dp; JPY crosses & metals/crypto 2dp.
  const priceDecimals = (id: string) =>
    id.includes("JPY") ? 3 : id.includes("BTC") || id.includes("ETH") || id.includes("XAU") || id.includes("XAG") ? 2 : 5;

  const broadcastMarketData = () => {
    const timestamp = new Date().toISOString();
    assets.forEach((asset) => {
      // Only run the random walk for assets with no authentic feed (owner "sim").
      // Binance- and provider-owned assets already hold real vendor prices.
      if (asset.owner === "sim") {
        const randomFactor = (Math.random() - 0.5) * 2 * asset.volatility;
        const trendFactor = asset.bias || 0;
        asset.price = asset.price * (1 + randomFactor + trendFactor);
        asset.percentChange = ((asset.price - asset.initialPrice) / asset.initialPrice) * 100;
      }

      // Update history buffer (keep last 100 points)
      asset.history.push({
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: parseFloat(asset.price.toFixed(5))
      });
      if (asset.history.length > 100) asset.history.shift();
    });

    const payload = JSON.stringify({
      type: "MARKET_UPDATE",
      timestamp,
      data: assets.map(a => {
        const percentChange = a.percentChange || 0;
        return {
          id: a.id,
          price: a.price.toFixed(priceDecimals(a.id)),
          change: (percentChange >= 0 ? "+" : "") + percentChange.toFixed(2) + "%",
          trend: percentChange >= 0 ? "up" : "down",
          source: a.source,
          live: a.owner !== "sim" && a.hasLiveData === true
        };
      })
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  };

  // Broadcast every 500ms for high-frequency feel
  setInterval(broadcastMarketData, 500);

  wss.on("connection", (ws) => {
    console.log("Client connected to market feed");
    
    // Send history for all assets
    ws.send(JSON.stringify({
      type: "MARKET_HISTORY",
      timestamp: new Date().toISOString(),
      data: assets.map(a => ({
        id: a.id,
        history: a.history
      }))
    }));

    // Send initial current data
    ws.send(JSON.stringify({
      type: "MARKET_UPDATE",
      timestamp: new Date().toISOString(),
      data: assets.map(a => {
        const percentChange = a.percentChange || 0;
        return {
          id: a.id,
          price: a.price.toFixed(priceDecimals(a.id)),
          change: (percentChange >= 0 ? "+" : "") + percentChange.toFixed(2) + "%",
          trend: percentChange >= 0 ? "up" : "down",
          source: a.source,
          live: a.owner !== "sim" && a.hasLiveData === true
        };
      })
    }));

    ws.on("close", () => console.log("Client disconnected"));
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      liveProvider: providerName,
      liveAssets: assets.filter(a => a.owner !== "sim").map(a => a.id),
      simulatedAssets: assets.filter(a => a.owner === "sim").map(a => a.id),
    });
  });

  // Real OHLC history for charting (Twelve Data). Falls back on the client to
  // the live in-memory buffer when unavailable.
  app.get("/api/history", async (req, res) => {
    const symbol = (req.query.symbol as string) || "XAU/USD";
    const timeframe = (req.query.timeframe as string) || "1m";
    const outputsize = Math.min(500, parseInt((req.query.limit as string) || "60", 10));
    try {
      const history = await fetchHistory(symbol, timeframe, outputsize);
      res.json({ symbol, timeframe, source: "Twelve Data", history });
    } catch (error) {
      res.status(200).json({
        symbol,
        timeframe,
        source: "unavailable",
        history: [],
        error: error instanceof Error ? error.message : "History unavailable",
      });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const apiKey = process.env.NEWS_API_KEY || process.env.VITE_NEWS_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "News API key not configured" });
      }

      const category = req.query.category as string || "all";
      let query = "forex+OR+crypto+OR+gold";
      
      if (category === "Forex") {
        query = "forex+OR+EURUSD+OR+GBPUSD";
      } else if (category === "Crypto") {
        query = "crypto+OR+bitcoin+OR+ethereum";
      } else if (category === "Commodities") {
        query = "commodities+OR+gold+OR+silver+OR+oil";
      }

      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&language=en&pageSize=12&apiKey=${apiKey}`,
        {
          headers: {
            "User-Agent": "Institutional-Trading-Terminal/1.0",
            "Accept": "application/json"
          }
        }
      );

      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          return res.status(response.status).json(errorData);
        } else {
          const text = await response.text();
          console.error("NewsAPI Error (Non-JSON):", text.slice(0, 200));
          return res.status(response.status).json({ error: "Source API error" });
        }
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        console.error("NewsAPI Unexpected Response (Non-JSON):", text.slice(0, 200));
        res.status(502).json({ error: "Invalid response from news provider" });
      }
    } catch (error) {
      console.error("Server news fetch error:", error);
      res.status(500).json({ error: "Internal server error fetching news" });
    }
  });

  app.get("/api/intermarket", async (req, res) => {
    try {
      const fredKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
      const avKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.VITE_ALPHA_VANTAGE_API_KEY;
      
      const results: any = {};

      if (fredKey) {
        // 10Y Treasury Yield
        const fredRes = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&limit=1&sort_order=desc&file_type=json&api_key=${fredKey}`);
        if (fredRes.ok) {
          const data = await fredRes.json();
          results.yield10Y = data.observations[0]?.value;
        }
      }

      if (avKey) {
        // US Dollar Index (DXY) - Using USD/EUR as proxy or specific DXY if available
        const avRes = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey=${avKey}`);
        if (avRes.ok) {
          const data = await avRes.json();
          results.dxy = data["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
        }
      }

      // Simulated real-time CO2 emissions data for industrial analysis
      results.co2Emissions = {
        oil: { 
          value: 395.4 + (Math.random() * 2), 
          trend: Array.from({ length: 12 }).map(() => 390 + Math.random() * 10) 
        },
        gas: { 
          value: 202.1 + (Math.random() * 1.5), 
          trend: Array.from({ length: 12 }).map(() => 195 + Math.random() * 10) 
        }
      };

      res.json(results);
    } catch (error) {
      console.error("Intermarket API error:", error);
      res.status(500).json({ error: "Intermarket data fetch failed" });
    }
  });

  app.get("/api/cot", async (req, res) => {
    try {
      // Use the standard Socrata data domain for CFTC - fetch last 10 reports for history
      const url = "https://data.cftc.gov/resource/66gz-6m6d.json?$limit=10&$order=report_date_as_yyyy_mm_dd%20DESC&market_and_exchange_names=GOLD%20-%20COMMODITY%20EXCHANGE%20INC.";
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Institutional-Trading-Terminal/1.0"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      const latest = data[0];
      
      if (!latest) throw new Error("No COT data found in response");

      const history = data.map((item: any) => ({
        date: item.report_date_as_yyyy_mm_dd?.split('T')[0],
        nonCommercialsNet: (parseFloat(item.noncomm_positions_long_all) - parseFloat(item.noncomm_positions_short_all)) || 0,
        commercialsNet: (parseFloat(item.comm_positions_long_all) - parseFloat(item.comm_positions_short_all)) || 0
      })).reverse();

      res.json({
        date: latest.report_date_as_yyyy_mm_dd?.split('T')[0] || new Date().toISOString().split('T')[0],
        commercials: {
          long: parseFloat(latest.comm_positions_long_all) || 0,
          short: parseFloat(latest.comm_positions_short_all) || 0,
          net: (parseFloat(latest.comm_positions_long_all) - parseFloat(latest.comm_positions_short_all)) || 0
        },
        nonCommercials: {
          long: parseFloat(latest.noncomm_positions_long_all) || 0,
          short: parseFloat(latest.noncomm_positions_short_all) || 0,
          net: (parseFloat(latest.noncomm_positions_long_all) - parseFloat(latest.noncomm_positions_short_all)) || 0
        },
        history,
        fallback: false
      });
    } catch (error) {
      const today = new Date();
      const history = Array.from({ length: 10 }).map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (9 - i) * 7);
        return {
          date: d.toISOString().split('T')[0],
          nonCommercialsNet: 280000 + (Math.random() * 80000 - 40000),
          commercialsNet: -240000 + (Math.random() * 80000 - 40000)
        };
      });

      res.status(200).json({
        date: today.toISOString().split('T')[0],
        commercials: { long: 125000, short: 385000, net: -260000 },
        nonCommercials: { long: 412000, short: 92000, net: 320000 },
        history,
        sentiment: 'bullish',
        fallback: true,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
