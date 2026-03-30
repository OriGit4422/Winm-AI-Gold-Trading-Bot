import { LayoutDashboard, BarChart3, Bell, Settings, History } from "lucide-react";
import { motion } from "motion/react";

interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function BottomNavBar({ activeTab, setActiveTab }: BottomNavBarProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "markets", label: "Markets", icon: BarChart3 },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "config", label: "Config", icon: Settings },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-surface border-t border-outline-variant/10 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center transition-all relative px-3 py-1 rounded-sm ${
              isActive ? "text-primary bg-surface-container-high/50" : "text-on-surface/50 hover:text-primary/80"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-px left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className={`w-5 h-5 mb-1 ${isActive ? "fill-primary/20" : ""}`} />
            <span className="font-sans text-[10px] font-medium uppercase tracking-wider">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
