import React, { useState, useEffect } from "react";
import { generateAlphaSignals, AlphaSignal } from "../services/geminiService";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  Info,
  History
} from "lucide-react";

interface AlphaSignalsProps {
  marketContext: string;
}

export function AlphaSignals({ marketContext }: AlphaSignalsProps) {
  const [signals, setSignals] = useState<AlphaSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const fetchSignals = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      const data = await generateAlphaSignals(marketContext);
      if (data && data.length > 0) {
        setSignals(data);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } finally {
      setIsLoading(false);
      setCooldown(60); // Always set cooldown to prevent tight loops
    }
  };

  useEffect(() => {
    if (marketContext && !lastRefreshed) {
      fetchSignals();
    }
  }, [marketContext]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-surface-container-high/20 p-2 rounded-lg border border-outline-variant/10">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface">Neural Alpha Stream</h3>
        </div>
        <button 
          onClick={fetchSignals}
          disabled={isLoading || cooldown > 0}
          className="flex items-center gap-2 px-3 py-1 bg-primary text-on-primary text-[9px] font-bold uppercase tracking-widest rounded hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {isLoading ? "Running Synthesis..." : cooldown > 0 ? `Ready in ${cooldown}s` : "Refresh Signals"}
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {signals.length === 0 && !isLoading && (
             <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
                <Zap className="w-8 h-8 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">No signals generated.<br/>Refresh to compute.</p>
             </div>
          )}

          {signals.map((sig, i) => {
            const isHighConfidence = sig.confidence >= 85;
            const isBuy = sig.type === 'LONG';
            const isSell = sig.type === 'SHORT';
            
            return (
              <motion.div
                key={`${sig.assetId}-${sig.timestamp}`}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ delay: i * 0.1, ease: "easeOut" }}
                className={`p-5 bg-surface-container-low border rounded-xl relative overflow-hidden group transition-all shadow-sm ${
                  isHighConfidence 
                    ? isBuy 
                      ? 'border-secondary-container/40 ring-1 ring-secondary-container/20 shadow-[0_0_20px_rgba(56,189,248,0.1)]' 
                      : 'border-tertiary-container/40 ring-1 ring-tertiary-container/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                    : 'border-outline-variant/10 hover:border-primary/40'
                }`}
              >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] transition-opacity group-hover:opacity-20 ${isBuy ? 'bg-secondary-container opacity-10' : isSell ? 'bg-tertiary-container opacity-10' : 'bg-on-surface opacity-5'}`} />
                
                {isHighConfidence && (
                  <div className={`absolute -top-1 px-4 py-0.5 right-4 rounded-b-lg text-[7px] font-black uppercase tracking-[0.3em] z-20 shadow-lg ${isBuy ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                    High Conviction Alpha
                  </div>
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                     <h4 className="text-sm font-black text-on-surface mb-1 flex items-center gap-2">
                       {sig.assetId}
                       {isHighConfidence && <Zap className={`w-3 h-3 ${isBuy ? 'text-secondary-container' : 'text-tertiary-container'} animate-pulse`} />}
                     </h4>
                     <p className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">Confidence Score</p>
                  </div>
                  <div className="flex flex-col items-end">
                     <div className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-1 ${isBuy ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_12px_rgba(56,189,248,0.3)]' : isSell ? 'bg-tertiary-container text-on-tertiary-container shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'bg-surface-container-high text-on-surface/60'}`}>
                       {sig.type === 'LONG' ? 'BUY' : sig.type === 'SHORT' ? 'SELL' : 'NEUTRAL'}
                     </div>
                     <span className={`text-xl font-mono font-black ${isBuy ? 'text-secondary-container' : isSell ? 'text-tertiary-container' : 'text-on-surface/40'}`}>{sig.confidence}%</span>
                  </div>
                </div>

              <div className="space-y-4 relative z-10">
                <div className="flex gap-2">
                   <div className="mt-1">
                      <div className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                   </div>
                   <p className="text-[11px] leading-relaxed text-on-surface/80 font-medium">
                     {sig.reasoning}
                   </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-outline-variant/10 bg-surface-container-high/5 px-2 rounded-lg">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-40">Entry</p>
                      <p className="text-[10px] font-mono font-bold text-on-surface">{sig.entry.toLocaleString()}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-40">Stop Loss</p>
                      <p className="text-[10px] font-mono font-bold text-tertiary-container">{sig.sl.toLocaleString()}</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <p className="text-[8px] font-black uppercase tracking-tighter opacity-40">Take Profit</p>
                      <p className="text-[10px] font-mono font-bold text-secondary-container">{sig.tp.toLocaleString()}</p>
                   </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/5 flex justify-between items-center opacity-60">
                   <div className="flex items-center gap-2">
                      <History className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-tighter">{new Date(sig.timestamp).toLocaleTimeString()}</span>
                   </div>
                   <button className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest hover:text-primary transition-colors">
                      Execute Plan
                      <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      {lastRefreshed && (
         <div className="text-center">
            <span className="text-[9px] font-bold text-on-surface/20 uppercase tracking-[0.3em]">Last Update: {lastRefreshed}</span>
         </div>
      )}
    </div>
  );
}
