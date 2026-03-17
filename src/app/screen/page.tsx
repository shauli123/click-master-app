"use client";

import React, { useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import SlideRenderer from "./components/SlideRenderer";
import LobbySlide from "./components/LobbySlide";

export default function ScreenPage() {
  const { isConnected, joinRoom, gameState, players, errorMsg, socket } = useSocket();
  const roomCode = "MAIN"; // For simplicity, we can use a fixed room or dynamic. We'll use MAIN for now.

  useEffect(() => {
    if (isConnected) {
      joinRoom(roomCode, "screen");
    }
  }, [isConnected, joinRoom, roomCode]);

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

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="animate-pulse text-2xl font-bold text-zinc-500 tracking-widest">
          CONNECTING...
        </div>
      </div>
    );
  }

  return (
    <main className="w-full h-full relative">
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-6 py-2 rounded-full font-bold z-50 shadow-2xl">
          {errorMsg}
        </div>
      )}

      {/* Show Lobby if game hasn't started or no slides */}
      {!gameState || !gameState.slides || gameState.slides.length === 0 ? (
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
