import { Landmark, ShieldCheck, Zap, Activity, Bolt, Play, History, Settings2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StrategyBuilder } from "./StrategyBuilder";

interface BacktestResult {
  source: string;
  strategy: string;
  symbol: string;
  profit: string;
  winRate: string;
  drawdown: string;
  trades: number;
  startBalance?: string;
  endBalance?: string;
  note?: string;
}

export function Config() {
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [isTesting, setIsTesting] = useState(false);
  const [mt5Status, setMt5Status] = useState<{ connected: boolean; message: string } | null>(null);

  // Form state — no hardcoded credentials
  const [server, setServer] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [leverage, setLeverage] = useState(200);
  const [riskPerTrade, setRiskPerTrade] = useState(1.5);
  const [maxTrades, setMaxTrades] = useState(5);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["XAU/USD", "EUR/USD", "BTC/USD"]);
  const [btStrategy, setBtStrategy] = useState("Gold Scalper V2");
  const [btSymbol, setBtSymbol] = useState("XAU/USD");
  const [btStartDate, setBtStartDate] = useState("");
  const [btEndDate, setBtEndDate] = useState("");
  const [btCapital, setBtCapital] = useState("10000");

  // Load saved config on mount
  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(cfg => {
        if (cfg.server) setServer(cfg.server);
        if (cfg.login) setLogin(cfg.login);
        if (cfg.leverage) setLeverage(cfg.leverage);
        if (cfg.riskPerTrade) setRiskPerTrade(cfg.riskPerTrade);
        if (cfg.maxTrades) setMaxTrades(cfg.maxTrades);
        if (cfg.assets?.length) setSelectedAssets(cfg.assets);
      })
      .catch(() => {/* use empty defaults */});

    // Default backtest dates: last 90 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    setBtEndDate(end.toISOString().split("T")[0]);
    setBtStartDate(start.toISOString().split("T")[0]);
  }, []);

  const toggleAsset = (asset: string) => {
    setSelectedAssets(prev =>
      prev.includes(asset) ? prev.filter(a => a !== asset) : [...prev, asset]
    );
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const resp = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server, login, password, leverage, riskPerTrade, maxTrades, assets: selectedAssets }),
      });
      const data = await resp.json();
      setSaveStatus(data.success ? "success" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleTestMt5 = async () => {
    setIsTesting(true);
    setMt5Status(null);
    try {
      const resp = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server, login, password }),
      });
      const data = await resp.json();
      setMt5Status({ connected: data.connected, message: data.message || data.error });
    } catch {
      setMt5Status({ connected: false, message: "Network error — server unreachable" });
    } finally {
      setIsTesting(false);
    }
  };

  const runBacktest = async () => {
    setIsBacktesting(true);
    setBacktestResult(null);
    try {
      const resp = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: btStrategy,
          symbol: btSymbol,
          startDate: btStartDate,
          endDate: btEndDate,
          initialCapital: btCapital,
        }),
      });
      const data = await resp.json();
      setBacktestResult(data);
    } catch {
      setBacktestResult(null);
    } finally {
      setIsBacktesting(false);
    }
  };

  return (
    <div className="space-y-10">
      <AnimatePresence>
        {showBuilder && <StrategyBuilder onClose={() => setShowBuilder(false)} />}
      </AnimatePresence>

      <div className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">Bot Configuration</h1>
        <p className="text-on-surface-variant font-light max-w-2xl">
          Configure MT5 connectivity, strategy parameters, and run backtests against real historical data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-4 space-y-6">
          {/* MT5 Terminal Connection */}
          <div className="bg-surface-container-low p-6 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Landmark className="w-16 h-16" />
            </div>
            <h2 className="font-headline text-lg font-bold mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              MT5 Terminal Link
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Server</label>
                <input
                  className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-medium outline-none"
                  value={server}
                  onChange={e => setServer(e.target.value)}
                  placeholder="e.g. ICMarkets-Demo, XM-Real"
                  type="text"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Login ID</label>
                <input
                  className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-medium outline-none tnum"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="Your MT5 account number"
                  type="text"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Password</label>
                <input
                  className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-medium outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="MT5 password"
                  type="password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              onClick={handleTestMt5}
              disabled={isTesting || !server || !login || !password}
              className="mt-4 w-full py-2 bg-surface-container-highest border border-outline-variant/20 text-on-surface text-[10px] font-bold uppercase tracking-widest hover:bg-surface-bright transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {isTesting ? "Testing…" : "Test Connection"}
            </button>

            {mt5Status && (
              <div className={`mt-3 p-3 rounded flex items-start gap-3 border ${mt5Status.connected ? "bg-secondary-container/10 border-secondary-container/20" : "bg-surface-container-highest border-outline-variant/10"}`}>
                <ShieldCheck className={`w-4 h-4 mt-0.5 flex-shrink-0 ${mt5Status.connected ? "text-secondary-container" : "text-on-surface/40"}`} />
                <p className="text-[11px] leading-relaxed text-on-surface/70">{mt5Status.message}</p>
              </div>
            )}
          </div>

          {/* Strategy Architect */}
          <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Settings2 className="w-16 h-16" />
            </div>
            <h2 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Strategy Architect
            </h2>
            <p className="text-[11px] text-on-surface-variant mb-6 leading-relaxed">
              Build and edit your trading logic with the WINM AI visual block interface.
            </p>
            <button
              onClick={() => setShowBuilder(true)}
              className="w-full py-3 bg-surface-container-highest text-on-surface text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-surface-bright transition-all flex items-center justify-center gap-2 border border-outline-variant/20 group"
            >
              <Settings2 className="w-4 h-4 text-primary group-hover:rotate-90 transition-transform duration-500" />
              Open Visual Builder
            </button>
          </div>

          {/* Backtesting */}
          <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10">
            <h2 className="font-headline text-lg font-bold mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Strategy Backtesting
            </h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Strategy</label>
                <select
                  className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-medium outline-none appearance-none"
                  value={btStrategy}
                  onChange={e => setBtStrategy(e.target.value)}
                >
                  <option>Gold Scalper V2</option>
                  <option>EUR/USD Trend Follower</option>
                  <option>Volatility Arbitrage</option>
                  <option>EMA Crossover (9/21)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Symbol</label>
                <select
                  className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-medium outline-none appearance-none"
                  value={btSymbol}
                  onChange={e => setBtSymbol(e.target.value)}
                >
                  {["XAU/USD", "EUR/USD", "BTC/USD", "GBP/JPY", "ETH/USD"].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-xs font-medium outline-none"
                    value={btStartDate}
                    onChange={e => setBtStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-xs font-medium outline-none"
                    value={btEndDate}
                    onChange={e => setBtEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold ml-1">Initial Capital</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-sm font-bold outline-none tnum"
                    value={btCapital}
                    onChange={e => setBtCapital(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant">USD</span>
                </div>
              </div>

              <button
                onClick={runBacktest}
                disabled={isBacktesting}
                className="w-full py-3 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBacktesting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Backtesting…</>
                ) : (
                  <><Play className="w-4 h-4 fill-current" /> Run Backtest</>
                )}
              </button>

              <AnimatePresence>
                {backtestResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-outline-variant/10 space-y-4"
                  >
                    {backtestResult.note && (
                      <p className="text-[9px] text-on-surface/40 italic">{backtestResult.note}</p>
                    )}
                    <p className="text-[9px] text-on-surface/50 uppercase tracking-widest">
                      Source: {backtestResult.source} · {backtestResult.strategy}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Net Profit", value: backtestResult.profit, color: "text-secondary-container" },
                        { label: "Win Rate", value: backtestResult.winRate, color: "text-on-surface" },
                        { label: "Max Drawdown", value: backtestResult.drawdown, color: "text-tertiary-container" },
                        { label: "Total Trades", value: String(backtestResult.trades), color: "text-on-surface" },
                      ].map(stat => (
                        <div key={stat.label} className="p-3 bg-surface-container-highest/50 rounded">
                          <p className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{stat.label}</p>
                          <p className={`text-sm font-bold tnum ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    {backtestResult.startBalance && backtestResult.endBalance && (
                      <p className="text-[10px] text-on-surface/40 text-center">
                        Balance: ${backtestResult.startBalance} → ${backtestResult.endBalance}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-low p-6 rounded-lg md:col-span-2">
            <h2 className="font-headline text-lg font-bold mb-8 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Strategy Parameters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Leverage</label>
                  <span className="text-primary font-bold tnum text-lg">1:{leverage}</span>
                </div>
                <input
                  className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                  max="500"
                  min="1"
                  type="range"
                  value={leverage}
                  onChange={e => setLeverage(Number(e.target.value))}
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter">
                  <span>1:1</span><span>1:500</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Risk per Trade (%)</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border-b border-outline-variant/20 focus:border-primary transition-colors px-4 py-3 text-lg font-bold outline-none tnum"
                    step="0.1"
                    min="0.1"
                    max="10"
                    type="number"
                    value={riskPerTrade}
                    onChange={e => setRiskPerTrade(Number(e.target.value))}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">%</span>
                </div>
                <p className="text-[11px] text-on-surface-variant/60 italic">Suggested range: 0.5% – 2.0%</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Max Simultaneous Trades</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMaxTrades(m => Math.max(1, m - 1))}
                    className="w-12 h-12 bg-surface-container-highest flex items-center justify-center hover:bg-surface-bright transition-colors text-lg font-bold"
                  >
                    -
                  </button>
                  <input
                    className="flex-1 bg-surface-container-highest border-b border-outline-variant/20 text-center text-lg font-bold outline-none tnum"
                    type="number"
                    min="1"
                    max="50"
                    value={maxTrades}
                    onChange={e => setMaxTrades(Number(e.target.value))}
                  />
                  <button
                    onClick={() => setMaxTrades(m => Math.min(50, m + 1))}
                    className="w-12 h-12 bg-surface-container-highest flex items-center justify-center hover:bg-surface-bright transition-colors text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Asset Selection</label>
                <div className="grid grid-cols-2 gap-3">
                  {["XAU/USD", "EUR/USD", "GBP/JPY", "BTC/USD", "ETH/USD", "AUD/USD"].map(asset => (
                    <label
                      key={asset}
                      className="flex items-center gap-3 p-3 bg-surface-container-highest rounded cursor-pointer border border-transparent hover:border-primary/20 transition-all"
                    >
                      <input
                        className="w-4 h-4 rounded-sm border-outline-variant bg-surface-container text-primary focus:ring-primary/20"
                        type="checkbox"
                        checked={selectedAssets.includes(asset)}
                        onChange={() => toggleAsset(asset)}
                      />
                      <span className="text-xs font-bold tracking-tight tnum">{asset}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-4 pt-4">
            {saveStatus === "success" && (
              <span className="flex items-center text-secondary-container text-xs font-bold uppercase tracking-widest gap-2">
                <ShieldCheck className="w-4 h-4" /> Configuration saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center text-tertiary-container text-xs font-bold uppercase tracking-widest">
                Save failed — check server
              </span>
            )}
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-10 py-4 gold-gradient text-on-primary font-bold uppercase tracking-widest text-sm rounded shadow-[0_12px_24px_-8px_rgba(212,175,55,0.4)] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bolt className="w-4 h-4" />}
              Apply Configuration
            </button>
          </div>
        </section>
      </div>

      <div className="mt-20 border-t border-outline-variant/10 pt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: ShieldCheck, title: "Encrypted Link", desc: "Credentials stored server-side. Passwords are never returned to the browser after saving." },
          { icon: Zap, title: "Latency Opt", desc: "Configure order latency via your broker's server selection above." },
          { icon: Activity, title: "Smart Sizing", desc: "Dynamic position sizing based on risk-per-trade and live leverage settings." },
        ].map(item => (
          <div key={item.title} className="flex items-start gap-4">
            <item.icon className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-1">{item.title}</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
