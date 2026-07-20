"use client";

import Link from "next/link";
import { Home, Compass, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 md:px-6 lg:px-8 py-12 md:py-16 text-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating stars */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
            }}
          />
        ))}
        {/* Gradient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-brand-secondary/5 blur-[100px]" />
      </div>

      {/* Illustration */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mb-6 md:mb-8"
      >
        <div className="relative">
          <img
            src="/404-astronaut.png"
            alt="404 Astronaut"
            className="w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 object-contain mx-auto drop-shadow-[0_0_40px_rgba(212,54,122,0.2)]"
          />
          {/* Floating 404 badge */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-2 -right-2 md:top-0 md:right-0"
          >
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-lg md:text-2xl font-black px-3 md:px-4 py-1 md:py-1.5 rounded-2xl shadow-lg shadow-brand-primary/30 border border-white/10">
              404
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="relative z-10 mb-8 md:mb-10"
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 md:mb-4">
          <span className="text-white">Oops! Page </span>
          <span className="text-brand-primary">not found</span>
        </h1>
        <p className="text-sm md:text-base text-brand-muted max-w-sm mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="relative z-10 flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md"
      >
        <Link
          href="/"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/25 text-sm md:text-base"
        >
          <Home className="w-4 h-4 md:w-5 md:h-5" />
          Go Home
        </Link>
        <Link
          href="/explore"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-highlight border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/5 hover:border-white/20 active:scale-[0.98] transition-all text-sm md:text-base"
        >
          <Compass className="w-4 h-4 md:w-5 md:h-5" />
          Explore Music
        </Link>
      </motion.div>
    </div>
  );
}
