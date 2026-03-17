"use client";

import React, { useMemo } from "react";
import { Player } from "@/types";
import { motion } from "framer-motion";

export default function PodiumSlide({ players }: { players: Player[] }) {
  const top3 = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [players]);

  const confettiParticles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * -100 - 50,
      rotate: Math.random() * 360,
      color: ["#f59e0b", "#3b82f6", "#f472b6", "#10b981", "#ffffff"][Math.floor(Math.random() * 5)],
      scale: Math.random() * 0.5 + 0.5,
    }));
  }, []);

  if (top3.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white">
        <h1 className="text-6xl font-black text-zinc-600">אין מספיק שחקנים</h1>
      </div>
    );
  }

  // Ensure we have at least 3 for rendering structure
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div className="w-full h-full flex flex-col items-center justify-end bg-zinc-950 text-white relative overflow-hidden pb-12 px-8">
      {/* High-End Cinematic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_var(--tw-gradient-stops))] from-blue-900/40 via-zinc-950 to-zinc-950" />
      
      {/* Confetti Explosion for 1st Place */}
      {first && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          {confettiParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{ 
                x: p.x * 20, 
                y: p.y * 10, 
                opacity: 0, 
                scale: p.scale,
                rotate: p.rotate + 720 
              }}
              transition={{ 
                delay: 5.5, // Sync with 1st place name reveal
                duration: 2.5,
                ease: "easeOut"
              }}
              className="absolute w-4 h-4 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2.5, type: "spring", stiffness: 50 }} 
        className="absolute top-[12%] left-1/2 -translate-x-1/2 z-40 text-center w-full px-4"
      >
        <span className="text-xl md:text-2xl font-black text-amber-500/80 uppercase tracking-[0.5em] mb-2 block">מצעד הניצחון</span>
        <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-800 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)] leading-[0.8] italic">
          המנצחים!
        </h1>
      </motion.div>

      {/* Podium Container */}
      <div className="flex h-[45%] items-end justify-center gap-6 z-10 w-full max-w-5xl relative">
        {/* Spotlight floor */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-24 bg-amber-500/5 blur-[60px] rounded-[100%] -z-10" />

        {/* 2nd Place */}
        {second && (
          <div className="flex-1 flex flex-col items-center justify-end h-full relative group">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="mb-4 text-center"
            >
              <div className="text-zinc-500 font-black text-sm uppercase opacity-50">מקום 2</div>
              <h2 className="text-xl md:text-2xl font-black bg-zinc-100 text-zinc-900 px-5 py-2 rounded-xl mb-1 shadow-lg border-2 border-white truncate max-w-[200px]">
                {second.name}
              </h2>
              <div className="text-xl font-black text-zinc-300 tabular-nums">
                {Math.round(second.score).toLocaleString()} <span className="text-[10px] opacity-40">PTS</span>
              </div>
            </motion.div>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "60%" }}
              transition={{ duration: 1, delay: 0.8 }}
              className="w-full bg-gradient-to-b from-zinc-200 to-zinc-400 rounded-t-2xl border-t-4 border-white flex items-center justify-center shadow-2xl relative overflow-hidden"
            >
              <span className="text-[8rem] font-black text-black/10 select-none">2</span>
            </motion.div>
          </div>
        )}

        {/* 1st Place */}
        {first && (
          <div className="flex-1 flex flex-col items-center justify-end h-full relative z-30 group">
            <motion.div 
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 5.5, type: "spring" }}
              className="mb-6 text-center z-40"
            >
              <motion.div 
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-6xl mb-2 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
              >
                👑
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-b from-amber-200 to-amber-600 text-zinc-950 px-8 py-3 rounded-2xl mb-2 shadow-[0_0_40px_rgba(245,158,11,0.4)] border-4 border-amber-200 truncate max-w-[280px]">
                {first.name}
              </h2>
              <div className="text-3xl font-black text-amber-400 drop-shadow-md tabular-nums">
                {Math.round(first.score).toLocaleString()} <span className="text-xs opacity-50">PTS</span>
              </div>
            </motion.div>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ duration: 1.5, delay: 3.5 }}
              className="w-full bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 rounded-t-3xl border-t-8 border-amber-200 flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.3)] relative overflow-hidden"
            >
              <span className="text-[12rem] font-black text-zinc-950/20 select-none">1</span>
            </motion.div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex-1 flex flex-col items-center justify-end h-full relative group">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mb-3 text-center"
            >
              <div className="text-amber-700 font-black text-sm uppercase opacity-50">מקום 3</div>
              <h2 className="text-lg md:text-xl font-black bg-amber-800 text-amber-100 px-4 py-1.5 rounded-lg mb-1 shadow-md border-2 border-amber-600 truncate max-w-[180px]">
                {third.name}
              </h2>
              <div className="text-lg font-black text-amber-600 tabular-nums">
                {Math.round(third.score).toLocaleString()} <span className="text-[10px] opacity-40">PTS</span>
              </div>
            </motion.div>
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "40%" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-xl border-t-4 border-amber-600 flex items-center justify-center shadow-2xl relative overflow-hidden"
            >
              <span className="text-[6rem] font-black text-black/20 select-none">3</span>
            </motion.div>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
