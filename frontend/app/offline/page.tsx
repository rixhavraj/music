"use client";

import Link from "next/link";
import { RefreshCw, Download, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Attempt to ping the API
      const res = await fetch("/api/search?q=test&limit=1", { 
        signal: AbortSignal.timeout(5000) 
      });
      if (res.ok) {
        // Connection restored, redirect to home
        window.location.href = "/";
        return;
      }
    } catch (_) {
      // Still offline
    }
    setIsRetrying(false);
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 md:px-6 lg:px-8 py-12 md:py-16 text-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Signal wave rings */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full border border-brand-primary/10 animate-pulse" />
          <div className="absolute inset-4 md:inset-8 rounded-full border border-brand-primary/5 animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute inset-8 md:inset-16 rounded-full border border-brand-primary/5 animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        {/* Gradient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-primary/5 blur-[120px]" />
      </div>

      {/* Wifi Off Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 mb-4 md:mb-6"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-7 h-7 md:w-9 md:h-9 text-brand-primary" />
        </div>
      </motion.div>

      {/* Illustration */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="relative z-10 mb-6 md:mb-8"
      >
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/offline-astronaut.png"
            alt="Offline Astronaut"
            className="w-44 h-44 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain mx-auto drop-shadow-[0_0_40px_rgba(212,54,122,0.15)]"
          />
        </motion.div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="relative z-10 mb-8 md:mb-10"
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 md:mb-4">
          <span className="text-white">You&apos;re </span>
          <span className="text-brand-primary">Offline</span>
        </h1>
        <p className="text-sm md:text-base text-brand-muted max-w-sm mx-auto leading-relaxed">
          Looks like you&apos;re not connected to the internet.<br />
          Check your connection and try again.
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md"
      >
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/25 disabled:opacity-70 disabled:hover:scale-100 text-sm md:text-base"
        >
          <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Retrying..." : "Retry"}
        </button>
        <Link
          href="/downloads"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-highlight border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/5 hover:border-white/20 active:scale-[0.98] transition-all text-sm md:text-base"
        >
          <Download className="w-4 h-4 md:w-5 md:h-5" />
          Go to Downloads
        </Link>
      </motion.div>
    </div>
  );
}
