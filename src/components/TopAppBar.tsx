import { Bell, User, Radio, Cpu, Zap } from "lucide-react";

export function TopAppBar() {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface border-b border-outline-variant/10">
      <div className="flex items-center gap-3">
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

      <div className="hidden md:flex items-center gap-8">
        <div className="flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-container-low border border-outline-variant/10">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary-container shadow-[0_0_8px_#00b954]" />
          <span className="font-sans text-[10px] font-bold tracking-widest text-on-surface/60 uppercase">
            MT5 CONNECTED
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Equity</p>
          <p className="text-primary font-bold tnum">$12,450.80</p>
        </div>
        <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
          <Bell className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>
    </header>
  );
}
