import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  ChevronRight, 
  Settings2, 
  Zap, 
  Activity, 
  TrendingUp, 
  ArrowRightLeft,
  X,
  Info
} from "lucide-react";

interface StrategyBlock {
  id: string;
  type: 'indicator' | 'logic' | 'action';
  name: string;
  params: Record<string, any>;
  linkedParams?: Record<string, string>; // paramName -> sourceBlockId
}

const AVAILABLE_BLOCKS = {
  indicator: [
    { name: "Gold Sentiment", params: { period: 14 } },
    { name: "Forex Volatility", params: { period: 20 } },
    { name: "Institutional RSI", params: { period: 14 } },
    { name: "Neural EMA", params: { period: 200 } },
    { name: "MACD Pulse", params: { fast: 12, slow: 26, signal: 9 } },
    { name: "BB Expansion", params: { period: 20, stdDev: 2 } },
  ],
  logic: [
    { name: "Neural Cross Up", params: {} },
    { name: "Neural Cross Down", params: {} },
    { name: "Liquidity Sweep", params: {} },
    { name: "Volume Imbalance", params: {} },
    { name: "AND", params: {} },
    { name: "OR", params: {} },
  ],
  action: [
    { name: "Exec Alpha Buy", params: { lotSize: 0.1 } },
    { name: "Exec Alpha Sell", params: { lotSize: 0.1 } },
    { name: "Emergency Close", params: {} },
    { name: "Trail SL/TP", params: { sl: 50, tp: 100 } },
  ]
};

export function StrategyBuilder({ onClose }: { onClose: () => void }) {
  const [strategyName, setStrategyName] = useState("New Alpha Strategy");
  const [blocks, setBlocks] = useState<StrategyBlock[]>([]);
  const [activeCategory, setActiveCategory] = useState<'indicator' | 'logic' | 'action'>('indicator');

  const addBlock = (block: any) => {
    const newBlock: StrategyBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeCategory,
      name: block.name,
      params: { ...block.params }
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const updateParam = (blockId: string, param: string, value: any) => {
    setBlocks(blocks.map(b => 
      b.id === blockId ? { 
        ...b, 
        params: { ...b.params, [param]: value },
        linkedParams: { ...b.linkedParams, [param]: undefined } as any
      } : b
    ));
  };

  const linkParam = (blockId: string, param: string, sourceBlockId: string) => {
    setBlocks(blocks.map(b => 
      b.id === blockId ? { 
        ...b, 
        linkedParams: { ...b.linkedParams, [param]: sourceBlockId } 
      } : b
    ));
  };

  const unlinkParam = (blockId: string, param: string) => {
    setBlocks(blocks.map(b => 
      b.id === blockId ? { 
        ...b, 
        linkedParams: { ...b.linkedParams, [param]: undefined } as any
      } : b
    ));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-surface/95 backdrop-blur-xl"
    >
      <div className="w-full max-w-6xl h-full bg-surface-container-low border border-outline-variant/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <input 
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                className="bg-transparent border-none text-xl font-bold text-on-surface outline-none focus:ring-0 p-0"
              />
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Visual Strategy Architect</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
              <Play className="w-4 h-4" />
              Test
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary text-xs font-bold uppercase tracking-widest rounded hover:bg-primary/90 transition-all">
              <Save className="w-4 h-4" />
              Save Strategy
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Block Library */}
          <div className="w-72 border-r border-outline-variant/10 flex flex-col bg-surface-container-lowest/50">
            <div className="p-4 flex gap-1 border-b border-outline-variant/10">
              {(['indicator', 'logic', 'action'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 py-2 text-[9px] uppercase tracking-widest font-bold rounded transition-all ${
                    activeCategory === cat 
                      ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {cat}s
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {AVAILABLE_BLOCKS[activeCategory].map((block) => (
                <button
                  key={block.name}
                  onClick={() => addBlock(block)}
                  className="w-full p-4 bg-surface-container-low border border-outline-variant/10 rounded-lg text-left group hover:border-primary/40 hover:bg-surface-container-highest transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-on-surface mb-1">{block.name}</p>
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-tighter">Click to add</p>
                  </div>
                  <Plus className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
            <div className="p-4 bg-surface-container-highest/30">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Info className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Builder Tip</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Combine indicators with logic blocks to create complex entry conditions. Actions define what happens when conditions are met.
              </p>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 overflow-y-auto p-8 bg-surface-container-low/30 relative" id="strategy-workspace">
             <svg className="absolute inset-0 pointer-events-none z-0 overflow-visible w-full h-full">
                {blocks.map(block => 
                  Object.entries(block.linkedParams || {}).map(([param, sourceId]) => {
                    if (!sourceId) return null;
                    const sourceIndex = blocks.findIndex(b => b.id === sourceId);
                    const targetIndex = blocks.findIndex(b => b.id === block.id);
                    if (sourceIndex === -1 || targetIndex === -1) return null;

                    // This is a simplified vertical connection line logic
                    // In a real nodal editor we'd use getBoundingClientRect, 
                    // but for this vertical flow we can visualize it as a side-path
                    return (
                      <motion.path
                        key={`${block.id}-${param}-${sourceId}`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        d={`M 100 ${sourceIndex * 180 + 100} Q 40 ${(sourceIndex + targetIndex) / 2 * 180 + 100} 100 ${targetIndex * 180 + 120}`}
                        stroke="var(--color-primary)"
                        strokeWidth="1"
                        fill="none"
                        strokeDasharray="4 4"
                        className="opacity-20"
                      />
                    );
                  })
                )}
             </svg>

            {blocks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-20 h-20 border-2 border-dashed border-outline-variant rounded-full flex items-center justify-center mb-6">
                  <Zap className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">Workspace Empty</h3>
                <p className="text-sm max-w-xs">Select blocks from the sidebar to begin architecting your trading logic.</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {blocks.map((block, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={block.id}
                    className="relative"
                  >
                    {index > 0 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <div className="w-px h-4 bg-outline-variant/40" />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full -translate-x-[0.5px]" />
                      </div>
                    )}
                    <div className={`p-5 rounded-xl border flex items-center gap-6 transition-all ${
                      block.type === 'indicator' ? 'bg-surface-container-highest/40 border-primary/20' :
                      block.type === 'logic' ? 'bg-surface-container-highest/60 border-secondary-container/20' :
                      'bg-surface-container-highest/80 border-tertiary-container/20 shadow-lg shadow-tertiary-container/5'
                    }`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        block.type === 'indicator' ? 'bg-primary/10 text-primary' :
                        block.type === 'logic' ? 'bg-secondary-container/10 text-secondary-container' :
                        'bg-tertiary-container/10 text-tertiary-container'
                      }`}>
                        {block.type === 'indicator' ? <Activity className="w-5 h-5" /> :
                         block.type === 'logic' ? <ArrowRightLeft className="w-5 h-5" /> :
                         <TrendingUp className="w-5 h-5" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-sm font-bold uppercase tracking-widest">{block.name}</h4>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                            block.type === 'indicator' ? 'bg-primary/10 text-primary' :
                            block.type === 'logic' ? 'bg-secondary-container/10 text-secondary-container' :
                            'bg-tertiary-container/10 text-tertiary-container'
                          }`}>
                            {block.type}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                          {Object.entries(block.params).map(([key, val]) => {
                            const linkedBlockId = block.linkedParams?.[key];
                            const linkedBlock = blocks.find(b => b.id === linkedBlockId);
                            const availableSources = blocks.filter(b => b.id !== block.id && b.type === 'indicator');

                            return (
                              <div key={key} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <label className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">{key}</label>
                                    <div title={`Linking this to another block allows dynamic parameter synchronization (e.g. using ${key} from an indicator's output).`}>
                                      <Info className="w-2.5 h-2.5 text-on-surface/20 hover:text-primary cursor-help transition-colors" />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {availableSources.length > 0 && (
                                      <button 
                                        onClick={() => linkedBlockId ? unlinkParam(block.id, key) : null}
                                        className={`p-0.5 rounded transition-colors ${linkedBlockId ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary'}`}
                                        title={linkedBlockId ? "Unlink Parameter" : "Link to another block"}
                                      >
                                        <ArrowRightLeft className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {linkedBlockId ? (
                                  <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded px-2 py-1">
                                    <Zap className="w-2.5 h-2.5 text-primary" />
                                    <span className="text-[10px] font-bold text-primary truncate max-w-[80px]">
                                      {linkedBlock?.name || 'Unknown'}
                                    </span>
                                    <button onClick={() => unlinkParam(block.id, key)}>
                                      <X className="w-2.5 h-2.5 text-primary/60 hover:text-primary" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="number"
                                      value={val}
                                      onChange={(e) => updateParam(block.id, key, parseFloat(e.target.value))}
                                      className="bg-surface-container-lowest border border-outline-variant/20 rounded px-2 py-1 text-xs font-bold w-16 outline-none focus:border-primary transition-colors"
                                    />
                                    {availableSources.length > 0 && (
                                      <select 
                                        className="bg-surface-container-lowest border border-outline-variant/20 rounded px-1 py-1 text-[9px] font-bold w-20 outline-none focus:border-primary transition-colors text-on-surface-variant"
                                        onChange={(e) => {
                                          if (e.target.value) linkParam(block.id, key, e.target.value);
                                        }}
                                        value=""
                                      >
                                        <option value="" disabled>Link...</option>
                                        {availableSources.map(s => (
                                          <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button 
                        onClick={() => removeBlock(block.id)}
                        className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                <div className="pt-8 flex justify-center">
                  <div className="px-4 py-2 bg-surface-container-highest/50 border border-dashed border-outline-variant/30 rounded-full text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                    End of Logic Flow
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Summary/Preview */}
          <div className="w-80 border-l border-outline-variant/10 flex flex-col bg-surface-container-lowest/50">
            <div className="p-6 border-b border-outline-variant/10">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Strategy Logic
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-2">Generated Pseudo-code</p>
                  <pre className="text-[10px] font-mono text-primary leading-relaxed overflow-x-auto">
                    {blocks.length === 0 ? '// No logic defined' : (
                      blocks.map(b => {
                        const paramsStr = Object.entries(b.params).map(([k, v]) => {
                          const linkedId = b.linkedParams?.[k];
                          if (linkedId) {
                            const source = blocks.find(s => s.id === linkedId);
                            return `${k}: @${source?.name || 'unknown'}`;
                          }
                          return `${k}: ${v}`;
                        }).join(', ');

                        if (b.type === 'indicator') return `IF ${b.name}(${paramsStr})`;
                        if (b.type === 'logic') return `  ${b.name}`;
                        return `THEN ${b.name}`;
                      }).join('\n')
                    )}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-6 flex-1">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Performance Metrics</h3>
              <div className="space-y-3">
                {[
                  { label: "Complexity", value: blocks.length > 5 ? "High" : "Optimal" },
                  { label: "Execution Speed", value: "< 2ms" },
                  { label: "Risk Profile", value: "Moderate" },
                ].map((stat) => (
                  <div key={stat.label} className="flex justify-between items-center py-2 border-b border-outline-variant/5">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase">{stat.label}</span>
                    <span className="text-xs font-bold text-on-surface">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
