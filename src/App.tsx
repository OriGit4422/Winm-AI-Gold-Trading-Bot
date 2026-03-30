/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { TopAppBar } from "./components/TopAppBar";
import { BottomNavBar } from "./components/BottomNavBar";
import { Dashboard } from "./components/Dashboard";
import { Markets } from "./components/Markets";
import { Alerts } from "./components/Alerts";
import { Config } from "./components/Config";
import { History } from "./components/History";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "markets":
        return <Markets />;
      case "alerts":
        return <Alerts />;
      case "config":
        return <Config />;
      case "history":
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/30">
      <TopAppBar />
      
      <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Background Decorative Gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary-container/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
