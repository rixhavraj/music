"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { 
  Heart, MoreHorizontal, Shuffle, SkipBack, Play, Pause, 
  SkipForward, Repeat, Repeat1, Volume2, VolumeX, ListMusic 
} from "lucide-react";
import { usePlayerStore } from "@/store/player-store";

export function BottomPlayer() {
  const {
    currentTrack, isPlaying, shuffle, repeat, volume, likedIds,
    playbackSpeed, togglePlaying, setPlaying, playNext, playPrevious,
    toggleShuffle, cycleRepeat, setVolume, toggleLike, setBufferedPercent, bufferedPercent,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seekRef = useRef<HTMLDivElement | null>(null);
  const finishHandledRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(0.78);
  const [dragging, setDragging] = useState(false);

  const isLiked = currentTrack ? likedIds.includes(currentTrack.id) : false;
  const totalDur = (Number.isFinite(duration) && duration > 0) ? duration : (currentTrack?.duration || 1);
  const pct = (progress / totalDur) * 100;

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

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.streamUrl || `/api/stream/${currentTrack.id}`;
    audio.playbackRate = playbackSpeed;
    finishHandledRef.current = false;
    setProgress(0);
    setBufferedPercent(0);
    if (isPlaying) audio.play().catch(() => setPlaying(false));
    fetch(`/api/track/${currentTrack.id}/play`, { method: "POST" }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.play().catch(() => setPlaying(false)); }
    else audio.pause();
  }, [isPlaying, setPlaying]);

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
    setPlaying(false);
  }, [finishIfNearEnd, setPlaying]);

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

  return (
    <div className="h-24 bg-brand-surface border-t border-white/5 flex items-center justify-between px-6 rounded-t-3xl shadow-player z-50">
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
      
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        {currentTrack ? (
          <>
            <img src={currentTrack.cover || "https://picsum.photos/seed/track/60/60"} alt={currentTrack.title} className="w-14 h-14 rounded-lg object-cover shadow-md" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold truncate">{currentTrack.title}</h4>
              <p className="text-xs text-brand-muted truncate">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-2 text-brand-muted">
              <button onClick={() => toggleLike(currentTrack.id)} className={`transition ${isLiked ? "text-brand-primary" : "hover:text-brand-primary"}`}>
                <Heart className={`w-5 h-5 ${isLiked ? "fill-brand-primary" : ""}`} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 text-sm text-brand-muted">Nothing playing</div>
        )}
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center justify-center flex-[2] max-w-3xl px-12">
        <div className="flex items-center gap-6 mb-3">
          <button onClick={toggleShuffle} className={`transition ${shuffle ? "text-brand-primary" : "text-brand-muted hover:text-white"}`}>
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={playPrevious} className="text-white hover:text-brand-primary transition">
            <SkipBack className="w-5 h-5" fill="currentColor" />
          </button>
          
          <button 
            onClick={togglePlaying}
            disabled={!currentTrack}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,122,138,0.3)] hover:scale-105 hover:shadow-[0_0_25px_rgba(255,122,138,0.5)] transition-all disabled:opacity-50"
          >
            {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6 ml-1" fill="currentColor" />}
          </button>
          
          <button onClick={() => playNext()} className="text-white hover:text-brand-primary transition">
            <SkipForward className="w-5 h-5" fill="currentColor" />
          </button>
          <button onClick={cycleRepeat} className={`transition ${repeat !== "off" ? "text-brand-primary" : "text-brand-muted hover:text-white"}`}>
            {repeat === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full flex items-center gap-4 text-xs text-brand-muted font-medium">
          <span className="w-10 text-right">{fmt(progress)}</span>
          <div 
            ref={seekRef}
            className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative group cursor-pointer"
            onMouseDown={(e) => { setDragging(true); seekAt(e.clientX); }}
            onMouseMove={(e) => { if (dragging) seekAt(e.clientX); }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onClick={(e) => seekAt(e.clientX)}
          >
            <div className="absolute top-0 bottom-0 left-0 bg-white/20" style={{ width: `${bufferedPercent}%` }} />
            <div className="absolute top-0 bottom-0 left-0 bg-brand-primary group-hover:bg-brand-secondary transition-colors" style={{ width: `${pct}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${pct}% - 6px)` }} />
          </div>
          <span className="w-10 text-left">{fmt(totalDur)}</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="flex items-center justify-end gap-4 w-1/4 min-w-[200px] text-brand-muted">
        {isPlaying && (
          <div className="hidden lg:flex items-center gap-1 h-8 px-3 rounded-full bg-brand-highlight text-xs font-medium text-brand-primary border border-brand-primary/20">
            <div className="flex gap-[2px] items-end h-3">
              <div className="w-[2px] bg-brand-primary animate-jingle-1" />
              <div className="w-[2px] bg-brand-primary animate-jingle-2" />
              <div className="w-[2px] bg-brand-primary animate-jingle-3" />
              <div className="w-[2px] bg-brand-primary animate-jingle-4" />
            </div>
          </div>
        )}
        
        <button onClick={toggleMute} className="hover:text-white transition">
          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer relative"
             onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
                setIsMuted(false);
                setVolume(v);
             }}>
          <div className="absolute top-0 bottom-0 left-0 bg-brand-text rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
        </div>
        <button className="hover:text-white transition ml-2"><ListMusic className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
