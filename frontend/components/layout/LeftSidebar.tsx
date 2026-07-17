"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Radio, Library, ListMusic, Heart, 
  Podcast, Users, Plus, Music2, Mic2, Disc, Download,
  Compass
} from "lucide-react";

export function LeftSidebar() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return isActive
      ? "flex items-center gap-3 px-4 py-3 text-sm font-medium bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl"
      : "flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors";
  };

  return (
    <aside className="w-64 h-full bg-brand-surface flex flex-col rounded-r-3xl border-r border-white/5 overflow-hidden">
      {/* Logo */}
      <div className="p-6 pb-2">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="flex gap-[2px] items-center text-brand-primary">
            <div className="w-1 h-3 bg-current rounded-full" />
            <div className="w-1 h-5 bg-current rounded-full" />
            <div className="w-1 h-4 bg-current rounded-full" />
            <div className="w-1 h-2 bg-current rounded-full" />
          </div>
          <span>Lofiëra</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
        {/* Main Nav */}
        <nav className="space-y-1">
          <Link href="/" className={getLinkClass("/")}>
            <Home className="w-5 h-5" />
            Home
          </Link>
          <Link href="/explore" className={getLinkClass("/explore")}>
            <Compass className="w-5 h-5" />
            Explore
          </Link>
          <Link href="/radio" className={getLinkClass("/radio")}>
            <Radio className="w-5 h-5" />
            Radio
          </Link>
        </nav>

        {/* Library Nav */}
        <nav className="space-y-1">
          <Link href="/library" className={getLinkClass("/library")}>
            <Library className="w-5 h-5" />
            Library
          </Link>
          <Link href="/playlists" className={getLinkClass("/playlists")}>
            <ListMusic className="w-5 h-5" />
            Playlists
          </Link>
          <Link href="/liked" className={getLinkClass("/liked")}>
            <Heart className="w-5 h-5" />
            Liked Songs
          </Link>
          <Link href="/podcasts" className={getLinkClass("/podcasts")}>
            <Podcast className="w-5 h-5" />
            Podcasts
          </Link>
        </nav>

        {/* Your Library */}
        <div>
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Your Library</h3>
            <button className="text-brand-muted hover:text-brand-text"><Plus className="w-4 h-4" /></button>
          </div>
          <nav className="space-y-1">
            <Link href="/songs" className={getLinkClass("/songs")}>
              <Music2 className="w-4 h-4" /> Songs
            </Link>
            <Link href="/artists" className={getLinkClass("/artists")}>
              <Mic2 className="w-4 h-4" /> Artists
            </Link>
            <Link href="/albums" className={getLinkClass("/albums")}>
              <Disc className="w-4 h-4" /> Albums
            </Link>
            <Link href="/downloads" className={getLinkClass("/downloads")}>
              <Download className="w-4 h-4" /> Downloads
            </Link>
          </nav>
        </div>

      </div>
      
      {/* Premium Banner */}
      <div className="p-4">
        <div className="bg-brand-highlight p-4 rounded-2xl">
          <h4 className="font-semibold text-sm mb-1">Go Premium ✨</h4>
          <p className="text-xs text-brand-muted mb-3">Unlock unlimited skips, high quality audio and more.</p>
          <button className="w-full py-2 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl text-sm font-medium">
            Try Premium
          </button>
        </div>
      </div>
    </aside>
  );
}
