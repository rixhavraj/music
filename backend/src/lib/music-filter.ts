import type { Track } from "../types/music";

const AI_PATTERNS = [
  /\bai\b/i,
  /ai\s+made/i,
  /ai-made/i,
  /ai\s+remix/i,
  /ai-remix/i,
  /ai\s+generated/i,
  /ai-generated/i,
  /ai\s+cover/i,
  /ai-cover/i,
  /suno/i,
  /udio/i,
  /voicify/i,
  /rvc/i,
  /so-vits-svc/i,
  /diff-svc/i,
  /artificial\s+intelligence/i
];

const NON_ORIGINAL_PATTERNS = [
  /\bremix\b/i,
  /\breworks?\b/i,
  /\bbootlegs?\b/i,
  /\bflips?\b/i,
  /\bedits?\b/i,
  /\bmashups?\b/i,
  /\bcovers?\b/i,
  /\bslowed\b/i,
  /\breverb\b/i,
  /\bsped\s+up\b/i,
  /\bspeed\s+up\b/i,
  /\bbass\s+boosted\b/i,
  /\bnightcore\b/i,
  /\bdaycore\b/i,
  /lofi\s+version/i,
  /lo-fi\s+version/i
];

/**
 * Checks if a track is original, non-AI, and not modified (no speed up, slowed, reverb, cover, remix, etc.).
 * Allows original lofi and normal music.
 */
export function isOriginalTrack(track: Track): boolean {
  const fields = [
    track.title || "",
    track.artist || "",
    track.album || "",
    track.mood || ""
  ];

  for (const field of fields) {
    const value = field.toLowerCase();
    
    // Check AI patterns
    for (const pattern of AI_PATTERNS) {
      if (pattern.test(value)) {
        return false;
      }
    }

    // Check non-original / modified patterns
    for (const pattern of NON_ORIGINAL_PATTERNS) {
      if (pattern.test(value)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Filters an array of tracks to keep only original tracks.
 */
export function filterOriginalTracks(tracks: Track[]): Track[] {
  return tracks.filter(isOriginalTrack);
}
