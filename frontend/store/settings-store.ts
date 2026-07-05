"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AudioQuality } from "@/types/music";

type SettingsState = {
  quality: AudioQuality;
  crossfade: number;
  cacheSizeMb: number;
  playbackSpeed: number;
  dataSaver: boolean;
  notifications: boolean;
  setQuality: (quality: AudioQuality) => void;
  setCrossfade: (crossfade: number) => void;
  setCacheSize: (cacheSizeMb: number) => void;
  setPlaybackSpeed: (playbackSpeed: number) => void;
  toggleDataSaver: () => void;
  toggleNotifications: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      quality: "balanced",
      crossfade: 2,
      cacheSizeMb: 512,
      playbackSpeed: 1,
      dataSaver: false,
      notifications: false,
      setQuality: (quality) => set({ quality }),
      setCrossfade: (crossfade) => set({ crossfade }),
      setCacheSize: (cacheSizeMb) => set({ cacheSizeMb }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      toggleDataSaver: () => set((state) => ({ dataSaver: !state.dataSaver })),
      toggleNotifications: () => set((state) => ({ notifications: !state.notifications }))
    }),
    { name: "music-pwa-settings" }
  )
);
