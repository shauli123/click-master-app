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
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-950 to-zinc-950" />
      
      {/* Title */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2 }} // Appears after podium
        className="absolute top-16 left-1/2 -translate-x-1/2 z-20 text-center"
      >
        <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 drop-shadow-[0_0_20px_theme(colors.amber.500)]">
          המנצחים!
        </h1>
      </motion.div>

      {/* Podium Container */}
      <div className="flex h-3/5 items-end justify-center gap-4 z-10 w-full max-w-5xl">
        
        {/* 2nd Place */}
        {second && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "60%", opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className="flex-1 flex flex-col items-center justify-end relative"
          >
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute -top-32 text-center"
            >
              <h2 className="text-4xl font-bold bg-slate-300 text-black px-6 py-2 rounded-full mb-2 shadow-[0_0_15px_theme(colors.slate.400)]">
                {second.name}
              </h2>
              <div className="text-2xl font-black text-slate-300">
                {Math.round(second.score).toLocaleString()} נק'
              </div>
            </motion.div>
            <div className="w-full h-full bg-gradient-to-t from-slate-600 to-slate-400 rounded-t-3xl border-t-8 border-slate-300 flex items-start justify-center pt-8 shadow-2xl">
              <span className="text-8xl font-black text-slate-200/50">2</span>
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {first && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "90%", opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 3 }} // Suspense for 1st
            className="flex-1 flex flex-col items-center justify-end relative z-20"
          >
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 4.5, type: "spring", stiffness: 200 }}
              className="absolute -top-40 text-center"
            >
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-7xl mb-2 drop-shadow-[0_0_15px_theme(colors.amber.400)]">👑</div>
              <h2 className="text-5xl font-black bg-gradient-to-r from-amber-200 to-amber-500 text-black px-8 py-3 rounded-full mb-2 shadow-[0_0_30px_theme(colors.amber.500)] scale-110">
                {first.name}
              </h2>
              <div className="text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_theme(colors.amber.400)]">
                {Math.round(first.score).toLocaleString()} נק'
              </div>
            </motion.div>
            <div className="w-full h-full bg-gradient-to-t from-amber-700 via-amber-500 to-yellow-400 rounded-t-3xl border-t-8 border-amber-200 flex items-start justify-center pt-8 shadow-[0_0_50px_theme(colors.amber.500/50)]">
              <span className="text-9xl font-black text-amber-100/50 drop-shadow-md">1</span>
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {third && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "45%", opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0 }} // Shows first
            className="flex-1 flex flex-col items-center justify-end relative"
          >
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-32 text-center"
            >
              <h2 className="text-3xl font-bold bg-amber-800 text-white px-6 py-2 rounded-full mb-2 shadow-[0_0_15px_theme(colors.amber.900)]">
                {third.name}
              </h2>
              <div className="text-2xl font-black text-amber-700">
                {Math.round(third.score).toLocaleString()} נק'
              </div>
            </motion.div>
            <div className="w-full h-full bg-gradient-to-t from-amber-950 to-amber-800 rounded-t-3xl border-t-8 border-amber-700 flex items-start justify-center pt-8 shadow-2xl">
              <span className="text-7xl font-black text-amber-600/50">3</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
