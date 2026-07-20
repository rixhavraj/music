"use client";

import {
  Pause, Play, SkipForward, Volume2, VolumeX,
  Repeat, Repeat1, Shuffle, SkipBack, Heart, CheckCircle2,
  ChevronDown, ListMusic, MoreHorizontal, MessageSquare,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrackArt } from "@/components/track-art";
import { usePlayerStore } from "@/store/player-store";

const BAR_COUNT = 24;

function hashColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 12%)`;
}

function getTrackWaveform(title: string, count: number = 36): number[] {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const val1 = Math.sin((i / count) * Math.PI); 
    const val2 = Math.sin((i / count) * Math.PI * 4 + (hash % 10)); 
    const val3 = Math.sin((i / count) * Math.PI * 8 + (hash % 7)); 
    let height = Math.abs(val1 * 0.75 + val2 * 0.2 + val3 * 0.05);
    height = 0.2 + height * 0.75;
    result.push(height);
  }
  return result;
}

export function PlayerShell({ visuallyHidden = false }: { visuallyHidden?: boolean }) {
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const animRef     = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const barsRef     = useRef<(HTMLDivElement | null)[]>([]);
  const seekRef     = useRef<HTMLDivElement | null>(null);
  const finishHandledRef = useRef(false);
  const retryCountRef = useRef(0);

  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [isMuted, setIsMuted]       = useState(false);
  const [prevVol, setPrevVol]       = useState(0.78);
  const [dragging, setDragging]     = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  const {
    currentTrack, isPlaying, shuffle, repeat, volume, likedIds,
    playbackSpeed, togglePlaying, setPlaying, playNext, playPrevious,
    toggleShuffle, cycleRepeat, setVolume, toggleLike, setBufferedPercent, bufferedPercent,
  } = usePlayerStore();

  const isLiked      = currentTrack ? likedIds.includes(currentTrack.id) : false;
  const totalDur     = (Number.isFinite(duration) && duration > 0) ? duration : (currentTrack?.duration || 1);
  const pct          = (progress / totalDur) * 100;

  const finishCurrentTrack = useCallback(() => {
    if (finishHandledRef.current) return;
    finishHandledRef.current = true;

    if (repeat === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        setProgress(0);
        finishHandledRef.current = false;
        setPlaying(true);
        audio.play().catch(() => setPlaying(false));
      }
      return;
    }

    playNext();
  }, [playNext, repeat, setPlaying]);

  // Load comments on mount or currentTrack change
  useEffect(() => {
    if (!currentTrack) return;
    const stored = localStorage.getItem("lofi-comments");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setComments(parsed[currentTrack.id] || []);
      } catch (_) {
        setComments([]);
      }
    } else {
      setComments([]);
    }
  }, [currentTrack?.id, isExpanded]);

  const handlePostComment = () => {
    if (!newComment.trim() || !currentTrack) return;
    const newCommentObj = {
      id: Math.random().toString(36).substring(2, 9),
      user: "rishavraj",
      text: newComment.trim(),
      time: "Just now",
    };
    const updated = [newCommentObj, ...comments];
    setComments(updated);
    setNewComment("");

    // Write back to localStorage
    const stored = localStorage.getItem("lofi-comments");
    let parsed: Record<string, any[]> = {};
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch (_) {}
    }
    parsed[currentTrack.id] = updated;
    localStorage.setItem("lofi-comments", JSON.stringify(parsed));
  };

  // ─── Volume sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // ─── Speed sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // ─── Load track ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.streamUrl || `/api/stream/${currentTrack.id}`;
    audio.playbackRate = playbackSpeed;
    finishHandledRef.current = false;
    retryCountRef.current = 0;
    setProgress(0);
    setBufferedPercent(0);
    if (isPlaying) audio.play().catch(() => setPlaying(false));
    fetch(`/api/track/${currentTrack.id}/play`, { method: "POST" }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // ─── Play/Pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.play().catch(() => setPlaying(false)); }
    else audio.pause();
  }, [isPlaying, setPlaying]);

  // ─── Waveform loop ───────────────────────────────────────────────────────
  useEffect(() => {
    const heights = getTrackWaveform(currentTrack?.title || "default", BAR_COUNT);
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      barsRef.current.forEach((el, i) => {
        if (el && heights[i]) el.style.height = `${heights[i] * 24}px`;
      });
      return;
    }
    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      barsRef.current.forEach((el, i) => {
        if (!el) return;
        const h = heights[i] || 0.5;
        const raw = 50 + Math.sin(Date.now() / 150 + i * 0.5) * 35 + Math.random() * 15;
        const played = (i / BAR_COUNT) < (pct / 100);
        const factor = 0.5 + (raw / 255) * 0.8;
        el.style.height          = `${h * factor * 24}px`;
        el.style.backgroundColor = played ? "#ff7a8a" : "rgba(255,255,255,0.2)";
      });
    };
    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, pct, currentTrack?.title]);

  // ─── Static colour update when paused ────────────────────────────────────
  useEffect(() => {
    if (isPlaying) return;
    const heights = getTrackWaveform(currentTrack?.title || "default", BAR_COUNT);
    barsRef.current.forEach((el, i) => {
      if (!el) return;
      const played = (i / BAR_COUNT) < (pct / 100);
      el.style.backgroundColor = played ? "#ff7a8a" : "rgba(255,255,255,0.2)";
      if (heights[i]) el.style.height = `${heights[i] * 24}px`;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, isPlaying, currentTrack?.title]);

  // ─── Buffered ────────────────────────────────────────────────────────────
  const onProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio?.duration || !audio.buffered.length) return;
    setBufferedPercent((audio.buffered.end(audio.buffered.length - 1) / audio.duration) * 100);
  }, [setBufferedPercent]);

  const onTimeUpdate = useCallback((audio: HTMLAudioElement) => {
    setProgress(audio.currentTime);
  }, []);

  const finishIfNearEnd = useCallback(() => {
    const audio = audioRef.current;
    const audioDuration = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;

    if (audio && audioDuration > 0 && audioDuration - audio.currentTime <= 2) {
      finishCurrentTrack();
      return true;
    }

    return false;
  }, [duration, finishCurrentTrack]);

  const onPlaybackError = useCallback(() => {
    if (finishIfNearEnd()) return;
    
    const audio = audioRef.current;
    if (audio && currentTrack) {
      if (retryCountRef.current < 3) {
        retryCountRef.current += 1;
        console.warn(`Stream dropped, attempting resume (${retryCountRef.current}/3)...`);
        
        const currentTime = audio.currentTime;
        audio.src = (currentTrack.streamUrl || `/api/stream/${currentTrack.id}`) + `?retry=${Date.now()}`;
        audio.load();
        
        const onReady = () => {
          audio.currentTime = currentTime;
          audio.play().catch(() => setPlaying(false));
          audio.removeEventListener("loadedmetadata", onReady);
        };
        audio.addEventListener("loadedmetadata", onReady);
        return;
      }
    }
    
    setPlaying(false);
  }, [finishIfNearEnd, setPlaying, currentTrack]);

  // ─── Seek ────────────────────────────────────────────────────────────────
  function seekAt(clientX: number) {
    const bar = seekRef.current, audio = audioRef.current;
    if (!bar || !audio || !currentTrack) return;
    const r  = bar.getBoundingClientRect();
    const rt = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const t  = (Number.isFinite(duration) && duration > 0) ? duration : (currentTrack.duration || 0);
    if (t > 0) { audio.currentTime = rt * t; setProgress(rt * t); }
  }

  function toggleMute() {
    if (isMuted) { setIsMuted(false); setVolume(prevVol); }
    else         { setPrevVol(volume); setIsMuted(true); }
  }

  const fmt = (v: number) => {
    if (!Number.isFinite(v) || v < 0) return "0:00";
    return `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, "0")}`;
  };

  const pillBg: React.CSSProperties = {
    background:     "linear-gradient(145deg, #1c1c24 0%, #141724 100%)",
    border:         "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(24px)",
    boxShadow:      "0 12px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",
  };

  const goldBtn: React.CSSProperties = {
    background: "linear-gradient(135deg, #ff7a8a 0%, #ff6b7d 100%)",
    boxShadow:  "0 2px 12px rgba(255,122,138,0.35)",
  };

  // ─── Shared waveform element ──────────────────────────────────────────────
  const WaveSeek = ({ className = "" }: { className?: string }) => {
    const heights = useMemo(() => {
      return getTrackWaveform(currentTrack?.title || "default", BAR_COUNT);
    }, [currentTrack?.title]);

    return (
      <div
        ref={seekRef}
        className={`flex items-end gap-[2.5px] cursor-pointer select-none min-w-0 overflow-hidden ${className}`}
        onMouseDown={(e) => { setDragging(true); seekAt(e.clientX); }}
        onMouseMove={(e) => { if (dragging) seekAt(e.clientX); }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={(e) => seekAt(e.touches[0].clientX)}
        onTouchMove={(e) => seekAt(e.touches[0].clientX)}
        onClick={(e) => seekAt(e.clientX)}
      >
        {heights.map((h: number, i: number) => {
          const played = (i / BAR_COUNT) < (pct / 100);
          return (
            <div
              key={i}
              ref={(el) => { barsRef.current[i] = el; }}
              className="flex-1 rounded-full"
              style={{
                height: `${h * 24}px`,
                backgroundColor: played ? "#ff7a8a" : "rgba(255,255,255,0.2)",
                minWidth: "2px",
                transition: "background-color 80ms, height 80ms"
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <footer className={visuallyHidden ? "sr-only" : "fixed inset-x-0 bottom-0 z-40 flex w-full justify-center pointer-events-auto"}>
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onProgress={onProgress}
        onEnded={finishCurrentTrack}
        onError={onPlaybackError}
        onStalled={finishIfNearEnd}
        onWaiting={finishIfNearEnd}
      />

      {/* ═══════════ MOBILE  (< sm) ═══════════════════════════════════════ */}
      {currentTrack && (
        <div className="sm:hidden w-full select-none">
          {/* Floating capsule mini-player matching mockup */}
          <div
            onClick={() => setIsExpanded(true)}
            className="pointer-events-auto fixed bottom-[84px] left-3 right-3 rounded-full bg-yellow-100 text-black py-2 px-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-neutral-200 cursor-pointer"
            style={{ maxWidth: "480px", margin: "0 auto" }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden shadow-md bg-black/10 relative">
                <TrackArt src={currentTrack.cover} alt={currentTrack.title} size={40} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-neutral-900 leading-tight">{currentTrack.title}</p>
                <p className="truncate text-[10px] text-neutral-500 font-medium leading-tight mt-0.5">{currentTrack.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => toggleLike(currentTrack.id)} className="p-2 text-neutral-500 active:scale-95 transition">
                {isLiked ? <Heart size={16} className="fill-red-500 text-red-500" /> : <Heart size={16} />}
              </button>
              <button
                onClick={togglePlaying}
                className="h-9 w-9 rounded-full bg-neutral-900 text-white flex items-center justify-center active:scale-90 transition shadow-sm"
              >
                {isPlaying ? <Pause size={14} className="fill-white text-white" /> : <Play size={14} className="fill-white text-white ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Full-screen Now Playing Overlay matching mockup */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className="pointer-events-auto fixed inset-0 z-50 flex flex-col select-none text-white overflow-y-auto pb-8 px-6 pt-12 scrollbar-none"
                style={{
                  background: `radial-gradient(circle at top, ${currentTrack ? hashColorFromString(currentTrack.title + currentTrack.artist) : "hsl(210, 30%, 8%)"} 0%, #060606 80%)`,
                }}
              >
                {/* Header */}
                <header className="flex items-center justify-between w-full">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:text-white"
                  >
                    <ChevronDown size={24} />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Now Playing</span>
                  </div>
                  <button className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:text-white">
                    <ListMusic size={20} />
                  </button>
                </header>

                {/* Cover art with glow */}
                <div className="my-auto flex flex-col items-center justify-center relative">
                  <div
                    className="absolute w-[260px] h-[260px] rounded-full filter blur-[60px] opacity-40 mix-blend-screen scale-110"
                    style={{
                      backgroundImage: `url(${currentTrack.cover})`,
                      backgroundSize: "cover",
                    }}
                  />
                  <div className="w-[80vw] h-[80vw] max-w-[320px] max-h-[320px] rounded-[32px] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.8)] border border-white/10 relative z-10">
                    <TrackArt src={currentTrack.cover} alt={currentTrack.title} size={320} />
                  </div>
                </div>

                {/* Track details, Waveform and Control Panel */}
                <div className="flex flex-col gap-6 w-full">
                  {/* Title & Artist */}
                  <div className="flex items-center justify-between w-full px-2">
                    <button onClick={() => toggleLike(currentTrack.id)} className="text-gray-400 hover:text-white transition p-2">
                      {isLiked ? <Heart size={22} className="fill-red-500 text-red-500" /> : <Heart size={22} />}
                    </button>
                    <div className="flex flex-col items-center text-center min-w-0 max-w-[70%]">
                      <h3 className="text-xl font-extrabold text-white truncate w-full tracking-wide drop-shadow-md">
                        {currentTrack.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1.5 font-medium truncate w-full">
                        {currentTrack.artist}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-white transition p-2">
                      <MoreHorizontal size={22} />
                    </button>
                  </div>

                  {/* Normal Seeker Timeline with Dancing Beat Indicator */}
                  <div className="w-full px-2">
                    <div
                      ref={seekRef}
                      className="relative w-full py-4 cursor-pointer select-none group pointer-events-auto"
                      onMouseDown={(e) => { e.stopPropagation(); setDragging(true); seekAt(e.clientX); }}
                      onMouseMove={(e) => { e.stopPropagation(); if (dragging) seekAt(e.clientX); }}
                      onMouseUp={(e) => { e.stopPropagation(); setDragging(false); }}
                      onMouseLeave={(e) => { e.stopPropagation(); setDragging(false); }}
                      onTouchStart={(e) => { e.stopPropagation(); seekAt(e.touches[0].clientX); }}
                      onTouchMove={(e) => { e.stopPropagation(); seekAt(e.touches[0].clientX); }}
                      onClick={(e) => { e.stopPropagation(); seekAt(e.clientX); }}
                    >
                      {/* Background track line */}
                      <div className="h-[4px] bg-white/20 rounded-full w-full overflow-hidden relative">
                        {/* Buffered progress */}
                        <div className="absolute top-0 bottom-0 left-0 bg-white/10 rounded-full" style={{ width: `${bufferedPercent}%` }} />
                        {/* Active progress */}
                        <div className="absolute top-0 bottom-0 left-0 bg-[#ff7a8a] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      
                      {/* Thumb handle */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-neutral-300 transition-transform duration-150 group-hover:scale-125"
                        style={{ left: `calc(${pct}% - 7px)` }}
                      />

                      {/* The dancing beat equalizer indicator sitting on top of the progress line */}
                      {isPlaying && (
                        <div
                          className="absolute -top-1.5 -translate-x-1/2 flex items-end gap-[1.5px] h-3.5 pointer-events-none"
                          style={{ left: `${pct}%` }}
                        >
                          <div className="w-[1.5px] bg-[#ff7a8a] rounded-full animate-jingle-1 shadow-[0_0_6px_#ff7a8a50]" style={{ height: "14px" }} />
                          <div className="w-[1.5px] bg-[#ff7a8a] rounded-full animate-jingle-2 shadow-[0_0_6px_#ff7a8a50]" style={{ height: "14px" }} />
                          <div className="w-[1.5px] bg-[#ff7a8a] rounded-full animate-jingle-3 shadow-[0_0_6px_#ff7a8a50]" style={{ height: "14px" }} />
                          <div className="w-[1.5px] bg-[#ff7a8a] rounded-full animate-jingle-4 shadow-[0_0_6px_#ff7a8a50]" style={{ height: "14px" }} />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-1 px-0.5">
                      <span className="text-[10px] text-gray-400 font-bold tabular-nums">{fmt(progress)}</span>
                      <span className="text-[10px] text-gray-400 font-bold tabular-nums">{fmt(totalDur)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between w-full px-4 mt-2">
                    <button
                      onClick={toggleShuffle}
                      className={`transition p-2 ${shuffle ? "text-[#ff7a8a]" : "text-gray-400"}`}
                    >
                      <Shuffle size={20} className={shuffle ? "filter drop-shadow-[0_0_8px_rgba(255,122,138,0.5)]" : ""} />
                    </button>

                    <button onClick={playPrevious} className="text-white hover:text-[#ff7a8a] transition p-2">
                      <SkipBack size={26} className="fill-current" />
                    </button>

                    <button
                      onClick={togglePlaying}
                      className="h-16 w-16 rounded-full bg-white text-black flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-[0_0_24px_rgba(255,255,255,0.2)]"
                    >
                      {isPlaying ? (
                        <Pause size={24} className="fill-black text-black" />
                      ) : (
                        <Play size={24} className="fill-black text-black ml-1" />
                      )}
                    </button>

                    <button onClick={() => playNext()} className="text-white hover:text-[#ff7a8a] transition p-2">
                      <SkipForward size={26} className="fill-current" />
                    </button>

                    <button
                      onClick={cycleRepeat}
                      className={`transition p-2 ${repeat !== "off" ? "text-[#ff7a8a]" : "text-gray-400"}`}
                    >
                      {repeat === "one" ? <Repeat1 size={20} /> : <Repeat size={20} />}
                    </button>
                  </div>

                  {/* Song Community section for this track */}
                  <div className="w-full flex flex-col gap-4 mt-8 pb-12">
                    <div className="w-full h-[1px] bg-white/10 my-2" />
                    
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-[#ff7a8a]" />
                      <span className="font-extrabold text-sm text-white">Song Discussion</span>
                      <span className="text-[10px] text-[#ff7a8a] font-bold uppercase tracking-wider ml-auto">{comments.length} comments</span>
                    </div>
                    
                    {/* Comment input */}
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(); }}
                        placeholder="Say something about this track..."
                        className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5 text-xs outline-none focus:border-[#ff7a8a]/30 transition"
                      />
                      <button 
                        onClick={handlePostComment}
                        className="px-4 py-1.5 rounded-xl bg-[#ff7a8a] text-black font-extrabold text-xs hover:bg-[#ff9aa6] transition"
                      >
                        Post
                      </button>
                    </div>

                    {/* Comments list */}
                    <div className="flex flex-col gap-2 mt-2">
                      {comments.length === 0 ? (
                        <p className="text-center text-[10px] text-white/30 py-6">No thoughts shared yet. Be the first!</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-1.5 animate-fadeIn">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-extrabold text-[#ff7a8a]">{comment.user}</span>
                              <span className="text-[8px] text-white/40">{comment.time}</span>
                            </div>
                            <p className="text-[11px] text-white/80 leading-relaxed font-medium">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══════════ TABLET / DESKTOP  (sm+) ═══════════════════════════════ */}
      <div
        className="pointer-events-auto hidden sm:flex flex-col w-full rounded-2xl select-none overflow-hidden"
        style={{ ...pillBg, maxWidth: "860px" }}
      >
        {/* Top row: all controls in one line */}
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 pt-3 pb-1.5">
          {/* Art */}
          <div className="h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-xl overflow-hidden shadow-md bg-[#282828]">
            {currentTrack
              ? <TrackArt src={currentTrack.cover} alt={currentTrack.title} size={40} />
              : <div className="h-full w-full bg-[#2d2d1f]" />}
          </div>

          {/* Title */}
          <div className="min-w-0 w-28 md:w-36 shrink-0">
            <p className="truncate text-[11px] md:text-xs font-bold text-white leading-tight">
              {currentTrack?.title ?? "Nothing playing"}
            </p>
            <p className="truncate text-[9px] md:text-[10px] text-white/45 leading-tight mt-0.5">
              {currentTrack?.artist ?? ""}
            </p>
          </div>

          {/* Shuffle */}
          <button onClick={toggleShuffle} className={`shrink-0 transition hidden md:block ${shuffle ? "text-[#ff7a8a]" : "text-white/40 hover:text-white"}`}>
            <Shuffle size={13} />
          </button>
 
          {/* ⏮ */}
          <button onClick={playPrevious} className="shrink-0 text-white/60 hover:text-white transition">
            <SkipBack size={15} className="fill-current" />
          </button>
 
          {/* ▶ */}
          <button
            onClick={togglePlaying}
            disabled={!currentTrack}
            className="shrink-0 h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center transition hover:scale-105 active:scale-95 disabled:opacity-40"
            style={goldBtn}
          >
            {isPlaying
              ? <Pause size={15} className="fill-[#090a10] text-[#090a10]" />
              : <Play  size={15} className="fill-[#090a10] text-[#090a10] ml-0.5" />}
          </button>
 
          {/* ⏭ */}
          <button onClick={() => playNext()} className="shrink-0 text-white/60 hover:text-white transition">
            <SkipForward size={15} className="fill-current" />
          </button>
 
          {/* Repeat */}
          <button onClick={cycleRepeat} className={`shrink-0 transition hidden md:block ${repeat !== "off" ? "text-[#ff7a8a]" : "text-white/40 hover:text-white"}`}>
            {repeat === "one" ? <Repeat1 size={13} /> : <Repeat size={13} />}
          </button>
 
          {/* Waveform — takes remaining space */}
          <WaveSeek className="flex-1 h-8 mx-1" />
 
          {/* Time */}
          <span className="text-[9px] md:text-[10px] text-white/40 tabular-nums shrink-0 hidden md:block w-20 text-right">
            {fmt(progress)} / {fmt(totalDur)}
          </span>
 
          {/* Like */}
          {currentTrack && (
            <button onClick={() => toggleLike(currentTrack.id)} className="shrink-0 text-white/50 hover:text-white transition">
              {isLiked ? <CheckCircle2 size={14} className="text-[#ff7a8a]" /> : <Heart size={14} />}
            </button>
          )}
 
          {/* Volume */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={toggleMute} className="text-white/45 hover:text-white transition">
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range" min={0} max={1} step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => { setIsMuted(false); setVolume(Number(e.target.value)); }}
              className="w-16 md:w-20 h-[3px] rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right,#ff7a8a ${(isMuted?0:volume)*100}%,rgba(255,255,255,0.15) ${(isMuted?0:volume)*100}%)` }}
            />
          </div>
        </div>
 
        {/* Thin progress strip at bottom of card */}
        <div className="h-[3px] w-full bg-white/5">
          <div className="h-full bg-[#ff7a8a]/50 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </footer>
  );
}
