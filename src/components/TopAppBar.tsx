import { Search, X, Wifi, WifiOff } from "lucide-react";
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

  const filteredResults = searchQuery.trim() === "" ? [] : ([
    ...marketData
      .filter(a => a.id.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(a => ({ id: a.id, label: a.id, category: "Asset", price: a.price })),
    ...news
      .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(n => ({ id: "news", label: n.title, category: "Intelligence", price: undefined })),
    { id: "config", label: "Bot Parameters", category: "Settings", price: undefined },
    { id: "config", label: "Strategy Builder", category: "Settings", price: undefined },
  ] as { id: string; label: string; category: string; price?: string }[]).slice(0, 8);

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
    <header className="h-14 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between px-4 shrink-0 z-50 gap-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-black font-headline text-sm select-none">
          W
        </div>
        <span className="font-headline font-bold tracking-tight text-lg leading-none">WINM <span className="text-primary">AI</span></span>
      </div>

      {/* Search */}
      <div ref={searchRef} className="flex-1 max-w-sm relative hidden md:block">
        <div className={`flex items-center gap-2 px-3 h-9 rounded-md bg-surface border transition-all ${
          isSearchFocused ? "border-primary/50 ring-1 ring-primary/10" : "border-outline-variant/15 hover:border-outline-variant/30"
        }`}>
          <Search className={`w-3.5 h-3.5 shrink-0 ${isSearchFocused ? "text-primary" : "text-on-surface/30"}`} />
          <input
            type="text"
            placeholder="Search assets, news, commands..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="flex-1 bg-transparent border-none outline-none text-xs placeholder:text-on-surface/30"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-surface-container-high rounded-full">
              <X className="w-3 h-3 text-on-surface/30" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {isSearchFocused && filteredResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="absolute top-11 left-0 right-0 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-1.5 space-y-0.5">
                {filteredResults.map((result, idx) => (
                  <button
                    key={`${result.id}-${idx}`}
                    onClick={() => {
                      onSearchSelect(result.id);
                      setIsSearchFocused(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-primary/10 group transition-all"
                  >
                    <div className="flex flex-col items-start gap-0.5 text-left">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-primary">{result.category}</span>
                      <span className="text-xs font-semibold text-on-surface group-hover:translate-x-0.5 transition-transform">{result.label}</span>
                    </div>
                    {result.price && (
                      <span className="text-xs font-mono font-bold text-on-surface/50">{result.price}</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status + Equity */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-secondary-container" : "bg-tertiary-container"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-secondary-container" : "bg-tertiary-container"}`} />
          </span>
          <span className={`text-xs font-medium ${isConnected ? "text-secondary-container" : "text-tertiary-container"}`}>
            {isConnected ? "Live Feed Active" : "Reconnecting…"}
          </span>
        </div>

        <div className="h-6 w-px bg-outline-variant/15 hidden sm:block" />

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-on-surface/40">Total Equity</span>
          <span className="font-headline font-semibold text-primary text-sm leading-tight">$124,592.45</span>
        </div>
      </div>
    </header>
  );
}
