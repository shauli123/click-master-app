"use client";

import React, { useMemo } from "react";
import { Player, GameState } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function LeaderboardSlide({ players, gameState }: { players: Player[], gameState: GameState }) {
  // Sort players by score
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score).slice(0, 5); // Focus on Top 5
  }, [players]);

  return (
    <div className="w-full h-full flex flex-col items-center bg-zinc-950 text-white relative overflow-hidden py-12 px-8">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 blur-[180px] rounded-full animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-fuchsia-600/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-50px] w-[500px] h-[500px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
        className="flex flex-col items-center mb-6 z-10"
      >
        <div className="flex items-center gap-4 mb-2">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="text-4xl">⭐</motion.div>
            <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(129,140,248,0.4)] tracking-tighter">
            טבלת המנצחים
            </h1>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="text-4xl">⭐</motion.div>
        </div>
        <div className="h-2 w-64 bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.6)]" />
      </motion.div>

      {/* Speedster Highlight (Mini) */}
      {gameState.fastestCorrectAnswer && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8 z-10"
        >
          <div className="flex items-center gap-4 bg-zinc-900/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl">
            <span className="text-2xl animate-bounce">⚡</span>
            <span className="text-sm font-black text-zinc-400 uppercase tracking-widest mr-2">מהיר החידון:</span>
            <span className="text-xl font-black text-amber-400 italic mr-4">{gameState.fastestCorrectAnswer.playerName}</span>
            <div className="h-4 w-px bg-zinc-700 mx-2" />
            <span className="text-lg font-mono font-bold text-white tabular-nums">{gameState.fastestCorrectAnswer.timeTaken.toFixed(2)}s</span>
          </div>
        </motion.div>
      )}

      <div className="w-full max-w-5xl flex flex-col gap-4 z-10 py-4">
        <AnimatePresence mode="popLayout">
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -150 : 150, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: index === 0 ? 1.05 : 1 }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              transition={{ 
                delay: index * 0.15, 
                type: "spring", 
                stiffness: 100, 
                damping: 20,
                duration: 0.8
              }}
              layout
              className={`group flex items-center justify-between p-6 rounded-[2.5rem] border relative transition-all duration-500 overflow-hidden ${
                index === 0 
                  ? "bg-gradient-to-r from-amber-500/90 to-orange-400/90 text-black border-amber-300 shadow-[0_0_80px_rgba(245,158,11,0.4)] z-20"
                  : index === 1
                  ? "bg-zinc-100/90 text-black border-white shadow-xl"
                  : index === 2
                  ? "bg-gradient-to-r from-orange-850 to-orange-950/90 text-white border-orange-600/50 shadow-lg"
                  : "bg-zinc-900/40 backdrop-blur-3xl border-white/5 hover:border-white/20 hover:bg-zinc-800/60"
              }`}
            >
                {/* Glowing Highlight for #1 */}
                {index === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                )}

              <div className="flex items-center gap-8 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl font-black italic transform -rotate-12 ${
                    index === 0 ? "bg-black text-amber-400" : 
                    index === 1 ? "bg-zinc-800 text-zinc-100" :
                    index === 2 ? "bg-orange-700 text-orange-200" :
                    "bg-zinc-800/80 text-zinc-500"
                }`}>
                  {index + 1}
                </div>
                <div className="flex flex-col">
                    <span className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{player.name}</span>
                    <span className={`text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 ${index < 2 ? "text-zinc-900" : "text-zinc-400"}`}>
                        TOP CONTENDER
                    </span>
                </div>
              </div>
              
              <div className="flex items-center gap-6 relative z-10">
                <motion.div 
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className={`text-6xl md:text-7xl font-black font-mono tracking-tighter ${index === 0 ? "text-black drop-shadow-sm" : index === 1 ? "text-zinc-900" : "text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500"}`}>
                  {Math.round(player.score).toLocaleString()}
                </motion.div>
                <div className="flex flex-col items-center">
                    {index === 0 && <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl drop-shadow-lg">👑</motion.span>}
                    {index === 1 && <span className="text-4xl grayscale brightness-125">🥈</span>}
                    {index === 2 && <span className="text-4xl contrast-125">🥉</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedPlayers.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center text-4xl text-zinc-700 mt-20 font-black tracking-widest uppercase opacity-30 animate-pulse"
          >
            ממתנים לקרב...
          </motion.div>
        )}
      </div>
    </div>
  );
}
