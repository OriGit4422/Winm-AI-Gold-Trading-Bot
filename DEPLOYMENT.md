# Deployment Guide (Winm AI Gold Trading Bot)

This app is a **single Node.js service** that serves:
- a React/Vite frontend (`dist/` in production),
- REST API endpoints (`/api/*`),
- a WebSocket market feed.

## 1) Recommended hosting options

For this architecture, use a platform that supports long-running Node servers and WebSockets:

1. **Railway** (easiest)
2. **Render** (good free/dev plans)
3. **Fly.io** (more control)
4. **Any VPS (DigitalOcean/Linode/AWS EC2)** if you want full control

> Avoid static-only hosts (like Netlify/Vercel static mode) unless you split backend and frontend.

## 2) Environment variables

Set these in your hosting provider:

- `NODE_ENV=production`
- `PORT` (usually injected by host automatically)
- `NEWS_API_KEY` (preferred) or `VITE_NEWS_API_KEY`
- `GEMINI_API_KEY` (if Gemini features are used by your app)

## 3) Build and start commands

Use these commands:

- **Install:** `npm ci`
- **Build:** `npm run build`
- **Start:** `npm run start`

## 4) Railway quick publish

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Set environment variables listed above.
4. Railway will detect Node and run your commands.
5. Open the generated URL and verify:
   - UI loads
   - `/api/health` returns `{ "status": "ok" }`
   - market table updates (WebSocket connected)

## 5) Render quick publish

Create a **Web Service** with:
- Runtime: Node
- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Environment variables: same as above

## 6) Publish checklist

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `PORT` is not hardcoded
- [ ] `NEWS_API_KEY` configured
- [ ] WebSocket works behind HTTPS/WSS
- [ ] CORS/reverse proxy checked if frontend/backend are split

## 7) Suggested production improvements

Before public release, consider:

- Add request-rate limiting to `/api/news`
- Add structured logging (`pino` or `winston`)
- Add error monitoring (Sentry)
- Replace mock market stream with a real market provider
- Add authentication if you expose account-specific features

