"use client";

import { Play, ListMusic } from "lucide-react";
import type { Track } from "@/types/music";
import { usePlayerStore } from "@/store/player-store";

interface PlaylistCardsProps {
  title: string;
  playlists: {
    id: string;
    title: string;
    creator: string;
    cover: string;
    trackQuery: string; // The query used to fetch tracks for this playlist when played
  }[];
}

export function PlaylistCards({ title, playlists }: PlaylistCardsProps) {
  const { play } = usePlayerStore();

  const handlePlayPlaylist = async (query: string) => {
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
    }
  };

  return (
    <section className="mb-10 px-8">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <ListMusic className="w-6 h-6 text-brand-primary" />
           {title}
        </h2>
        <button className="text-sm font-medium text-brand-muted hover:text-white transition">View all</button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {playlists.map((playlist) => (
          <div 
            key={playlist.id}
            onClick={() => handlePlayPlaylist(playlist.trackQuery)}
            className="group cursor-pointer bg-brand-highlight p-4 rounded-3xl border border-white/5 hover:bg-white/5 transition-colors"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-square mb-4 shadow-xl">
              <img 
                src={playlist.cover} 
                alt={playlist.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <Play className="w-6 h-6 ml-1" fill="currentColor" />
                </button>
              </div>
            </div>
            <h3 className="text-base font-bold text-white truncate mb-1 group-hover:text-brand-primary transition">
              {playlist.title}
            </h3>
            <p className="text-xs text-brand-muted truncate">By {playlist.creator}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
