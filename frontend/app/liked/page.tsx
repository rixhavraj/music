"use client";

import { usePlayerStore } from "@/store/player-store";
import { useEffect, useState } from "react";
import type { Track } from "@/types/music";
import { Heart, Play, Pause } from "lucide-react";

export default function LikedSongsPage() {
  const { likedIds, play, currentTrack, isPlaying } = usePlayerStore();
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLikedTracks() {
      if (likedIds.length === 0) {
        setLikedTracks([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const tracks: Track[] = [];
        // In a real production app, this would use a batch API endpoint like /api/tracks?ids=...
        // We'll fetch them individually for now or use fallback if they were already in the store's queue/recentlyPlayed.
        // For simplicity, we just use the first available data.
        
        // Let's use the local storage state first to avoid N requests if possible.
        // We can access it from localStorage 'chillguys-player'
        let cachedTracks: Track[] = [];
        try {
          const stateData = JSON.parse(localStorage.getItem('chillguys-player') || '{}');
          const state = stateData?.state || {};
          cachedTracks = [...(state.queue || []), ...(state.recentlyPlayed || []), ...(state.currentTrack ? [state.currentTrack] : [])];
        } catch(e) {}

        for (const id of likedIds) {
          const cached = cachedTracks.find(t => t.id === id);
          if (cached) {
            if (!tracks.some(t => t.id === cached.id)) {
               tracks.push(cached);
            }
          } else {
             // If we really don't have it, we could fetch it.
             // But for this UI demo, we might just try hitting /api/track/id
             try {
               const res = await fetch(`/api/track/${id}`);
               if (res.ok) {
                 const data = await res.json();
                 tracks.push(data);
               }
             } catch(e) {
               console.error("Failed to fetch track", id);
             }
          }
        }
        setLikedTracks(tracks);
      } catch (e) {
        console.error("Failed to load liked tracks", e);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadLikedTracks();
  }, [likedIds]);

  return (
    <div className="pb-10 min-h-full">
      <div className="px-8 pt-12 mb-8 bg-gradient-to-b from-brand-primary/20 to-transparent pb-8">
        <div className="flex items-end gap-6">
          <div className="w-48 h-48 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl shadow-2xl flex items-center justify-center">
            <Heart className="w-20 h-20 fill-white text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-5xl font-extrabold text-white mb-4">Liked Songs</h1>
            <p className="text-brand-muted">{likedIds.length} songs</p>
          </div>
        </div>
      </div>
      
      <div className="px-8">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => {
              if (likedTracks.length > 0) {
                play(likedTracks[0], likedTracks);
              }
            }}
            disabled={likedTracks.length === 0 || isLoading}
            className="w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-xl hover:scale-105 transition disabled:opacity-50"
          >
            <Play className="w-6 h-6 ml-1 fill-current" />
          </button>
        </div>

        {isLoading ? (
           <div className="space-y-4">
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 animate-pulse h-16" />
             ))}
           </div>
        ) : likedTracks.length === 0 ? (
           <div className="text-center py-20 bg-brand-highlight rounded-3xl border border-white/5">
              <Heart className="w-12 h-12 text-brand-muted mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No liked songs yet</h3>
              <p className="text-brand-muted">Tap the heart on any track to add it to your Liked Songs.</p>
           </div>
        ) : (
          <div className="space-y-2">
            {likedTracks.map((item, index) => {
              const isCurrent = currentTrack?.id === item.id;
              
              return (
                <div 
                  key={item.id}
                  onClick={() => play(item, likedTracks)}
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition duration-300 group hover:bg-white/5 border ${isCurrent ? 'bg-white/5 border-white/10' : 'border-transparent'}`}
                >
                  <div className="w-8 text-center text-brand-muted group-hover:hidden">
                    {index + 1}
                  </div>
                  <div className="w-8 hidden group-hover:flex items-center justify-center text-white">
                    {isCurrent && isPlaying ? <Pause className="w-4 h-4 text-brand-primary" /> : <Play className="w-4 h-4 fill-current" />}
                  </div>
                  
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-brand-surface shadow-sm">
                    <img src={item.cover || "https://picsum.photos/seed/fallback/50/50"} alt={item.title} className="w-full h-full object-cover" />
                    {isCurrent && isPlaying && (
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                         <div className="flex gap-[2px] items-end h-3">
                           <div className="w-[2px] bg-brand-primary animate-pulse h-2" />
                           <div className="w-[2px] bg-brand-primary animate-pulse h-3" />
                           <div className="w-[2px] bg-brand-primary animate-pulse h-2" />
                         </div>
                       </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-bold truncate transition ${isCurrent ? "text-brand-primary" : "text-white group-hover:text-brand-primary"}`}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-brand-muted truncate mt-0.5">{item.artist}</p>
                  </div>
                  
                  <div className="px-4 opacity-0 group-hover:opacity-100 transition text-brand-primary">
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
