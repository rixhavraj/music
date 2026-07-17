"use client";

import { ChevronRight, Play, Heart, UserPlus, MoreHorizontal, Radio, MessageCircle, Share2, Crown, ChevronDown } from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import type { Track } from "@/types/music";
import { useState, useEffect } from "react";
import Link from "next/link";

function ArtistItem({ name }: { name: string }) {
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
      } catch (e) {
        // Fallback to placeholder on error
      }
    }
    fetchArtistImg();
  }, [name]);

  return (
    <Link href={`/artist/${encodeURIComponent(name)}`} className="flex flex-col items-center gap-2 group">
      <div className="w-14 h-14 rounded-full bg-brand-highlight overflow-hidden shadow-md group-hover:scale-105 transition-transform border-2 border-transparent group-hover:border-brand-primary/50">
        <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
      </div>
      <span className="text-xs text-brand-muted group-hover:text-white transition">{name}</span>
    </Link>
  );
}

function CommentCard({ 
  avatar, name, time, text, likes, replies, isTopListener, nestedReply, nestedRepliesCount 
}: {
  avatar: string; name: string; time: string; text: string; likes: number; replies: number; isTopListener?: boolean;
  nestedReply?: { name: string; time: string; text: string; avatar: string };
  nestedRepliesCount?: number;
}) {
  return (
    <div className="bg-brand-highlight/30 rounded-2xl p-4 border border-white/5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{name}</span>
              {isTopListener && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full">
                  <Crown className="w-3 h-3" /> Top Listener
                </span>
              )}
            </div>
            <span className="text-xs text-brand-muted">{time}</span>
          </div>
        </div>
        <button className="text-brand-muted hover:text-white transition">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-brand-text/90 leading-relaxed mb-4">
        {text}
      </p>

      <div className="flex items-center gap-6 mb-2">
        <button className="flex items-center gap-1.5 text-pink-500 hover:text-pink-400 transition text-sm font-medium">
          <Heart className="w-4 h-4 fill-current" /> {likes}
        </button>
        <button className="flex items-center gap-1.5 text-brand-muted hover:text-white transition text-sm font-medium">
          <MessageCircle className="w-4 h-4" /> {replies}
        </button>
        <button className="flex items-center gap-1.5 text-brand-muted hover:text-white transition text-sm font-medium">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {nestedReply && (
        <div className="mt-3 bg-[#1A1F2E] rounded-xl p-3 border border-white/5 ml-2">
          <div className="flex items-start gap-3 mb-2">
            <img src={nestedReply.avatar} alt={nestedReply.name} className="w-6 h-6 rounded-full object-cover" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{nestedReply.name}</span>
                <span className="text-[10px] text-brand-muted">{nestedReply.time}</span>
              </div>
              <p className="text-xs text-brand-text/80 mt-0.5">{nestedReply.text}</p>
            </div>
            <button className="ml-auto text-brand-muted hover:text-white transition">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          {nestedRepliesCount && (
            <button className="text-xs text-brand-primary hover:text-brand-secondary font-medium mt-1 transition">
              View all {nestedRepliesCount} replies
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function RightSidebar() {
  const { recentlyPlayed, play, currentTrack } = usePlayerStore();
  const [activeTab, setActiveTab] = useState("Popular");
  
  const [newComment, setNewComment] = useState("");
  const [userComments, setUserComments] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const saved = localStorage.getItem("chillguys-comments");
    if (saved) {
      try { setUserComments(JSON.parse(saved)); } catch(e){}
    }
  }, []);

  const handleAddComment = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newComment.trim() && currentTrack) {
      const commentObj = {
        id: Date.now().toString(),
        avatar: "https://i.pravatar.cc/150?img=68",
        name: "You",
        time: "Just now",
        text: newComment.trim(),
        likes: 0,
        replies: 0,
      };
      
      const trackId = currentTrack.id;
      const updated = {
        ...userComments,
        [trackId]: [commentObj, ...(userComments[trackId] || [])]
      };
      
      setUserComments(updated);
      localStorage.setItem("chillguys-comments", JSON.stringify(updated));
      setNewComment("");
    }
  };

  const handlePlayRadio = async () => {
    try {
      const res = await fetch(`/api/search?q=chill%20lofi%20relax&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const tracks = data.tracks as Track[];
        if (tracks.length > 0) {
          play(tracks[0], tracks);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside className="w-[420px] shrink-0 h-full bg-brand-dark flex flex-col p-6 overflow-y-auto scrollbar-hide border-l border-white/5">
      
      {/* Community Section */}
      <section className="mb-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center bg-white/5 rounded-full p-1">
            {["Popular", "Latest", "Following"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  activeTab === tab ? "bg-white/10 text-white" : "text-brand-muted hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1 text-xs text-brand-muted hover:text-white transition">
            Top Comments <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {currentTrack ? (
          <div className="space-y-4">
            
            {(userComments[currentTrack.id] || []).length === 0 ? (
              <div className="text-xs text-brand-muted text-center py-8 bg-brand-highlight/30 rounded-2xl border border-white/5">
                No comments yet. Be the first to share your thoughts on this track!
              </div>
            ) : (
              (userComments[currentTrack.id] || []).map((c: any) => (
                <CommentCard 
                  key={c.id}
                  avatar={c.avatar}
                  name={c.name}
                  time={c.time}
                  text={c.text}
                  likes={c.likes}
                  replies={c.replies}
                />
              ))
            )}

            <div className="sticky bottom-0 bg-brand-dark pt-2 pb-1">
              <input 
                type="text" 
                placeholder="Add a comment... (Press Enter)" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleAddComment}
                className="w-full bg-brand-surface border border-white/10 rounded-full py-2.5 px-4 text-xs text-white placeholder-brand-muted focus:border-brand-primary/50 outline-none" 
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-brand-muted text-center py-12 bg-brand-highlight/30 rounded-2xl border border-white/5">
            Play a track to join the community discussion.
          </div>
        )}
      </section>

      {/* Popular Artists */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Popular Artists</h2>
          <Link href="/artists" className="text-xs text-brand-muted hover:text-brand-text">View all</Link>
        </div>
        <div className="flex justify-between">
          <ArtistItem name="Arijit Singh" />
          <ArtistItem name="Anuv Jain" />
          <ArtistItem name="Pritam" />
          <ArtistItem name="Shreya" />
        </div>
      </section>

      {/* Radio Station */}
      <section className="mb-8">
        <div 
          onClick={handlePlayRadio}
          className="bg-brand-highlight rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition border border-white/5 hover:border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center text-brand-primary shadow-inner">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">LoFi Beats Radio</h4>
              <p className="text-xs text-brand-muted mt-0.5">24/7 chill beats to relax</p>
            </div>
          </div>
          <button className="w-9 h-9 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/30 group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
          </button>
        </div>
      </section>
    </aside>
  );
}
