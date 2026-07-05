"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TrackArt } from "@/components/track-art";
import type { SearchResponse, Track } from "@/types/music";

type SearchPanelProps = {
  onPlay: (track: Track, queue?: Track[]) => void;
};

type SearchForm = {
  query: string;
};

export function SearchPanel({ onPlay }: SearchPanelProps) {
  const { register, watch } = useForm<SearchForm>({ defaultValues: { query: "" } });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const query = watch("query");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  const search = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=18`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      return response.json() as Promise<SearchResponse>;
    },
    enabled: debouncedQuery.length > 0
  });

  const tracks = search.data?.tracks || [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3 rounded-md border border-ink/10 bg-white px-4 py-3">
        <Search size={20} className="shrink-0 text-ink/50" />
        <input
          {...register("query")}
          className="h-10 min-w-0 flex-1 bg-transparent text-lg outline-none"
          placeholder="Search songs, albums, artists"
          autoComplete="off"
        />
      </div>

      <div className="mt-6 grid gap-3">
        {search.isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[74px] animate-pulse rounded-md bg-ink/10" />
          ))}

        {!search.isLoading &&
          tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => onPlay(track, tracks)}
              className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-md border border-ink/10 bg-white p-2 text-left transition hover:border-copper/40 hover:shadow-sm"
            >
              <TrackArt src={track.cover} alt={`${track.album} cover`} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{track.title}</span>
                <span className="block truncate text-sm text-ink/55">
                  {track.artist} · {track.album}
                </span>
              </span>
              <span className="rounded-md bg-paper px-3 py-2 text-sm text-ink/60">{track.mood}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
