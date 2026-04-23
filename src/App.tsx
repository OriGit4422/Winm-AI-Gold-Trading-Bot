/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { TopAppBar } from "./components/TopAppBar";
import { BottomNavBar } from "./components/BottomNavBar";
import { Dashboard } from "./components/Dashboard";
import { Config } from "./components/Config";
import { History } from "./components/History";
import { AssetDetailView } from "./components/AssetDetailView";
import { StrategyBuilder } from "./components/StrategyBuilder";
import { motion, AnimatePresence } from "motion/react";
import { ShortcutIndicator } from "./components/ShortcutIndicator";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);

  // Derive active tab from path
  const activeTab = location.pathname === "/" ? "terminal" : 
                    location.pathname.startsWith("/history") ? "history" :
                    location.pathname.startsWith("/config") ? "config" : "terminal";

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case "1": navigate("/"); break;
          case "2": navigate("/"); break;
          case "3": navigate("/history"); break;
          case "4": navigate("/config"); break;
          case "b": navigate("/builder"); break;
          case "d": setSelectedAssetDetail(prev => prev ? null : "XAU/USD"); break;
        }
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [navigate]);

  // Hide UI if in full-screen modes like Strategy Builder
  const isDedicatedMode = location.pathname === "/builder";

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/30">
      {!isDedicatedMode && (
        <TopAppBar onSearchSelect={(id) => {
          if (id === "config") navigate("/config");
          else if (id === "history") navigate("/history");
          else setSelectedAssetDetail(id);
        }} />
      )}
      
      <main className={`${isDedicatedMode ? '' : 'pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto'}`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Dashboard onSelectAsset={setSelectedAssetDetail} />
              </motion.div>
            } />
            <Route path="/config" element={
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Config />
              </motion.div>
            } />
            <Route path="/history" element={
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <History filterAsset={historyFilter} onClearFilter={() => setHistoryFilter(null)} />
              </motion.div>
            } />
            <Route path="/builder" element={<StrategyBuilder onClose={() => navigate("/config")} />} />
          </Routes>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedAssetDetail && (
          <AssetDetailView 
            assetId={selectedAssetDetail} 
            onClose={() => setSelectedAssetDetail(null)} 
            onNavigateToHistory={(assetId) => {
              setHistoryFilter(assetId);
              navigate("/history");
              setSelectedAssetDetail(null);
            }}
          />
        )}
      </AnimatePresence>

      {!isDedicatedMode && (
        <BottomNavBar activeTab={activeTab} setActiveTab={(tab) => navigate(tab === "terminal" ? "/" : `/${tab}`)} />
      )}
      <ShortcutIndicator />

      {/* Background Decorative Gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary-container/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
