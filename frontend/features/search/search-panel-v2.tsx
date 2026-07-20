"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Clock, TrendingUp, X, Mic, Play } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { TrackArt } from "@/components/track-art";
import { useSearchHistoryStore, TRENDING_SEARCHES } from "@/store/search-store";
import type { Track } from "@/types/music";

type SearchPanelV2Props = {
  onPlay: (track: Track, queue?: Track[]) => void;
};

export function SearchPanelV2({ onPlay }: SearchPanelV2Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const { history, addSearch, removeSearch, clearHistory } = useSearchHistoryStore();

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => clearTimeout(timer);
  }, [query]);

  // Save to history when we get results
  useEffect(() => {
    if (debouncedQuery.length > 1) {
      addSearch(debouncedQuery);
    }
  }, [debouncedQuery, addSearch]);

  // Voice search
  function startVoiceSearch() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      inputRef.current?.focus();
    };
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      return json.tracks as Track[];
    },
    enabled: debouncedQuery.length > 0,
  });

  const tracks = data || [];
  const showEmpty = debouncedQuery.length === 0;

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Search bar header */}
      <div className="flex flex-col gap-2 mt-2 mb-4">
        <h2 className="text-3xl font-black text-white tracking-tight">Explore</h2>
        <p className="text-sm font-medium text-white/50">Discover new music, genres, and moods</p>
      </div>

      <div className={`flex items-center gap-3 rounded-2xl bg-white/10 border-2 px-5 py-4 transition shadow-lg ${isListening ? "border-[#ff7a8a] shadow-[0_0_24px_#ff7a8a40]" : "border-white/10 focus-within:border-white/40"}`}>
        <Search size={24} className="shrink-0 text-white/70" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          placeholder={isListening ? "Listening…" : "Search songs, artists, albums, moods"}
          autoComplete="off"
          autoFocus
        />
        {query.length > 0 && (
          <button onClick={() => setQuery("")} className="text-gray-400 hover:text-white transition">
            <X size={16} />
          </button>
        )}
        <button
          onClick={startVoiceSearch}
          className={`p-2 rounded-full transition ${isListening ? "bg-[#ff7a8a] text-black animate-pulse" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
          title="Voice search"
        >
          <Mic size={16} />
        </button>
      </div>

      {showEmpty ? (
        <div className="flex flex-col gap-6">
          {/* Search history */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  Recent Searches
                </h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((term) => (
                  <div
                    key={term}
                    className="flex items-center gap-2 bg-[#2a2a2a] rounded-full px-3 py-1.5 group"
                  >
                    <button
                      onClick={() => setQuery(term)}
                      className="text-sm text-gray-200 hover:text-white transition"
                    >
                      {term}
                    </button>
                    <button
                      onClick={() => removeSearch(term)}
                      className="text-gray-600 hover:text-gray-300 transition opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending searches */}
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#ff7a8a]" />
              Trending Searches
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {TRENDING_SEARCHES.map((term, i) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] transition text-left group"
                >
                  <span className="text-lg font-bold text-[#1db954]/40 w-6 shrink-0">{i + 1}</span>
                  <span className="text-sm text-gray-200 truncate group-hover:text-white">{term}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Browse Categories */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-bold text-lg mb-3">Genres & Moods</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { name: "Bollywood", color: "from-[#e91e63] to-[#9c27b0]" },
                  { name: "Pop",       color: "from-[#ff6f00] to-[#e53935]" },
                  { name: "Hip-Hop",   color: "from-[#1a237e] to-[#283593]" },
                  { name: "Classical", color: "from-[#4e342e] to-[#6d4c41]" },
                  { name: "Electronic",color: "from-[#006064] to-[#00838f]" },
                  { name: "Rock",      color: "from-[#212121] to-[#424242]" },
                  { name: "Lo-Fi",     color: "from-[#1b5e20] to-[#2e7d32]" },
                  { name: "R&B",       color: "from-[#880e4f] to-[#ad1457]" },
                  { name: "Jazz",      color: "from-[#bf360c] to-[#d84315]" },
                  { name: "Acoustic",  color: "from-[#5d4037] to-[#795548]" },
                  { name: "Indie",     color: "from-[#00897b] to-[#00695c]" },
                  { name: "K-Pop",     color: "from-[#ec407a] to-[#d81b60]" },
                ].map((genre) => (
                  <button
                    key={genre.name}
                    onClick={() => setQuery(genre.name)}
                    className={`h-24 rounded-2xl bg-gradient-to-br ${genre.color} flex items-end p-4 hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer shadow-lg`}
                  >
                    <span className="font-black text-base text-white drop-shadow-md">{genre.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3">Activities & Decades</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: "Workout", color: "from-[#d32f2f] to-[#b71c1c]" },
                  { name: "Focus",   color: "from-[#1976d2] to-[#0d47a1]" },
                  { name: "Sleep",   color: "from-[#4527a0] to-[#311b92]" },
                  { name: "Party",   color: "from-[#fbc02d] to-[#f57f17]" },
                  { name: "90s Hits", color: "from-[#c2185b] to-[#880e4f]" },
                  { name: "2000s Pop", color: "from-[#0288d1] to-[#01579b]" },
                ].map((act) => (
                  <button
                    key={act.name}
                    onClick={() => setQuery(act.name)}
                    className={`h-20 rounded-2xl bg-gradient-to-tr ${act.color} flex items-center justify-center p-3 hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer shadow-md`}
                  >
                    <span className="font-bold text-sm text-white/90 drop-shadow">{act.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">
              {isFetching ? "Searching…" : `Results for "${debouncedQuery}"`}
            </h3>
            {tracks.length > 0 && (
              <span className="text-xs text-gray-400">{tracks.length} tracks</span>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Search size={40} className="text-gray-600" />
              <p className="font-semibold text-gray-400">No results found</p>
              <p className="text-sm text-gray-600">Try a different spelling or keyword</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {tracks.map((track, i) => (
                <div
                  key={track.id}
                  onClick={() => onPlay(track, tracks)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition group"
                >
                  <span className="w-5 text-xs text-gray-500 text-center group-hover:hidden shrink-0">{i + 1}</span>
                  <Play size={14} className="fill-white text-white hidden group-hover:block shrink-0" />
                  <div className="h-12 w-12 rounded overflow-hidden shrink-0">
                    <TrackArt src={track.cover} alt={track.title} size={48} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-sm text-white group-hover:text-[#1db954] transition">
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-gray-400">{track.artist} · {track.album}</p>
                  </div>
                  {track.mood && (
                    <span className="bg-white/10 text-[10px] text-gray-300 px-2 py-0.5 rounded-full capitalize shrink-0">
                      {track.mood}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
