"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Bell,
  Database,
  Gauge,
  SlidersHorizontal,
  WifiOff,
  Music2,
  Trash2,
  Download,
  BarChart3,
  Zap,
  Shield,
  HardDrive,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import { useAudioEqualizer, EQ_PRESETS, DEFAULT_EQ_BANDS } from "@/lib/use-equalizer";
import {
  getCacheMeta,
  clearAudioCache,
  evictTrack,
  getTotalCacheSizeBytes,
} from "@/lib/offline-cache";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-[#181818] border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3 font-bold text-white">
          <span className="text-[#1db954]">{icon}</span>
          {title}
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-5 pb-5 flex flex-col gap-4">{children}</div>}
    </div>
  );
}

// ─── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${checked ? "bg-[#1db954]" : "bg-[#3d3d3d]"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

// ─── Slider row ────────────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-400 w-32 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 appearance-none rounded bg-[#4d4d4d] cursor-pointer"
        style={{
          background: `linear-gradient(to right, #1db954 0%, #1db954 ${((value - min) / (max - min)) * 100}%, #4d4d4d ${((value - min) / (max - min)) * 100}%, #4d4d4d 100%)`,
        }}
      />
      <span className="text-sm text-white font-mono w-16 text-right">
        {value}{suffix}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SettingsPanelV2() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { setBandGain, applyPreset, setMasterGain, setBassBoost, resetEq } = useAudioEqualizer(audioRef);

  const {
    volume,
    playbackSpeed,
    audioQuality,
    crossfadeDuration,
    sleepTimer,
    setVolume,
    setPlaybackSpeed,
    setAudioQuality,
    setCrossfadeDuration,
    setSleepTimer,
  } = usePlayerStore();

  const [eqGains, setEqGains] = useState<number[]>(DEFAULT_EQ_BANDS.map((b) => b.gain));
  const [selectedPreset, setSelectedPreset] = useState("Flat");
  const [bassBoost, setBassBoostState] = useState(0);
  const [masterGain, setMasterGainState] = useState(1.0);
  const [notifications, setNotifications] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [cachedTracks, setCachedTracks] = useState(getCacheMeta());
  const [cacheClearing, setCacheClearing] = useState(false);

  const handleBandChange = useCallback((index: number, gain: number) => {
    setBandGain(index, gain);
    setEqGains((prev) => prev.map((g, i) => (i === index ? gain : g)));
    setSelectedPreset("Custom");
  }, [setBandGain]);

  const handlePreset = useCallback((name: string) => {
    applyPreset(name);
    const gains = EQ_PRESETS[name];
    if (gains) {
      setEqGains(gains);
      setSelectedPreset(name);
    }
  }, [applyPreset]);

  const handleResetEq = useCallback(() => {
    resetEq();
    setEqGains(DEFAULT_EQ_BANDS.map((b) => b.gain));
    setSelectedPreset("Flat");
    setBassBoostState(0);
    setMasterGainState(1.0);
  }, [resetEq]);

  const handleClearCache = async () => {
    setCacheClearing(true);
    await clearAudioCache();
    setCachedTracks([]);
    setCacheClearing(false);
  };

  const handleEvictTrack = async (trackId: string) => {
    await evictTrack(trackId);
    setCachedTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  const totalCacheSize = getTotalCacheSizeBytes();
  const cacheSizeMb = (totalCacheSize / 1024 / 1024).toFixed(1);

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto px-6 py-6 pb-32">
      <h2 className="text-2xl font-extrabold text-white">Settings</h2>

      {/* ── Equalizer ────────────────────────────────────────────────────── */}
      <Section icon={<SlidersHorizontal size={18} />} title="Equalizer">
        {/* Preset selector */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(EQ_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => handlePreset(name)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                selectedPreset === name
                  ? "bg-[#1db954] text-black"
                  : "bg-[#282828] text-gray-300 hover:bg-[#333]"
              }`}
            >
              {name}
            </button>
          ))}
          {selectedPreset === "Custom" && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white">Custom</span>
          )}
        </div>

        {/* 10-band EQ vertical sliders */}
        <div className="flex items-end justify-between gap-2 h-32 mt-2">
          {DEFAULT_EQ_BANDS.map((band, i) => (
            <div key={band.frequency} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[#1db954] text-[10px] font-bold leading-none">
                {eqGains[i] > 0 ? `+${eqGains[i]}` : eqGains[i]}
              </span>
              <div className="flex-1 flex items-center justify-center w-full relative">
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={eqGains[i]}
                  onChange={(e) => handleBandChange(i, Number(e.target.value))}
                  className="h-20 appearance-none cursor-pointer"
                  style={{
                    writingMode: "vertical-lr" as const,
                    direction: "rtl",
                    width: "100%",
                    accentColor: "#1db954",
                  }}
                />
              </div>
              <span className="text-gray-500 text-[9px] leading-none">
                {band.frequency >= 1000 ? `${band.frequency / 1000}k` : band.frequency}
              </span>
            </div>
          ))}
        </div>

        {/* Bass boost and master gain */}
        <SliderRow
          label="Bass Boost"
          value={bassBoost}
          min={0}
          max={12}
          step={1}
          suffix="dB"
          onChange={(v) => { setBassBoostState(v); setBassBoost(v); }}
        />
        <SliderRow
          label="Master Gain"
          value={masterGain}
          min={0.5}
          max={2}
          step={0.1}
          suffix="×"
          onChange={(v) => { setMasterGainState(v); setMasterGain(v); }}
        />

        <button
          onClick={handleResetEq}
          className="self-start flex items-center gap-2 text-xs text-gray-400 hover:text-white transition border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw size={12} /> Reset EQ
        </button>
      </Section>

      {/* ── Playback ──────────────────────────────────────────────────────── */}
      <Section icon={<Gauge size={18} />} title="Playback">
        <div className="grid grid-cols-2 gap-2">
          {(["auto", "low", "medium", "high"] as const).map((q) => (
            <button
              key={q}
              onClick={() => setAudioQuality(q)}
              className={`py-2 rounded-lg text-sm font-semibold capitalize transition ${
                audioQuality === q
                  ? "bg-[#1db954] text-black"
                  : "bg-[#282828] text-gray-300 hover:bg-[#333]"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <SliderRow
          label="Speed"
          value={playbackSpeed}
          min={0.5}
          max={2}
          step={0.25}
          suffix="×"
          onChange={(v) => setPlaybackSpeed(v as Parameters<typeof setPlaybackSpeed>[0])}
        />
        <SliderRow
          label="Crossfade"
          value={crossfadeDuration}
          min={0}
          max={12}
          step={1}
          suffix="s"
          onChange={setCrossfadeDuration}
        />
        <SliderRow
          label="Volume"
          value={Math.round(volume * 100)}
          min={0}
          max={100}
          step={1}
          suffix="%"
          onChange={(v) => setVolume(v / 100)}
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Sleep Timer</p>
            <p className="text-xs text-gray-400">Auto-pause after a set duration</p>
          </div>
          <select
            value={sleepTimer}
            onChange={(e) => setSleepTimer(e.target.value as Parameters<typeof setSleepTimer>[0])}
            className="bg-[#282828] text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none cursor-pointer"
          >
            <option value="off">Off</option>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
          </select>
        </div>
      </Section>

      {/* ── Offline / Downloads ────────────────────────────────────────────── */}
      <Section icon={<HardDrive size={18} />} title="Offline & Downloads">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-semibold text-white">Cached Audio</p>
            <p className="text-gray-400 text-xs">{cachedTracks.length} tracks · {cacheSizeMb} MB used</p>
          </div>
          <button
            onClick={handleClearCache}
            disabled={cacheClearing || cachedTracks.length === 0}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 disabled:opacity-40 text-xs border border-red-400/30 hover:border-red-300/50 px-3 py-1.5 rounded-lg transition"
          >
            <Trash2 size={12} />
            {cacheClearing ? "Clearing…" : "Clear Cache"}
          </button>
        </div>

        {cachedTracks.length > 0 ? (
          <div className="flex flex-col gap-2 mt-1">
            {cachedTracks.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-t border-white/5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.artist} · {(t.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button
                  onClick={() => handleEvictTrack(t.id)}
                  className="text-gray-500 hover:text-red-400 transition p-1 shrink-0 ml-3"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Download size={28} className="text-gray-600" />
            <p className="text-sm text-gray-500">No tracks cached yet</p>
            <p className="text-xs text-gray-600">Play songs to cache them for offline listening</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Data Saver</p>
            <p className="text-xs text-gray-400">Stream at lower quality to save data</p>
          </div>
          <Toggle checked={dataSaver} onChange={() => setDataSaver(!dataSaver)} />
        </div>
      </Section>

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      <Section icon={<Bell size={18} />} title="Notifications" defaultOpen={false}>
        {[
          { label: "New releases from followed artists", key: "releases" },
          { label: "Weekly recommendations ready", key: "weekly" },
          { label: "Friends follow you", key: "follows" },
          { label: "Downloads complete", key: "downloads" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <p className="text-sm text-gray-300">{item.label}</p>
            <Toggle checked={notifications} onChange={() => setNotifications(!notifications)} />
          </div>
        ))}
      </Section>

      {/* ── Privacy & Security ─────────────────────────────────────────────── */}
      <Section icon={<Shield size={18} />} title="Privacy & Security" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          {[
            { label: "Share listening activity", desc: "Let friends see what you're playing" },
            { label: "Personalised recommendations", desc: "Use your history to improve suggestions" },
            { label: "Voice search data", desc: "Save voice queries for improvement" },
          ].map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <Toggle checked={i === 1} onChange={() => {}} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Analytics info ─────────────────────────────────────────────────── */}
      <Section icon={<BarChart3 size={18} />} title="Your Stats" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Tracks Played", value: "—" },
            { label: "Hours Listened", value: "—" },
            { label: "Top Genre", value: "—" },
            { label: "Liked Songs", value: "—" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#121212] rounded-lg p-4 flex flex-col gap-1 border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-[#1db954]">{stat.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center">Stats update as you listen</p>
      </Section>
    </div>
  );
}
