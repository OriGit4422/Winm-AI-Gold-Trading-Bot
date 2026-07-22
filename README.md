<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Winm AI Gold Trading Terminal

An institutional-style trading terminal with **live, authentic market data** —
real prices, real quotes, real order books, and real historical candles pulled
from valid market-data sources (no faked numbers when a provider is configured).

## Live Data Sources

| Data | Source | Key required |
| --- | --- | --- |
| BTC/USD, ETH/USD prices, 24h change & order book | **Binance** public WebSocket (`@ticker` / `@depth`) | No |
| XAU/USD (gold) real-time proxy | **Binance** PAXG stream | No |
| XAU/USD & XAG/USD **spot**, EUR/USD, GBP/JPY, USD/JPY, AUD/USD | **Twelve Data** (primary) or **Finnhub** (fallback) | Yes |
| Historical OHLC candles for charts | **Twelve Data** `time_series` | Yes |
| Market news | **NewsAPI** | Yes |
| 10Y Treasury yield | **FRED** | Yes |
| USD strength (DXY proxy) | **Alpha Vantage** | Yes |
| Commitment of Traders (COT) | **CFTC** public Socrata API | No |

Crypto and the gold PAXG proxy stream live out of the box with **no key**.
Forex majors, spot metals, and chart history become authentic once you add a
Twelve Data (or Finnhub) key — otherwise those assets run in clearly-labelled
**SIM** mode and the UI badges them accordingly (`LIVE FEED · N/8 REAL`).

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   - `GEMINI_API_KEY` — AI analysis (Gemini)
   - `TWELVE_DATA_API_KEY` — **live forex + spot metals + chart history** (free at https://twelvedata.com/)
   - `FINNHUB_API_KEY` — optional fallback forex/metals provider (https://finnhub.io/)
   - `VITE_NEWS_API_KEY` — news feed (https://newsapi.org/)
   - `VITE_FRED_API_KEY`, `VITE_ALPHA_VANTAGE_API_KEY` — intermarket indices
   - `MARKET_POLL_INTERVAL_MS` — REST quote poll interval (optional; auto-derived from symbol count and `MARKET_CREDITS_PER_MIN` when unset — e.g. 6 symbols → 45s on the free tier)
   - `MARKET_CREDITS_PER_MIN` — provider credit budget used to size the auto interval (default `8`, matching Twelve Data's free tier)
3. Run the app:
   ```bash
   npm run dev
   ```
4. Verify the feed:
   ```bash
   curl http://localhost:3000/api/health
   ```
   The response lists which assets are `liveAssets` vs `simulatedAssets` and the
   active provider.

## Notes on rate limits

The forex/metals provider is polled over REST. Twelve Data's free tier allows
roughly 8 credits/minute and each symbol costs a credit per poll. To avoid
throttling out of the box, the poll interval is **auto-derived** from the number
of provider symbols and `MARKET_CREDITS_PER_MIN` (default 8) — e.g. 6 symbols
resolves to a 45s interval (~8 credits/min). Set `MARKET_POLL_INTERVAL_MS`
explicitly to override: lower it for faster refresh on a paid plan, or raise it
if you add symbols. On startup the server logs the chosen interval and the
resulting credits/min. Crypto and the gold proxy stream continuously over
WebSocket and are not affected by this limit.

Provider-backed assets are only flagged **LIVE** once a real quote (or Binance
tick) has actually arrived — a pending, failing, or throttled provider shows
**SIM** rather than masquerading its seed price as live data.
