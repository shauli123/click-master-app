"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import SlideRenderer from "./components/SlideRenderer";
import LobbySlide from "./components/LobbySlide";
import { parseCSV } from "@/utils/csvParser";
import { Upload, Key } from "lucide-react";

export default function ScreenPage() {
  const { isConnected, createRoom, gameState, players, errorMsg, socket } = useSocket();
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [hostCode, setHostCode] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(true);

  // Re-establish connection visual if lost
  useEffect(() => {
    if (isConnected && !isSettingUp && createdRoomCode) {
      // It's technically re-created if the server died, but for simplicity we rely on the server keeping state
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

    const text = await file.text();
    try {
      const parsed = await parseCSV(text);
      
      createRoom(parsed.slides, parsed.teams, (res) => {
        setCreatedRoomCode(res.roomCode);
        setHostCode(res.hostCode);
        setIsSettingUp(false);
      });
      
    } catch (err) {
      alert("Error parsing CSV");
      console.error(err);
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
      <div className="flex items-center justify-center w-full h-full bg-zinc-950 text-white">
        <div className="w-[600px] bg-zinc-900 p-12 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center">
          <h1 className="text-5xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-fuchsia-500">
            Setup Projector
          </h1>
          <p className="text-zinc-400 text-center mb-8">
            Upload the timeline CSV to generate the room code and wait for the Host to connect.
          </p>
          <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition px-8 py-6 rounded-2xl flex flex-col items-center gap-4 border-2 border-dashed border-zinc-600 hover:border-blue-500 w-full group">
            <Upload size={48} className="text-zinc-500 group-hover:text-blue-400 transition" />
            <span className="text-xl font-bold text-zinc-300">Upload Timeline CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full h-full relative bg-zinc-950 text-white overflow-hidden">
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-6 py-2 rounded-full font-bold z-50 shadow-2xl">
          {errorMsg}
        </div>
      )}

      {/* Floating Room Info */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-zinc-800">
        <div>
          <div className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Room Code</div>
          <div className="text-3xl font-black text-white">{createdRoomCode}</div>
        </div>
        <div className="w-px h-10 bg-zinc-700 mx-2" />
        <div>
          <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
            <Key size={10} /> Host Code
          </div>
          <div className="text-lg font-bold text-zinc-400">{hostCode}</div>
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
