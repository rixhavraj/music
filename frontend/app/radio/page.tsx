"use client";

import { Play, Radio } from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import { useState } from "react";
import type { Track } from "@/types/music";

export default function RadioPage() {
  const { play } = usePlayerStore();
  const [loadingStation, setLoadingStation] = useState<string | null>(null);

  const handlePlayStation = async (stationName: string, query: string) => {
    try {
      setLoadingStation(stationName);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const tracks = data.tracks as Track[];
        if (tracks.length > 0) {
          play(tracks[0], tracks);
        }
      }
    } catch (e) {
      console.error("Failed to load station", e);
    } finally {
      setLoadingStation(null);
    }
  };

  return (
    <div className="pb-10 min-h-full">
      <div className="px-8 pt-8 mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
          <Radio className="w-10 h-10 text-brand-primary" />
          Radio
        </h1>
        <p className="text-brand-muted">24/7 continuous music curated just for you.</p>
      </div>
      
      <div className="px-8 flex gap-6">
        <div 
          onClick={() => handlePlayStation("lofi", "chill lofi relax")}
          className="flex-1 bg-brand-highlight rounded-3xl p-8 border border-white/5 relative overflow-hidden group cursor-pointer hover:bg-white/5 transition"
        >
          <div className="relative z-10">
            <div className={`w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-brand-primary/20 ${loadingStation === "lofi" ? "animate-pulse" : ""}`}>
              <Play className="w-8 h-8 ml-1" fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">LoFi Beats Radio</h2>
            <p className="text-brand-muted">The best chill lofi beats to relax, study, or sleep to. Live 24/7.</p>
          </div>
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2 group-hover:bg-brand-primary/20 transition duration-500"></div>
        </div>
        
        <div 
          onClick={() => handlePlayStation("focus", "study focus instrumental")}
          className="flex-1 bg-brand-highlight rounded-3xl p-8 border border-white/5 relative overflow-hidden group cursor-pointer hover:bg-white/5 transition"
        >
          <div className="relative z-10">
            <div className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20 ${loadingStation === "focus" ? "animate-pulse" : ""}`}>
              <Play className="w-8 h-8 ml-1" fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Focus Mix</h2>
            <p className="text-brand-muted">Deep focus music, ambient and atmospheric sounds to help you concentrate.</p>
          </div>
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2 group-hover:bg-blue-500/20 transition duration-500"></div>
        </div>
      </div>
    </div>
  );
}
