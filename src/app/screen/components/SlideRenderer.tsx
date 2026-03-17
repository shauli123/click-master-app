"use client";

import React, { useMemo } from "react";
import { GameState, Player, SlideData } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import TopicSlide from "./TopicSlide";
import QuestionSlide from "./QuestionSlide";
import MediaSlide from "./MediaSlide";
import LeaderboardSlide from "./LeaderboardSlide";
import PollSlide from "./PollSlide";
import PodiumSlide from "./PodiumSlide";

interface SlideRendererProps {
  gameState: GameState;
  players: Record<string, Player>;
}

export default function SlideRenderer({ gameState, players }: SlideRendererProps) {
  const currentSlide = gameState.slides[gameState.currentSlideIndex];

  const renderSlide = (slide: SlideData) => {
    switch (slide.type) {
      case "TOPIC":
        return <TopicSlide key={`slide-${gameState.currentSlideIndex}`} slide={slide} />;
      case "QUESTION":
        return (
          <QuestionSlide 
            key={`slide-${gameState.currentSlideIndex}`} 
            slide={slide} 
            gameState={gameState} 
            players={players} 
          />
        );
      case "MEDIA":
        return <MediaSlide key={`slide-${gameState.currentSlideIndex}`} slide={slide} />;
      case "LEADERBOARD":
        return (
          <LeaderboardSlide 
            key={`slide-${gameState.currentSlideIndex}`} 
            players={Object.values(players)} 
            gameState={gameState}
          />
        );
      case "POLL":
        return (
          <PollSlide 
            key={`slide-${gameState.currentSlideIndex}`} 
            slide={slide} 
            gameState={gameState} 
          />
        );
      case "PODIUM":
        return (
          <PodiumSlide 
            key={`slide-${gameState.currentSlideIndex}`} 
            players={Object.values(players)} 
          />
        );
      default:
        return (
          <div key={`slide-${gameState.currentSlideIndex}`} className="flex items-center justify-center w-full h-full text-5xl font-black text-zinc-600">
            סוג שקופית לא ידוע: {slide.type}
          </div>
        );
    }
  };

  if (!currentSlide) {
    return (
      <div className="flex items-center justify-center w-full h-full text-5xl font-black text-zinc-600">
        אין שקופית פעילה
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-zinc-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState.currentSlideIndex}
          initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          {renderSlide(currentSlide)}
        </motion.div>
      </AnimatePresence>

      {/* Leaderboard Overlay */}
      <AnimatePresence>
        {gameState.showLeaderboardOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[100] bg-zinc-950"
          >
             <LeaderboardSlide 
                players={Object.values(players)} 
                gameState={gameState}
              />
              <div className="absolute top-8 left-8 bg-amber-500 text-black px-4 py-2 rounded-full font-black text-sm animate-pulse shadow-lg z-[110]">
                שידור חי: טבלת מובילים
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
