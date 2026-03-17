"use client";

import React, { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayPage() {
  const { isConnected, joinPlayer, gameState, sendAnswer, errorMsg, socket } = useSocket();
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);

  // Local State
  const [name, setName] = useState("");
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
    if (!name.trim() || !roomCodeInput.trim()) return;

    joinPlayer(roomCodeInput.trim(), name.trim(), (res) => {
      if (res.success) {
        setRoomCode(roomCodeInput.trim());
        setHasJoined(true);
        triggerHaptic(50);
      } else {
        alert(res.error || "שגיאה בהתחברות לחדר");
      }
    });
  };

  const triggerHaptic = (ms: number | number[]) => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(ms);
    }
  };

  const handleAnswer = (index: number) => {
    if (!gameState?.isQuestionActive || hasAnswered || !gameState.questionStartTime) return;
    
    // Performance.now() for high precision, but we need to compare with server-side questionStartTime
    // questionStartTime is Date.now() on server.
    const now = Date.now();
    const elapsed = now - gameState.questionStartTime;
    const timeRemaining = Math.max(0, (gameState.baseTimeAllowed * 1000) - elapsed);
    
    triggerHaptic([50, 50, 50]);
    
    if (roomCode) sendAnswer(roomCode, index, timeRemaining / 1000);
    setHasAnswered(true);
  };

  const optionColors = [
    "bg-red-600",
    "bg-blue-600",
    "bg-yellow-500 text-black",
    "bg-green-600",
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
    return (
      <div className="fixed inset-0 flex flex-col p-8 justify-center items-center bg-zinc-950 h-[100svh] overflow-hidden">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-12 text-center">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-blue-500">
            CLICK-MASTER
          </h1>
          <p className="text-zinc-400 mt-2 font-medium">ברוכים הבאים למשחק!</p>
        </motion.div>

        <form onSubmit={handleJoin} className="w-full flex flex-col gap-6 max-w-sm">
          <div>
            <label className="block text-sm font-bold text-zinc-500 mb-2 px-2 text-right">קוד חדר</label>
            <input
              type="text"
              required
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              placeholder="0000"
              className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl px-6 py-4 text-3xl font-black tracking-[0.5em] text-center focus:outline-none focus:border-blue-500 transition-all text-white"
              maxLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-500 mb-2 px-2 text-right">השם שלך</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ישראל ישראלי"
              className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl px-6 py-4 text-xl font-bold focus:outline-none focus:border-fuchsia-500 transition-all text-white text-right"
              dir="rtl"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !roomCodeInput.trim()}
            className="mt-6 w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-fuchsia-600 font-black text-2xl shadow-xl shadow-fuchsia-900/40 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 text-white"
          >
            התחבר למצעד!
          </button>
        </form>
      </div>
    );
  }

  // GAME CONTROLLER VIEW
  const slide = gameState?.slides?.[gameState.currentSlideIndex];
  const myAnswer = roomCode && socket?.id && gameState?.answers ? gameState.answers[socket.id] : null;
  const isCorrect = slide?.type === "QUESTION" && myAnswer !== null && myAnswer === slide.correctOption;

  if (slide?.type === "QUESTION" && gameState && !gameState.showResults) {
    return (
      <div className="fixed inset-0 flex flex-col bg-zinc-950 h-[100svh] overflow-hidden">
        <div className="text-center py-6 z-10 bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800">
          <h2 className="text-xl font-black text-white px-4 leading-tight">{slide.content}</h2>
          <div className="mt-2 flex justify-center items-center gap-2">
            {!gameState.isQuestionActive ? (
              <span className="text-zinc-500 font-bold animate-pulse">ממתינים להפעלת הטיימר...</span>
            ) : (
              <span className="text-fuchsia-400 font-bold">בחרו עכשיו! ⚡</span>
            )}
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4 pb-8">
          {[0, 1, 2, 3].map((index) => {
            const isRevealed = gameState && index < gameState.revealedOptionsCount;
            const amIAnswering = hasAnswered && myAnswer === index;
            
            return (
              <AnimatePresence key={index}>
                {isRevealed && (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => handleAnswer(index)}
                    disabled={!gameState?.isQuestionActive || hasAnswered}
                    className={`rounded-[2rem] ${optionColors[index]} active:scale-95 transition-all flex items-center justify-center font-black text-6xl relative overflow-hidden ${
                      !gameState?.isQuestionActive || (hasAnswered && !amIAnswering) ? "opacity-30 grayscale" : "opacity-100"
                    } ${amIAnswering ? "ring-8 ring-white scale-105 z-20" : ""}`}
                  >
                    <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
                    {amIAnswering && <div className="absolute inset-0 flex items-center justify-center bg-white/20 animate-pulse" />}
                  </motion.button>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </div>
    );
  }

  // RESULTS FEEDBACK VIEW
  if (gameState?.showResults) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center bg-zinc-950 h-[100svh] overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-64 h-64 rounded-full flex items-center justify-center text-8xl shadow-[0_0_80px_rgba(0,0,0,0.5)] mb-8 ${
            isCorrect ? "bg-green-500 shadow-green-500/40" : "bg-red-500 shadow-red-500/40"
          }`}
        >
          {isCorrect ? "🏆" : "❌"}
        </motion.div>
        <h2 className={`text-5xl font-black mb-4 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
          {isCorrect ? "צדקתם!" : "טעיתם!"}
        </h2>
        <p className="text-zinc-400 text-xl font-bold">
          {isCorrect ? "מצוין, המשכתם קדימה!" : "לא נורא, תצליחו בבאה!"}
        </p>
      </div>
    );
  }

  // WAITING/LOBBY VIEW
  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center relative overflow-hidden bg-zinc-950 h-[100svh]">
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
