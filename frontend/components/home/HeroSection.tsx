"use client";

import { Play, Shuffle, X, Search as SearchIcon } from "lucide-react";
import type { Track } from "@/types/music";
import { usePlayerStore } from "@/store/player-store";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

interface HeroSectionProps {
  tracks?: Track[];
  isLoading?: boolean;
}

export function HeroSection({ tracks = [], isLoading = false }: HeroSectionProps) {
  const { play, toggleShuffle } = usePlayerStore();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["heroSearch", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      return json.tracks as Track[];
    },
    enabled: debouncedQuery.length > 0,
  });

  const handlePlayMix = () => {
    if (tracks.length > 0) {
      play(tracks[0], tracks);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      toggleShuffle();
      play(tracks[Math.floor(Math.random() * tracks.length)], tracks);
    }
  };

  const handlePlaySearchResult = (track: Track) => {
    if (searchResults) {
      play(track, searchResults);
      setQuery("");
      setIsSearchFocused(false);
    }
  };

  return (
    <section className="mb-10 px-8 pt-8">
      {/* Search Bar Container */}
      <div className="relative mb-8 max-w-xl z-50" ref={searchRef}>
        <div className={`flex-1 bg-brand-highlight/90 backdrop-blur-xl rounded-full flex items-center px-4 py-3 border transition-all ${isSearchFocused ? "border-brand-primary shadow-[0_0_20px_rgba(29,185,84,0.3)]" : "border-white/10"}`}>
          <SearchIcon className="w-5 h-5 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search for songs, artists, moods..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="bg-transparent border-none outline-none text-sm ml-3 flex-1 text-white placeholder-brand-muted" 
          />
          {query.length > 0 && (
            <button onClick={() => setQuery("")} className="text-brand-muted hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && debouncedQuery.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-brand-surface/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl max-h-[60vh] overflow-y-auto scrollbar-hide">
            <h3 className="text-sm font-bold text-white mb-4 flex justify-between items-center">
              <span>{isSearching ? "Searching..." : `Results for "${debouncedQuery}"`}</span>
              {searchResults && searchResults.length > 0 && <span className="text-brand-muted font-normal">{searchResults.length} tracks</span>}
            </h3>

            {isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((track) => (
                  <div 
                    key={track.id}
                    onClick={() => handlePlaySearchResult(track)}
                    className="group flex flex-col p-3 rounded-2xl bg-brand-highlight/30 border border-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"
                  >
                    <div className="w-full aspect-square rounded-xl overflow-hidden relative mb-3 shadow-md group-hover:shadow-xl transition-shadow">
                      <img src={track.cover} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                      <div className="absolute bottom-2 right-2 w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all shadow-lg">
                        <Play className="w-5 h-5 ml-1" fill="currentColor" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-white truncate group-hover:text-brand-primary transition-colors">{track.title}</h4>
                    <p className="text-xs text-brand-muted truncate mt-0.5">{track.artist}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <SearchIcon className="w-10 h-10 text-brand-muted mx-auto mb-3" />
                <p className="text-brand-muted font-medium">No results found for "{debouncedQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-sm font-medium mb-2">Good evening, Rishav 👋</p>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            <span className="text-white">Your vibe, your</span><br/>
            <span className="text-brand-primary">music.</span>
          </h1>
          <p className="text-brand-muted mb-8 text-sm">Listen to what moves you.</p>
          <div className="flex gap-4">
            <button 
              onClick={handlePlayMix}
              disabled={isLoading || tracks.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-medium flex items-center gap-2 hover:scale-105 transition shadow-lg shadow-brand-primary/20 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              Play Mix
            </button>
            <button 
              onClick={handleShuffle}
              disabled={isLoading || tracks.length === 0}
              className="px-6 py-2.5 rounded-xl bg-brand-highlight border border-white/10 text-white font-medium flex items-center gap-2 hover:bg-white/5 transition disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>

        <div className="flex-1 relative rounded-3xl overflow-hidden aspect-[16/9] lg:aspect-auto shadow-2xl">
          <img src={tracks[0]?.cover || "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=1000&auto=format&fit=crop"} alt="Hero Cover" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-hero-overlay"></div>
          
          <div className="absolute bottom-6 left-6 right-6">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-brand-secondary/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              AI MIX
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{tracks[0]?.title || "Late Night Lofi"}</h2>
            <p className="text-sm text-white/80 max-w-sm">{tracks[0]?.artist || "Chill beats to relax, study or vibe at night."}</p>
          </div>
          <button 
            onClick={handlePlayMix}
            disabled={isLoading || tracks.length === 0}
            className="absolute bottom-6 right-6 w-12 h-12 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition disabled:opacity-50"
          >
            <Play className="w-5 h-5 ml-1 fill-current" />
          </button>
        </div>
      </div>
    </section>
  );
}
