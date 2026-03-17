"use client";

import React from "react";
import { Player } from "@/types";
import { motion } from "framer-motion";

export default function LobbySlide({ players }: { players: Player[] }) {
  // Use a predefined set of colors for the bubbles based on their team or random
  const getTeamColor = (team: string) => {
    switch (team) {
      case "הנמרים": return "bg-orange-500";
      case "הכרישים": return "bg-blue-500";
      case "האריות": return "bg-yellow-500";
      default: return "bg-indigo-500";
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-zinc-950 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 z-0" />
      
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 text-center mb-10"
      >
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-fuchsia-500">
          CLICK-MASTER
        </h1>
        <p className="text-xl md:text-2xl font-medium text-zinc-400 mt-2">
          סרקו את ה-QR CODE או היכנסו והזינו קוד
        </p>
      </motion.div>

      <div className="z-10 flex flex-wrap max-w-7xl justify-center gap-6 mt-8">
        {players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: i * 0.05 }}
            className={`px-8 py-4 rounded-full text-2xl font-bold shadow-lg shadow-black/50 ${getTeamColor(p.team)} text-white`}
          >
            {p.name}
          </motion.div>
        ))}
        {players.length === 0 && (
          <div className="text-zinc-500 text-2xl animate-pulse">ממתינים לשחקנים...</div>
        )}
      </div>
    </div>
  );
}
