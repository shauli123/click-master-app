"use client";

import React, { useMemo } from "react";
import { SlideData, GameState, Player } from "@/types";
import { motion } from "framer-motion";

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

  // Calculate generic progress percentage
  const totalPlayers = Object.keys(players).length;
  const answeredCount = Object.keys(gameState.answers).length;
  const progressPct = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;

  // Render results if question is no longer active
  const renderResults = !gameState.isQuestionActive && answeredCount > 0;

  // Calculate vote distribution if rendering results
  const voteCounts = [0, 0, 0, 0];
  if (renderResults) {
    Object.values(gameState.answers).forEach(ans => {
      if (ans >= 0 && ans <= 3) voteCounts[ans]++;
    });
  }

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white relative p-8">
      {/* Top 5 Speedsters Strip */}
      <div className="flex justify-center items-center h-16 mb-4 gap-4">
        {speedsters.map((s, i) => (
          <motion.div
            key={s.player.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`px-6 py-2 rounded-full font-bold shadow-lg shadow-black/50 ${
              i === 0 ? "bg-amber-400 text-black border-2 border-amber-200" : "bg-zinc-800"
            }`}
          >
            {i + 1}. {s.player.name}
          </motion.div>
        ))}
      </div>

      {/* Question Main Title */}
      <div className="flex-1 flex items-center justify-center mb-8 px-12">
        <h2 className="text-6xl md:text-8xl font-black text-center text-zinc-100 leading-tight">
          {slide.content}
        </h2>
      </div>

      {/* 4 Options Grid */}
      <div className="grid grid-cols-2 gap-6 h-1/2 mt-auto">
        {options.map((opt, i) => {
          const isCorrect = renderResults && slide.correctOption === i;
          const pct = renderResults && answeredCount > 0 ? (voteCounts[i] / answeredCount) * 100 : 0;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex items-center justify-center rounded-3xl overflow-hidden font-bold text-4xl shadow-2xl ${
                renderResults && !isCorrect ? "opacity-30 grayscale" : "opacity-100"
              }`}
            >
              <div className={`absolute inset-0 ${optionColors[i]} opacity-90`} />
              
              {/* Results Bar inside background */}
              {renderResults && (
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${pct}%` }} 
                  className={`absolute left-0 bottom-0 top-0 bg-white/20 z-0`} 
                />
              )}

              <div className="z-10 text-center px-4 flex flex-col items-center">
                <span>{opt}</span>
                {renderResults && (
                  <span className="text-2xl mt-2 opacity-80">{Math.round(pct)}%</span>
                )}
              </div>

              {/* Correct checkmark */}
              {isCorrect && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-green-400 text-7xl font-black"
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Progress Bar */}
      <div className="h-4 w-full bg-zinc-800 rounded-full mt-8 overflow-hidden">
        <motion.div 
          className="h-full bg-fuchsia-500 shadow-[0_0_20px_theme(colors.fuchsia.500)]"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
