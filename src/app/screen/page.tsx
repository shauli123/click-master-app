"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import SlideRenderer from "@/app/screen/components/SlideRenderer";
import LobbySlide from "@/app/screen/components/LobbySlide";
import { parseCSV } from "@/utils/csvParser";
import { Upload, Key, Eye, EyeOff, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function ScreenPage() {
  const { isConnected, createRoom, gameState, players, errorMsg, socket } = useSocket();
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [hostCode, setHostCode] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHostCodeVisible, setIsHostCodeVisible] = useState(false);

  // Re-establish connection visual if lost
  useEffect(() => {
    if (isConnected && !isSettingUp && createdRoomCode) {
      console.log("Connected & Room active:", createdRoomCode);
    }
  }, [isConnected, isSettingUp, createdRoomCode]);

  useEffect(() => {
    if (!socket) return;
    
    const handleSound = (sound: string) => {
      try {
        const audio = new Audio(`/${sound}.mp3`);
        audio.play().catch(e => console.error("Audio play failed:", e));
      } catch (e) {
        console.error("Error playing sound", e);
      }
    };

    socket.on("playSound", handleSound);
    return () => {
      socket.off("playSound", handleSound);
    };
  }, [socket]);

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
      <div className="flex items-center justify-center w-full h-screen bg-zinc-950 text-white">
        <div className="w-[800px] bg-zinc-900 p-12 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center">
          <h1 className="text-5xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-fuchsia-500">
            הגדרת מקרן
          </h1>
          {isTransitioning ? (
            <div className="flex flex-col items-center gap-6 py-10">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-xl font-bold text-zinc-400">יוצר חדר פלאות...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-12 w-full">
              <div className="flex flex-col items-center justify-center border-r border-zinc-800 pr-12">
                <p className="text-zinc-400 text-center mb-8">
                  העלה את קובץ ה-CSV של ציר הזמן ליצירת קוד חדר והמתן לחיבור המנחה.
                </p>
                <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition px-8 py-12 rounded-2xl flex flex-col items-center gap-4 border-2 border-dashed border-zinc-600 hover:border-blue-500 w-full group">
                  <Upload size={48} className="text-zinc-500 group-hover:text-blue-400 transition" />
                  <span className="text-xl font-bold text-zinc-300">העלאת CSV ציר זמן</span>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="p-6 bg-white rounded-2xl shadow-xl">
                  <QRCodeCanvas 
                    value={process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")} 
                    size={200}
                    level="H"
                  />
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <QrCode size={16} /> סרקו להצטרפות
                  </p>
                  <p className="text-zinc-400 font-mono text-xs">
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
