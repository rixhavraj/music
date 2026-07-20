"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { VerticalPlaylistCards, type VerticalCardItem } from "@/components/ui/VerticalPlaylistCards";
import { GenreCards, type GenreItem } from "@/components/ui/GenreCards";
import { useQuery } from "@tanstack/react-query";
import { SectionList } from "@/components/ui/SectionList";
import type { Track } from "@/types/music";

const TAGS = ["All", "Lo-fi", "Chill", "Romance", "Party", "Sad", "Workout"];

const MOODS_VIBES: VerticalCardItem[] = [
  { id: "m1", title: "Chill", subtitle: "120 songs", query: "chill relaxing aesthetic", cover: "https://images.unsplash.com/photo-1511406361295-0a1ff814c0ce?w=500&q=80" },
  { id: "m2", title: "Study", subtitle: "98 songs", query: "study concentration lofi", cover: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=500&q=80" },
  { id: "m3", title: "Romance", subtitle: "112 songs", query: "romantic love acoustic", cover: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=500&q=80" },
  { id: "m4", title: "Late Night", subtitle: "78 songs", query: "late night drive midnight", cover: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=500&q=80" },
  { id: "m5", title: "Workout", subtitle: "95 songs", query: "workout gym hype energetic", cover: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80" },
];

const TOP_GENRES: GenreItem[] = [
  { id: "g1", title: "Hip Hop", iconName: "Radio", color: "#a855f7", query: "hip hop rap" },
  { id: "g2", title: "Bollywood", iconName: "Music", color: "#f97316", query: "bollywood hits hindi" },
  { id: "g3", title: "Pop", iconName: "Star", color: "#3b82f6", query: "pop trending hits" },
  { id: "g4", title: "Lo-fi", iconName: "Activity", color: "#6366f1", query: "lofi hip hop chillhop" },
  { id: "g5", title: "Indie", iconName: "Guitar", color: "#10b981", query: "indie folk alternative" },
  { id: "g6", title: "EDM", iconName: "Globe", color: "#ec4899", query: "edm electronic dance" },
  { id: "g7", title: "Rock", iconName: "Zap", color: "#f59e0b", query: "rock classic alternative" },
  { id: "g8", title: "Classical", iconName: "Music", color: "#4e342e", query: "classical instrumental" },
  { id: "g9", title: "R&B", iconName: "Heart", color: "#880e4f", query: "r&b soul smooth" },
  { id: "g10", title: "Jazz", iconName: "Radio", color: "#bf360c", query: "jazz cafe chill" },
  { id: "g11", title: "Acoustic", iconName: "Guitar", color: "#5d4037", query: "acoustic guitar chill" },
  { id: "g12", title: "K-Pop", iconName: "Star", color: "#ec407a", query: "kpop bts blackpink hits" },
];

const TRENDING_PLAYLISTS: VerticalCardItem[] = [
  { id: "p1", title: "Viral Hits India", subtitle: "50 songs", query: "viral hits india trending", cover: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=500&q=80" },
  { id: "p2", title: "Peaceful Lo-fi", subtitle: "60 songs", query: "peaceful lofi beats", cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80" },
  { id: "p3", title: "Bollywood Love", subtitle: "40 songs", query: "bollywood romantic love", cover: "https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=500&q=80" },
  { id: "p4", title: "Workout Boost", subtitle: "55 songs", query: "workout hype gym motivation", cover: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80" },
  { id: "p5", title: "Sad Songs", subtitle: "45 songs", query: "sad emotional heartbreak", cover: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&q=80" },
  { id: "p6", title: "Party Tonight", subtitle: "60 songs", query: "party dance upbeat hits", cover: "https://images.unsplash.com/photo-1470229722913-7c092fb12a9e?w=500&q=80" },
];

export default function ExplorePage() {
  const [activeTag, setActiveTag] = useState("All");

  const tagQuery = useQuery({
    queryKey: ["exploreTag", activeTag],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(activeTag + " best songs")}&limit=30`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      return data.tracks as Track[];
    },
    enabled: activeTag !== "All",
  });

  return (
    <div className="pb-10 min-h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-6 md:pt-8 mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-1 md:mb-2">Explore</h1>
        <p className="text-xs md:text-sm font-medium text-white/50 mb-4 md:mb-6">Discover new music, genres, and moods</p>
        
        {/* Search Bar */}
        <div className="mb-4 md:mb-6 flex items-center gap-2 md:gap-3 rounded-full bg-white/10 border-2 border-white/10 px-4 md:px-5 py-3 md:py-4 focus-within:border-[#ff7a8a] transition shadow-lg w-full max-w-2xl">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-white/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500 text-sm"
            placeholder="Search songs, artists, albums, moods..."
            onChange={(e) => setActiveTag(e.target.value)}
          />
        </div>

        {/* Tags Row */}
        <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                activeTag === tag
                  ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg"
                  : "bg-brand-surface text-brand-muted hover:text-white border border-white/5 hover:border-white/20"
              }`}
            >
              {tag}
            </button>
          ))}
          <button className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full bg-brand-surface text-brand-muted hover:text-white border border-white/5 hover:border-white/20 flex items-center gap-1 transition-all">
            More <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
      
      <div className="px-4 md:px-6 lg:px-8 space-y-2">
        {activeTag === "All" || !activeTag ? (
          <>
            <VerticalPlaylistCards title="Browse by mood & vibe" items={MOODS_VIBES} />
            <GenreCards title="Top genres" items={TOP_GENRES} />
            <VerticalPlaylistCards title="Activities & Decades" items={[
              { id: "a1", title: "90s Hits", subtitle: "Retro", query: "90s hits nostalgic", cover: "https://images.unsplash.com/photo-1550684376-efcb6e0526f7?w=500&q=80" },
              { id: "a2", title: "2000s Pop", subtitle: "Throwback", query: "2000s pop hits", cover: "https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=500&q=80" },
              { id: "a3", title: "Focus", subtitle: "Deep Work", query: "focus instrumental study", cover: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=500&q=80" },
              { id: "a4", title: "Workout", subtitle: "Energy", query: "workout hype gym motivation", cover: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80" },
              { id: "a5", title: "Sleep", subtitle: "Rest", query: "sleep calm meditation", cover: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&q=80" },
            ]} />
            <VerticalPlaylistCards title="Trending playlists" items={TRENDING_PLAYLISTS} />
          </>
        ) : (
          <div>
            {tagQuery.isLoading ? (
              <div className="space-y-4 pt-4">
                <div className="h-8 w-48 bg-white/5 animate-pulse rounded mb-6" />
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-xl" />
                  ))}
                </div>
              </div>
            ) : tagQuery.data && tagQuery.data.length > 0 ? (
              <SectionList title={`Top ${activeTag} Hits`} items={tagQuery.data} />
            ) : (
              <div className="text-center py-20 text-brand-muted">
                <p>No results found for {activeTag}.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
