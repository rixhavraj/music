"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import type { Track } from "@/types/music";
import { SectionList } from "@/components/ui/SectionList";
import { ChevronLeft } from "lucide-react";

export default function ExploreCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const categoryName = decodeURIComponent(rawCategory || "Category");

  const { data: tracks, isLoading } = useQuery({
    queryKey: ["exploreCategory", categoryName],
    queryFn: async () => {
      // Decode the URL param and append "best songs" to ensure we get good hits for that mood/genre
      const res = await fetch(`/api/search?q=${encodeURIComponent(categoryName + " best songs")}&limit=50`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      return data.tracks as Track[];
    },
    enabled: !!categoryName
  });

  return (
    <div className="pb-20 pt-8 px-8 min-h-full">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-brand-muted hover:text-white transition mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Explore
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2 capitalize">{categoryName}</h1>
        <p className="text-brand-muted">Explore all the best hits and playlists for {categoryName.toLowerCase()}.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      ) : tracks && tracks.length > 0 ? (
        <SectionList title="Top Tracks" items={tracks} />
      ) : (
        <div className="text-center py-20 text-brand-muted">
          <p>No results found for {categoryName}.</p>
        </div>
      )}
    </div>
  );
}
