"use client";

import React, { useMemo } from "react";
import { Player } from "@/types";
import { motion } from "framer-motion";

export default function PodiumSlide({ players }: { players: Player[] }) {
  const top3 = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [players]);

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
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-blue-500/0 via-blue-500/20 to-blue-500/0 blur-sm" />
        <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-fuchsia-500/0 via-fuchsia-500/20 to-fuchsia-500/0 blur-sm" />
      </div>
      
      {/* Title */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2.5, type: "spring", stiffness: 50 }} 
        className="absolute top-[12%] left-1/2 -translate-x-1/2 z-40 text-center w-full"
      >
        <span className="text-xl md:text-2xl font-black text-amber-500/80 uppercase tracking-[0.5em] mb-2 block">מצעד הניצחון</span>
        <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-800 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)] leading-[0.8] italic">
          המנצחים!
        </h1>
      </motion.div>

      {/* Podium Container */}
      <div className="flex h-[55%] items-end justify-center gap-8 z-10 w-full max-w-6xl relative">
        {/* Spotlight floor */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-amber-500/5 blur-[80px] rounded-[100%] -z-10" />

        {/* 2nd Place */}
        {second && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "65%", opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.8 }}
            className="flex-1 flex flex-col items-center justify-end relative group"
          >
            <motion.div 
              initial={{ scale: 0, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="absolute -top-[30%] text-center w-full"
            >
              <div className="text-zinc-500 font-black text-xl mb-1 opacity-50">#2</div>
              <h2 className="text-2xl md:text-3xl font-black bg-zinc-100 text-zinc-900 px-6 py-2 rounded-2xl mb-2 shadow-xl inline-block border-2 border-white max-w-[90%] truncate">
                {second.name}
              </h2>
              <div className="text-2xl font-black text-zinc-300 tracking-tighter shrink-0">
                {Math.round(second.score).toLocaleString()} <span className="text-sm opacity-50 uppercase">PTS</span>
              </div>
            </motion.div>
            <div className="w-full h-full bg-gradient-to-b from-zinc-200 to-zinc-400 rounded-t-[3rem] border-t-4 border-white flex items-center justify-center shadow-2xl overflow-hidden relative">
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <span className="text-[12rem] font-black text-black/10 select-none">2</span>
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {first && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "100%", opacity: 1 }}
            transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1], delay: 3.5 }}
            className="flex-1 flex flex-col items-center justify-end relative z-30 group"
          >
            <motion.div 
              initial={{ scale: 0, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ delay: 5.5, type: "spring", stiffness: 150 }}
              className="absolute -top-[65%] text-center w-full z-40"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="text-6xl md:text-8xl mb-4 drop-shadow-[0_0_30px_rgba(245,158,11,0.8)] filter brightness-125"
              >
                👑
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 text-zinc-950 px-8 py-4 rounded-[2.5rem] mb-3 shadow-[0_0_50px_rgba(245,158,11,0.6)] inline-block border-4 border-amber-200 relative overflow-hidden max-w-[95%] truncate">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                {first.name}
              </h2>
              <div className="text-4xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] tracking-tighter">
                {Math.round(first.score).toLocaleString()} <span className="text-xl opacity-50 uppercase">PTS</span>
              </div>
            </motion.div>
            <div className="w-full h-full bg-gradient-to-b from-amber-400 via-amber-600 to-amber-800 rounded-t-[4rem] border-t-8 border-amber-200 flex items-center justify-center shadow-[0_0_80px_rgba(245,158,11,0.4)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.3),_transparent)]" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="text-[16rem] font-black text-zinc-950/20 select-none">1</span>
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {third && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "45%", opacity: 1 }}
            transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
            className="flex-1 flex flex-col items-center justify-end relative group"
          >
            <motion.div 
              initial={{ scale: 0, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="absolute -top-[25%] text-center w-full"
            >
              <div className="text-amber-700 font-black text-lg mb-1 opacity-50">#3</div>
              <h2 className="text-xl md:text-2xl font-black bg-amber-800 text-amber-100 px-5 py-2 rounded-xl mb-1 shadow-lg inline-block border-2 border-amber-600 max-w-[90%] truncate">
                {third.name}
              </h2>
              <div className="text-xl font-black text-amber-600 tracking-tighter shrink-0">
                {Math.round(third.score).toLocaleString()} <span className="text-xs opacity-50 uppercase">PTS</span>
              </div>
            </motion.div>
            <div className="w-full h-full bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-[2.5rem] border-t-4 border-amber-600 flex items-center justify-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="text-[10rem] font-black text-black/20 select-none">3</span>
            </div>
          </motion.div>
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
