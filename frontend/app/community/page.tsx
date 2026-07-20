"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Crown, Send, Music2 } from "lucide-react";
import { usePlayerStore } from "@/store/player-store";

interface Comment {
  id: string;
  avatar: string;
  name: string;
  time: string;
  text: string;
  likes: number;
  replies: number;
  isTopListener?: boolean;
}

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: "sc1",
    avatar: "https://i.pravatar.cc/150?img=11",
    name: "MusicLove_09",
    time: "2h ago",
    text: "This song hits different! Arijit Sir's voice + the lyrics = pure magic. ✨",
    likes: 345,
    replies: 52,
    isTopListener: true,
  },
  {
    id: "sc2",
    avatar: "https://i.pravatar.cc/150?img=5",
    name: "SoulVibes",
    time: "5h ago",
    text: "The emotions are just on another level. This part 🥹💗",
    likes: 210,
    replies: 32,
  },
  {
    id: "sc3",
    avatar: "https://i.pravatar.cc/150?img=33",
    name: "LofiDreamer",
    time: "8h ago",
    text: "Been listening on repeat all day. This is my comfort song 🎧",
    likes: 178,
    replies: 19,
  },
  {
    id: "sc4",
    avatar: "https://i.pravatar.cc/150?img=22",
    name: "NightOwl_",
    time: "12h ago",
    text: "3 AM vibes with this track hit different. The production is insane.",
    likes: 95,
    replies: 8,
  },
];

function CommentCard({ comment }: { comment: Comment }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div className="bg-brand-highlight/30 rounded-2xl p-4 border border-white/5 animate-fadeIn">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={comment.avatar} alt={comment.name} className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{comment.name}</span>
              {comment.isTopListener && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full">
                  <Crown className="w-3 h-3" /> Top Listener
                </span>
              )}
            </div>
            <span className="text-xs text-brand-muted">{comment.time}</span>
          </div>
        </div>
        <button className="text-brand-muted hover:text-white transition">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-brand-text/90 leading-relaxed mb-4">
        {comment.text}
      </p>

      <div className="flex items-center gap-6">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition ${
            liked ? "text-pink-500" : "text-brand-muted hover:text-pink-400"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> {likeCount}
        </button>
        <button className="flex items-center gap-1.5 text-brand-muted hover:text-white transition text-sm font-medium">
          <MessageCircle className="w-4 h-4" /> {comment.replies}
        </button>
        <button className="flex items-center gap-1.5 text-brand-muted hover:text-white transition text-sm font-medium">
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { currentTrack } = usePlayerStore();
  const [activeTab, setActiveTab] = useState("For You");
  const [newComment, setNewComment] = useState("");
  const [userComments, setUserComments] = useState<Comment[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("lofi-community");
    if (stored) {
      try {
        setUserComments(JSON.parse(stored));
      } catch (_) {}
    }
  }, []);

  const handlePost = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now().toString(),
      avatar: "https://i.pravatar.cc/150?img=68",
      name: "rishavraj",
      time: "Just now",
      text: newComment.trim(),
      likes: 0,
      replies: 0,
    };
    const updated = [comment, ...userComments];
    setUserComments(updated);
    localStorage.setItem("lofi-community", JSON.stringify(updated));
    setNewComment("");
  };

  const allComments = [...userComments, ...SAMPLE_COMMENTS];

  return (
    <div className="pb-10 min-h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-6 md:pt-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-1 md:mb-2">Community</h1>
        <p className="text-xs md:text-sm font-medium text-white/50 mb-4 md:mb-6">Join the conversation about the music you love</p>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white/5 rounded-full p-1 w-fit">
          {["For You", "Following", "Trending"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full transition-all ${
                activeTab === tab
                  ? "bg-white/10 text-white"
                  : "text-brand-muted hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Currently Playing Context */}
        {currentTrack && (
          <div className="mb-6 bg-brand-highlight/40 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title} 
              className="w-12 h-12 rounded-xl object-cover shadow-md" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-muted">Currently listening to</p>
              <h3 className="text-sm font-bold text-white truncate">{currentTrack.title}</h3>
              <p className="text-xs text-brand-muted truncate">{currentTrack.artist}</p>
            </div>
            <div className="flex gap-[2px] items-end h-3 shrink-0">
              <div className="w-[2px] bg-brand-primary animate-jingle-1 h-2" />
              <div className="w-[2px] bg-brand-primary animate-jingle-2 h-3" />
              <div className="w-[2px] bg-brand-primary animate-jingle-3 h-2" />
            </div>
          </div>
        )}

        {/* Comment Input */}
        <div className="mb-6 bg-brand-highlight/30 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <Music2 className="w-4 h-4 text-brand-primary" />
            <span className="text-xs text-brand-muted">Share your thoughts about this song</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handlePost(); }}
              placeholder="What's on your mind..."
              className="flex-1 bg-brand-surface border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-brand-muted focus:border-brand-primary/50 outline-none transition"
            />
            <button
              onClick={handlePost}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-sm font-medium flex items-center gap-1.5 hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="w-4 h-4" />
              <span className="hidden md:inline">Post</span>
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-3 md:space-y-4">
          {allComments.map(comment => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>

        {/* Top Listeners section */}
        <div className="mt-8 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white mb-4">Top Listeners</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
            {[
              { name: "MusicLove_09", img: "https://i.pravatar.cc/150?img=11" },
              { name: "SoulVibes", img: "https://i.pravatar.cc/150?img=5" },
              { name: "LofiDreamer", img: "https://i.pravatar.cc/150?img=33" },
              { name: "Rhythmhood", img: "https://i.pravatar.cc/150?img=15" },
              { name: "Artistik_Atkan", img: "https://i.pravatar.cc/150?img=20" },
              { name: "SweetMelodies", img: "https://i.pravatar.cc/150?img=25" },
            ].map((user) => (
              <div key={user.name} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-14 h-14 rounded-full bg-brand-highlight overflow-hidden border-2 border-transparent hover:border-brand-primary/50 transition">
                  <img src={user.img} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] md:text-xs text-brand-muted text-center w-16 truncate">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
