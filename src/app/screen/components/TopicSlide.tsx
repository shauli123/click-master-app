"use client";

import React from "react";
import { SlideData } from "@/types";
import { motion } from "framer-motion";

export default function TopicSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Dynamic Background Abstract Shapes */}
      <motion.div
        animate={{ 
          rotate: [0, 90, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-[800px] h-[800px] rounded-full bg-fuchsia-600/10 blur-[120px] -top-96 -left-96"
      />
      <motion.div
        animate={{ 
          rotate: [0, -90, 0],
          scale: [1, 1.3, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute w-[900px] h-[900px] rounded-full bg-blue-600/10 blur-[120px] -bottom-96 -right-96"
      />

      <motion.h1 
        initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-8xl md:text-9xl font-black text-center text-white z-10 px-8 leading-tight drop-shadow-2xl max-w-6xl"
      >
        {slide.content}
      </motion.h1>
    </div>
  );
}
