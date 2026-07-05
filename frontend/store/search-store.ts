"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Search History Store ──────────────────────────────────────────────────────

type SearchHistoryState = {
  history: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearHistory: () => void;
};

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addSearch: (query) =>
        set((state) => ({
          history: [query, ...state.history.filter((h) => h !== query)].slice(0, 15),
        })),
      removeSearch: (query) =>
        set((state) => ({ history: state.history.filter((h) => h !== query) })),
      clearHistory: () => set({ history: [] }),
    }),
    { name: "chillguys-search-history" }
  )
);

// ─── Trending searches (static for now, could be fetched from backend) ────────

export const TRENDING_SEARCHES = [
  "Arijit Singh hits",
  "Bollywood 2024",
  "Lo-Fi study beats",
  "90s Hindi songs",
  "Diljit Dosanjh",
  "Rahman classics",
  "Party anthems",
  "Romantic duets",
  "Workout motivation",
  "Pritam collection",
];
