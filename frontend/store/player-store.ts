"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "@/types/music";
import { MoodPlayer } from "@/lib/mood-player";

type RepeatMode = "off" | "one" | "all";
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;
export type AudioQuality = "low" | "medium" | "high" | "auto";
export type SleepTimer = "off" | "15" | "30" | "45" | "60";

type PlayerState = {
  currentTrack: Track | null;
  queue: Track[];
  recentlyPlayed: Track[];
  likedIds: string[];
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  // Enhanced audio features
  playbackSpeed: PlaybackSpeed;
  audioQuality: AudioQuality;
  crossfadeDuration: number;       // 0–12 seconds
  sleepTimer: SleepTimer;
  sleepTimerEndsAt: number | null; // epoch ms
  bufferedPercent: number;          // 0–100 from HTMLAudioElement.buffered
  // Actions
  setQueue: (tracks: Track[]) => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  play: (track: Track, queue?: Track[]) => void;
  playNext: () => void | Promise<void>;
  playPrevious: () => void;
  togglePlaying: () => void;
  setPlaying: (isPlaying: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (volume: number) => void;
  toggleLike: (id: string) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setAudioQuality: (quality: AudioQuality) => void;
  setCrossfadeDuration: (seconds: number) => void;
  setSleepTimer: (timer: SleepTimer) => void;
  clearSleepTimer: () => void;
  setBufferedPercent: (percent: number) => void;
};

// ---------------------------------------------------------------------------
// Singleton MoodPlayer engine — lives for the lifetime of the app session
// ---------------------------------------------------------------------------
const moodEngine = new MoodPlayer([]);


export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      recentlyPlayed: [],
      likedIds: [],
      isPlaying: false,
      shuffle: false,
      repeat: "off",
      volume: 0.78,
      playbackSpeed: 1,
      audioQuality: "auto",
      crossfadeDuration: 0,
      sleepTimer: "off",
      sleepTimerEndsAt: null,
      bufferedPercent: 0,

      setQueue: (tracks) => set({ queue: tracks }),

      playTrack: (track, queue) =>
        set((state) => ({
          currentTrack: { ...track, streamUrl: track.streamUrl || `/api/stream/${track.id}` },
          queue: queue?.length ? queue : state.queue,
          isPlaying: true,
          recentlyPlayed: [
            track,
            ...state.recentlyPlayed.filter((r) => r.id !== track.id),
          ].slice(0, 20),
          bufferedPercent: 0,
        })),

      // Alias so music-home.tsx can call either play() or playTrack()
      play: (track, queue) => {
        moodEngine.recordPlay(track, 0);  // record start of play
        get().playTrack(track, queue);
      },

      playNext: async () => {
        const { currentTrack, queue, repeat } = get();
        if (!currentTrack) return;

        if (repeat === "one") {
          set({ currentTrack: { ...currentTrack }, isPlaying: true });
          return;
        }

        // Record that the current track ended (full listen = ratio 1.0)
        moodEngine.recordPlay(currentTrack, 1.0);

        // 1. Try the MoodPlayer engine's catalog first (instant, in-memory)
        moodEngine.updateCatalog(queue);
        let nextTrack: Track | null = moodEngine.pickNextSong(currentTrack.id);

        // 2. If engine has nothing or catalog is tiny, fetch fresh mood-matched tracks
        if (!nextTrack) {
          try {
            const mood = moodEngine.getMood();
            // Map mood point to a text query
            let query = "popular songs";
            const { valence, energy } = mood;
            const title  = currentTrack.title.toLowerCase();
            const artist = currentTrack.artist.toLowerCase();
            const isHindi   = ["dil","ishq","pyar","arijit","shreya","jubin","atif","pritam","rahman"].some(k => title.includes(k) || artist.includes(k));
            const isPunjabi = ["jatt","punjabi","diljit","ap dhillon","shubh","moosewala"].some(k => title.includes(k) || artist.includes(k));

            if (valence > 0.65 && energy > 0.65) {
              query = isHindi ? "Bollywood party dance hits" : isPunjabi ? "Punjabi high energy dance" : "upbeat party pop hits";
            } else if (valence > 0.65 && energy <= 0.65) {
              query = isHindi ? "Hindi romantic love songs" : "popular romantic acoustic love songs";
            } else if (valence < 0.4 && energy < 0.4) {
              query = isHindi ? "Hindi sad emotional songs" : "sad melodic songs";
            } else if (energy > 0.7) {
              query = isHindi ? "Bollywood workout motivation" : "workout motivation songs";
            } else {
              query = isHindi ? "Hindi chill lofi relax" : "chill lofi study beats";
            }

            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=25`);
            if (res.ok) {
              const data = await res.json();
              const freshTracks = data.tracks as Track[];
              // Feed new tracks into the engine
              moodEngine.updateCatalog(freshTracks);
              // Append to queue for continuity
              set((state) => ({
                queue: [...state.queue, ...freshTracks.filter((t) => !state.queue.some((q) => q.id === t.id))],
              }));
              nextTrack = moodEngine.pickNextSong(currentTrack.id);
            }
          } catch (e) {
            console.error("[MoodPlayer] fetch failed:", e);
          }
        }

        // 3. Hard fallback: sequential next in queue
        if (!nextTrack && queue.length > 0) {
          const idx = queue.findIndex((t) => t.id === currentTrack.id);
          const next = queue[(idx + 1) % queue.length];
          if (next && next.id !== currentTrack.id) nextTrack = next;
        }

        if (nextTrack) {
          moodEngine.recordPlay(nextTrack, 0);  // record start of next
          get().playTrack(nextTrack);
        } else {
          set({ isPlaying: false });
        }
      },

      playPrevious: () => {
        const { currentTrack, queue } = get();
        if (!currentTrack || queue.length === 0) return;
        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
        const prevTrack = queue[Math.max(currentIndex - 1, 0)];
        if (prevTrack) get().playTrack(prevTrack);
      },

      togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPlaying: (isPlaying) => set({ isPlaying }),
      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      cycleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off",
        })),
      setVolume: (volume) => set({ volume }),
      toggleLike: (id) =>
        set((state) => ({
          likedIds: state.likedIds.includes(id)
            ? state.likedIds.filter((l) => l !== id)
            : [...state.likedIds, id],
        })),

      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      setAudioQuality: (quality) => set({ audioQuality: quality }),
      setCrossfadeDuration: (seconds) =>
        set({ crossfadeDuration: Math.max(0, Math.min(12, seconds)) }),

      setSleepTimer: (timer) => {
        if (timer === "off") {
          set({ sleepTimer: "off", sleepTimerEndsAt: null });
          return;
        }
        const minutes = parseInt(timer, 10);
        const endsAt = Date.now() + minutes * 60 * 1000;
        set({ sleepTimer: timer, sleepTimerEndsAt: endsAt });
      },

      clearSleepTimer: () => set({ sleepTimer: "off", sleepTimerEndsAt: null }),
      setBufferedPercent: (percent) => set({ bufferedPercent: percent }),
    }),
    {
      name: "chillguys-player",
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        recentlyPlayed: state.recentlyPlayed,
        likedIds: state.likedIds,
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        playbackSpeed: state.playbackSpeed,
        audioQuality: state.audioQuality,
        crossfadeDuration: state.crossfadeDuration,
        sleepTimer: state.sleepTimer,
        sleepTimerEndsAt: state.sleepTimerEndsAt,
      }),
    }
  )
);
