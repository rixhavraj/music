"use client";

import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/home/HeroSection";
import { SectionList } from "@/components/ui/SectionList";
import { GlobalHitsCards } from "@/components/ui/GlobalHitsCards";
import { PlaylistCards } from "@/components/ui/PlaylistCards";
import type { Track } from "@/types/music";
import { useMemo } from "react";

const ORIGINAL_HINDI_PLAYLISTS = [
  {
    id: "oh1",
    title: "Best of Arijit",
    creator: "ChillGuys",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
    trackQuery: "arijit singh best hits",
  },
  {
    id: "oh2",
    title: "Desi Indie",
    creator: "ChillGuys",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80",
    trackQuery: "anuv jain prateek kuhad indie",
  },
  {
    id: "oh3",
    title: "90s Bollywood",
    creator: "ChillGuys",
    cover: "https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=500&q=80",
    trackQuery: "90s bollywood romance classic",
  },
  {
    id: "oh4",
    title: "Punjabi Beats",
    creator: "ChillGuys",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
    trackQuery: "punjabi hits upbeat party",
  },
];

const TRENDING_PLAYLISTS = [
  {
    id: "pl1",
    title: "Viral Hits 2026",
    creator: "Lofiëra",
    cover: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=500&q=80",
    trackQuery: "viral tiktok songs 2026",
  },
  {
    id: "pl2",
    title: "Late Night Drive",
    creator: "Alex_Vibes",
    cover: "https://images.unsplash.com/photo-1511406361295-0a1ff814c0ce?w=500&q=80",
    trackQuery: "late night drive lofi chill",
  },
  {
    id: "pl3",
    title: "Focus Flow",
    creator: "Lofiëra",
    cover: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=500&q=80",
    trackQuery: "focus concentration instrumental",
  },
  {
    id: "pl4",
    title: "Acoustic Chill",
    creator: "MusicLover",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80",
    trackQuery: "acoustic guitar chill relax",
  },
];

export default function Home() {
  const trendingQuery = useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const res = await fetch("/api/search?q=Trending%20Hindi%20Hits%202026&limit=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.tracks as Track[];
    },
  });

  const bestHindiQuery = useQuery({
    queryKey: ["bestHindi"],
    queryFn: async () => {
      const res = await fetch("/api/search?q=Best%20Hindi%20Songs%20All%20Time&limit=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.tracks as Track[];
    },
  });

  const globalHitsQuery = useQuery({
    queryKey: ["globalHits"],
    queryFn: async () => {
      const res = await fetch("/api/search?q=Trending%20Global%20Hits%202026&limit=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.tracks as Track[];
    },
  });

  const suggestedQuery = useQuery({
    queryKey: ["suggested"],
    queryFn: async () => {
      const res = await fetch("/api/search?q=latest%20new%20great%20songs%20trending&limit=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.tracks as Track[];
    },
  });

  // Shuffle function
  const shuffleTracks = (tracks: Track[]) => {
    return [...tracks].sort(() => Math.random() - 0.5);
  };

  const trendingTracks = useMemo(() => shuffleTracks(trendingQuery.data || []), [trendingQuery.data]);
  const bestHindiTracks = useMemo(() => shuffleTracks(bestHindiQuery.data || []), [bestHindiQuery.data]);
  const suggestedTracks = useMemo(() => shuffleTracks(suggestedQuery.data || []), [suggestedQuery.data]);
  const globalHits = useMemo(() => shuffleTracks(globalHitsQuery.data || []), [globalHitsQuery.data]);

  return (
    <div className="pb-10 min-h-full">
      <HeroSection tracks={trendingTracks} isLoading={trendingQuery.isLoading} />
      
      {suggestedQuery.isLoading ? (
        <div className="px-6 py-4">
          <div className="h-6 w-64 bg-white/5 animate-pulse rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <SectionList title="Suggested for you: New Great Songs" items={suggestedTracks.slice(0, 9)} />
        </div>
      )}

      {trendingQuery.isLoading ? (
        <div className="px-6 py-4">
          <div className="h-6 w-48 bg-white/5 animate-pulse rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <SectionList title="Trending Hindi Now" items={trendingTracks} />
      )}

      {bestHindiQuery.isLoading ? (
        <div className="px-6 py-4 mt-4">
          <div className="h-6 w-48 bg-white/5 animate-pulse rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <SectionList title="Best Hindi Hits" items={bestHindiTracks.slice(0, 9)} />
        </div>
      )}

      {globalHitsQuery.isLoading ? (
        <div className="px-6 py-4 mt-4">
          <div className="h-6 w-48 bg-white/5 animate-pulse rounded mb-4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-white/5 animate-pulse rounded-3xl" />
            ))}
          </div>
        </div>
      ) : (
        <GlobalHitsCards title="Global Hits" items={globalHits} />
      )}

      <PlaylistCards title="Original Hindi Playlists" playlists={ORIGINAL_HINDI_PLAYLISTS} />
      
      <div className="mt-8">
        <PlaylistCards title="Trending Playlists" playlists={TRENDING_PLAYLISTS} />
      </div>
    </div>
  );
}
