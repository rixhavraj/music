"use client";

import { useQuery } from "@tanstack/react-query";
import type { Track } from "@/types/music";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Play } from "lucide-react";

function ArtistCard({ name, category }: { name: string, category: string }) {
  const [imgUrl, setImgUrl] = useState<string>("https://i.pravatar.cc/150");

  useEffect(() => {
    async function fetchArtistImg() {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(name)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data.tracks && data.tracks.length > 0 && data.tracks[0].cover) {
             setImgUrl(data.tracks[0].cover);
          }
        }
      } catch (e) {}
    }
    fetchArtistImg();
  }, [name]);

  return (
    <Link 
      href={`/artist/${encodeURIComponent(name)}`}
      className="group flex flex-col items-center p-4 bg-brand-surface hover:bg-white/5 rounded-2xl border border-white/5 transition-all"
    >
      <div className="w-24 h-24 sm:w-32 sm:h-32 mb-4 rounded-full overflow-hidden shadow-lg relative">
        <img src={imgUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
        <div className="absolute bottom-2 right-2 w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all shadow-lg">
          <Play className="w-5 h-5 ml-1" fill="currentColor" />
        </div>
      </div>
      <h3 className="font-bold text-white text-center">{name}</h3>
      <p className="text-xs text-brand-muted mt-1">{category}</p>
    </Link>
  );
}

const INDIAN_ARTISTS = [
  "Arijit Singh", "Shreya Ghoshal", "Pritam", "Anuv Jain", 
  "A.R. Rahman", "Jubin Nautiyal", "Neha Kakkar", "Atif Aslam",
  "Diljit Dosanjh", "Prateek Kuhad", "Kishore Kumar", "Lata Mangeshkar"
];

const GLOBAL_ARTISTS = [
  "The Weeknd", "Taylor Swift", "Drake", "Ed Sheeran",
  "Billie Eilish", "Justin Bieber", "Dua Lipa", "Post Malone",
  "Ariana Grande", "Eminem", "Coldplay", "Bruno Mars"
];

export default function ArtistsPage() {
  return (
    <div className="pb-20 pt-8 px-8 min-h-full">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2">Top Artists</h1>
        <p className="text-brand-muted">Discover the most popular artists across India and the globe.</p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Trending in India</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {INDIAN_ARTISTS.map((artist) => (
            <ArtistCard key={artist} name={artist} category="Indian" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Global Superstars</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {GLOBAL_ARTISTS.map((artist) => (
            <ArtistCard key={artist} name={artist} category="Global" />
          ))}
        </div>
      </section>
    </div>
  );
}
