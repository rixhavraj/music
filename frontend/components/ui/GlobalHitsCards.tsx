"use client";

import { Play, Pause } from "lucide-react";
import type { Track } from "@/types/music";
import { usePlayerStore } from "@/store/player-store";

interface GlobalHitsCardsProps {
  title: string;
  items: Track[];
}

export function GlobalHitsCards({ title, items }: GlobalHitsCardsProps) {
  const { play, currentTrack, isPlaying } = usePlayerStore();

  return (
    <section className="mb-10 px-8">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <button className="text-sm font-medium text-brand-muted hover:text-white transition">View all</button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.slice(0, 8).map((item) => {
          const isCurrent = currentTrack?.id === item.id;
          
          return (
            <div 
              key={item.id}
              onClick={() => play(item, items)}
              className="relative group cursor-pointer overflow-hidden rounded-3xl aspect-[4/3] bg-brand-surface shadow-lg"
            >
              <img 
                src={item.cover || "https://picsum.photos/seed/fallback/300/200"} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
              
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <h3 className={`text-base font-bold truncate mb-0.5 ${isCurrent ? 'text-brand-primary' : 'text-white'}`}>
                  {item.title}
                </h3>
                <p className="text-xs text-brand-muted truncate opacity-80">{item.artist}</p>
              </div>
              
              <div className={`absolute top-3 right-3 w-10 h-10 bg-brand-primary backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 ${isCurrent ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'}`}>
                {isCurrent && isPlaying ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
