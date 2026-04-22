import React, { useState, useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceLine, ReferenceArea, Brush, Line
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, Info, BarChart3, Activity } from "lucide-react";
import { FootprintCandle, OrderFlowPoint } from "../services/marketService";

interface NexusSMCChartProps {
  assetId: string;
  history: any[];
  footprints: FootprintCandle[];
  activeOverlays: string[];
  smcMarkers: any[];
  fvgZones: any[];
  liquidityPools: any[];
  killZones: any[];
  smcZones: any[];
  volumeProfile: any[];
  orderBook?: { bids: [number, number][]; asks: [number, number][] };
  premiumDiscount?: any;
  zoomRange: { start: number; end: number };
  onZoomRangeChange: (range: any) => void;
  onHoverLiquidity?: (poolId: string | null) => void;
  onHoverFVG?: (fvgId: string | null) => void;
  comparisonAssetId?: string | null;
  comparisonHistory?: any[];
}

const DepthChart = ({ bids, asks }: { bids: [number, number][]; asks: [number, number][] }) => {
  const maxVolume = Math.max(...bids.map(b => b[1]), ...asks.map(a => a[1]));
  
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-32 flex flex-col gap-px pointer-events-none opacity-40">
       <div className="space-y-0.5 flex flex-col-reverse">
          {asks.slice(0, 15).map((ask, i) => (
            <div key={i} className="h-2 flex items-center justify-end group">
              <div 
                className="h-full bg-tertiary-container/30 rounded-l-sm" 
                style={{ width: `${(ask[1] / maxVolume) * 100}%` }} 
              />
            </div>
          ))}
       </div>
       <div className="h-px bg-outline-variant/20 my-1" />
       <div className="space-y-0.5">
          {bids.slice(0, 15).map((bid, i) => (
            <div key={i} className="h-2 flex items-center justify-end">
              <div 
                className="h-full bg-secondary-container/30 rounded-l-sm" 
                style={{ width: `${(bid[1] / maxVolume) * 100}%` }} 
              />
            </div>
          ))}
       </div>
    </div>
  );
};

const FootprintMiniCandle = ({ candle }: { candle: FootprintCandle }) => {
  return (
    <div className="flex-shrink-0 w-16 flex flex-col h-32 bg-surface-container-high/10 border-x border-outline-variant/10 relative">
      <div className="absolute top-0 left-0 w-full text-[6px] font-mono text-on-surface/40 px-1 py-0.5 border-b border-outline-variant/5 bg-surface-container-highest/20 truncate text-center">
        {candle.time}
      </div>
      
      <div className="flex-1 flex flex-col-reverse relative mt-3 overflow-hidden">
        {candle.levels.slice(0, 8).map((level: OrderFlowPoint, li: number) => {
          const total = level.buyVol + level.sellVol;
          const buyPercent = (level.buyVol / total) * 100;
          return (
            <div key={li} className={`h-[12.5%] border-t border-outline-variant/5 flex relative group/level ${level.isPOC ? 'bg-primary/20' : ''}`}>
              <div className="flex-1 border-r border-outline-variant/10 flex items-center justify-end pr-0.5 overflow-hidden">
                <div className="absolute left-0 h-full bg-secondary-container/20 transition-all" style={{ width: `${buyPercent / 2}%` }} />
              </div>
              <div className="flex-1 flex items-center pl-0.5 overflow-hidden relative">
                <div className="absolute right-0 h-full bg-tertiary-container/20 transition-all" style={{ width: `${(100 - buyPercent) / 2}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-0.5 border-t border-outline-variant/10 bg-surface-container-low/50 text-center">
        <span className={`text-[6px] font-black ${candle.totalDelta > 0 ? 'text-secondary-container' : 'text-tertiary-container'}`}>
          {candle.totalDelta > 0 ? '+' : ''}{candle.totalDelta.toFixed(0)}
        </span>
      </div>
    </div>
  );
};

export function NexusSMCChart({ 
  assetId, 
  history, 
  footprints, 
  activeOverlays, 
  smcMarkers, 
  fvgZones, 
  liquidityPools, 
  killZones,
  smcZones,
  volumeProfile,
  orderBook,
  premiumDiscount,
  zoomRange,
  onZoomRangeChange,
  onHoverLiquidity,
  onHoverFVG,
  comparisonAssetId,
  comparisonHistory
}: NexusSMCChartProps) {
  const [showOrderFlowSubpane, setShowOrderFlowSubpane] = useState(false);
  const [showDepthOverlay, setShowDepthOverlay] = useState(false);
  const [showVPVR, setShowVPVR] = useState(true);
  const [hoveredFVG, setHoveredFVG] = useState<string | null>(null);
  const [hoveredPool, setHoveredPool] = useState<string | null>(null);

  const visibleHistory = useMemo(() => {
    if (history.length === 0) return [];
    const s = Math.max(0, Math.floor((zoomRange.start / 100) * history.length));
    const e = Math.min(history.length, Math.ceil((zoomRange.end / 100) * history.length));
    return history.slice(s, e);
  }, [history, zoomRange]);

  const activeFootprints = useMemo(() => footprints.slice(-15), [footprints]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 relative bg-surface-container-lowest/30 rounded-xl border border-outline-variant/10 overflow-hidden">
        {/* Toggle Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button 
             onClick={() => setShowVPVR(!showVPVR)}
             className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${showVPVR ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high/50 text-on-surface/60 border-outline-variant/20 hover:text-on-surface'}`}
          >
             VPVR
          </button>
          <button 
             onClick={() => setShowDepthOverlay(!showDepthOverlay)}
             className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${showDepthOverlay ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high/50 text-on-surface/60 border-outline-variant/20 hover:text-on-surface'}`}
          >
             Depth
          </button>
          <button 
            onClick={() => setShowOrderFlowSubpane(!showOrderFlowSubpane)}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showOrderFlowSubpane ? 'bg-primary text-on-primary border-primary shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)]' : 'bg-surface-container-high/50 text-on-surface/60 border-outline-variant/20 hover:text-on-surface'}`}
          >
            <Activity className="w-3 h-3" />
            Flow Engine
          </button>
        </div>

        {/* Depth Overlay */}
        {showDepthOverlay && orderBook && (
          <DepthChart bids={orderBook.bids} asks={orderBook.asks} />
        )}

        {/* VPVR Overlay (Linked to Ops Hub) */}
        {activeOverlays.includes('volume') && volumeProfile.length > 0 && (
          <div className="absolute right-0 top-0 h-full w-32 pointer-events-none flex flex-col-reverse py-[60px] pr-[60px] z-10">
             {volumeProfile.map((p, i) => (
                <div key={i} className={`flex-1 flex justify-end items-center ${p.isPOC ? 'z-20' : ''}`}>
                   <div 
                      className={`h-[90%] rounded-l-sm transition-all duration-700 ${p.isPOC ? 'bg-primary/40 border-y border-l border-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]' : 'bg-primary/10 border-r border-primary/20'}`} 
                      style={{ width: `${p.weight}%` }} 
                   />
                </div>
             ))}
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleHistory.map((h, i) => {
            const histIdx = history.findIndex(hist => hist.time === h.time);
            return {
              ...h,
              comparePrice: comparisonAssetId && histIdx !== -1 && comparisonHistory?.[histIdx] ? comparisonHistory[histIdx].price : undefined
            };
          })}>
            <defs>
              <linearGradient id="colorPriceSMC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            
            {/* Premium/Discount Zones */}
            {premiumDiscount && activeOverlays.includes('smc') && (
              <>
                <ReferenceArea 
                  y1={premiumDiscount.discount.bottom} 
                  y2={premiumDiscount.discount.top} 
                  fill="var(--color-secondary-container)" 
                  fillOpacity={0.03} 
                />
                <ReferenceArea 
                  y1={premiumDiscount.premium.bottom} 
                  y2={premiumDiscount.premium.top} 
                  fill="var(--color-tertiary-container)" 
                  fillOpacity={0.03} 
                />
                <ReferenceLine y={premiumDiscount.equilibrium} stroke="var(--color-on-surface)" strokeOpacity={0.1} strokeDasharray="5 5" />
              </>
            )}

            {/* Supply & Demand Zones */}
            {activeOverlays.includes('smc') && smcZones.map((z, i) => (
              <ReferenceArea 
                key={i}
                x1={z.start}
                x2={z.end}
                y1={z.bottom}
                y2={z.top}
                fill={z.type === 'Supply' ? 'var(--color-tertiary-container)' : 'var(--color-secondary-container)'}
                fillOpacity={0.1}
                stroke={z.type === 'Supply' ? 'var(--color-tertiary-container)' : 'var(--color-secondary-container)'}
                strokeOpacity={0.2}
                label={{ position: 'insideLeft', value: z.type.toUpperCase(), fill: z.type === 'Supply' ? 'var(--color-tertiary-container)' : 'var(--color-secondary-container)', fontSize: 7, fontWeight: 'black' }}
              />
            ))}

            {/* Kill Zones Refinement */}
            {activeOverlays.includes('killzones') && killZones.map((kz, i) => (
              <ReferenceArea 
                key={i} 
                x1={kz.start} 
                x2={kz.end} 
                fill={kz.color.replace('0.05', '0.12')} 
                stroke={kz.color.replace('0.05', '0.3')}
                strokeWidth={1}
                className="cursor-help"
                label={{ 
                  position: 'insideTopLeft', 
                  value: kz.name, 
                  fill: 'var(--color-on-surface)', 
                  fontSize: 7, 
                  fontWeight: '900', 
                  className: 'uppercase opacity-40 translate-y-4' 
                }}
              />
            ))}

            {/* FVG Detection Zones with Hover and Refined Visuals */}
            {activeOverlays.includes('fvg') && fvgZones.map((z, i) => {
               const fvgId = `fvg-${i}`;
               const isHovered = hoveredFVG === fvgId;
               return (
                  <ReferenceArea 
                    key={i}
                    x1={z.timeStart}
                    x2={z.timeEnd}
                    y1={z.bottom}
                    y2={z.top}
                    fill={z.type === 'bull' ? 'var(--color-secondary-container)' : 'var(--color-tertiary-container)'}
                    fillOpacity={isHovered ? 0.25 : 0.08}
                    stroke={z.type === 'bull' ? 'var(--color-secondary-container)' : 'var(--color-tertiary-container)'}
                    strokeOpacity={isHovered ? 0.8 : 0.2}
                    strokeDasharray={isHovered ? "0" : "4 4"}
                    className="cursor-help transition-all duration-300"
                    onMouseEnter={() => {
                      setHoveredFVG(fvgId);
                      onHoverFVG?.(fvgId);
                    }}
                    onMouseLeave={() => {
                      setHoveredFVG(null);
                      onHoverFVG?.(null);
                    }}
                  />
               );
            })}

            {/* Liquidity Pools with Dynamic Interaction and Interactivity */}
            {activeOverlays.includes('liquidity') && liquidityPools.map((p, i) => {
              const poolId = `pool-${i}`;
              const isHovered = hoveredPool === poolId;
              const isInteracting = !isHovered && visibleHistory.length > 0 && Math.abs(p.price - visibleHistory[visibleHistory.length-1].price) < p.price * 0.002;
              
              return (
                <ReferenceLine 
                    key={i}
                    y={p.price}
                    stroke={p.type === 'buy-side' ? 'var(--color-secondary-container)' : 'var(--color-tertiary-container)'}
                    strokeWidth={isHovered ? 4 : (isInteracting ? 2 : 1)}
                    strokeOpacity={isHovered ? 1 : (isInteracting ? 0.8 : 0.4)}
                    className="cursor-pointer transition-all duration-350"
                    onMouseEnter={() => {
                        setHoveredPool(poolId);
                        onHoverLiquidity?.(poolId);
                    }}
                    onMouseLeave={() => {
                        setHoveredPool(null);
                        onHoverLiquidity?.(null);
                    }}
                >
                   {isHovered && (
                     <animate 
                       attributeName="stroke-opacity" 
                       values="0.6;1;0.6" 
                       dur="0.4s" 
                       repeatCount="indefinite" 
                     />
                   )}
                   {isInteracting && (
                      <animate 
                        attributeName="stroke-dasharray" 
                        values="0;4;0" 
                        dur="1s" 
                        repeatCount="indefinite" 
                      />
                   )}
                </ReferenceLine>
              );
            })}

            {/* SMC Markers (BOS/CHoCH) */}
            {activeOverlays.includes('smc') && smcMarkers.map((m, i) => (
              <ReferenceLine 
                key={i}
                x={m.time}
                stroke={m.side === 'bull' ? 'var(--color-secondary-container)' : 'var(--color-tertiary-container)'}
                strokeOpacity={0.6}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                label={{
                  position: 'top',
                  value: m.type,
                  fill: m.side === 'bull' ? 'var(--color-secondary-container)' : 'var(--color-tertiary-container)',
                  fontSize: 9,
                  fontWeight: '900',
                  className: 'uppercase tracking-tighter'
                }}
              />
            ))}
            
            {/* Horizontal level lines for SMC pivots */}
            {activeOverlays.includes('smc') && smcMarkers.map((m, i) => (
                <ReferenceLine 
                    key={`level-${i}`}
                    y={m.price}
                    stroke={m.side === 'bull' ? 'var(--color-secondary-container)' : 'var(--color-tertiary-container)'}
                    strokeOpacity={0.2}
                    strokeWidth={1}
                />
            ))}

            <XAxis dataKey="time" hide />
            <YAxis 
              domain={['auto', 'auto']} 
              orientation="right" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: 'var(--color-primary)', fontFamily: 'monospace' }}
              width={60}
            />
            
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  // Custom Tooltip for Kill Zones if logic allows
                  const currentKz = killZones.find(kz => label >= kz.start && label <= kz.end);
                  
                  return (
                    <div className="bg-surface-container-highest/90 border border-outline-variant/20 p-3 rounded-lg shadow-2xl backdrop-blur-md min-w-[150px]">
                      {currentKz && (
                        <div className="mb-2 pb-2 border-b border-outline-variant/10">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{currentKz.name}</p>
                          <p className="text-[8px] text-on-surface/60 mt-1 uppercase font-bold">Session Volatility Peak</p>
                        </div>
                      )}

                      <p className="text-[9px] text-on-surface/40 uppercase font-black mb-2">{label}</p>
                      
                      {/* FVG Highlighted Tooltip */}
                      {hoveredFVG && (
                        <div className="mt-2 p-2 bg-primary/10 rounded border border-primary/20 mb-2">
                           <p className="text-[8px] font-black text-primary uppercase mb-1">FVG DETAILS</p>
                           <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              <span className="text-[7px] text-on-surface/40 uppercase font-bold">Imbalance:</span>
                              <span className="text-[8px] font-bold text-on-surface">Significant</span>
                              <span className="text-[7px] text-on-surface/40 uppercase font-bold">Midpoint:</span>
                              <span className="text-[8px] font-bold text-on-surface">${(Number(payload[0]?.value || 0) * 1.0005).toFixed(2)}</span>
                           </div>
                        </div>
                      )}

                      {/* Liquidity Pool Tooltip */}
                      {hoveredPool && (
                        <div className="mt-2 p-2 bg-secondary-container/10 rounded border border-secondary-container/20 mb-2">
                           <p className="text-[8px] font-black text-secondary-container uppercase mb-1">LIQUIDITY HUB</p>
                           <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                 <span className="text-[7px] text-on-surface/40 uppercase font-bold">Type:</span>
                                 <span className="text-[8px] font-bold text-on-surface uppercase">Institutional Pull</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-[7px] text-on-surface/40 uppercase font-bold">Resting Vol:</span>
                                 <span className="text-[8px] font-bold text-secondary-container">High Conviction</span>
                              </div>
                           </div>
                        </div>
                      )}

                      {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex flex-col mb-1 last:mb-0">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[8px] text-on-surface/30 uppercase font-bold tracking-tighter">{entry.name}</span>
                          </div>
                          <span className={`text-xs font-mono font-bold ${entry.name === assetId ? 'text-primary' : 'text-on-surface/60'}`}>
                            ${entry.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="var(--color-primary)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPriceSMC)" 
              isAnimationActive={false}
              name={assetId}
            />
            {comparisonAssetId && (
              <Line
                type="monotone"
                dataKey="comparePrice"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                name={comparisonAssetId || "Comparison"}
              />
            )}
            <Brush 
              dataKey="time" 
              height={20} 
              stroke="var(--color-primary-variant)" 
              fill="var(--color-surface-container-highest)"
              startIndex={history.length > 0 ? Math.max(0, Math.floor((zoomRange.start / 100) * history.length)) : 0}
              endIndex={history.length > 0 ? Math.min(history.length - 1, Math.ceil((zoomRange.end / 100) * history.length) - 1) : 0}
              onChange={(range: any) => {
                if (range && typeof range.startIndex === 'number' && history.length > 0) {
                   onZoomRangeChange({
                     start: (range.startIndex / history.length) * 100,
                     end: (range.endIndex / history.length) * 100
                   });
                }
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Toggleable Order Flow Subpane (Footprint/Delta) */}
      <AnimatePresence>
        {showOrderFlowSubpane && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-surface-container-high/30 rounded-xl border border-outline-variant/10 p-4 overflow-hidden"
          >
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                   <BarChart3 className="w-4 h-4 text-primary" />
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-on-surface">Deal Splitting Flow (Real-time Delta)</h5>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-secondary-container/60 rounded-full" />
                      <span className="text-[8px] font-bold text-on-surface/40 uppercase">Aggregated Buys</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-tertiary-container/60 rounded-full" />
                      <span className="text-[8px] font-bold text-on-surface/40 uppercase">Aggregated Sells</span>
                   </div>
                </div>
             </div>

             <div className="flex h-36 gap-2 overflow-x-auto scrollbar-hide">
                {activeFootprints.map((candle, i) => (
                  <FootprintMiniCandle key={i} candle={candle} />
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
