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
    { id: "XAU/USD", price: 2642.12, initialPrice: 2642.12, volatility: 0.0004, bias: 0.00005 },
    { id: "EUR/USD", price: 1.09421, initialPrice: 1.09421, volatility: 0.0001, bias: -0.00001 },
    { id: "BTC/USD", price: 74281.50, initialPrice: 74281.50, volatility: 0.0015, bias: 0.0002 },
    { id: "GBP/JPY", price: 201.125, initialPrice: 201.125, volatility: 0.0003, bias: 0.00002 },
    { id: "ETH/USD", price: 3842.15, initialPrice: 3842.15, volatility: 0.0012, bias: 0.00015 },
    { id: "USD/JPY", price: 151.42, initialPrice: 151.42, volatility: 0.0002, bias: -0.00003 },
    { id: "AUD/USD", price: 0.6642, initialPrice: 0.6642, volatility: 0.00015, bias: 0.00001 },
    { id: "XAG/USD", price: 31.42, initialPrice: 31.42, volatility: 0.0008, bias: 0.00008 },
  ];

  const broadcastMarketData = () => {
    assets.forEach((asset) => {
      // Random walk with a slight bias to simulate trends
      const randomFactor = (Math.random() - 0.5) * 2 * asset.volatility;
      const trendFactor = asset.bias || 0;
      asset.price = asset.price * (1 + randomFactor + trendFactor);
    });

    const payload = JSON.stringify({
      type: "MARKET_UPDATE",
      timestamp: new Date().toISOString(),
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

  // Broadcast every 2 seconds
  setInterval(broadcastMarketData, 2000);

  wss.on("connection", (ws) => {
    console.log("Client connected to market feed");
    // Send initial data
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
        `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&language=en&pageSize=12&apiKey=${apiKey}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Server news fetch error:", error);
      res.status(500).json({ error: "Internal server error fetching news" });
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
