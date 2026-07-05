# Personal Music Streaming PWA — Technical Specification

**Status:** Personal-use project after testing will use it for commercial.
**Goal:** Spotify-like PWA — fast, low-RAM, offline-capable, secure by default.

---

## 1. Corrected Architecture Decisions

| Area | Original | Issue | Fix |
|---|---|---|---|
| DB | SQLite on Vercel | Serverless functions are stateless — writes don't persist reliably | Run as a persistent Node server (self-host / VPS / Docker) **or** swap to Turso (libSQL, SQLite-compatible, serverless-safe) |
| Cache | Redis "optional" on Vercel | No local Redis on serverless | Use Upstash Redis (serverless-native) if you want a shared cache; otherwise skip and rely on React Query + IndexedDB |
| Music source | GaanaPy inline | It's a separate self-hosted Python/Docker service | Deploy it independently (Docker container on same host or a small VPS), call it **only** from server-side Route Handlers — never expose its URL to the client |
| Deployment | Vercel | Works fine for the Next.js frontend/API layer, but the DB + GaanaPy service need to live somewhere persistent | Vercel for the app, a small VPS (or Fly.io/Railway) for GaanaPy + DB if you don't self-host everything |

---

## 2. Tech Stack (finalized)

**Frontend:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS · Framer Motion · Zustand (player/UI state) · TanStack Query (server state/caching) · React Hook Form + Zod (validation)

**Backend:** Next.js Route Handlers as a thin proxy/aggregation layer over external APIs — never call third-party APIs directly from the client.

**Data:** Prisma ORM + Turso (libSQL) for serverless-safe persistence, or SQLite directly if self-hosting on a VPS.

**Caching:** TanStack Query (in-memory + stale-while-revalidate) · IndexedDB (offline track metadata, "Downloads") · Upstash Redis (optional, shared server-side cache for search/metadata responses).

**PWA:** `next-pwa` or a hand-rolled Workbox service worker — cache-first for static assets, network-first with fallback for API/metadata, and a dedicated audio cache with a size cap (respect your "Cache Size" setting).

---

## 3. API Layer — Adapter Pattern (swappable sources)

```
/lib/music-sources/
  types.ts            <- MusicSource interface (search, getStream, getMetadata)
  gaanapy.ts           <- implements MusicSource
  index.ts             <- exports the active source, swap via env var
/lib/metadata/
  musicbrainz.ts        <- artist/album metadata
  coverart.ts           <- Cover Art Archive
  lastfm.ts              <- similar artists, tags, artist bios
  genius.ts (optional)   <- lyrics lookup
```

Every source implements the same `MusicSource` interface (`search()`, `getTrack()`, `getStreamUrl()`), so swapping GaanaPy for another backend later means writing one new adapter file — nothing else changes.

**Server-side aggregation:** a Route Handler like `/api/track/[id]` calls GaanaPy for the stream URL *and* MusicBrainz/Last.fm for enriched metadata, merges them, and returns one clean JSON payload to the client. The client never talks to third-party APIs directly.

---

## 4. Security (added — not in your original list)

- **Secrets:** All API keys (Last.fm, Genius) live in server-only env vars (`.env.local`, never `NEXT_PUBLIC_*`). Route Handlers proxy requests so keys never reach the browser.
- **Rate limiting:** Per-IP rate limiting on your Route Handlers (even for personal use — protects against runaway client bugs and respects upstream API limits). Use `@upstash/ratelimit` if you have Redis, or a simple in-memory token bucket if not.
- **Input validation:** Zod-validate every query param (search terms, IDs) before hitting upstream APIs — prevents injection into scraped-API query strings.
- **Sanitization:** Lyrics (Genius) and any HTML-ish metadata must go through `DOMPurify` or be rendered as plain text — never `dangerouslySetInnerHTML` on raw upstream content.
- **CSP:** Strict Content-Security-Policy headers (via `next.config.js` headers) — restrict `connect-src` to your own API routes and known CDN hosts for audio/art.
- **CORS:** GaanaPy service should only accept requests from your Next.js server's IP/origin, not the public internet, if self-hosted separately.
- **Service worker scope:** Never cache API responses containing keys or personal history indefinitely — set explicit TTLs, and exclude `/api/auth*` (if you add auth later) from caching.
- **Dependency hygiene:** `npm audit` / Dependabot on, since scraping-based unofficial APIs change often and pull in third-party packages.

---

## 5. Folder Structure (feature-based)

```
/app                     # Next.js App Router routes
  /(routes)/...
  /api/...                # Route Handlers (proxy/aggregation layer)
/components               # Shared, reusable UI primitives
/features
  /player                 # Player UI + logic
  /search                 # Search UI + debounced query hook
  /library                # Liked songs, albums, playlists
  /lyrics
/hooks                    # Cross-feature hooks (useDebounce, useAudioBuffer)
/lib
  /music-sources           # Adapter pattern (section 3)
  /metadata
  /db                       # Prisma client
/store                     # Zustand stores (player, queue, ui)
/types
/styles
/public
  /sw.js or generated workbox output
prisma/
  schema.prisma
```

---

## 6. Feature Scope (unchanged from your list, organized)

- **Home:** search, trending, recently played, continue listening, favorites, recommended artists, quick mixes, latest albums, mood categories, recently added
- **Search:** instant + debounced, multi-type (songs/albums/artists/playlists), history + suggestions
- **Player:** bottom mini-player + full player, queue, repeat/shuffle/seek/volume, keyboard shortcuts, playback speed, gapless playback, optional crossfade
- **Library:** liked songs, albums, artists, downloads, history, pinned albums
- **Playlists:** create/edit/delete, drag & drop, smart playlists, import/export
- **Lyrics:** real-time + auto-scroll, fullscreen, copy, translate
- **Audio:** adaptive quality (low/medium/high/auto, default balanced), buffer optimization, lazy-load + preload next track
- **Settings:** theme, audio quality, crossfade, cache size, playback speed, notifications, shortcuts, data saver, clear cache
- **Extras:** sleep timer, EQ UI, listening stats (top artists/songs, yearly wrapped)

---

## 7. Performance Targets

- Lighthouse 100/100/100/100 — achieved primarily through: route-level code splitting, `next/image` for art, virtualized lists (song/library views), Suspense boundaries around player/queue, memoized selectors in Zustand, prefetching next-track metadata during current playback.
- Audio buffer strategy: preload only the *next* queued track (not the whole queue), stream in chunks, cap in-memory buffer size to keep RAM low.

---

## 8. Recommended Build Path

Given the scope (30+ features, adapter-pattern API layer, PWA/offline, Prisma schema, dozens of components), I'd build this incrementally rather than in one shot:

1. **Scaffold** — Next.js 15 + TS + Tailwind + Prisma + Zustand + TanStack Query, empty route structure, CI lint/format.
2. **Data layer** — Prisma schema (users*, tracks, playlists, history, favorites) + Turso connection.
3. **Music source adapter** — GaanaPy client + one working end-to-end flow: search → track → stream.
4. **Player core** — audio engine, queue, Zustand store, mini + full player UI.
5. **Metadata enrichment** — MusicBrainz/Cover Art/Last.fm merged into track responses.
6. **Library/playlists/lyrics/settings** — layered on top once the core loop works.
7. **PWA/offline/service worker** — added last, once caching boundaries are stable.

*(*"users" only needed if you ever want multi-device sync — for pure single-device personal use you can skip auth entirely and store everything in local Prisma/IndexedDB.)*

I'd recommend doing the actual multi-file implementation in **Claude Code** — it can scaffold the whole repo, run the dev server, iterate on real files, and test as it goes, which isn't practical inside a chat response for a project this size.
