# Personal Music PWA

This folder implements the first working slice from `music-pwa-spec.md`: a Next.js App Router PWA with a music source adapter, server-side API proxy routes, searchable demo catalog, player state, settings, local artwork, and installable PWA assets.

## Run

```bash
pnpm install
pnpm dev
```

The default source is `mock`, so the app runs without external services. To connect GaanaPy later, copy `.env.example` to `.env.local`, set `MUSIC_SOURCE=gaanapy`, and configure `GAANAPY_URL`.

## Verify

```bash
pnpm exec tsc --noEmit
pnpm build
```
