"use client";

import { Bell, Database, Gauge, SlidersHorizontal, WifiOff } from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";
import type { AudioQuality } from "@/types/music";

const qualityOptions: AudioQuality[] = ["low", "balanced", "high", "auto"];

export function SettingsPanel() {
  const {
    quality,
    crossfade,
    cacheSizeMb,
    playbackSpeed,
    dataSaver,
    notifications,
    setQuality,
    setCrossfade,
    setCacheSize,
    setPlaybackSpeed,
    toggleDataSaver,
    toggleNotifications
  } = useSettingsStore();

  return (
    <div className="mx-auto grid max-w-5xl gap-4">
      <h2 className="text-3xl font-semibold">Settings</h2>

      <section className="rounded-md border border-ink/10 bg-white p-4">
        <div className="mb-4 flex items-center gap-2">
          <Gauge size={19} />
          <h3 className="font-semibold">Audio Quality</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {qualityOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setQuality(option)}
              className={`h-10 rounded-md border text-sm capitalize ${
                quality === option
                  ? "border-lagoon bg-lagoon text-white"
                  : "border-ink/10 bg-paper text-ink/70 hover:border-lagoon/40"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RangeSetting
          icon={<SlidersHorizontal size={19} />}
          label="Crossfade"
          value={crossfade}
          min={0}
          max={10}
          step={1}
          suffix="s"
          onChange={setCrossfade}
        />
        <RangeSetting
          icon={<Database size={19} />}
          label="Cache Size"
          value={cacheSizeMb}
          min={128}
          max={2048}
          step={128}
          suffix="MB"
          onChange={setCacheSize}
        />
        <RangeSetting
          icon={<Gauge size={19} />}
          label="Playback Speed"
          value={playbackSpeed}
          min={0.75}
          max={1.5}
          step={0.05}
          suffix="x"
          onChange={setPlaybackSpeed}
        />
        <div className="rounded-md border border-ink/10 bg-white p-4">
          <ToggleRow
            icon={<WifiOff size={19} />}
            label="Data Saver"
            checked={dataSaver}
            onToggle={toggleDataSaver}
          />
          <div className="mt-4 border-t border-ink/10 pt-4">
            <ToggleRow
              icon={<Bell size={19} />}
              label="Notifications"
              checked={notifications}
              onToggle={toggleNotifications}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

type RangeSettingProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
};

function RangeSetting({ icon, label, value, min, max, step, suffix, onChange }: RangeSettingProps) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold">{label}</h3>
        </div>
        <span className="rounded-md bg-paper px-3 py-1 text-sm text-ink/60">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-lagoon"
      />
    </div>
  );
}

type ToggleRowProps = {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onToggle: () => void;
};

function ToggleRow({ icon, label, checked, onToggle }: ToggleRowProps) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left">
      <span className="flex items-center gap-2 font-semibold">
        {icon}
        {label}
      </span>
      <span
        className={`flex h-7 w-12 items-center rounded-full px-1 transition ${
          checked ? "justify-end bg-moss" : "justify-start bg-ink/15"
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  );
}
