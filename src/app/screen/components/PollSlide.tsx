"use client";

import React from "react";
import { SlideData, GameState } from "@/types";
import { motion } from "framer-motion";

export default function PollSlide({
  slide,
  gameState,
}: {
  slide: SlideData;
  gameState: GameState;
}) {
  const options = slide.options || [];
  
  // Calculate results
  const answers = Object.values(gameState.answers);
  const totalVotes = answers.length;
  const renderResults = !gameState.isQuestionActive && totalVotes > 0;

  const voteCounts = [0, 0, 0, 0];
  if (renderResults) {
    answers.forEach(ans => {
      if (ans >= 0 && ans <= 3) voteCounts[ans]++;
    });
  }

  const optionColors = [
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-blue-500",
    "from-emerald-500 to-teal-500",
    "from-violet-500 to-purple-500",
  ];

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white relative p-12 overflow-hidden">
      {/* Dynamic Background Abstract Shapes */}
      <motion.div
        animate={{ 
          rotate: [0, -45, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute w-[800px] h-[800px] rounded-full bg-indigo-600/10 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />

      {/* Main Title */}
      <div className="flex-1 flex flex-col items-center justify-center mb-12 px-12 z-10">
        <h3 className="text-3xl font-bold text-indigo-400 mb-6 tracking-widest uppercase">סקר קהל</h3>
        <h2 className="text-6xl md:text-8xl font-black text-center text-white leading-tight drop-shadow-xl">
          {slide.content}
        </h2>
        
        {/* Total Votes Counter */}
        <div className="mt-8 px-6 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-xl font-medium">
          הצבעות עד כה: <span className="font-bold text-fuchsia-400">{totalVotes}</span>
        </div>
      </div>

      {/* Poll Options Grid / Results */}
      <div className="flex h-1/2 gap-6 items-end justify-center z-10 w-full max-w-6xl mx-auto">
        {options.map((opt, i) => {
          const pct = renderResults && totalVotes > 0 ? (voteCounts[i] / totalVotes) * 100 : 0;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full h-full relative flex items-end justify-center group perspective-1000">
                {/* Visual Bar Container */}
                <div className="w-full h-full bg-zinc-900/50 rounded-t-3xl overflow-hidden relative flex items-end border-x border-t border-zinc-800">
                  <motion.div 
                    initial={{ height: "10%" }} // Base height so it's visible
                    animate={{ height: renderResults ? `${Math.max(pct, 10)}%` : "10%" }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className={`w-full bg-gradient-to-t ${optionColors[i]} shadow-lg`}
                  >
                    {renderResults && (
                      <div className="absolute top-4 left-0 w-full text-center font-black text-4xl drop-shadow-md">
                        {Math.round(pct)}%
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
              
              {/* Option Label */}
              <div className="mt-6 text-center h-20 flex items-center justify-center px-2">
                <span className="text-3xl font-bold text-zinc-300 leading-tight">
                  {opt}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
