/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { TopAppBar } from "./components/TopAppBar";
import { SideNav } from "./components/SideNav";
import { Dashboard } from "./components/Dashboard";
import { Config } from "./components/Config";
import { History } from "./components/History";
import { AssetDetailView } from "./components/AssetDetailView";
import { StrategyBuilder } from "./components/StrategyBuilder";
import { Markets } from "./components/Markets";
import { Alerts } from "./components/Alerts";
import { motion, AnimatePresence } from "motion/react";
import { ShortcutIndicator } from "./components/ShortcutIndicator";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case "1": navigate("/"); break;
          case "2": navigate("/markets"); break;
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

  const isDedicatedMode = location.pathname === "/builder";

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden selection:bg-primary/30">
      {!isDedicatedMode && (
        <TopAppBar onSearchSelect={(id) => {
          if (id === "config") navigate("/config");
          else if (id === "history") navigate("/history");
          else setSelectedAssetDetail(id);
        }} />
      )}

      <div className={`flex flex-1 overflow-hidden ${isDedicatedMode ? "" : ""}`}>
        {!isDedicatedMode && <SideNav />}

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <motion.div
                  className="h-full"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Dashboard onSelectAsset={setSelectedAssetDetail} />
                </motion.div>
              } />
              <Route path="/markets" element={
                <motion.div
                  className="h-full overflow-y-auto p-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Markets onSelectAsset={setSelectedAssetDetail} />
                </motion.div>
              } />
              <Route path="/alerts" element={
                <motion.div
                  className="h-full overflow-y-auto p-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Alerts />
                </motion.div>
              } />
              <Route path="/history" element={
                <motion.div
                  className="h-full overflow-y-auto p-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <History filterAsset={historyFilter} onClearFilter={() => setHistoryFilter(null)} />
                </motion.div>
              } />
              <Route path="/config" element={
                <motion.div
                  className="h-full overflow-y-auto p-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Config />
                </motion.div>
              } />
              <Route path="/builder" element={<StrategyBuilder onClose={() => navigate("/config")} />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

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

      <ShortcutIndicator />

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
