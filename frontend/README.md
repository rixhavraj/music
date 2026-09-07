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

this is how you will use this project 
this is a very upper level project helped to stream music add free 



Q-Learning is a fundamental, model-free Reinforcement Learning (RL) algorithm. It enables an agent to learn how to act optimally in a Markov Decision Process (MDP) through trial-and-error interactions with an environment.


AI Mode conversation: what is bittensorYou said: what is bittensorwhat is bittensor5 September 2026Bittensor is a decentralized, blockchain-based network that connects artificial intelligence (AI) models across the world into a single, open marketplace. [1] (https://coinmarketcap.com/cmc-ai/bittensor/what-is/)