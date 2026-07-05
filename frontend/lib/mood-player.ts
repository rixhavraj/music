/**
 * mood-player.ts
 * ============================================================================
 * Mood detection + next-song engine.
 *
 * The user's mood is inferred purely from WHAT THEY CHOOSE TO PLAY.
 * Every track has a (valence, energy) position:
 *   - valence: 0 (sad/negative) .. 1 (happy/positive)
 *   - energy:  0 (calm/mellow)  .. 1 (intense/high-energy)
 *
 * Plays are folded into a running "mood point" weighted by:
 *   - RECENCY   → exponential time-decay, recent songs matter far more
 *   - COMPLETION → full listens = strong vote; early skips = weak vote
 *
 * Next song is chosen by softmax-weighted random sampling of candidates
 * scored against the current mood point — not always #1, not pure random.
 * ============================================================================
 */

import type { Track as AppTrack } from "@/types/music";

// ---------------------------------------------------------------------------
// INTERNAL TRACK FORMAT (maps from AppTrack)
// ---------------------------------------------------------------------------

export interface MoodTrack {
  id: string;
  title: string;
  artist: string;
  valence: number;   // 0..1  derived from mood/metadata
  energy: number;    // 0..1  derived from mood/metadata
  durationSec: number;
  original: AppTrack;
}

interface PlayRecord {
  track: MoodTrack;
  playedAt: number;       // Date.now() timestamp
  playedRatio: number;    // 0..1 — how much was played
}

export interface MoodPoint {
  valence: number;
  energy: number;
  label: string;          // human-readable label derived from position
}

// ---------------------------------------------------------------------------
// MOOD → (valence, energy) MAP
// Derived from standard Spotify audio feature research.
// ---------------------------------------------------------------------------

const MOOD_VE: Record<string, { valence: number; energy: number }> = {
  happy:     { valence: 0.88, energy: 0.72 },
  party:     { valence: 0.80, energy: 0.90 },
  energetic: { valence: 0.65, energy: 0.92 },
  travel:    { valence: 0.70, energy: 0.70 },
  romantic:  { valence: 0.72, energy: 0.45 },
  focus:     { valence: 0.55, energy: 0.40 },
  calm:      { valence: 0.58, energy: 0.22 },
  rainy:     { valence: 0.40, energy: 0.18 },
  sad:       { valence: 0.18, energy: 0.25 },
  sleep:     { valence: 0.45, energy: 0.08 },
};

const DEFAULT_VE = { valence: 0.5, energy: 0.5 };

// ---------------------------------------------------------------------------
// TUNABLE CONSTANTS
// ---------------------------------------------------------------------------

const HALF_LIFE_MS        = 15 * 60 * 1000;        // 15-min recency half-life
const HISTORY_WINDOW_MS   = 2 * 60 * 60 * 1000;    // ignore plays > 2 hrs ago
const MAX_HISTORY_LENGTH  = 40;
const SHUFFLE_TEMPERATURE = 0.35;                   // 0 = strict, 1 = random

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function softmax(scores: number[], temperature: number): number[] {
  const t = Math.max(0.05, temperature);
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp((s - max) / t));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function weightedRandomPick<T>(items: T[], weights: number[]): T {
  let r = Math.random();
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Derive a mood keyword from the app Track's fields. */
function inferMoodKeyword(track: AppTrack): string {
  if (track.mood && track.mood !== "Streaming" && track.mood !== "") {
    return track.mood.toLowerCase();
  }

  const text = `${track.title} ${track.artist} ${track.album}`.toLowerCase();

  const MOOD_KEYWORDS: Record<string, string[]> = {
    happy:     ["happy", "upbeat", "cheerful", "joyful", "sunshine"],
    party:     ["party", "edm", "dance", "club", "hip hop", "bass"],
    energetic: ["workout", "gym", "power", "motivation", "running", "energetic"],
    romantic:  ["romantic", "love", "bollywood love", "date night", "romance",
                "dil", "ishq", "pyar", "prem"],
    calm:      ["calm", "relax", "chill", "lofi", "peaceful", "ambient"],
    focus:     ["focus", "study", "concentration", "instrumental", "work"],
    sleep:     ["sleep", "lullaby", "night", "meditation"],
    sad:       ["sad", "melancholy", "heartbreak", "emotional", "blue"],
    rainy:     ["rainy", "rain", "monsoon", "cozy", "acoustic"],
    travel:    ["travel", "road trip", "adventure", "punjabi", "dhol"],
  };

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return mood;
  }

  // Stable hash fallback
  const keys = Object.keys(MOOD_KEYWORDS);
  let hash = 0;
  for (let i = 0; i < track.id.length; i++) {
    hash = track.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return keys[Math.abs(hash) % keys.length];
}

/** Convert an AppTrack into a MoodTrack with derived valence/energy. */
export function toMoodTrack(track: AppTrack): MoodTrack {
  const moodKey = inferMoodKeyword(track);
  const ve = MOOD_VE[moodKey] ?? DEFAULT_VE;
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    valence: ve.valence,
    energy: ve.energy,
    durationSec: track.duration || 210,
    original: track,
  };
}

/** Map a (valence, energy) point to a human-readable mood label. */
function moodLabel(valence: number, energy: number): string {
  if (valence > 0.65 && energy > 0.65) return "Energetic & Happy";
  if (valence > 0.65 && energy <= 0.65) return "Calm & Positive";
  if (valence <= 0.65 && energy > 0.65) return "Intense";
  if (valence < 0.35 && energy < 0.35) return "Melancholy";
  if (valence < 0.35) return "Reflective";
  return "Balanced";
}

// ---------------------------------------------------------------------------
// ENGINE
// ---------------------------------------------------------------------------

export class MoodPlayer {
  private catalog: MoodTrack[];
  private history: PlayRecord[] = [];

  constructor(catalog: AppTrack[]) {
    this.catalog = catalog.map(toMoodTrack);
  }

  /** Update the catalog (e.g. when new tracks are loaded from the API). */
  updateCatalog(tracks: AppTrack[]): void {
    const existing = new Set(this.catalog.map((t) => t.id));
    for (const t of tracks) {
      if (!existing.has(t.id)) {
        this.catalog.push(toMoodTrack(t));
        existing.add(t.id);
      }
    }
  }

  /**
   * Call whenever a track starts, ends, or is skipped.
   * @param track       The AppTrack that was played.
   * @param playedRatio 0..1 — fraction of track played (use 0 on start,
   *                    actualSecs/duration on end/skip).
   */
  recordPlay(track: AppTrack, playedRatio: number): void {
    const mt = toMoodTrack(track);
    this.history.unshift({ track: mt, playedAt: Date.now(), playedRatio: clamp01(playedRatio) });
    if (this.history.length > MAX_HISTORY_LENGTH) this.history.pop();
  }

  /**
   * Returns the currently inferred mood point from recent listening history.
   */
  getMood(): MoodPoint {
    const now = Date.now();
    const relevant = this.history.filter((r) => now - r.playedAt <= HISTORY_WINDOW_MS);

    if (relevant.length === 0) return { valence: 0.5, energy: 0.5, label: "Balanced" };

    let vSum = 0, eSum = 0, wSum = 0;

    for (const rec of relevant) {
      const ageMs = now - rec.playedAt;
      const recencyWeight = Math.pow(0.5, ageMs / HALF_LIFE_MS);
      // Early skips (< 15 %) are weak signals; full listens are strong
      const engagementWeight = rec.playedRatio < 0.15 ? 0.15 : rec.playedRatio;
      const weight = recencyWeight * engagementWeight;
      vSum += rec.track.valence * weight;
      eSum += rec.track.energy * weight;
      wSum += weight;
    }

    if (wSum === 0) return { valence: 0.5, energy: 0.5, label: "Balanced" };

    const valence = clamp01(vSum / wSum);
    const energy  = clamp01(eSum / wSum);
    return { valence, energy, label: moodLabel(valence, energy) };
  }

  /**
   * Pick the next song via softmax-weighted random sampling toward the
   * current inferred mood.  Never returns the currently-playing track.
   * Returns the original AppTrack (not the internal MoodTrack).
   */
  pickNextSong(excludeTrackId?: string): AppTrack | null {
    const mood = this.getMood();
    const recentIds = this.history.slice(0, 8).map((r) => r.track.id);

    const candidates = this.catalog.filter((t) => t.id !== excludeTrackId);
    if (candidates.length === 0) return null;

    const scores  = candidates.map((t) => this.scoreTrack(t, mood, recentIds));
    const weights = softmax(scores, SHUFFLE_TEMPERATURE);
    return weightedRandomPick(candidates, weights).original;
  }

  private scoreTrack(track: MoodTrack, mood: MoodPoint, recentIds: string[]): number {
    const dv = track.valence - mood.valence;
    const de = track.energy  - mood.energy;
    const moodDistance = Math.sqrt(dv * dv + de * de);  // 0 = perfect match

    const recentIdx    = recentIds.indexOf(track.id);
    const repeatPenalty = recentIdx === -1 ? 0 : 1 - recentIdx / recentIds.length;

    return -1.5 * moodDistance - 1.0 * repeatPenalty;
  }
}
