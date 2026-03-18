"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useAudio } from "@/contexts/AudioContext";
import { motion, AnimatePresence } from "framer-motion";
import SlideRenderer from "@/app/screen/components/SlideRenderer";
import LobbySlide from "@/app/screen/components/LobbySlide";
import { parseCSV } from "@/utils/csvParser";
import { Upload, Key, Eye, EyeOff, QrCode, Volume2, VolumeX } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function ScreenPage() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHostCodeVisible, setIsHostCodeVisible] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [hostCode, setHostCode] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(true);
  const { isPlayingBg, toggleBgMusic, playSFX } = useAudio();
  const { isConnected, createRoom, gameState, players, errorMsg, socket, syncGameState } = useSocket();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTransitioning(true);
    const text = await file.text();
    try {
      const parsed = await parseCSV(text);
      console.log("CSV Parsed successfully. Slides:", parsed.slides.length);
      
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        alert("החיבור לשרת התעכב. נסה שוב.");
      }, 5000);

      createRoom(parsed.slides, parsed.teams, (res) => {
        clearTimeout(timeout);
        console.log("Server responded to createRoom:", res);
        if (res.roomCode && res.hostCode) {
          setCreatedRoomCode(res.roomCode);
          setHostCode(res.hostCode);
          setIsSettingUp(false);
          setIsTransitioning(false);
        } else {
          alert("השרת לא החזיר קודי גישה תקינים");
          setIsTransitioning(false);
        }
      });
      
    } catch (err) {
      alert("שגיאה בניתוח הקובץ - וודא שהפורמט תקין");
      console.error(err);
      setIsTransitioning(false);
    }
  };

  // Keep a ref for the latest gameState to use in listeners without re-subscribing
  const gameStateRef = React.useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!socket || !createdRoomCode) return;

    const channel = socket; 

    const handlePlayerJoin = (payload: any) => {
      const { name, id } = payload.payload;
      const currentState = gameStateRef.current;
      if (!currentState) return;

      console.log(`[REALTIME] Player joining project: ${name} (${id})`);
      
      const newPlayer = {
        id,
        name,
        team: "None",
        joinedAt: Date.now(),
        score: 0
      };

      const updatedGameState = {
        ...currentState,
        players: { ...currentState.players, [id]: newPlayer }
      };
      
      syncGameState(updatedGameState, createdRoomCode);
    };

    const handleAnswer = (payload: any) => {
      const { playerId, answer, timeRemaining } = payload.payload;
      const currentState = gameStateRef.current;
      if (!currentState || !currentState.isQuestionActive) return;

      console.log(`[REALTIME] Answer received from ${playerId}: ${answer}`);

      const updatedGameState = {
        ...currentState,
        answers: { ...currentState.answers, [playerId]: answer },
        answerTimes: { ...currentState.answerTimes, [playerId]: timeRemaining }
      };

      syncGameState(updatedGameState, createdRoomCode);
    };

    channel.on("broadcast", { event: "playerJoined" }, handlePlayerJoin);
    channel.on("broadcast", { event: "answer" }, handleAnswer);

    return () => {
      // In Supabase, if we want to remove specific listeners we need to be careful,
      // but usually unsubscribe handles it. For now we just stay subscribed.
    };
  }, [socket, createdRoomCode]); // removed gameState

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-zinc-950 text-white">
        <div className="animate-pulse text-2xl font-bold text-zinc-500 tracking-widest">
          CONNECTING...
        </div>
      </div>
    );
  }

  // Initial Setup Phase
  if (isSettingUp) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-zinc-950 text-white p-4 overflow-y-auto">
        <div className="w-full max-w-4xl bg-zinc-900 p-8 md:p-10 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-fuchsia-500">
            הגדרת מקרן
          </h1>
          {isTransitioning ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-lg font-bold text-zinc-400">יוצר חדר פלאות...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="flex flex-col items-center justify-center md:border-r border-zinc-800 md:pr-8">
                <p className="text-zinc-400 text-center mb-6 text-sm">
                  העלה את קובץ ה-CSV של ציר הזמן ליצירת קוד חדר והמתן לחיבור המנחה.
                </p>
                <label className="cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition px-6 py-8 rounded-2xl flex flex-col items-center gap-3 border-2 border-dashed border-zinc-700 hover:border-blue-500 w-full group">
                  <Upload size={40} className="text-zinc-500 group-hover:text-blue-400 transition" />
                  <span className="text-lg font-bold text-zinc-300">העלאת CSV ציר זמן</span>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>

                {/* Enable Sound Button */}
                {!isPlayingBg && (
                  <button 
                    onClick={toggleBgMusic}
                    className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-fuchsia-600 text-white font-black flex items-center justify-center gap-3 animate-pulse shadow-xl shadow-fuchsia-900/20"
                  >
                    <Volume2 size={24} />
                    <span>הפעל מוזיקת רקע</span>
                  </button>
                )}
              </div>
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-white rounded-xl shadow-xl">
                  <QRCodeCanvas 
                    value={process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")} 
                    size={160}
                    level="H"
                  />
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                    <QrCode size={12} /> סרקו להצטרפות
                  </p>
                  <p className="text-zinc-500 font-mono text-[10px] truncate max-w-[200px]">
                    {process.env.NEXT_PUBLIC_APP_URL || "קבלת כתובת..."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="w-full h-screen relative bg-zinc-950 text-white overflow-hidden">
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-6 py-2 rounded-full font-bold z-50 shadow-2xl">
          {errorMsg}
        </div>
      )}

      {/* Floating Room Info */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-zinc-800" dir="rtl">
        <div>
          <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">קוד חדר</div>
          <div className="text-3xl font-black text-white">{createdRoomCode}</div>
        </div>
        
        <div className="w-px h-10 bg-zinc-700 mx-2" />
        
        <div className="flex flex-col">
          <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
            <Key size={10} /> קוד מנחה
          </div>
          <div className="flex items-center gap-3">
            <div className="text-lg font-mono font-bold text-zinc-400 min-w-[3rem]">
              {isHostCodeVisible ? hostCode : "****"}
            </div>
            <button 
              onClick={() => setIsHostCodeVisible(!isHostCodeVisible)}
              className="p-1 hover:bg-zinc-800 rounded-lg transition-all text-zinc-500 hover:text-white active:scale-90"
              title={isHostCodeVisible ? "הסתר קוד" : "הצג קוד"}
            >
              {isHostCodeVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="w-px h-10 bg-zinc-700 mx-2" />

        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg">
            <QRCodeCanvas 
              value={`${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")}/play?room=${createdRoomCode}`} 
              size={48}
              level="M"
            />
          </div>
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight leading-tight">
            סרקו<br/>להצטרפות
          </div>
        </div>

        <div className="w-px h-10 bg-zinc-700 mx-2" />

        {/* Audio Toggle */}
        <button 
          onClick={toggleBgMusic}
          className={`p-3 rounded-xl transition-all ${isPlayingBg ? "bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/40" : "bg-zinc-800 text-zinc-500"}`}
          title={isPlayingBg ? "השתקת מוזיקה" : "הפעלת מוזיקה"}
        >
          {isPlayingBg ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Show Lobby if game hasn't started (slide 0 usually or waiting for host to advance) */}
      {!gameState || gameState.currentSlideIndex === 0 ? (
        <LobbySlide players={Object.values(players)} />
      ) : (
        <SlideRenderer 
          gameState={gameState} 
          players={players} 
        />
      )}
    </main>
  );
}
