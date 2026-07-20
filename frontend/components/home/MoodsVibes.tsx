import { Leaf, Target, BookOpen, Moon, Heart, Zap, ChevronRight } from "lucide-react";

const MOODS = [
  { id: 1, title: "Chill", songs: "120 songs", icon: Leaf, color: "text-green-400", bg: "bg-green-400/10" },
  { id: 2, title: "Focus", songs: "98 songs", icon: Target, color: "text-blue-400", bg: "bg-blue-400/10" },
  { id: 3, title: "Study", songs: "86 songs", icon: BookOpen, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { id: 4, title: "Sleep", songs: "76 songs", icon: Moon, color: "text-purple-400", bg: "bg-purple-400/10" },
  { id: 5, title: "Romance", songs: "112 songs", icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
  { id: 6, title: "Energy", songs: "95 songs", icon: Zap, color: "text-orange-400", bg: "bg-orange-400/10" },
];

export function MoodsVibes() {
  return (
    <section className="mb-8 md:mb-10 px-4 md:px-6 lg:px-8 relative">
      <div className="flex justify-between items-end mb-3 md:mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white">Moods & Vibes</h2>
        <button className="text-xs md:text-sm font-medium text-brand-muted hover:text-white transition">View all</button>
      </div>

      <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-4">
        {MOODS.map((mood) => {
          const Icon = mood.icon;
          return (
            <div key={mood.id} className={`min-w-[110px] max-w-[110px] md:min-w-[140px] md:max-w-[140px] h-28 md:h-36 rounded-2xl p-3 md:p-4 flex flex-col justify-between cursor-pointer hover:-translate-y-1 transition-transform border border-white/5 ${mood.bg}`}>
              <Icon className={`w-8 h-8 ${mood.color}`} />
              <div>
                <h3 className="font-bold text-white">{mood.title}</h3>
                <p className="text-xs text-brand-muted">{mood.songs}</p>
              </div>
            </div>
          );
        })}
        
        {/* Next Arrow Button */}
        <div className="absolute right-8 top-[60%] -translate-y-1/2 w-10 h-10 rounded-full bg-brand-surface border border-white/10 flex items-center justify-center text-white shadow-xl cursor-pointer hover:bg-brand-highlight transition z-10 hidden md:flex">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
}
