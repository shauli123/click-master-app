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

      {/* Top Header Bar: Timer & Progress */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
        {/* Visual Timer */}
        <div className="flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-zinc-800"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="125.6"
                initial={{ strokeDashoffset: 0 }}
                animate={{ 
                  strokeDashoffset: gameState.isQuestionActive ? 125.6 : 0 
                }}
                transition={{ 
                  duration: gameState.isQuestionActive ? gameState.baseTimeAllowed : 0, 
                  ease: "linear" 
                }}
                className="text-fuchsia-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-white">
              <Timer countdown={gameState.baseTimeAllowed} isActive={gameState.isQuestionActive} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">זמן נותר</span>
            <span className="text-xl font-black tabular-nums">שניות</span>
          </div>
        </div>

        {/* Info / Answered */}
        <div className="flex items-center gap-6 bg-zinc-900/80 backdrop-blur-md px-8 py-4 rounded-3xl border border-zinc-800 shadow-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">תשובות</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{answeredCount}</span>
                <span className="text-zinc-600 font-bold">/</span>
                <span className="text-lg font-bold text-zinc-500">{totalPlayers}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Question Main Title */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-10 md:p-16 rounded-[4rem] shadow-2xl max-w-6xl w-full text-center"
        >
          <h2 className={`font-black text-zinc-100 leading-tight drop-shadow-2xl ${
            slide.content.length > 60 ? "text-5xl md:text-6xl" : "text-6xl md:text-8xl"
          }`}>
            {slide.content}
          </h2>
        </motion.div>
      </div>

      {/* Live Correctness Graph Side Indicator */}
      {showResults && (
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20"
        >
          <div className="h-48 w-12 bg-zinc-900/80 border border-zinc-800 rounded-full overflow-hidden relative shadow-2xl">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${correctnessPct}%` }}
              className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-green-400 shadow-[0_0_30px_theme(colors.emerald.500)]"
            />
          </div>
          <div className="text-emerald-400 font-black">{Math.round(correctnessPct)}%</div>
        </motion.div>
      )}

      {/* 4 Options Grid */}
      <div className="grid grid-cols-2 gap-6 h-[35%] mt-auto z-10 max-w-7xl mx-auto w-full pb-8">
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
                  className={`relative flex items-center justify-center rounded-[2rem] overflow-hidden font-bold text-3xl shadow-2xl min-h-[100px] border-4 transition-all duration-500 ${
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
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`absolute left-0 bottom-0 top-0 bg-white/20 z-0`} 
                    />
                  )}

                  <div className="z-10 text-center px-6 flex flex-col items-center">
                    <span className="drop-shadow-lg">{opt}</span>
                    {showResults && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-2xl mt-2 font-black drop-shadow-md"
                      >
                        {Math.round(pct)}%
                      </motion.span>
                    )}
                  </div>

                  {isCorrect && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }} 
                      animate={{ scale: 1, rotate: 0 }} 
                      className="absolute right-8 text-white text-5xl font-black drop-shadow-lg"
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

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-900 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 via-fuchsia-500 to-amber-500"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

// Timer sub-component for ticking
function Timer({ countdown, isActive }: { countdown: number; isActive: boolean }) {
  const [rem, setRem] = React.useState(countdown);
  
  React.useEffect(() => {
    if (!isActive) {
      setRem(countdown);
      return;
    }
    
    const interval = setInterval(() => {
      setRem(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, countdown]);
  
  return <>{rem}</>;
}
