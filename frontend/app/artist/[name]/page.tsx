"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import type { Track } from "@/types/music";
import { SectionList } from "@/components/ui/SectionList";
import { Play, User, Heart, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePlayerStore } from "@/store/player-store";

export default function ArtistProfilePage() {
  const params = useParams();
  const rawName = Array.isArray(params.name) ? params.name[0] : params.name;
  const artistName = decodeURIComponent(rawName || "");
  const { play } = usePlayerStore();
  
  const [artistImage, setArtistImage] = useState("https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&q=80");

  const { data: tracks, isLoading } = useQuery({
    queryKey: ["artistTracks", artistName],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(artistName + " best hits")}&limit=30`);
      if (!res.ok) throw new Error("Failed to fetch artist tracks");
      const data = await res.json();
      return data.tracks as Track[];
    },
    enabled: !!artistName
  });

  useEffect(() => {
    if (tracks && tracks.length > 0 && tracks[0].cover) {
      setArtistImage(tracks[0].cover);
    }
  }, [tracks]);

  const handlePlayAll = () => {
    if (tracks && tracks.length > 0) {
      play(tracks[0], tracks);
    }
  };

  return (
    <div className="pb-20 min-h-full bg-brand-background">
      {/* Hero Section */}
      <div className="relative h-[350px] w-full flex items-end">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src={artistImage} alt={artistName} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-background via-brand-background/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 w-full flex items-end gap-6">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-brand-background shadow-2xl shrink-0">
            <img src={artistImage} alt={artistName} className="w-full h-full object-cover" />
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-2 text-brand-primary mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-widest">Verified Artist</span>
            </div>
            <h1 className="text-6xl font-extrabold text-white mb-6 drop-shadow-lg">{artistName}</h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePlayAll}
                className="w-14 h-14 bg-brand-primary hover:bg-brand-secondary hover:scale-105 transition-all rounded-full flex items-center justify-center text-white shadow-xl shadow-brand-primary/30"
              >
                <Play className="w-6 h-6 ml-1" fill="currentColor" />
              </button>
              <button className="px-6 py-2 rounded-full border border-white/20 hover:border-white transition font-bold text-sm tracking-wide text-white">
                Follow
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 mt-8">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 w-48 bg-white/5 animate-pulse rounded mb-6" />
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        ) : tracks && tracks.length > 0 ? (
          <SectionList title="Popular Tracks" items={tracks} />
        ) : (
          <div className="text-center py-20 text-brand-muted">
            <p>No tracks found for {artistName}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
