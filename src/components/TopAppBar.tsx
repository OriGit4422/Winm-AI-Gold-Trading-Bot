import { Bell, Cpu } from "lucide-react";
import { useAccount } from "../services/accountService";
import { useMarketData } from "../services/marketService";

export function TopAppBar() {
  const { account } = useAccount();
  const { dataSource } = useMarketData();

  const equityNum = parseFloat(account.equity);
  const balanceNum = parseFloat(account.balance);
  const isProfit = equityNum >= balanceNum;

  const dataSourceLabel: Record<string, string> = {
    twelve_data: "TWELVE DATA LIVE",
    alpha_vantage: "ALPHA VANTAGE LIVE",
    simulator: "SIMULATED PRICES",
  };

  const dataSourceColor: Record<string, string> = {
    twelve_data: "bg-secondary-container",
    alpha_vantage: "bg-secondary-container",
    simulator: "bg-primary/60",
  };

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface border-b border-outline-variant/10">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-lg rotate-45 animate-pulse" />
          <div className="absolute inset-0 border border-primary/40 rounded-lg -rotate-12" />
          <Cpu className="w-6 h-6 text-primary relative z-10 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-headline font-black text-on-surface tracking-tighter leading-none">
            WINM <span className="text-primary">AI</span>
          </span>
          <span className="text-[8px] font-bold text-on-surface/40 uppercase tracking-[0.3em] mt-0.5">
            Neural Trading Core
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {/* MT5 Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-container-low border border-outline-variant/10">
          <div className={`w-1.5 h-1.5 rounded-full ${account.mt5Connected ? "bg-secondary-container shadow-[0_0_8px_#00b954]" : "bg-on-surface/20"}`} />
          <span className="font-sans text-[10px] font-bold tracking-widest text-on-surface/60 uppercase">
            {account.mt5Connected ? `MT5: ${account.mt5Server || "CONNECTED"}` : "MT5 DISCONNECTED"}
          </span>
        </div>
        {/* Data Source Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-container-low border border-outline-variant/10">
          <div className={`w-1.5 h-1.5 rounded-full ${dataSourceColor[dataSource] || "bg-primary/60"} ${dataSource !== "simulator" ? "animate-pulse" : ""}`} />
          <span className="font-sans text-[10px] font-bold tracking-widest text-on-surface/60 uppercase">
            {dataSourceLabel[dataSource] || dataSource}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Equity</p>
          <p className={`font-bold tnum ${isProfit ? "text-secondary-container" : "text-tertiary-container"}`}>
            ${parseFloat(account.equity).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
          <Bell className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>
    </header>
  );
}
