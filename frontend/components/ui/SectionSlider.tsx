"use client";

import { Play } from "lucide-react";
import type { Track } from "@/types/music";
import { usePlayerStore } from "@/store/player-store";

interface SectionSliderProps {
  title: string;
  items: Track[];
}

export function SectionSlider({ title, items }: SectionSliderProps) {
  const { play } = usePlayerStore();

  return (
    <section className="mb-10 px-8">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <button className="text-sm font-medium text-brand-muted hover:text-white transition">View all</button>
      </div>
      
      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="min-w-[160px] max-w-[160px] group cursor-pointer"
            onClick={() => play(item, items)}
          >
            <div className="relative rounded-2xl overflow-hidden aspect-square mb-3 shadow-lg">
              <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition opacity-0 group-hover:opacity-100 flex items-center justify-center">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-brand-primary transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300">
                  <Play className="w-5 h-5 ml-1 fill-current" />
                </button>
              </div>
            </div>
            <h3 className="text-sm font-bold truncate text-white mb-1 group-hover:text-brand-primary transition">{item.title}</h3>
            <p className="text-xs text-brand-muted truncate">{item.artist}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
