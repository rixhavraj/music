# Personal Music PWA

This folder implements the first working slice from `music-pwa-spec.md`: a Next.js App Router PWA with a music source adapter, server-side API proxy routes, searchable demo catalog, player state, settings, local artwork, and installable PWA assets.

## Run

```bash
pnpm install
pnpm dev
```

The default source is `mock`, so the app runs without external services. To connect GaanaPy later, copy `.env.example` to `.env.local`, set `MUSIC_SOURCE=gaanapy`, and configure `GAANAPY_URL`.

## Production deployment

Deploy `backend` as a persistent Node service (Render, Railway, Fly.io, or a VPS). The frontend has the current Render service as a fallback, but you should set this Vercel environment variable when using a different backend:

```text
BACKEND=https://your-deployed-backend.example.com
```

The backend must be reachable over HTTPS and expose `/api/health`, `/api/search`, `/api/track/:id/play`, and `/api/stream/:id`. Do not use `127.0.0.1` or `localhost` for `BACKEND` in Vercel.

## Verify

```bash
pnpm exec tsc --noEmit
pnpm build
```

