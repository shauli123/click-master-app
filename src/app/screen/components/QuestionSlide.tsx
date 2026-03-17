"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  const showResults = gameState.showResults;
  const totalPlayers = Object.keys(players).length;
  const answeredCount = Object.keys(gameState.answers).length;
  
  // Calculate speedsters
  const speedsters = useMemo(() => {
    return Object.entries(gameState.answerTimes)
      .filter(([playerId]) => gameState.answers[playerId] === slide.correctOption)
      .map(([playerId, time]) => ({
        player: players[playerId],
        timeRemaining: time,
        timeTaken: gameState.baseTimeAllowed - time,
      }))
      .filter((entry) => entry.player)
      .sort((a, b) => b.timeRemaining - a.timeRemaining)
      .slice(0, 5);
  }, [gameState.answerTimes, gameState.answers, players, slide.correctOption, gameState.baseTimeAllowed]);

  // Option colors
  const optionColors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  // Vote distribution
  const voteCounts = [0, 0, 0, 0];
  Object.values(gameState.answers).forEach(ans => {
    if (ans >= 0 && ans <= 3) voteCounts[ans]++;
  });

  const correctCount = Object.values(gameState.answers).filter(a => a === slide.correctOption).length;
  const correctnessPct = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;
  const progressPct = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;

  return (
    <div className="w-full min-h-screen flex flex-col bg-zinc-950 text-white relative p-8 pt-24 overflow-y-auto">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Bar (Integrated Stats) */}
      <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
        {/* Visual Timer */}
        <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-zinc-800" />
              <motion.circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray="88"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: gameState.isQuestionActive ? 88 : 0 }}
                transition={{ duration: gameState.isQuestionActive ? gameState.baseTimeAllowed : 0, ease: "linear" }}
                className="text-fuchsia-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-[10px] text-white">
              <Timer countdown={gameState.baseTimeAllowed} isActive={gameState.isQuestionActive} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-0.5">זמן נותר</span>
            <span className="text-sm font-black tabular-nums">שניות</span>
          </div>
        </div>

        {/* Answers Count */}
        <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-800 shadow-2xl">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-0.5">תשובות</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white">{answeredCount}</span>
              <span className="text-[10px] font-bold text-zinc-600">/ {totalPlayers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header: Speedsters & Joker Indicator */}
      <div className="absolute top-[10%] left-0 right-0 flex flex-col items-center gap-4 z-20">
        <AnimatePresence>
          {gameState.jokerModeEnabled && (
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 px-8 py-3 rounded-2xl border-4 border-white shadow-[0_0_50px_rgba(192,38,211,0.6)] flex items-center gap-4"
            >
              <span className="text-4xl">🃏</span>
              <span className="text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg">ניקוד כפול פעיל!</span>
              <span className="text-4xl text-white animate-bounce">⚡</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResults && speedsters.length > 0 && (
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-center items-center gap-3 z-10 flex-wrap"
            >
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                🏆 בזק
              </div>
              {speedsters.map((s, i) => (
                <div key={s.player.id} className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${i === 0 ? "bg-amber-400 text-black border-amber-200" : "bg-zinc-800 text-white border-zinc-700"}`}>
                  <span>{s.player.name}</span>
                  <span className="opacity-60 text-[10px] tabular-nums">({s.timeTaken.toFixed(2)}s)</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question Title */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 z-10 my-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/50 p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-6xl w-full text-center"
        >
          <h2 className={`font-black text-zinc-100 leading-tight ${
            slide.content.length > 50 ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl"
          }`}>
            {slide.content}
          </h2>
        </motion.div>
      </div>

      {/* Live Correctness Graph */}
      {showResults && (
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-20"
        >
          <div className="h-48 w-4 bg-zinc-900/80 border border-zinc-800 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${correctnessPct}%` }}
              className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-green-400 shadow-[0_0_20px_theme(colors.emerald.500)]"
            />
          </div>
          <div className="text-emerald-400 font-extrabold text-sm">{Math.round(correctnessPct)}%</div>
        </motion.div>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-7xl mx-auto z-10 pb-8">
        {options.map((opt, i) => {
          const isRevealed = i < gameState.revealedOptionsCount;
          const isCorrect = showResults && slide.correctOption === i;
          const pct = showResults && answeredCount > 0 ? (voteCounts[i] / answeredCount) * 100 : 0;
          
          return (
            <AnimatePresence key={i}>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative flex items-center justify-center rounded-[2rem] overflow-hidden font-bold text-xl shadow-2xl min-h-[70px] border-4 transition-all duration-500 ${
                    showResults 
                      ? isCorrect 
                        ? "border-green-400 scale-105 z-20 shadow-green-500/40" 
                        : "border-transparent opacity-30 grayscale blur-[1px]"
                      : "border-white/5"
                  }`}
                >
                  <div className={`absolute inset-0 ${optionColors[i]} opacity-90`} />
                  
                  {showResults && (
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${pct}%` }} 
                      transition={{ duration: 1 }}
                      className="absolute left-0 bottom-0 top-0 bg-white/20" 
                    />
                  )}

                  <div className="z-10 text-center px-8 flex flex-col items-center">
                    <span className="drop-shadow-md">{opt}</span>
                    {showResults && (
                      <span className="text-2xl mt-2 font-black opacity-80">{Math.round(pct)}%</span>
                    )}
                  </div>

                  {isCorrect && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-8 text-white text-6xl font-black">
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-900">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 via-fuchsia-500 to-amber-500"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

function Timer({ countdown, isActive }: { countdown: number; isActive: boolean }) {
  const [rem, setRem] = useState(countdown);
  useEffect(() => {
    if (!isActive) {
      setRem(countdown);
      return;
    }
    const interval = setInterval(() => setRem(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [isActive, countdown]);
  return <>{rem}</>;
}
