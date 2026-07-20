"use client";

import { Play, ChevronRight } from "lucide-react";
import type { Track } from "@/types/music";
import { usePlayerStore } from "@/store/player-store";
import { useState } from "react";
import Link from "next/link";

export interface VerticalCardItem {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  query: string; // The search query for playback
}

interface VerticalPlaylistCardsProps {
  title: string;
  items: VerticalCardItem[];
}

export function VerticalPlaylistCards({ title, items }: VerticalPlaylistCardsProps) {
  const { play } = usePlayerStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handlePlay = async (e: React.MouseEvent, query: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLoadingId(id);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const tracks = data.tracks as Track[];
        if (tracks.length > 0) {
          play(tracks[0], tracks);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <Link href={`/explore/${encodeURIComponent(title)}`} className="text-sm font-medium text-brand-muted hover:text-white transition flex items-center gap-1">
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 scroll-smooth">
        {items.map((item) => (
          <Link 
            key={item.id}
            href={`/explore/${encodeURIComponent(item.title)}`}
            className="group relative w-[140px] h-[200px] md:w-[180px] md:h-[260px] shrink-0 rounded-2xl overflow-hidden cursor-pointer shadow-lg block"
          >
            <img 
              src={item.cover} 
              alt={item.title} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10 pointer-events-none" />
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-base font-bold text-white leading-tight mb-1">{item.title}</h3>
              <p className="text-[11px] text-white/70">{item.subtitle}</p>
            </div>

            <button 
              onClick={(e) => handlePlay(e, item.query, item.id)}
              className="absolute bottom-4 right-4 w-9 h-9 bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all shadow-xl z-10"
            >
              {loadingId === item.id ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
              )}
            </button>
          </Link>
        ))}
        {/* Fake card to trigger right scroll arrow visibility if needed, or just padding */}
        <div className="w-[40px] shrink-0 flex items-center justify-center">
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}
