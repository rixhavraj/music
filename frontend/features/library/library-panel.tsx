"use client";

import { Music2 } from "lucide-react";
import { TrackArt } from "@/components/track-art";
import type { Track } from "@/types/music";

type LibraryPanelProps = {
  title: string;
  tracks: Track[];
  emptyLabel: string;
  onPlay: (track: Track, queue?: Track[]) => void;
};

export function LibraryPanel({ title, tracks, emptyLabel, onPlay }: LibraryPanelProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex items-center gap-3">
        <Music2 size={22} />
        <h2 className="text-3xl font-semibold">{title}</h2>
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink/20 bg-white p-8 text-ink/55">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => onPlay(track, tracks)}
              className="rounded-md border border-ink/10 bg-white p-3 text-left transition hover:border-moss/40 hover:shadow-sm"
            >
              <TrackArt src={track.cover} alt={`${track.album} cover`} size={260} />
              <div className="mt-3 min-w-0">
                <h3 className="truncate text-lg font-semibold">{track.title}</h3>
                <p className="truncate text-sm text-ink/55">{track.artist}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
