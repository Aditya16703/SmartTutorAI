"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Target, Flame, Layers, Trophy, Sparkles } from "lucide-react";

interface ProgressStats {
  topicsStudied: number;
  averageScore: number | null;
  currentStreak: number;
  lastActive: string | null;
  totalDueFlashcards: number;
  xp: number;
}

interface ProgressDashboardProps {
  stats: ProgressStats;
}

// Mastery Level Logic (Early wins: fast levels at start)
// L1: 0, L2: 50, L3: 150, L4: 350...
function calculateMastery(xp: number) {
  if (xp < 50) return { level: 1, current: xp, target: 50, percent: (xp / 50) * 100 };
  if (xp < 150) return { level: 2, current: xp - 50, target: 100, percent: ((xp - 50) / 100) * 100 };
  if (xp < 350) return { level: 3, current: xp - 150, target: 200, percent: ((xp - 150) / 200) * 100 };
  if (xp < 750) return { level: 4, current: xp - 350, target: 400, percent: ((xp - 350) / 400) * 100 };
  
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const levelStart = 50 * Math.pow(level - 1, 2);
  const nextLevelStart = 50 * Math.pow(level, 2);
  return { 
    level, 
    current: xp - levelStart, 
    target: nextLevelStart - levelStart,
    percent: ((xp - levelStart) / (nextLevelStart - levelStart)) * 100
  };
}

const statCards = [
  {
    key: "topicsStudied" as const,
    label: "Topics Studied",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    format: (v: number | null) => String(v ?? 0),
    suffix: "",
  },
  {
    key: "averageScore" as const,
    label: "Avg Quiz Score",
    icon: Target,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    format: (v: number | null) => (v !== null ? `${Math.round(v)}` : "—"),
    suffix: (v: number | null) => (v !== null ? "%" : ""),
  },
  {
    key: "totalDueFlashcards" as const,
    label: "Due Today",
    icon: Layers,
    color: "text-secondary",
    bg: "bg-secondary/10",
    format: (v: number | null) => String(v ?? 0),
    suffix: " cards",
  },
  {
    key: "currentStreak" as const,
    label: "Study Streak",
    icon: Flame,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    format: (v: number | null) => String(v ?? 0),
    suffix: "d",
  },
];

export default function ProgressDashboard({ stats }: ProgressDashboardProps) {
  const mastery = calculateMastery(stats.xp || 0);

  return (
    <div className="space-y-4">
      {/* --- Mastery & Level Hub --- */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Trophy className="w-32 h-32 text-primary" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
                <div className="w-16 h-16 bg-primary rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-2xl font-black text-white -rotate-3 leading-none">{mastery.level}</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-secondary rounded-full flex items-center justify-center border-2 border-card shadow-sm">
                    <Sparkles className="w-3 h-3 text-white" />
                </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                Mastery Level {mastery.level}
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    {stats.xp || 0} Total XP
                </span>
              </h2>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                You're {Math.round(mastery.target - mastery.current)} XP away from Level {mastery.level + 1}
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                <span>Novice</span>
                <span className="text-primary">Master</span>
            </div>
            <div className="h-4 w-full bg-muted rounded-full overflow-hidden p-1 border border-border">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${mastery.percent}%` }}
                    transition={{ duration: 1.5, type: "spring", bounce: 0.3 }}
                    className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                />
            </div>
          </div>
        </div>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, color, bg, format, suffix }) => {
          const rawValue = stats[key as keyof ProgressStats] as number | string | null;
          const displayValue = format(rawValue as never);
          const displaySuffix = typeof suffix === "function" ? suffix(rawValue as never) : suffix;

          return (
            <div
              key={key}
              className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-2xl font-black ${color} leading-none`}>{displayValue}</span>
                  {displaySuffix && <span className={`text-sm font-bold ${color} opacity-80`}>{displaySuffix}</span>}
                </div>
                <p className="text-xs text-muted-foreground font-medium mt-1 truncate">{label}</p>
              </div>
            </div>
          );
        })}

        {stats.totalDueFlashcards > 0 && (
           <div className="col-span-2 md:col-span-4 mt-2">
              <a href="/learn/review" className="block w-full">
                <button className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 animate-pulse-subtle">
                  <Target className="w-5 h-5" />
                  Start Your Daily Review ({stats.totalDueFlashcards} cards)
                </button>
              </a>
           </div>
        )}
      </div>
    </div>
  );
}
