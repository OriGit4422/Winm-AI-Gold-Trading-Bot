import React from 'react';
import { motion } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { 
  Settings, Activity, Clock, TrendingUp, TrendingDown,
  Globe, Zap, LayoutDashboard, SearchIcon, Plus, ArrowUpRight
} from 'lucide-react';

const chartData = [
  { time: '09:00', price: 2315.40 },
  { time: '10:00', price: 2318.20 },
  { time: '11:00', price: 2316.50 },
  { time: '12:00', price: 2322.10 },
  { time: '13:00', price: 2320.80 },
  { time: '14:00', price: 2325.30 },
  { time: '15:00', price: 2324.90 },
  { time: '16:00', price: 2328.70 },
  { time: '17:00', price: 2332.40 },
  { time: '18:00', price: 2330.10 },
  { time: '19:00', price: 2334.80 },
  { time: '20:00', price: 2335.20 }
];

const watchlist = [
  { pair: 'XAU/USD', price: '2,335.20', change: '+12.40', percent: '+0.54%', trend: 'up' },
  { pair: 'EUR/USD', price: '1.0842', change: '-0.0015', percent: '-0.14%', trend: 'down' },
  { pair: 'GBP/JPY', price: '192.45', change: '+0.85', percent: '+0.44%', trend: 'up' },
  { pair: 'BTC/USD', price: '64,230.00', change: '+1,240.00', percent: '+1.97%', trend: 'up' },
  { pair: 'ETH/USD', price: '3,452.10', change: '-45.20', percent: '-1.29%', trend: 'down' },
];

const signals = [
  { asset: 'XAU/USD', type: 'BUY', conf: '92%', time: '2m ago', desc: 'Bullish divergence on 15m timeframe.' },
  { asset: 'EUR/USD', type: 'SELL', conf: '78%', time: '14m ago', desc: 'Resistance test failure at 1.0850.' },
  { asset: 'BTC/USD', type: 'BUY', conf: '88%', time: '1h ago', desc: 'Volume spike accompanying breakout.' },
];

const news = [
  { title: "Fed leaves rates unchanged, signals one cut this year", source: "Bloomberg", time: "10m ago", sentiment: "neutral" },
  { title: "Gold surges to new all-time high amid geopolitical tensions", source: "Reuters", time: "45m ago", sentiment: "bullish" },
  { title: "ECB hints at potential July rate cut if inflation cools", source: "Financial Times", time: "2h ago", sentiment: "bearish" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#191c22] border border-[#272a31] p-3 rounded shadow-lg text-sm">
        <p className="text-[#a0a4b0] mb-1">{label}</p>
        <p className="text-[#f2ca50] font-semibold">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  return (
    <div className="min-h-screen bg-[#10131a] text-[#e1e2eb] font-['Inter'] flex flex-col overflow-hidden selection:bg-[#f2ca50] selection:text-[#10131a]">
      {/* HEADER */}
      <header className="h-14 bg-[#191c22] border-b border-[#272a31] flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#f2ca50] to-[#d4af37] flex items-center justify-center text-[#10131a] font-black font-['Manrope']">W</div>
            <span className="font-['Manrope'] font-bold tracking-tight text-lg">WINM AI</span>
          </div>
          
          <div className="hidden md:flex items-center bg-[#10131a] rounded-md px-3 py-1.5 border border-[#272a31] focus-within:border-[#f2ca50] transition-colors w-64">
            <SearchIcon className="w-4 h-4 text-[#a0a4b0] mr-2" />
            <input 
              type="text" 
              placeholder="Search assets, news, commands..." 
              className="bg-transparent border-none outline-none text-sm text-[#e1e2eb] placeholder:text-[#a0a4b0] w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00b954] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00b954]"></span>
            </span>
            <span className="text-xs font-medium text-[#00b954]">Live Feed Active</span>
          </div>
          
          <div className="h-8 w-px bg-[#272a31]"></div>
          
          <div className="flex flex-col items-end justify-center">
            <span className="text-xs text-[#a0a4b0]">Total Equity</span>
            <span className="font-['Manrope'] font-semibold text-[#f2ca50]">$124,592.45</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-16 md:w-20 bg-[#191c22] border-r border-[#272a31] flex flex-col items-center py-4 shrink-0">
          <nav className="flex flex-col gap-6 w-full">
            {[
              { icon: LayoutDashboard, label: 'Terminal', active: true },
              { icon: Globe, label: 'Markets' },
              { icon: Zap, label: 'Alerts' },
              { icon: Clock, label: 'History' },
              { icon: Settings, label: 'Settings' }
            ].map((item, i) => (
              <button key={i} className={`flex flex-col items-center justify-center gap-1.5 w-full py-2 group ${item.active ? 'text-[#f2ca50]' : 'text-[#a0a4b0] hover:text-[#e1e2eb]'}`}>
                <div className={`p-2 rounded-lg transition-colors ${item.active ? 'bg-[#f2ca50]/10' : 'group-hover:bg-[#272a31]'}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium hidden md:block">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col overflow-hidden p-2 gap-2">
          
          <div className="flex-1 flex gap-2 min-h-0">
            {/* LEFT PANEL - WATCHLIST */}
            <div className="w-72 bg-[#191c22] rounded-lg border border-[#272a31] flex flex-col overflow-hidden shrink-0">
              <div className="p-3 border-b border-[#272a31] flex items-center justify-between">
                <h2 className="font-['Manrope'] font-semibold text-sm">Watchlist</h2>
                <button className="text-[#a0a4b0] hover:text-[#f2ca50] transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
                {watchlist.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    key={i} 
                    className={`p-3 rounded-md flex justify-between items-center cursor-pointer transition-colors ${i === 0 ? 'bg-[#272a31] border border-[#f2ca50]/30' : 'hover:bg-[#272a31] border border-transparent'}`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{item.pair}</div>
                      <div className={`text-xs flex items-center gap-1 mt-0.5 ${item.trend === 'up' ? 'text-[#00b954]' : 'text-[#ff968f]'}`}>
                        {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {item.percent}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-['Manrope'] font-medium">{item.price}</div>
                      <div className={`text-xs ${item.trend === 'up' ? 'text-[#00b954]' : 'text-[#ff968f]'}`}>{item.change}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CENTER PANEL - CHART & AI */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              {/* CHART AREA */}
              <div className="flex-[2] bg-[#191c22] rounded-lg border border-[#272a31] flex flex-col overflow-hidden relative">
                <div className="p-3 border-b border-[#272a31] flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h1 className="font-['Manrope'] font-bold text-lg text-[#f2ca50]">XAU/USD</h1>
                    <div className="flex items-center gap-1 bg-[#272a31] rounded p-1">
                      {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
                        <button key={tf} className={`px-2 py-0.5 text-xs rounded font-medium ${tf === '1h' ? 'bg-[#191c22] text-[#e1e2eb]' : 'text-[#a0a4b0] hover:text-[#e1e2eb]'}`}>
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-xs font-medium text-[#a0a4b0] hover:text-[#e1e2eb] flex items-center gap-1"><Activity className="w-3.5 h-3.5"/> Indicators</button>
                    <button className="bg-[#00b954]/10 text-[#00b954] hover:bg-[#00b954]/20 px-4 py-1.5 rounded text-sm font-semibold transition-colors">BUY</button>
                    <button className="bg-[#ff968f]/10 text-[#ff968f] hover:bg-[#ff968f]/20 px-4 py-1.5 rounded text-sm font-semibold transition-colors">SELL</button>
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  <div style={{ height: '100%', minHeight: 250, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f2ca50" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f2ca50" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#272a31" vertical={false} />
                        <XAxis dataKey="time" stroke="#a0a4b0" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#a0a4b0" fontSize={12} tickLine={false} axisLine={false} dx={-10} orientation="right" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="price" stroke="#f2ca50" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* AI ANALYSIS */}
              <div className="flex-1 bg-[#191c22] rounded-lg border border-[#272a31] p-4 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Activity className="w-24 h-24 text-[#f2ca50]" />
                </div>
                <h3 className="font-['Manrope'] font-semibold text-sm text-[#f2ca50] mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Gemini AI Analysis — XAU/USD
                </h3>
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto z-10 text-sm pr-2">
                  <p className="text-[#e1e2eb] leading-relaxed">
                    Gold is currently exhibiting a strong bullish momentum on the 1-hour timeframe, breaking through the key psychological resistance at $2,330. 
                    The RSI is at 68, indicating strong buying pressure but approaching overbought territory.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#10131a] border border-[#272a31] p-3 rounded">
                      <div className="text-[#a0a4b0] text-xs mb-1">Short-term Bias</div>
                      <div className="text-[#00b954] font-semibold">Bullish</div>
                    </div>
                    <div className="bg-[#10131a] border border-[#272a31] p-3 rounded">
                      <div className="text-[#a0a4b0] text-xs mb-1">Key Support</div>
                      <div className="text-[#e1e2eb] font-semibold">2,315.50</div>
                    </div>
                    <div className="bg-[#10131a] border border-[#272a31] p-3 rounded">
                      <div className="text-[#a0a4b0] text-xs mb-1">Key Resistance</div>
                      <div className="text-[#e1e2eb] font-semibold">2,342.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL - SIGNALS */}
            <div className="w-72 bg-[#191c22] rounded-lg border border-[#272a31] flex flex-col overflow-hidden shrink-0">
               <div className="p-3 border-b border-[#272a31] flex items-center justify-between">
                <h2 className="font-['Manrope'] font-semibold text-sm">Alpha Signals</h2>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#f2ca50] animate-pulse"></span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {signals.map((sig, i) => (
                  <div key={i} className="bg-[#10131a] border border-[#272a31] p-3 rounded-md flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{sig.asset}</span>
                      <span className="text-xs text-[#a0a4b0]">{sig.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${sig.type === 'BUY' ? 'bg-[#00b954]/20 text-[#00b954]' : 'bg-[#ff968f]/20 text-[#ff968f]'}`}>
                        {sig.type}
                      </span>
                      <span className="text-xs text-[#a0a4b0]">Conf: <span className="text-[#f2ca50]">{sig.conf}</span></span>
                    </div>
                    <p className="text-xs text-[#e1e2eb] leading-tight">{sig.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM NEWS SECTION */}
          <div className="h-40 bg-[#191c22] rounded-lg border border-[#272a31] flex flex-col overflow-hidden shrink-0">
             <div className="p-3 border-b border-[#272a31] flex items-center justify-between">
                <h2 className="font-['Manrope'] font-semibold text-sm">Market Intelligence</h2>
                <button className="text-[#a0a4b0] hover:text-[#f2ca50] text-xs font-medium flex items-center gap-1">View All <ArrowUpRight className="w-3 h-3"/></button>
              </div>
              <div className="flex-1 p-3 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                {news.map((n, i) => (
                  <div key={i} className="bg-[#10131a] border border-[#272a31] p-3 rounded-md hover:border-[#f2ca50]/50 transition-colors cursor-pointer group flex flex-col justify-between">
                    <p className="text-sm font-medium leading-tight group-hover:text-[#f2ca50] transition-colors line-clamp-2">{n.title}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-[#a0a4b0] uppercase tracking-wider">{n.source} • {n.time}</span>
                      <div className={`w-2 h-2 rounded-full ${n.sentiment === 'bullish' ? 'bg-[#00b954]' : n.sentiment === 'bearish' ? 'bg-[#ff968f]' : 'bg-[#a0a4b0]'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
          </div>

        </main>
      </div>
    </div>
  );
}
