"use client";

import React, { useMemo } from "react";
import { SlideData, GameState, Player } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function QuestionSlide({
  slide,
  gameState,
  players,
}: {
  slide: SlideData;
  gameState: GameState;
  players: Record<string, Player>;
}) {
  const options = slide.options || [];
  
  // Calculate speedsters
  const speedsters = useMemo(() => {
    return Object.entries(gameState.answerTimes)
      .map(([playerId, time]) => ({
        player: players[playerId],
        timeRemaining: time,
      }))
      .filter((entry) => entry.player) // Make sure player exists
      .sort((a, b) => b.timeRemaining - a.timeRemaining) // higher timeRemaining is faster
      .slice(0, 5);
  }, [gameState.answerTimes, players]);

  // Option colors matching remote map
  const optionColors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  // Render results if specifically requested
  const showResults = gameState.showResults;

  // Calculate generic progress percentage (already declared above or needs refinement)
  // Let's keep one set of declarations
  const totalPlayers = Object.keys(players).length;
  const answeredCount = Object.keys(gameState.answers).length;
  const progressPct = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;

  // Calculate correctness for live graph (if results are shown)
  const correctCount = Object.values(gameState.answers).filter(a => a === slide.correctOption).length;
  const correctnessPct = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;

  // Calculate vote distribution
  const voteCounts = [0, 0, 0, 0];
  Object.values(gameState.answers).forEach(ans => {
    if (ans >= 0 && ans <= 3) voteCounts[ans]++;
  });

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white relative p-8 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top 5 Speedsters Strip (Only on results) */}
      <AnimatePresence>
        {showResults && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="flex justify-center items-center h-20 mb-4 gap-4 z-10"
          >
            <div className="text-sm font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 ml-4">
              🔥 המהירים ביותר
            </div>
            {speedsters.map((s, i) => (
              <motion.div
                key={s.player.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`px-6 py-2 rounded-full font-bold shadow-2xl backdrop-blur-md border ${
                  i === 0 
                  ? "bg-amber-400 text-black border-amber-200 scale-110 z-20" 
                  : "bg-zinc-800/80 text-white border-zinc-700"
                }`}
              >
                {i + 1}. {s.player.name}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Main Title */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8 px-12 z-10 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-12 rounded-[3rem] shadow-2xl max-w-6xl w-full"
        >
          <h2 className="text-6xl md:text-8xl font-black text-center text-zinc-100 leading-tight drop-shadow-2xl">
            {slide.content}
          </h2>
        </motion.div>
      </div>

      {/* Live Correctness Graph Side Indicator */}
      {showResults && (
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20"
        >
          <div className="h-64 w-16 bg-zinc-900/80 border border-zinc-800 rounded-full overflow-hidden relative shadow-2xl">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${correctnessPct}%` }}
              className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-green-400 shadow-[0_0_30px_theme(colors.emerald.500)]"
            />
          </div>
          <div className="text-emerald-400 font-black text-2xl">{Math.round(correctnessPct)}%</div>
          <div className="text-zinc-500 font-bold text-xs uppercase text-center">דיוק<br/>קהל</div>
        </motion.div>
      )}

      {/* 4 Options Grid */}
      <div className="grid grid-cols-2 gap-8 h-[40%] mt-auto z-10 max-w-7xl mx-auto w-full">
        {options.map((opt, i) => {
          const isRevealed = i < gameState.revealedOptionsCount;
          const isCorrect = showResults && slide.correctOption === i;
          const pct = showResults && answeredCount > 0 ? (voteCounts[i] / answeredCount) * 100 : 0;
          
          return (
            <AnimatePresence key={i}>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className={`relative flex items-center justify-center rounded-[2.5rem] overflow-hidden font-bold text-4xl shadow-2xl min-h-[140px] border-4 transition-all duration-500 ${
                    showResults 
                      ? isCorrect 
                        ? "border-green-400 scale-105 z-20 shadow-green-500/40" 
                        : "border-transparent opacity-30 grayscale blur-[2px]"
                      : "border-white/5"
                  }`}
                >
                  <div className={`absolute inset-0 ${optionColors[i]} opacity-90`} />
                  
                  {/* Results Bar inside background */}
                  {showResults && (
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${pct}%` }} 
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`absolute left-0 bottom-0 top-0 bg-white/20 z-0`} 
                    />
                  )}

                  <div className="z-10 text-center px-8 flex flex-col items-center">
                    <span className="drop-shadow-lg">{opt}</span>
                    {showResults && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-4xl mt-3 font-black drop-shadow-md"
                      >
                        {Math.round(pct)}%
                      </motion.span>
                    )}
                  </div>

                  {/* Correct checkmark or Icon */}
                  {isCorrect && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }} 
                      animate={{ scale: 1, rotate: 0 }} 
                      className="absolute right-10 text-white text-7xl font-black drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>

      {/* Bottom Interface Bar */}
      <div className="mt-12 flex items-center gap-8 z-10">
        {/* Progress Bar */}
        <div className="flex-1 h-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden p-0.5">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-fuchsia-500 to-amber-500 shadow-[0_0_20px_theme(colors.fuchsia.500)] rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct}%` }}
          />
        </div>
        
        {/* Timer / Info */}
        <div className="flex items-center gap-4 bg-zinc-900/80 px-8 py-3 rounded-2xl border border-zinc-800 min-w-[200px] justify-center shadow-xl">
          <div className="text-zinc-500 text-sm font-bold uppercase tracking-widest">תשובות</div>
          <div className="text-3xl font-black text-white tabular-nums">{answeredCount}</div>
          <div className="text-zinc-700 text-xl font-bold">/</div>
          <div className="text-xl font-bold text-zinc-500">{totalPlayers}</div>
        </div>
      </div>
    </div>
  );
}
