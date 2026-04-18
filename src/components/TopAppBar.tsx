import { Bell, User, Radio, Cpu, Zap, Wifi, WifiOff, Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMarketData } from "../services/marketService";
import { useNewsFeed } from "../services/newsService";
import { motion, AnimatePresence } from "motion/react";

interface TopAppBarProps {
  onSearchSelect: (id: string) => void;
}

export function TopAppBar({ onSearchSelect }: TopAppBarProps) {
  const { isConnected, data: marketData } = useMarketData();
  const { news } = useNewsFeed("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredResults = searchQuery.trim() === "" ? [] : ( [
    ...marketData
      .filter(a => a.id.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(a => ({ id: a.id, label: a.id, category: "Asset", price: a.price })),
    ...news
      .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(n => ({ id: "news", label: n.title, category: "Intelligence", price: undefined })),
    { id: "config", label: "Bot Parameters", category: "Settings", price: undefined },
    { id: "config", label: "Strategy Builder", category: "Settings", price: undefined }
  ] as { id: string; label: string; category: string; price?: string }[] ).slice(0, 8);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 px-6 h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between gap-6">
      <div className="flex items-center gap-3 shrink-0">
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

      {/* Global Search Bar */}
      <div ref={searchRef} className="flex-1 max-w-xl relative hidden md:block">
        <div className={`flex items-center gap-3 px-4 h-10 rounded-full bg-surface-container-high border transition-all ${isSearchFocused ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant/20'}`}>
          <Search className={`w-4 h-4 ${isSearchFocused ? 'text-primary' : 'text-on-surface/40'}`} />
          <input
            type="text"
            placeholder="Search Assets, Intelligence, or Systems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="flex-1 bg-transparent border-none outline-none text-xs font-medium placeholder:text-on-surface/30"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-surface-container-highest rounded-full">
              <X className="w-3 h-3 text-on-surface/40" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {isSearchFocused && filteredResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="absolute top-12 left-0 right-0 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-2xl"
            >
              <div className="p-2 space-y-1">
                {filteredResults.map((result, idx) => (
                  <button
                    key={`${result.id}-${idx}`}
                    onClick={() => {
                      onSearchSelect(result.id);
                      setIsSearchFocused(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/10 group transition-all"
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-primary">{result.category}</span>
                      <span className="text-sm font-bold text-on-surface group-hover:translate-x-1 transition-transform">{result.label}</span>
                    </div>
                    {result.price && (
                      <span className="text-xs font-mono font-bold text-on-surface/60">{result.price}</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-container-low border border-outline-variant/10">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-secondary-container shadow-[0_0_8px_#00b954]' : 'bg-tertiary-container shadow-[0_0_8px_#ff4d4d]'} transition-all duration-500`} />
          <span className="font-sans text-[10px] font-bold tracking-widest text-on-surface/60 uppercase">
            {isConnected ? 'LIVE FEED ACTIVE' : 'RECONNECTING...'}
          </span>
          {isConnected ? <Wifi className="w-3 h-3 text-secondary-container ml-1" /> : <WifiOff className="w-3 h-3 text-tertiary-container ml-1" />}
        </div>
        
        <div className="text-right hidden sm:block">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Equity</p>
          <p className="text-primary font-bold tnum">$12,450.80</p>
        </div>
        <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors relative">
          <Bell className="w-5 h-5 text-on-surface-variant" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-tertiary-container rounded-full border-2 border-surface" />
        </button>
      </div>
    </header>
  );
}
