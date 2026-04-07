import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HistoryPoint {
  time: string;
  price: number;
}

interface SignalResponse {
  symbol: string;
  signal: {
    trend: "bullish" | "bearish" | "neutral";
    confidence: number;
    reason: string;
  };
  lastPrice: number | null;
  change1h: string;
  generatedAt: string;
  error?: string;
}

interface Mt5Status {
  configured: boolean;
  connected: boolean;
  lastError: string | null;
  lastConnectedAt: string | null;
  bridgeUrl?: string;
  accountLogin?: string;
  accountServer?: string;
}

interface AutoTradingConfig {
  enabled: boolean;
  lotSize: number;
  maxRiskPercent: number;
}

export default function App() {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [signal, setSignal] = useState<SignalResponse | null>(null);
  const [lastTick, setLastTick] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  const [mt5Config, setMt5Config] = useState({
    bridgeUrl: "",
    accountLogin: "",
    accountServer: "",
    accountPassword: "",
  });
  const [mt5Status, setMt5Status] = useState<Mt5Status | null>(null);

  const [autoTrading, setAutoTrading] = useState<AutoTradingConfig>({
    enabled: false,
    lotSize: 0.1,
    maxRiskPercent: 1,
  });

  async function loadHistory() {
    const res = await fetch("/api/gold/history?interval=1min&outputsize=120");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load gold history");
    setHistory(
      (data.history as HistoryPoint[]).map((p) => ({
        ...p,
        time: new Date(p.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }))
    );
  }

  async function loadSignal() {
    const res = await fetch("/api/signals/gold");
    const data = (await res.json()) as SignalResponse;
    if (!res.ok) throw new Error(data.error || "Failed to load signal");
    setSignal(data);
  }

  async function loadMt5Status() {
    const res = await fetch("/api/mt5/status");
    const data = (await res.json()) as Mt5Status;
    setMt5Status(data);
    setMt5Config((prev) => ({
      ...prev,
      bridgeUrl: data.bridgeUrl || prev.bridgeUrl,
      accountLogin: data.accountLogin || prev.accountLogin,
      accountServer: data.accountServer || prev.accountServer,
    }));
  }

  async function loadAutoTrading() {
    const res = await fetch("/api/auto-trading");
    const data = (await res.json()) as AutoTradingConfig;
    setAutoTrading(data);
  }

  useEffect(() => {
    Promise.all([loadHistory(), loadSignal(), loadMt5Status(), loadAutoTrading()]).catch((e) => setError((e as Error).message));

    const timer = setInterval(() => {
      loadSignal().catch(() => undefined);
      loadMt5Status().catch(() => undefined);
    }, 15000);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "GOLD_TICK") {
          const price = payload.data.price as number;
          setLastTick(price);
          setHistory((prev) => {
            const next = [
              ...prev.slice(-119),
              {
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                price,
              },
            ];
            return next;
          });
        }
      } catch {
        // ignore
      }
    };

    return () => {
      clearInterval(timer);
      ws.close();
    };
  }, []);

  const trendColor = useMemo(() => {
    if (!signal) return "text-slate-300";
    if (signal.signal.trend === "bullish") return "text-emerald-400";
    if (signal.signal.trend === "bearish") return "text-rose-400";
    return "text-amber-300";
  }, [signal]);

  async function saveMt5Config() {
    const res = await fetch("/api/mt5/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mt5Config),
    });
    if (!res.ok) throw new Error("Failed to save MT5 config");
    await loadMt5Status();
  }

  async function connectMt5() {
    const res = await fetch("/api/mt5/connect", { method: "POST" });
    const data = await res.json();
    setMt5Status(data);
  }

  async function saveAutoTrading(next: AutoTradingConfig) {
    setAutoTrading(next);
    await fetch("/api/auto-trading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold">WINM Gold Live + MT5</h1>
          <p className="text-slate-400">Live XAU/USD chart, real-time signal, MT5 connect, and auto-trading controls.</p>
          {error && <p className="text-rose-400 mt-2">{error}</p>}
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-xs uppercase text-slate-400">Live Gold Price</p>
            <p className="text-2xl font-semibold mt-2">{lastTick?.toFixed(2) ?? signal?.lastPrice?.toFixed(2) ?? "--"}</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-xs uppercase text-slate-400">Signal</p>
            <p className={`text-2xl font-semibold mt-2 uppercase ${trendColor}`}>{signal?.signal.trend ?? "--"}</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-xs uppercase text-slate-400">Confidence / 1h Change</p>
            <p className="text-2xl font-semibold mt-2">{signal ? `${signal.signal.confidence}% / ${signal.change1h}` : "--"}</p>
          </div>
        </section>

        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h2 className="text-lg font-semibold mb-3">Live Gold Chart</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#94a3b8" minTickGap={20} />
                <YAxis domain={["auto", "auto"]} stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#facc15" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-3">{signal?.signal.reason}</p>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
            <h3 className="font-semibold">MT5 Terminal Connection</h3>
            {(["bridgeUrl", "accountLogin", "accountServer", "accountPassword"] as const).map((field) => (
              <input
                key={field}
                type={field === "accountPassword" ? "password" : "text"}
                value={mt5Config[field]}
                placeholder={field}
                onChange={(e) => setMt5Config((prev) => ({ ...prev, [field]: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2"
              />
            ))}
            <div className="flex gap-2">
              <button onClick={() => saveMt5Config().catch((e) => setError((e as Error).message))} className="px-4 py-2 bg-slate-700 rounded">
                Save Config
              </button>
              <button onClick={() => connectMt5().catch((e) => setError((e as Error).message))} className="px-4 py-2 bg-emerald-700 rounded">
                Connect MT5
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Status: {mt5Status?.connected ? "Connected" : "Disconnected"}
              {mt5Status?.lastError ? ` | Error: ${mt5Status.lastError}` : ""}
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
            <h3 className="font-semibold">Auto Trading (MT5)</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoTrading.enabled}
                onChange={(e) => saveAutoTrading({ ...autoTrading, enabled: e.target.checked }).catch((err) => setError((err as Error).message))}
              />
              Enable auto-trading when signal is bullish/bearish
            </label>
            <label className="block text-sm">
              Lot Size
              <input
                type="number"
                step="0.01"
                value={autoTrading.lotSize}
                onChange={(e) => setAutoTrading((prev) => ({ ...prev, lotSize: Number(e.target.value) }))}
                onBlur={() => saveAutoTrading(autoTrading).catch((err) => setError((err as Error).message))}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Max Risk %
              <input
                type="number"
                step="0.1"
                value={autoTrading.maxRiskPercent}
                onChange={(e) => setAutoTrading((prev) => ({ ...prev, maxRiskPercent: Number(e.target.value) }))}
                onBlur={() => saveAutoTrading(autoTrading).catch((err) => setError((err as Error).message))}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-3 py-2"
              />
            </label>
            <p className="text-xs text-slate-400">Auto-trading sends MT5 bridge market orders only when MT5 is connected.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
