"use client";

import React, { useMemo } from "react";
import { Player } from "@/types";
import { motion } from "framer-motion";

export default function LeaderboardSlide({ players }: { players: Player[] }) {
  // Sort players by score
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score).slice(0, 10); // Show top 10
  }, [players]);

  return (
    <div className="w-full h-full flex flex-col items-center bg-zinc-950 text-white relative overflow-hidden py-16 px-8">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none" />

      <motion.h1 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-7xl font-black mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 drop-shadow-lg z-10"
      >
        לוח מובילים
      </motion.h1>

      <div className="w-full max-w-5xl flex flex-col gap-4 z-10">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
            className={`flex items-center justify-between p-6 rounded-2xl ${
              index === 0 
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_30px_theme(colors.amber.500/50)] scale-105 z-20"
                : index === 1
                ? "bg-slate-300 text-black shadow-lg"
                : index === 2
                ? "bg-amber-700 text-white shadow-lg"
                : "bg-zinc-800/80 backdrop-blur-sm border border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-6">
              <span className={`text-4xl font-black ${index < 3 ? "opacity-80" : "text-zinc-500"}`}>
                #{index + 1}
              </span>
              <span className="text-4xl font-bold">{player.name}</span>
              <span className="text-xl px-4 py-1 rounded-full bg-black/20 font-semibold ml-4">
                {player.team}
              </span>
            </div>
            
            <div className="text-5xl font-black font-mono tracking-tighter">
              {Math.round(player.score).toLocaleString()}
            </div>
          </motion.div>
        ))}

        {sortedPlayers.length === 0 && (
          <div className="text-center text-4xl text-zinc-500 mt-20 font-bold">
            עדיין אין נתונים
          </div>
        )}
      </div>
    </div>
  );
}
