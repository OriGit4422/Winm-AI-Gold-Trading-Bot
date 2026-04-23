import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Command } from "lucide-react";

interface ShortcutFeedbackProps {
  shortcut: string;
  label: string;
}

export function ShortcutIndicator() {
  const [activeShortcut, setActiveShortcut] = useState<{key: string, label: string} | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for ALT + [1-4] or other combinations
      if (e.altKey) {
        let label = "";
        if (e.key === "1") label = "Terminal Nav";
        if (e.key === "2") label = "Markets Nav";
        if (e.key === "3") label = "History Nav";
        if (e.key === "4") label = "Config Nav";
        if (e.key === "b") label = "Builder Nav";
        if (e.key === "s") label = "Search Activated";
        if (e.key === "d") label = "Detail Toggle";
        
        if (label) {
          setActiveShortcut({ key: e.key.toUpperCase(), label });
          setTimeout(() => setActiveShortcut(null), 1500);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {activeShortcut && (
        <motion.div
           initial={{ opacity: 0, y: 50, scale: 0.9 }}
           animate={{ opacity: 1, y: 0, scale: 1 }}
           exit={{ opacity: 0, y: -20, scale: 0.9 }}
           className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div className="bg-surface-container-highest/90 backdrop-blur-xl border border-primary/40 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl shadow-primary/20">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary text-on-primary rounded font-mono font-black text-xs">
               <span className="text-[10px] opacity-70">ALT +</span>
               {activeShortcut.key}
            </div>
            <div className="h-4 w-px bg-outline-variant/20" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface">
              {activeShortcut.label}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const KEYBOARD_GUIDE = [
  { key: "ALT + 1", desc: "Open Dashboard" },
  { key: "ALT + 2", desc: "Open Markets" },
  { key: "ALT + 3", desc: "Open History" },
  { key: "ALT + 4", desc: "Open Config" },
  { key: "ALT + B", desc: "Open Builder" },
  { key: "ALT + S", desc: "Quick Search" },
  { key: "ALT + D", desc: "Toggle Details" },
];
