"use client";

import React, { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayPage() {
  const { isConnected, joinRoom, gameState, sendAnswer, errorMsg } = useSocket();
  const roomCode = "MAIN"; // Simplified for now

  // Local State
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Auto-reset hasAnswered when new question begins
  useEffect(() => {
    if (gameState?.isQuestionActive) {
      setHasAnswered(false);
    }
  }, [gameState?.isQuestionActive, gameState?.currentSlideIndex]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    joinRoom(roomCode, "player", name.trim(), team);
    setHasJoined(true);
    triggerHaptic(50);
  };

  const triggerHaptic = (ms: number | number[]) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(ms);
    }
  };

  const handleAnswer = (index: number) => {
    if (!gameState?.isQuestionActive || hasAnswered) return;
    
    triggerHaptic([50, 50, 50]); // Multi-pulse for confirmation
    
    // In a real app we'd calculate time remaining properly, simplified here
    const timeRemaining = gameState.baseTimeAllowed || 10; 
    
    sendAnswer(roomCode, index, timeRemaining);
    setHasAnswered(true);
  };

  const optionColors = [
    "from-red-600 to-red-500 shadow-[0_0_30px_theme(colors.red.600/50)]",
    "from-blue-600 to-blue-500 shadow-[0_0_30px_theme(colors.blue.600/50)]",
    "from-yellow-500 to-yellow-400 shadow-[0_0_30px_theme(colors.yellow.500/50)] text-black",
    "from-green-600 to-green-500 shadow-[0_0_30px_theme(colors.green.600/50)]",
  ];

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-2xl font-bold tracking-widest text-fuchsia-500"
        >
          מתחבר...
        </motion.div>
      </div>
    );
  }

  // ONBOARDING VIEW
  if (!hasJoined) {
    const availableTeams = gameState?.teams?.length ? gameState.teams : ["הנמרים", "הכרישים", "האריות"];
    
    return (
      <div className="flex-1 flex flex-col p-8 justify-center items-center">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-12 text-center">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-blue-500">
            CLICK-MASTER
          </h1>
          <p className="text-zinc-400 mt-2 font-medium">ברוכים הבאים למשחק!</p>
        </motion.div>

        <form onSubmit={handleJoin} className="w-full flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2 px-2">שם מלא</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ישראל ישראלי"
              className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl px-6 py-4 text-xl font-bold focus:outline-none focus:border-fuchsia-500 transition-colors text-right"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2 px-2">קבוצה (אופציונלי)</label>
            <div className="grid grid-cols-1 gap-3">
              {availableTeams.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTeam(t);
                    triggerHaptic(20);
                  }}
                  className={`py-4 rounded-2xl font-bold text-lg transition-all border-2 ${
                    team === t 
                      ? "bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400 scale-[1.02]" 
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="mt-6 w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-fuchsia-600 font-black text-2xl shadow-lg shadow-fuchsia-600/30 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
          >
            הכנס אותי למשחק!
          </button>
        </form>
      </div>
    );
  }

  // GAME CONTROLLER VIEW
  const slide = gameState?.slides?.[gameState.currentSlideIndex];
  
  if (slide?.type === "QUESTION" && gameState?.isQuestionActive && !hasAnswered) {
    // 4 MASSIVE BUTTONS
    return (
      <div className="flex-1 flex flex-col p-4 gap-4 bg-zinc-950">
        <div className="text-center py-4 z-10">
          <h2 className="text-2xl font-black text-white">{slide.content}</h2>
          <p className="text-fuchsia-400 font-bold mt-1">בחר תשובה מהר!</p>
        </div>
        
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 pb-4">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={`rounded-[2rem] bg-gradient-to-br ${optionColors[index]} active:scale-95 transition-transform flex items-center justify-center font-black text-6xl relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // WAITING/LOBBY VIEW
  return (
    <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden bg-zinc-950">
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-96 h-96 rounded-full bg-fuchsia-600/20 blur-[50px] z-0"
      />
      
      <div className="z-10 text-center flex flex-col items-center">
        {hasAnswered ? (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-7xl mb-4">✅</motion.div>
            <h2 className="text-3xl font-black text-fuchsia-400">התשובה התקבלה!</h2>
            <p className="text-zinc-400 mt-2 font-medium">מתזמן את שאר המשתתפים...</p>
          </>
        ) : (
          <>
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="text-6xl mb-8 opacity-50"
            >
              ⏳
            </motion.div>
            <h2 className="text-3xl font-black text-white px-8 leading-tight">שב בנחת, ממתינים למנחה...</h2>
            {slide?.type && slide.type !== "QUESTION" && (
              <p className="text-fuchsia-400 font-bold mt-4 px-8 text-xl">
                {slide.type === "MEDIA" ? "צפו במסך!" : slide.type === "POLL" ? "הצבעה תיפתח בקרוב" : "שים לב למסך הגדול"}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
