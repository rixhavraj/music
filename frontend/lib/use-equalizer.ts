"use client";

import { useEffect, useRef, useCallback } from "react";

// ─── EQ band presets ──────────────────────────────────────────────────────────

export interface EqBand {
  frequency: number; // Hz
  gain: number;      // dB, -12 to +12
  type: BiquadFilterType;
}

export const DEFAULT_EQ_BANDS: EqBand[] = [
  { frequency: 60,   gain: 0, type: "lowshelf" },
  { frequency: 170,  gain: 0, type: "peaking" },
  { frequency: 310,  gain: 0, type: "peaking" },
  { frequency: 600,  gain: 0, type: "peaking" },
  { frequency: 1000, gain: 0, type: "peaking" },
  { frequency: 3000, gain: 0, type: "peaking" },
  { frequency: 6000, gain: 0, type: "peaking" },
  { frequency: 12000, gain: 0, type: "peaking" },
  { frequency: 14000, gain: 0, type: "peaking" },
  { frequency: 16000, gain: 0, type: "highshelf" },
];

export const EQ_PRESETS: Record<string, number[]> = {
  Flat:      [0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  Bass:      [8,  7,  4,  1,  0,  0,  0,  0,  0,  0],
  Treble:    [0,  0,  0,  0,  0,  2,  4,  6,  6,  7],
  Vocal:     [0,  0,  0,  2,  4,  4,  3,  1,  0,  0],
  Pop:       [-1,  2,  4,  4,  2,  0, -1, -1, -1, -1],
  Rock:      [5,  4,  2,  0, -1, -1,  0,  2,  4,  5],
  Electronic:[5,  4,  0, -3,  0,  3,  5,  4,  3,  2],
  Classical: [0,  0,  0,  0,  0,  0, -1, -1, -1, -2],
  Jazz:      [0,  0,  1,  2,  2,  2,  1,  1,  1,  0],
  HipHop:    [5,  4,  2,  2,  0, -1, -1,  1,  2,  3],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Connects a Web Audio API processing chain (EQ + compressor + gain) to an
 * existing HTMLAudioElement. Returns controls to update individual bands,
 * apply presets, and adjust master gain / bass boost.
 */
export function useAudioEqualizer(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const connectedRef = useRef(false);

  // Build the audio graph lazily on first user interaction
  const initGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || connectedRef.current) return;
    if (typeof AudioContext === "undefined") return;

    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const source = ctx.createMediaElementSource(audio);
      sourceRef.current = source;

      // Build EQ filter chain
      const filters = DEFAULT_EQ_BANDS.map((band) => {
        const filter = ctx.createBiquadFilter();
        filter.type = band.type;
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        filter.Q.value = 1.4;
        return filter;
      });
      filtersRef.current = filters;

      // Master gain
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;

      // Compressor for loudness normalization
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      // Connect: source → filters chain → gain → compressor → destination
      let node: AudioNode = source;
      for (const filter of filters) {
        node.connect(filter);
        node = filter;
      }
      node.connect(gainNode);
      gainNode.connect(compressor);
      compressor.connect(ctx.destination);

      connectedRef.current = true;
    } catch (err) {
      console.warn("Web Audio API init failed:", err);
    }
  }, [audioRef]);

  // Initialize on first play
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handler = () => {
      initGraph();
      if (ctxRef.current?.state === "suspended") {
        ctxRef.current.resume();
      }
    };

    audio.addEventListener("play", handler, { once: false });
    return () => audio.removeEventListener("play", handler);
  }, [audioRef, initGraph]);

  // ─── Band controls ─────────────────────────────────────────────────────────

  const setBandGain = useCallback((bandIndex: number, gainDb: number) => {
    const filter = filtersRef.current[bandIndex];
    if (filter) {
      filter.gain.value = Math.max(-12, Math.min(12, gainDb));
    }
  }, []);

  const applyPreset = useCallback((presetName: string) => {
    const gains = EQ_PRESETS[presetName];
    if (!gains) return;
    gains.forEach((gain, i) => setBandGain(i, gain));
  }, [setBandGain]);

  const setMasterGain = useCallback((gain: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = Math.max(0, Math.min(2, gain));
    }
  }, []);

  const setBassBoost = useCallback((boost: number) => {
    // Boost the first two bands (60Hz + 170Hz)
    setBandGain(0, boost);
    setBandGain(1, boost * 0.7);
  }, [setBandGain]);

  const resetEq = useCallback(() => {
    filtersRef.current.forEach((f) => { f.gain.value = 0; });
    if (gainNodeRef.current) gainNodeRef.current.gain.value = 1;
  }, []);

  return { setBandGain, applyPreset, setMasterGain, setBassBoost, resetEq, initGraph };
}
