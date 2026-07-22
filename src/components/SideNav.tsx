import { LayoutDashboard, Globe, Zap, Clock, Settings } from "lucide-react";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "terminal", label: "Terminal", icon: LayoutDashboard, path: "/" },
  { id: "markets",  label: "Markets",  icon: Globe,          path: "/markets" },
  { id: "alerts",   label: "Alerts",   icon: Zap,            path: "/alerts" },
  { id: "history",  label: "History",  icon: Clock,          path: "/history" },
  { id: "settings", label: "Settings", icon: Settings,        path: "/config" },
];

export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeId = (() => {
    if (location.pathname === "/") return "terminal";
    if (location.pathname.startsWith("/markets")) return "markets";
    if (location.pathname.startsWith("/alerts")) return "alerts";
    if (location.pathname.startsWith("/history")) return "history";
    if (location.pathname.startsWith("/config")) return "settings";
    return "terminal";
  })();

  return (
    <aside className="w-16 md:w-20 bg-surface-container-low border-r border-outline-variant/10 flex flex-col items-center py-4 shrink-0 z-40">
      <nav className="flex flex-col gap-1 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center gap-1.5 w-full py-3 group transition-colors ${
                isActive ? "text-primary" : "text-on-surface/40 hover:text-on-surface/80"
              }`}
              title={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="sideNavActive"
                  className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <div className={`p-2 rounded-lg transition-colors ${
                isActive ? "bg-primary/10" : "group-hover:bg-surface-container-high"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider hidden md:block">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
