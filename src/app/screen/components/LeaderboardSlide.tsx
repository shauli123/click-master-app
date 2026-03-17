"use client";

import React, { useMemo } from "react";
import { Player, GameState } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function LeaderboardSlide({ players, gameState }: { players: Player[], gameState: GameState }) {
  // Sort players by score
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score).slice(0, 10); // Show top 10
  }, [players]);

  return (
    <div className="w-full h-full flex flex-col items-center bg-zinc-950 text-white relative overflow-hidden py-16 px-8">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center mb-8 z-10"
      >
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-fuchsia-400 drop-shadow-2xl">
          המובילים
        </h1>
        <div className="h-1.5 w-48 bg-gradient-to-r from-blue-500 to-fuchsia-500 rounded-full mt-4 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
      </motion.div>

      {/* Speedster Highlight */}
      {gameState.fastestCorrectAnswer && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-10 z-10 flex flex-col items-center"
        >
          <div className="flex items-center gap-4 bg-zinc-900/80 backdrop-blur-xl border border-amber-500/30 px-8 py-4 rounded-[2rem] shadow-[0_0_40px_rgba(245,158,11,0.1)]">
            <div className="text-4xl">⚡</div>
            <div className="flex flex-col items-start border-r border-zinc-800 pr-6 mr-2">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">מהיר החידון</span>
              <span className="text-3xl font-black text-white italic">
                {gameState.fastestCorrectAnswer.playerName}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">שיא מהירות</span>
              <span className="text-2xl font-black text-amber-400 tabular-nums">{gameState.fastestCorrectAnswer.timeTaken.toFixed(2)}s</span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="w-full max-w-5xl flex flex-col gap-5 z-10">
        <AnimatePresence mode="popLayout">
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 120, damping: 20 }}
              layout
              className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 ${
                index === 0 
                  ? "bg-gradient-to-r from-amber-500 to-orange-400 text-black border-amber-300 shadow-[0_0_50px_rgba(245,158,11,0.3)] scale-105 z-20"
                  : index === 1
                  ? "bg-zinc-100 text-black border-white shadow-xl"
                  : index === 2
                  ? "bg-orange-800 text-white border-orange-600 shadow-lg"
                  : "bg-zinc-900/60 backdrop-blur-xl border-zinc-800/50 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-8">
                <span className={`text-5xl font-black italic tracking-tighter ${index < 3 ? "opacity-40" : "text-zinc-600"}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-5xl font-black tracking-tight">{player.name}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`text-6xl font-black font-mono tracking-tighter ${index === 0 ? "text-black" : "text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500"}`}>
                  {Math.round(player.score).toLocaleString()}
                </div>
                {index === 0 && <span className="text-4xl">👑</span>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedPlayers.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center text-5xl text-zinc-700 mt-20 font-black tracking-widest uppercase opacity-50"
          >
            ממתינים לנתונים...
          </motion.div>
        )}
      </div>
    </div>
  );
}
