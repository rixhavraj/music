"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Library,
  Plus,
  ArrowRight,
  List,
  ChevronLeft,
  ChevronRight,
  Bell,
  Users,
  Play,
  Pause,
  Check,
  Settings,
  Heart,
  Mic2,
  Radio,
  Coffee,
  Moon,
  Zap,
  Smile,
  MoreHorizontal,
  Flame,
  Shuffle,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlayerShell } from "@/features/player/player-shell";
import { usePlayerStore } from "@/store/player-store";
import { TrackArt } from "@/components/track-art";
import { SearchPanelV2 } from "@/features/search/search-panel-v2";
import { SettingsPanelV2 } from "@/features/settings/settings-panel-v2";
import type { Track } from "@/types/music";

type AppView = "home" | "search" | "settings" | "library" | "hotlist";

// ─── Mood definitions ──────────────────────────────────────────────────────────

const MOODS = [
  { id: "happy",     label: "Happy",     icon: Smile,  color: "#f9a825", query: "happy upbeat songs" },
  { id: "calm",      label: "Chill",     icon: Coffee, color: "#29b6f6", query: "chill lofi relax" },
  { id: "energetic", label: "Energetic", icon: Zap,    color: "#ef5350", query: "workout gym motivation" },
  { id: "focus",     label: "Focus",     icon: Mic2,   color: "#66bb6a", query: "study focus instrumental" },
  { id: "romantic",  label: "Romantic",  icon: Heart,  color: "#ec407a", query: "romantic love bollywood" },
  { id: "sleep",     label: "Sleep",     icon: Moon,   color: "#7e57c2", query: "sleep calm meditation" },
  { id: "party",     label: "Party",     icon: Zap,    color: "#ff7043", query: "party edm dance" },
  { id: "travel",    label: "Travel",    icon: Radio,  color: "#26a69a", query: "road trip travel songs" },
];

// ─── Dynamic color extraction (simple dominant color from cover hue) ───────────
function hashColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 25%)`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function MusicHome() {
  const {
    playTrack,
    setQueue,
    recentlyPlayed,
    likedIds,
    currentTrack,
    isPlaying,
    togglePlaying,
  } = usePlayerStore();

  const [appView, setAppView] = useState<AppView>("home");
  const [selectedPlaylist, setSelectedPlaylist] = useState<typeof playlistList[number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"music" | "mood">("music");
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [dynamicBg, setDynamicBg] = useState("hsl(210, 30%, 8%)");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dynamic background color from current track
  useEffect(() => {
    if (currentTrack) {
      const color = hashColorFromString(currentTrack.title + currentTrack.artist);
      setDynamicBg(color);
    }
  }, [currentTrack]);

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const trendingQuery = useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const res = await fetch("/api/search?q=Trending%20Hindi%20Songs&limit=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.tracks as Track[];
    },
  });

  const searchQueryResult = useQuery({
    queryKey: ["search", debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}&limit=20`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      return data.tracks as Track[];
    },
    enabled: debouncedSearch.length > 0,
  });

  const moodQuery = useQuery({
    queryKey: ["mood", activeMood],
    queryFn: async () => {
      if (!activeMood) return [];
      const mood = MOODS.find((m) => m.id === activeMood)!;
      const res = await fetch(`/api/search?q=${encodeURIComponent(mood.query)}&limit=20`);
      if (!res.ok) throw new Error("Mood fetch failed");
      const data = await res.json();
      return data.tracks as Track[];
    },
    enabled: !!activeMood,
  });

  const tracks = trendingQuery.data || [];
  const searchTracks = searchQueryResult.data || [];
  const moodTracks = moodQuery.data || [];

  const likedTracks = useMemo(
    () => tracks.filter((t) => likedIds.includes(t.id)),
    [likedIds, tracks]
  );

  const playlistList = useMemo(() => [
    {
      id: "favs",
      name: "Liked Songs",
      desc: `Playlist • ${likedIds.length} songs`,
      tracks: likedTracks,
      cover: likedTracks[0]?.cover || tracks[0]?.cover,
      gradient: "from-[#4a1a6a] to-[#282828]",
    },
    {
      id: "90s",
      name: "90s Love",
      desc: "Playlist • rishav",
      tracks: tracks.slice(2, 8),
      cover: tracks[2]?.cover,
      gradient: "from-[#1a3a6a] to-[#282828]",
    },
    {
      id: "delhi",
      name: "Delhi Se Manali",
      desc: "Playlist • rishav",
      tracks: tracks.slice(0, 5),
      cover: tracks[0]?.cover,
      gradient: "from-[#1a5a3a] to-[#282828]",
    },
    {
      id: "majboor",
      name: "Majboor",
      desc: "Playlist • rishav",
      tracks: tracks.slice(4, 9),
      cover: tracks[4]?.cover,
      gradient: "from-[#5a3a1a] to-[#282828]",
    },
  ], [likedIds.length, likedTracks, tracks]);

  // Recommendation categories (from trending tracks re-sliced)
  const categories = useMemo(() => [
    { id: "daily-mix",    name: "Daily Mix",        emoji: "🎵", tracks: [...tracks].sort(() => Math.random() - 0.5).slice(0, 15) },
    { id: "discover",     name: "Discover Weekly",  emoji: "🔭", tracks: tracks.slice(5, 18) },
    { id: "chill",        name: "Chill Mix",        emoji: "😌", tracks: tracks.slice(0, 12) },
    { id: "trending",     name: "Trending Now",     emoji: "🔥", tracks: tracks.slice(0, 15) },
  ], [tracks]);

  function play(track: Track, queueList: Track[] = []) {
    const q = queueList.length > 0 ? queueList : tracks;
    setQueue(q);
    playTrack(track, q);
  }

  const rightSidebarTrack = currentTrack || tracks[0];

  // What's displayed in the main panel
  const displayedTracks = debouncedSearch.length > 0
    ? searchTracks
    : activeMood
      ? moodTracks
      : tracks;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black font-sans text-white select-none">
      <div className="flex flex-1 overflow-hidden p-2 gap-2">

        {/* ── Left Sidebar ──────────────────────────────────────────────── */}
        <aside className="hidden md:flex w-[280px] shrink-0 flex-col gap-2 overflow-hidden">

          {/* Nav Card */}
          <div className="rounded-lg bg-[#121212] p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-2">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.076-.67-.135-.746-.472-.076-.336.135-.67.472-.746 3.854-.88 7.15-.506 9.822 1.13.295.18.387.565.206.863zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.666-1.112 8.232-.57 11.345 1.346.367.227.488.708.26 1.07zm.106-2.833C14.737 8.98 9.3 8.8 6.13 9.76c-.49.15-.99-.13-1.14-.62-.15-.49.13-.99.62-1.14C9.17 6.91 15.16 7.12 18.9 9.35c.44.26.59.83.33 1.27-.26.44-.83.59-1.27.33z"/>
              </svg>
              <span>ChillGuys</span>
            </div>

            <button
              onClick={() => { setAppView("home"); setSearchQuery(""); setActiveMood(null); setSelectedPlaylist(null); }}
              className={`flex items-center gap-5 transition font-bold ${
                appView === "home" ? "text-white" : "text-gray-300 hover:text-white"
              }`}
            >
              <Home size={22} />
              <span>Home</span>
            </button>

            <button
              onClick={() => { setAppView("search"); setSelectedPlaylist(null); }}
              className={`flex items-center gap-5 transition font-bold ${
                appView === "search" ? "text-white" : "text-gray-300 hover:text-white"
              }`}
            >
              <Search size={22} />
              <span>Search</span>
            </button>

            <button
              onClick={() => { setAppView("library"); setSelectedPlaylist(null); }}
              className={`flex items-center gap-5 transition font-bold ${
                appView === "library" ? "text-white" : "text-gray-300 hover:text-white"
              }`}
            >
              <Library size={22} />
              <span>Library</span>
            </button>

            <button
              onClick={() => { setAppView("settings"); setSelectedPlaylist(null); }}
              className={`flex items-center gap-5 transition font-bold ${
                appView === "settings" ? "text-white" : "text-gray-300 hover:text-white"
              }`}
            >
              <Settings size={22} />
              <span>Settings</span>
            </button>
          </div>

          {/* Library Card */}
          <div className="flex-1 rounded-lg bg-[#121212] overflow-hidden flex flex-col">
            <div className="p-4 flex items-center justify-between text-gray-400 font-bold">
              <button
                onClick={() => { setAppView("library"); setSelectedPlaylist(null); }}
                className="flex items-center gap-2 hover:text-white transition"
              >
                <Library size={22} />
                <span>Your Library</span>
              </button>
              <div className="flex items-center gap-3">
                <button className="hover:text-white transition rounded-full hover:bg-white/5 p-1"><Plus size={18} /></button>
                <button className="hover:text-white transition rounded-full hover:bg-white/5 p-1"><ArrowRight size={18} /></button>
              </div>
            </div>

            <div className="px-4 pb-2 flex gap-2">
              <span
                onClick={() => { setAppView("library"); setSelectedPlaylist(null); }}
                className="bg-[#2a2a2a] hover:bg-[#323232] transition text-white px-3 py-1 rounded-full text-xs font-semibold cursor-pointer"
              >
                Playlists
              </span>
            </div>

            <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-400 font-semibold border-b border-white/5">
              <button className="hover:text-white flex items-center gap-1"><Search size={14} /></button>
              <button className="hover:text-white flex items-center gap-1">Recents <List size={14} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1">
              {playlistList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedPlaylist(item); setAppView("library"); }}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] transition text-left w-full group"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-[#282828] relative">
                    <TrackArt src={item.cover} alt={item.name} size={48} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play size={16} className="fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-sm group-hover:text-[#1db954] transition">{item.name}</p>
                    <p className="truncate text-xs text-[#b3b3b3]">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Middle Content ─────────────────────────────────────────────── */}
        <main
          className="flex-1 rounded-lg overflow-y-auto flex flex-col relative transition-all duration-700"
          style={{
            background: `linear-gradient(180deg, ${dynamicBg} 0%, #121212 35%)`,
          }}
        >
          {/* Header */}
          <header className="sticky top-0 bg-transparent backdrop-blur-md z-10 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-black/50 hover:bg-black/70 transition rounded-full px-4 py-2 flex items-center gap-2 w-[340px] border border-transparent focus-within:border-white/50">
                <Search size={18} className="text-[#b3b3b3]" />
                <input
                  type="text"
                  placeholder="What do you want to play?"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setActiveMood(null); }}
                  className="bg-transparent text-sm w-full outline-none text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:scale-105 transition text-gray-300 hover:text-white">
                <Bell size={18} />
              </button>
              <button className="h-8 w-8 rounded-full bg-black/50 flex items-center justify-center hover:scale-105 transition text-gray-300 hover:text-white">
                <Users size={18} />
              </button>
              <div className="h-8 w-8 rounded-full bg-[#3d3d3d] cursor-pointer hover:scale-105 transition flex items-center justify-center text-xs font-bold">
                R
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="px-4 md:px-6 pb-40 flex flex-col gap-6">

            {/* View-specific content */}
            {appView === "search" ? (
              <SearchPanelV2 onPlay={(track, queue) => play(track, queue || tracks)} />
            ) : appView === "settings" ? (
              <SettingsPanelV2 />
            ) : appView === "library" ? (
              /* ── Library View ─────────────────────────────────────────── */
              selectedPlaylist ? (
                /* Playlist detail screen matching mockup */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* Playlist detail header layout */}
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <button
                      onClick={() => setSelectedPlaylist(null)}
                      className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 transition flex items-center justify-center text-white"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="font-semibold text-white">Playlist</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
                    <div className="w-48 h-48 rounded-[24px] overflow-hidden shadow-2xl bg-[#282828] relative shrink-0">
                      <TrackArt src={selectedPlaylist.cover} alt={selectedPlaylist.name} size={192} />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 text-center sm:text-left">
                      <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                        {selectedPlaylist.id === "favs" ? "Collection" : "Playlist"}
                      </span>
                      <h2 className="text-3xl font-extrabold text-white truncate drop-shadow-md">
                        {selectedPlaylist.name}
                      </h2>
                      <p className="text-xs text-white/60 mt-1">
                        {selectedPlaylist.desc}
                      </p>
                    </div>
                  </div>

                  {/* Play & Shuffle buttons side by side */}
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => selectedPlaylist.tracks.length > 0 && play(selectedPlaylist.tracks[0], selectedPlaylist.tracks)}
                      disabled={selectedPlaylist.tracks.length === 0}
                      className="flex-1 sm:flex-initial h-12 px-8 rounded-full bg-white text-black font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition shadow-lg disabled:opacity-50"
                    >
                      <Play size={18} className="fill-black text-black ml-0.5" />
                      Play
                    </button>
                    <button
                      onClick={() => {
                        if (selectedPlaylist.tracks.length > 0) {
                          const { toggleShuffle } = usePlayerStore.getState();
                          toggleShuffle();
                          play(selectedPlaylist.tracks[Math.floor(Math.random() * selectedPlaylist.tracks.length)], selectedPlaylist.tracks);
                        }
                      }}
                      disabled={selectedPlaylist.tracks.length === 0}
                      className="flex-1 sm:flex-initial h-12 px-8 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition backdrop-blur-md disabled:opacity-50"
                    >
                      <Shuffle size={16} />
                      Shuffle
                    </button>
                  </div>

                  {/* Tracklist layout */}
                  <div className="flex flex-col mt-4 divide-y divide-white/5">
                    {selectedPlaylist.tracks.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 text-sm">
                        No songs in this playlist. Start liking tracks to build your library!
                      </div>
                    ) : (
                      selectedPlaylist.tracks.map((track, i) => {
                        const isCurrent = currentTrack?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            onClick={() => play(track, selectedPlaylist.tracks)}
                            className={`flex items-center gap-4 py-3 px-2 rounded-xl cursor-pointer hover:bg-white/5 group transition ${isCurrent ? "bg-white/5" : ""}`}
                          >
                            <div className="w-6 text-center text-xs font-semibold text-gray-500">
                              {isCurrent && isPlaying ? (
                                <div className="flex justify-center items-end gap-0.5 h-3.5 w-full">
                                  <div className="w-0.5 bg-[#f5c842] animate-[bounce_0.8s_infinite_100ms]" style={{ height: "60%" }} />
                                  <div className="w-0.5 bg-[#f5c842] animate-[bounce_0.8s_infinite_300ms]" style={{ height: "100%" }} />
                                  <div className="w-0.5 bg-[#f5c842] animate-[bounce_0.8s_infinite_500ms]" style={{ height: "40%" }} />
                                </div>
                              ) : (
                                String(i + 1).padStart(2, "0")
                              )}
                            </div>
                            <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-[#282828]">
                              <TrackArt src={track.cover} alt={track.title} size={44} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className={`truncate font-semibold text-sm transition ${isCurrent ? "text-[#f5c842]" : "text-white"}`}>
                                {track.title}
                              </h4>
                              <p className="truncate text-xs text-gray-400 mt-0.5">{track.artist}</p>
                            </div>
                            <span className="text-xs text-gray-500 font-medium tabular-nums hidden sm:block shrink-0">
                              {formatDuration(track.duration)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="text-gray-500 hover:text-white transition p-1.5"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              ) : (
                /* Grid of playlists */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-6"
                >
                  <h3 className="font-bold text-2xl">Playlists</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {playlistList.map((playlist) => (
                      <div
                        key={playlist.id}
                        onClick={() => setSelectedPlaylist(playlist)}
                        className="relative aspect-[3/4] h-[340px] rounded-[24px] overflow-hidden cursor-pointer group shadow-xl transition-transform duration-300 hover:scale-[1.02]"
                      >
                        <div className="absolute inset-0 w-full h-full">
                          <TrackArt src={playlist.cover} alt={playlist.name} size={340} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1.5 block">
                              Playlist
                            </span>
                            <h4 className="font-extrabold text-base text-white truncate line-clamp-1 mb-1 drop-shadow-md">
                              {playlist.name}
                            </h4>
                            <p className="text-xs text-white/50 line-clamp-2 leading-relaxed drop-shadow-sm">
                              {playlist.desc}
                            </p>
                          </div>
                          <div className="h-11 w-11 rounded-full bg-white text-black shadow-lg flex items-center justify-center transition shrink-0 hover:scale-110 active:scale-95">
                            <Play size={16} className="fill-black text-black ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            ) : appView === "hotlist" ? (
              /* ── Hotlist View ─────────────────────────────────────────── */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <Flame size={24} className="fill-current" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl">Hotlist</h3>
                    <p className="text-sm text-gray-400">Trending tracks and popular hits updated hourly</p>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-white/5">
                  {tracks.slice(0, 15).map((track, i) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => play(track, tracks)}
                        className={`flex items-center gap-4 py-3 px-2 rounded-xl cursor-pointer hover:bg-white/5 group transition ${isCurrent ? "bg-white/5" : ""}`}
                      >
                        <div className="w-6 text-center text-xs font-semibold text-gray-500">
                          {isCurrent && isPlaying ? (
                            <div className="flex justify-center items-end gap-0.5 h-3.5 w-full">
                              <div className="w-0.5 bg-[#f5c842] animate-[bounce_0.8s_infinite_100ms]" style={{ height: "60%" }} />
                              <div className="w-0.5 bg-[#f5c842] animate-[bounce_0.8s_infinite_300ms]" style={{ height: "100%" }} />
                              <div className="w-0.5 bg-[#f5c842] animate-[bounce_0.8s_infinite_500ms]" style={{ height: "40%" }} />
                            </div>
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </div>
                        <div className="h-11 w-11 rounded-lg overflow-hidden shrink-0 bg-[#282828]">
                          <TrackArt src={track.cover} alt={track.title} size={44} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`truncate font-semibold text-sm transition ${isCurrent ? "text-[#f5c842]" : "text-white"}`}>
                            {track.title}
                          </h4>
                          <p className="truncate text-xs text-gray-400 mt-0.5">{track.artist} · {track.album}</p>
                        </div>
                        <span className="text-xs text-gray-500 font-medium tabular-nums hidden sm:block shrink-0">
                          {formatDuration(track.duration)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="text-gray-500 hover:text-white transition p-1.5"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <>
                {/* Category Tabs */}
                <div className="flex gap-2">
                  {(["music", "mood"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-full text-sm font-bold transition capitalize ${
                        activeTab === tab ? "bg-white text-black" : "bg-[#232323] hover:bg-[#2a2a2a] text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

            <AnimatePresence mode="wait">
              {debouncedSearch.length > 0 ? (
                /* ── Search Results ─────────────────────────────────────── */
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-bold text-xl mb-4">
                    Results for &ldquo;{debouncedSearch}&rdquo;
                  </h3>
                  {searchQueryResult.isLoading ? (
                    <div className="grid gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded bg-white/5" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {searchTracks.map((track, i) => (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => play(track, searchTracks)}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 cursor-pointer transition group"
                        >
                          <span className="w-5 text-center text-xs text-gray-500 group-hover:hidden">{i + 1}</span>
                          <Play size={14} className="fill-white text-white hidden group-hover:block shrink-0" />
                          <div className="h-12 w-12 shrink-0 rounded overflow-hidden bg-[#282828]">
                            <TrackArt src={track.cover} alt={track.title} size={48} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="truncate font-semibold text-sm group-hover:text-[#1db954] transition">{track.title}</h5>
                            <p className="truncate text-xs text-[#b3b3b3]">{track.artist} · {track.album}</p>
                          </div>
                          {track.mood && (
                            <span className="bg-white/10 text-xs text-gray-300 px-2 py-0.5 rounded-full capitalize shrink-0">{track.mood}</span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

              ) : activeMood ? (
                /* ── Mood Playlist ──────────────────────────────────────── */
                <motion.div
                  key={`mood-${activeMood}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {(() => {
                    const mood = MOODS.find((m) => m.id === activeMood)!;
                    const Icon = mood.icon;
                    return (
                      <>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: mood.color }}>
                            <Icon size={22} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-2xl">{mood.label} Mix</h3>
                            <p className="text-sm text-gray-400">Music to match your mood</p>
                          </div>
                          <button
                            onClick={() => setActiveMood(null)}
                            className="ml-auto text-xs text-gray-400 hover:text-white border border-white/20 hover:border-white px-3 py-1 rounded-full transition"
                          >
                            ✕ Close
                          </button>
                        </div>
                        {moodQuery.isLoading ? (
                          <div className="grid gap-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div key={i} className="h-16 animate-pulse rounded bg-white/5" />
                            ))}
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {moodTracks.map((track, i) => (
                              <motion.div
                                key={track.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => play(track, moodTracks)}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 cursor-pointer transition group"
                              >
                                <span className="w-5 text-center text-xs text-gray-500 group-hover:hidden">{i + 1}</span>
                                <Play size={14} className="fill-white text-white hidden group-hover:block shrink-0" />
                                <div className="h-12 w-12 shrink-0 rounded overflow-hidden bg-[#282828]">
                                  <TrackArt src={track.cover} alt={track.title} size={48} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="truncate font-semibold text-sm group-hover:text-[#1db954] transition">{track.title}</h5>
                                  <p className="truncate text-xs text-[#b3b3b3]">{track.artist}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.div>

              ) : (
                /* ── Home Dashboard ─────────────────────────────────────── */
                <motion.div
                  key="home"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* Playlists Section */}
                  {activeTab === "music" && (
                    <div>
                      <h3 className="font-bold text-xl mb-4">Your Playlists</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {playlistList.map((playlist) => (
                          <div
                            key={playlist.id}
                            onClick={() => playlist.tracks.length > 0 && play(playlist.tracks[0], playlist.tracks)}
                            className="relative aspect-[3/4] h-[340px] rounded-[24px] overflow-hidden cursor-pointer group shadow-xl transition-transform duration-300 hover:scale-[1.02]"
                          >
                            {/* Full-bleed background cover */}
                            <div className="absolute inset-0 w-full h-full">
                              <TrackArt src={playlist.cover} alt={playlist.name} size={340} />
                            </div>

                            {/* Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                            {/* Translucent Menu Button (Top Right) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {/* Info overlay & Play Button (Bottom) */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1.5 block">
                                  Playlist
                                </span>
                                <h4 className="font-extrabold text-base text-white truncate line-clamp-1 mb-1 drop-shadow-md">
                                  {playlist.name}
                                </h4>
                                <p className="text-xs text-white/50 line-clamp-2 leading-relaxed drop-shadow-sm">
                                  {playlist.desc}
                                </p>
                              </div>

                              {/* Play Button (Bottom Right) */}
                              <div className="h-11 w-11 rounded-full bg-white text-black shadow-lg flex items-center justify-center transition shrink-0 hover:scale-110 active:scale-95">
                                <Play size={16} className="fill-black text-black ml-0.5" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mood Selector */}
                  {activeTab === "mood" && (
                    <div>
                      <h3 className="font-bold text-xl mb-4">Mood</h3>
                      <div className="grid grid-cols-4 gap-3">
                        {MOODS.map((mood) => {
                          const Icon = mood.icon;
                          return (
                            <button
                              key={mood.id}
                              onClick={() => setActiveMood(mood.id)}
                              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:brightness-110 transition cursor-pointer group relative overflow-hidden"
                              style={{ background: `${mood.color}22`, border: `1px solid ${mood.color}44` }}
                            >
                              <div
                                className="h-10 w-10 rounded-full flex items-center justify-center transition group-hover:scale-110"
                                style={{ background: mood.color }}
                              >
                                <Icon size={18} className="text-white" />
                              </div>
                              <span className="text-xs font-semibold text-white">{mood.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}



                  {/* Recommendation category rows */}
                  {activeTab === "music" && categories.map((cat) => (
                    <div key={cat.id}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl">
                          <span className="mr-2">{cat.emoji}</span>
                          {cat.name}
                        </h3>
                        <button className="text-xs text-gray-400 hover:underline hover:text-white transition">Show all</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
                        {cat.tracks.slice(0, 5).map((track) => (
                          <div
                            key={track.id}
                            onClick={() => play(track, cat.tracks)}
                            className="bg-[#fafafa] hover:bg-white text-black p-3 pb-6 rounded-sm cursor-pointer group flex flex-col gap-3 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                            style={{ border: "1px solid #e2e2e2" }}
                          >
                            {/* Polaroid Square Photo Container */}
                            <div className="aspect-square w-full overflow-hidden relative bg-[#282828] border border-black/5">
                              <TrackArt src={track.cover} alt={track.title} size={150} />
                              
                              {/* Overlay Play Button on hover */}
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center shadow-md scale-90 group-hover:scale-100 transition duration-300">
                                  <Play size={18} className="fill-black text-black ml-0.5" />
                                </div>
                              </div>
                            </div>

                            {/* Polaroid bottom caption area */}
                            <div className="min-w-0 text-center px-1">
                              <h4 className="truncate font-bold text-xs text-gray-900 font-sans tracking-wide">
                                {track.title}
                              </h4>
                              <p className="truncate text-[10px] text-gray-500 font-medium mt-1 font-mono italic">
                                {track.artist}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* New Release Feature Card */}
                  {activeTab === "music" && tracks.length > 0 && (
                    <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
                      <div className="rounded-xl bg-gradient-to-b from-[#3a2010] to-[#181818] p-6 flex flex-col justify-between group">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden">
                              <TrackArt src={tracks[0].cover} alt={tracks[0].artist} size={48} />
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-widest text-[#b3b3b3]">New release from</p>
                              <h4 className="font-bold text-base hover:underline cursor-pointer">{tracks[0].artist}</h4>
                            </div>
                          </div>
                          <div className="flex gap-6 mt-4">
                            <div className="w-36 h-36 rounded overflow-hidden shadow-2xl shrink-0">
                              <TrackArt src={tracks[0].cover} alt={tracks[0].title} size={144} />
                            </div>
                            <div className="flex flex-col justify-end">
                              <span className="text-xs text-[#b3b3b3]">Album</span>
                              <h3 className="text-xl font-bold mt-1 group-hover:text-[#1db954] transition line-clamp-2">
                                {tracks[0].album || tracks[0].title}
                              </h3>
                              <div className="flex items-center gap-4 mt-5">
                                <button
                                  onClick={() => play(tracks[0], tracks)}
                                  className="h-12 w-12 rounded-full bg-[#1db954] text-black hover:scale-105 transition flex items-center justify-center shadow-lg"
                                >
                                  <Play size={20} className="fill-black text-black ml-0.5" />
                                </button>
                                <button className="h-8 w-8 rounded-full border border-white/20 hover:border-white transition flex items-center justify-center text-gray-300 hover:text-white">
                                  <Plus size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-lg">New Releases</h3>
                          <button className="text-xs text-gray-400 hover:underline">Show all</button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {tracks.slice(1, 5).map((track, i) => (
                            <div
                              key={track.id}
                              onClick={() => play(track, tracks)}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 cursor-pointer transition group"
                            >
                              <span className="w-4 text-xs text-gray-500 group-hover:hidden shrink-0">{i + 2}</span>
                              <Play size={12} className="fill-white text-white hidden group-hover:block shrink-0" />
                              <div className="h-12 w-12 shrink-0 rounded overflow-hidden bg-[#282828]">
                                <TrackArt src={track.cover} alt={track.title} size={48} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5 className="truncate font-semibold text-sm group-hover:text-[#1db954] transition">{track.title}</h5>
                                <p className="truncate text-xs text-[#b3b3b3]">{track.artist}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-[#1db954] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition flex items-center justify-center shrink-0">
                                <Play size={12} className="fill-black text-black ml-0.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
              </>
            )}
          </div>
        </main>

        {/* ── Right Sidebar (Now Playing) ────────────────────────────────── */}
        {rightSidebarTrack && (
          <aside className="hidden xl:flex w-[300px] shrink-0 rounded-lg bg-[#121212] overflow-y-auto flex flex-col p-4 gap-4 h-[calc(100vh-110px)]">
            <div className="flex justify-between items-center text-sm font-bold pb-2 border-b border-white/5">
              <span>Now Playing</span>
              <button className="text-gray-400 hover:text-white transition text-lg leading-none">···</button>
            </div>

            {/* Cover art */}
            <div className="w-full aspect-square rounded-md overflow-hidden bg-[#282828] relative shadow-xl group">
              <TrackArt src={rightSidebarTrack.cover} alt={rightSidebarTrack.title} size={300} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button
                  onClick={() => {
                    if (currentTrack?.id === rightSidebarTrack.id) {
                      togglePlaying();
                    } else {
                      play(rightSidebarTrack, tracks);
                    }
                  }}
                  className="h-14 w-14 rounded-full bg-[#1db954] text-black flex items-center justify-center hover:scale-105 transition shadow-lg"
                >
                  {currentTrack?.id === rightSidebarTrack.id && isPlaying
                    ? <Pause size={24} className="fill-black text-black" />
                    : <Play size={24} className="fill-black text-black ml-1" />
                  }
                </button>
              </div>
            </div>

            {/* Track title & artist */}
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-extrabold text-xl hover:underline cursor-pointer truncate">
                  {rightSidebarTrack.title}
                </h3>
                <p className="text-sm text-gray-400 hover:underline cursor-pointer truncate mt-1">
                  {rightSidebarTrack.artist}
                </p>
              </div>
              <div className="flex items-center justify-center h-5 w-5 bg-[#1db954] text-black rounded-full shrink-0 ml-2 mt-1">
                <Check size={12} className="stroke-[3]" />
              </div>
            </div>

            {/* Playback control + metadata */}
            <div className="rounded-lg bg-[#181818] p-3 flex flex-col gap-2.5 text-xs text-gray-400 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Playback</span>
                <button
                  onClick={() => {
                    if (currentTrack?.id === rightSidebarTrack.id) {
                      togglePlaying();
                    } else {
                      play(rightSidebarTrack, tracks);
                    }
                  }}
                  className="bg-white text-black hover:bg-[#1db954] hover:scale-105 transition rounded-full px-3 py-1 font-bold flex items-center gap-1"
                >
                  {currentTrack?.id === rightSidebarTrack.id && isPlaying
                    ? <><Pause size={10} className="fill-black" /> Pause</>
                    : <><Play size={10} className="fill-black" /> Play</>
                  }
                </button>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span>Album</span>
                <span className="text-white font-medium truncate max-w-[160px] text-right">{rightSidebarTrack.album || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="text-white font-medium">{formatDuration(rightSidebarTrack.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Source</span>
                <span className="text-white font-medium uppercase">{rightSidebarTrack.source}</span>
              </div>
              {rightSidebarTrack.mood && (
                <div className="flex justify-between">
                  <span>Mood</span>
                  <span className="text-white font-medium capitalize">{rightSidebarTrack.mood}</span>
                </div>
              )}
            </div>

            {/* About the Artist */}
            <div className="rounded-lg bg-[#181818] overflow-hidden flex flex-col">
              <div
                className="relative h-36 bg-[#282828] bg-cover bg-center"
                style={{ backgroundImage: `url(${rightSidebarTrack.cover})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs uppercase font-bold text-white tracking-wider drop-shadow-md">
                  About the artist
                </span>
              </div>
              <div className="p-4">
                <h4 className="font-extrabold text-base text-white hover:underline cursor-pointer">
                  {rightSidebarTrack.artist}
                </h4>
                <p className="text-xs text-gray-400 mt-2 line-clamp-4 leading-relaxed">
                  {rightSidebarTrack.artist} creates music that blends melodic storytelling with
                  rich production. This track streams via {rightSidebarTrack.source}.
                  {rightSidebarTrack.year ? ` Released in ${rightSidebarTrack.year}.` : ""}
                </p>
              </div>
            </div>

          </aside>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0c]/90 backdrop-blur-md border-t border-white/5 px-6 py-2 pb-5 flex justify-around items-center">
        <button
          onClick={() => { setAppView("home"); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center gap-1 transition ${appView === "home" ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          <Home size={20} className={appView === "home" ? "text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button
          onClick={() => { setAppView("search"); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center gap-1 transition ${appView === "search" ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          <Search size={20} className={appView === "search" ? "text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""} />
          <span className="text-[10px] font-bold">Search</span>
        </button>
        <button
          onClick={() => { setAppView("library"); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center gap-1 transition ${appView === "library" ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          <Library size={20} className={appView === "library" ? "text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""} />
          <span className="text-[10px] font-bold">Library</span>
        </button>
        <button
          onClick={() => { setAppView("hotlist"); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center gap-1 transition ${appView === "hotlist" ? "text-white" : "text-gray-400 hover:text-white"}`}
        >
          <Flame size={20} className={appView === "hotlist" ? "text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""} />
          <span className="text-[10px] font-bold">Hotlist</span>
        </button>
      </div>

      {/* Bottom Playback bar */}
      <PlayerShell />
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
