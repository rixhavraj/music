"use client";

import { Play, Pause } from "lucide-react";
import type { Track } from "@/types/music";
import { usePlayerStore } from "@/store/player-store";

interface SectionListProps {
  title: string;
  items: Track[];
}

export function SectionList({ title, items }: SectionListProps) {
  const { play, currentTrack, isPlaying } = usePlayerStore();

  return (
    <section className="mb-10 px-8">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <button className="text-sm font-medium text-brand-muted hover:text-white transition">View all</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, index) => {
          const isCurrent = currentTrack?.id === item.id;
          return (
            <div 
              key={item.id}
              onClick={() => play(item, items)}
              className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition duration-300 group border border-transparent hover:border-white/5 hover:bg-white/5 ${isCurrent ? "bg-white/5 border-white/5 shadow-sm" : ""}`}
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-brand-surface shadow-sm">
                <img src={item.cover || "https://picsum.photos/seed/fallback/50/50"} alt={item.title} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 flex items-center justify-center ${isCurrent ? 'bg-black/40' : 'bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                  {isCurrent && isPlaying ? (
                    <div className="flex gap-[2px] items-end h-3">
                       <div className="w-[2px] bg-brand-primary animate-jingle-1 h-2" />
                       <div className="w-[2px] bg-brand-primary animate-jingle-2 h-3" />
                       <div className="w-[2px] bg-brand-primary animate-jingle-3 h-2" />
                    </div>
                  ) : (
                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-bold truncate transition ${isCurrent ? "text-brand-primary" : "text-white group-hover:text-brand-primary"}`}>
                  {item.title}
                </h3>
                <p className="text-xs text-brand-muted truncate mt-0.5">{item.artist}</p>
              </div>
              
              <div className="text-xs font-medium text-brand-muted opacity-0 group-hover:opacity-100 transition px-2">
                {isCurrent ? "Playing" : "Play"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
