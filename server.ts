import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // Mock Market Data Generator
  const assets = [
    { id: "XAU/USD", price: 2642.12, initialPrice: 2642.12, volatility: 0.0004, bias: 0.00005, history: [] as { time: string; price: number }[], isRealTime: true },
    { id: "EUR/USD", price: 1.09421, initialPrice: 1.09421, volatility: 0.0001, bias: -0.00001, history: [] as { time: string; price: number }[] },
    { id: "BTC/USD", price: 74281.50, initialPrice: 74281.50, volatility: 0.0015, bias: 0.0002, history: [] as { time: string; price: number }[], isRealTime: true },
    { id: "GBP/JPY", price: 201.125, initialPrice: 201.125, volatility: 0.0003, bias: 0.00002, history: [] as { time: string; price: number }[] },
    { id: "ETH/USD", price: 3842.15, initialPrice: 3842.15, volatility: 0.0012, bias: 0.00015, history: [] as { time: string; price: number }[], isRealTime: true },
    { id: "USD/JPY", price: 151.42, initialPrice: 151.42, volatility: 0.0002, bias: -0.00003, history: [] as { time: string; price: number }[] },
    { id: "AUD/USD", price: 0.6642, initialPrice: 0.6642, volatility: 0.00015, bias: 0.00001, history: [] as { time: string; price: number }[] },
    { id: "XAG/USD", price: 31.42, initialPrice: 31.42, volatility: 0.0008, bias: 0.00008, history: [] as { time: string; price: number }[] },
  ];

  // Real-time WebSocket Integration (Binance for Crypto & Gold Proxy)
  const connectToBinance = () => {
    const streams = [
      "btcusdt@trade", "ethusdt@trade", "paxgusdt@trade",
      "btcusdt@depth10@100ms", "ethusdt@depth10@100ms", "paxgusdt@depth10@100ms"
    ].join("/");
    
    const binanceWs = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);
    
    binanceWs.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      
      if (msg.e === "trade") {
        const symbol = msg.s;
        const price = parseFloat(msg.p);
        
        if (symbol === "BTCUSDT") {
          const btc = assets.find(a => a.id === "BTC/USD");
          if (btc) btc.price = price;
        } else if (symbol === "ETHUSDT") {
          const eth = assets.find(a => a.id === "ETH/USD");
          if (eth) eth.price = price;
        } else if (symbol === "PAXGUSDT") {
          const gold = assets.find(a => a.id === "XAU/USD");
          if (gold) gold.price = price;
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

  const broadcastMarketData = () => {
    const timestamp = new Date().toISOString();
    assets.forEach((asset) => {
      // Only simulate if not real-time
      if (!(asset as any).isRealTime) {
        const randomFactor = (Math.random() - 0.5) * 2 * asset.volatility;
        const trendFactor = asset.bias || 0;
        asset.price = asset.price * (1 + randomFactor + trendFactor);
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
        const percentChange = ((a.price - a.initialPrice) / a.initialPrice) * 100;
        return {
          id: a.id,
          price: a.price.toFixed(a.id.includes("USD") && !a.id.includes("BTC") && !a.id.includes("ETH") && !a.id.includes("XAG") ? 5 : 2),
          change: (percentChange >= 0 ? "+" : "") + percentChange.toFixed(2) + "%",
          trend: percentChange >= 0 ? "up" : "down"
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
      data: assets.map(a => ({
        id: a.id,
        price: a.price.toFixed(a.id.includes("USD") && !a.id.includes("BTC") ? 5 : 2),
        change: "+0.00%",
        trend: "up"
      }))
    }));

    ws.on("close", () => console.log("Client disconnected"));
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

      res.json(results);
    } catch (error) {
      console.error("Intermarket API error:", error);
      res.status(500).json({ error: "Intermarket data fetch failed" });
    }
  });

  app.get("/api/cot", async (req, res) => {
    try {
      // Use the standard Socrata data domain for CFTC
      // Filter for Gold (XAU) - TFF report
      const url = "https://data.cftc.gov/resource/66gz-6m6d.json?$limit=1&$order=report_date_as_yyyy_mm_dd%20DESC&market_and_exchange_names=GOLD%20-%20COMMODITY%20EXCHANGE%20INC.";
      
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Institutional-Trading-Terminal/1.0"
        }
      });
      
      if (!response.ok) {
        console.error(`CFTC API responded with status: ${response.status}`);
        return res.status(200).json({ error: "CFTC API unavailable", fallback: true });
      }
      
      const data = await response.json();
      const latest = data[0];
      
      if (!latest) return res.json({ error: "No COT data found" });

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
        }
      });
    } catch (error) {
      console.error("COT API error:", error);
      // Return 200 with error info so client can use fallback without 500 error in console
      res.status(200).json({ error: "COT data fetch failed", fallback: true });
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
