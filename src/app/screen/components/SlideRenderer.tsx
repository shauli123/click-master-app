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
            UNKNOWN SLIDE TYPE: {slide.type}
          </div>
        );
    }
  };

  if (!currentSlide) {
    return (
      <div className="flex items-center justify-center w-full h-full text-5xl font-black text-zinc-600">
        NO SLIDE ACTIVE
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-zinc-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState.currentSlideIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {renderSlide(currentSlide)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
