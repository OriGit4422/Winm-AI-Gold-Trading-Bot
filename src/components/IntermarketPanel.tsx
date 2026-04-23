import React, { useState } from "react";
import { useIntermarketData } from "../services/marketService";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
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
  const { intermarket, loading, error } = useIntermarketData();
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
               {error && (
                 <div className="md:col-span-2 lg:col-span-1 p-2 bg-tertiary-container/10 border border-tertiary-container/20 rounded text-[9px] font-black text-tertiary-container uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    {error}
                 </div>
               )}
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

               {/* CO2 Emissions Section */}
               <div className="bg-surface-container-high/30 p-4 rounded-lg border border-outline-variant/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-tertiary-container rounded-full shadow-[0_0_8px_var(--color-tertiary-container)]" />
                      <span className="text-[9px] font-black text-on-surface/60 uppercase tracking-widest">Commodity CO2 Footprint</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {intermarket?.co2Emissions && Object.entries(intermarket.co2Emissions).map(([key, data]) => (
                      <div key={key} className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface/40">{key} (KG/UNIT)</span>
                          <span className="text-xs font-mono font-black text-on-surface">{data.value.toFixed(1)}</span>
                        </div>
                        <div className="h-6 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data.trend.map((v, i) => ({ v, i }))}>
                                <Line 
                                  type="monotone" 
                                  dataKey="v" 
                                  stroke={key === 'oil' ? "var(--color-tertiary-container)" : "var(--color-primary)"} 
                                  strokeWidth={1.5} 
                                  dot={false} 
                                  isAnimationActive={false}
                                />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
