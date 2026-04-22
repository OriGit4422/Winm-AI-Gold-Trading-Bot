import React, { useState } from "react";
import { useIntermarketData } from "../services/marketService";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown, 
  Globe,
  Dna,
  Zap
} from "lucide-react";

export function IntermarketPanel() {
  const { intermarket, loading } = useIntermarketData();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (loading && !intermarket) {
    return (
      <div className="bg-surface-container-low border border-outline-variant/10 rounded-lg p-4 animate-pulse">
        <div className="h-4 w-32 bg-outline-variant/10 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-8 w-full bg-outline-variant/10 rounded" />
          <div className="h-8 w-full bg-outline-variant/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-lg overflow-hidden flex flex-col transition-all duration-500">
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors border-b border-outline-variant/5"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Intermarket Matrix</h3>
        </div>
        {isCollapsed ? <ChevronDown className="w-4 h-4 text-on-surface/40" /> : <ChevronUp className="w-4 h-4 text-on-surface/40" />}
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
               <div className="bg-surface-container-high/30 p-3 rounded-lg border border-outline-variant/5 flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-on-surface/30 uppercase tracking-widest block">US 10Y Yield</span>
                      <span className="text-sm font-mono font-black text-on-surface">{intermarket?.yield10Y || "---"}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase text-secondary-container bg-secondary-container/10 px-1.5 py-0.5 rounded">Bullish USD</span>
                  </div>
               </div>

               <div className="bg-surface-container-high/30 p-3 rounded-lg border border-outline-variant/5 flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-on-surface/30 uppercase tracking-widest block">DXY (Proxy)</span>
                      <span className="text-sm font-mono font-black text-on-surface">{intermarket?.dxy || "---"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className="text-[9px] font-bold uppercase text-on-surface/40 italic">Real-time Feed</span>
                  </div>
               </div>

               <div className="bg-surface-container-high/30 p-3 rounded-lg border border-outline-variant/5">
                 <div className="flex items-center gap-2 mb-2">
                    <Dna className="w-3 h-3 text-secondary-container" />
                    <span className="text-[9px] font-bold text-on-surface/40 uppercase tracking-widest">Yield Correlation Analysis</span>
                 </div>
                 <p className="text-[10px] leading-relaxed text-on-surface/60 italic">
                   Rising yields historically exert downward pressure on Gold and provide a structural floor for the USD. Current decoupling suggests institutional accumulation.
                 </p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
