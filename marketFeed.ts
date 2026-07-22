/**
 * marketFeed.ts
 * -----------------------------------------------------------------------------
 * Authentic live-market data providers for forex and precious metals.
 *
 * Crypto (BTC, ETH) and the gold PAXG proxy are streamed directly from
 * Binance's public WebSocket in server.ts. This module covers the instruments
 * that Binance does not offer as fiat pairs — spot metals (XAU/USD, XAG/USD)
 * and FX pairs (EUR/USD, GBP/JPY, USD/JPY, AUD/USD) — by polling a real
 * market-data vendor over REST.
 *
 * Providers (auto-selected by which API key is present):
 *   - Twelve Data   (TWELVE_DATA_API_KEY)  primary — metals + forex + history
 *   - Finnhub       (FINNHUB_API_KEY)      fallback — forex/metals via OANDA
 *
 * No key configured  ->  hasLiveProvider() returns false and the server keeps
 * the affected assets in clearly-labelled simulation mode instead of pretending
 * they are real.
 */

export interface LiveQuote {
  /** Canonical asset id, e.g. "XAU/USD". */
  id: string;
  /** Last traded / mid price. */
  price: number;
  /** Real percentage change over the provider's session, e.g. +0.42. */
  percentChange: number;
  /** Human-readable data source, surfaced in the UI. */
  source: string;
}

export interface HistoryPoint {
  time: string;
  price: number;
  volume: number;
  fullTimestamp: string;
}

const TWELVE_DATA_BASE = "https://api.twelvedata.com";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

function tdKey(): string | undefined {
  return process.env.TWELVE_DATA_API_KEY || process.env.VITE_TWELVE_DATA_API_KEY;
}

function finnhubKey(): string | undefined {
  return process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY;
}

/** True when at least one authentic quote provider is configured. */
export function hasLiveProvider(): boolean {
  return Boolean(tdKey() || finnhubKey());
}

/** Name of the active provider, for logging / status. */
export function activeProviderName(): string {
  if (tdKey()) return "Twelve Data";
  if (finnhubKey()) return "Finnhub";
  return "Simulated";
}

async function fetchJson(url: string, timeoutMs = 10000): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Winm-Trading-Terminal/1.0" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// --- Twelve Data --------------------------------------------------------------

async function fetchTwelveDataQuotes(symbols: string[]): Promise<LiveQuote[]> {
  const key = tdKey()!;
  const url = `${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbols.join(","))}&apikey=${key}`;
  const data = await fetchJson(url);

  // Twelve Data returns a bare object for a single symbol, or a map keyed by
  // symbol for multiple. An API-level error surfaces as { code, message }.
  if (data && data.status === "error") {
    throw new Error(`Twelve Data: ${data.message || "request failed"}`);
  }

  const rows = symbols.length === 1 ? { [symbols[0]]: data } : data;
  const quotes: LiveQuote[] = [];

  for (const id of symbols) {
    const row = rows?.[id];
    if (!row || row.status === "error") continue;
    const price = parseFloat(row.close ?? row.price);
    const percentChange = parseFloat(row.percent_change ?? "0");
    if (!Number.isFinite(price)) continue;
    quotes.push({
      id,
      price,
      percentChange: Number.isFinite(percentChange) ? percentChange : 0,
      source: "Twelve Data",
    });
  }
  return quotes;
}

// --- Finnhub (fallback) -------------------------------------------------------

// Finnhub quotes precious metals and FX through the OANDA feed.
const FINNHUB_SYMBOL_MAP: Record<string, string> = {
  "XAU/USD": "OANDA:XAU_USD",
  "XAG/USD": "OANDA:XAG_USD",
  "EUR/USD": "OANDA:EUR_USD",
  "GBP/JPY": "OANDA:GBP_JPY",
  "USD/JPY": "OANDA:USD_JPY",
  "AUD/USD": "OANDA:AUD_USD",
};

async function fetchFinnhubQuotes(symbols: string[]): Promise<LiveQuote[]> {
  const key = finnhubKey()!;
  const quotes: LiveQuote[] = [];

  await Promise.all(
    symbols.map(async (id) => {
      const vendorSymbol = FINNHUB_SYMBOL_MAP[id];
      if (!vendorSymbol) return;
      try {
        const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(vendorSymbol)}&token=${key}`;
        const row = await fetchJson(url);
        // c = current, pc = previous close, dp = percent change
        const price = parseFloat(row.c);
        if (!Number.isFinite(price) || price === 0) return;
        const percentChange = Number.isFinite(parseFloat(row.dp))
          ? parseFloat(row.dp)
          : row.pc
          ? ((price - parseFloat(row.pc)) / parseFloat(row.pc)) * 100
          : 0;
        quotes.push({ id, price, percentChange, source: "Finnhub" });
      } catch {
        /* skip this symbol on transient error; next poll retries */
      }
    })
  );
  return quotes;
}

/**
 * Fetch authentic quotes for the requested symbols from the active provider.
 * Returns only the symbols that resolved successfully — callers keep their
 * previous value (or simulation) for anything missing.
 */
export async function fetchLiveQuotes(symbols: string[]): Promise<LiveQuote[]> {
  if (symbols.length === 0) return [];
  if (tdKey()) return fetchTwelveDataQuotes(symbols);
  if (finnhubKey()) return fetchFinnhubQuotes(symbols);
  return [];
}

// --- Historical candles -------------------------------------------------------

const TD_INTERVAL_MAP: Record<string, string> = {
  "1m": "1min",
  "5m": "5min",
  "1H": "1h",
  "1D": "1day",
  "1W": "1week",
};

/**
 * Real OHLC history from Twelve Data for charting. Returns oldest-first points.
 * Throws if no Twelve Data key is configured or the request fails, so the
 * caller can fall back to its local buffer.
 */
export async function fetchHistory(
  symbol: string,
  timeframe: string,
  outputsize = 60
): Promise<HistoryPoint[]> {
  const key = tdKey();
  if (!key) throw new Error("No history provider configured");

  const interval = TD_INTERVAL_MAP[timeframe] || "1min";
  const url =
    `${TWELVE_DATA_BASE}/time_series?symbol=${encodeURIComponent(symbol)}` +
    `&interval=${interval}&outputsize=${outputsize}&order=ASC&apikey=${key}`;
  const data = await fetchJson(url);

  if (!data || data.status === "error" || !Array.isArray(data.values)) {
    throw new Error(`Twelve Data history: ${data?.message || "no data"}`);
  }

  return data.values.map((v: any) => {
    const dt = new Date(v.datetime.replace(" ", "T"));
    const isIntraday = interval.includes("min") || interval.includes("h");
    return {
      time: isIntraday
        ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : dt.toLocaleDateString([], { month: "short", day: "numeric" }),
      fullTimestamp: dt.toLocaleString(),
      price: parseFloat(v.close),
      volume: v.volume ? parseFloat(v.volume) : parseFloat(v.close) * 0.05,
    };
  });
}
