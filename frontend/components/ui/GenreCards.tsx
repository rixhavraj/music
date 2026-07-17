"use client";

import { ChevronRight, Radio, Music, Star, Activity, Guitar, Globe, Zap, type LucideIcon } from "lucide-react";
import type { Track } from "@/types/music";
import { usePlayerStore } from "@/store/player-store";
import { useState } from "react";
import Link from "next/link";

export interface GenreItem {
  id: string;
  title: string;
  iconName: string;
  color: string;
  query: string;
}

interface GenreCardsProps {
  title: string;
  items: GenreItem[];
}

const iconMap: Record<string, LucideIcon> = {
  Radio, Music, Star, Activity, Guitar, Globe, Zap
};

export function GenreCards({ title, items }: GenreCardsProps) {
  const { play } = usePlayerStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handlePlay = async (query: string, id: string) => {
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
        {items.map((item) => {
          const Icon = iconMap[item.iconName] || Music;
          
          return (
            <Link 
              key={item.id}
              href={`/explore/${encodeURIComponent(item.title)}`}
              className="relative w-[130px] h-[140px] shrink-0 rounded-2xl cursor-pointer group transition-transform hover:-translate-y-1 block"
              style={{
                background: `linear-gradient(180deg, ${item.color}20 0%, rgba(0,0,0,0.8) 100%)`,
                boxShadow: `inset 0 1px 1px ${item.color}40`,
                border: `1px solid ${item.color}20`
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div 
                  className="w-12 h-12 mb-3 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ color: item.color, filter: `drop-shadow(0 0 8px ${item.color}60)` }}
                >
                  <Icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold text-white text-center w-full truncate">{item.title}</h3>
              </div>
            </Link>
          );
        })}
        {/* Scroll arrow padding */}
        <div className="w-[40px] shrink-0 flex items-center justify-center">
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}
