"use client";

import React from "react";
import { SlideData } from "@/types";

export default function MediaSlide({ slide }: { slide: SlideData }) {
  const isYouTube = slide.mediaUrl?.includes("youtube.com") || slide.mediaUrl?.includes("youtu.be");

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = isYouTube && slide.mediaUrl ? getYouTubeId(slide.mediaUrl) : null;

  return (
    <div className="w-full h-full flex flex-col bg-black relative">
      <div className="absolute top-8 w-full z-10 text-center pointer-events-none">
        <h2 className="text-5xl font-bold text-white drop-shadow-lg bg-black/50 inline-block px-8 py-4 rounded-full backdrop-blur-md">
          {slide.content}
        </h2>
      </div>

      <div className="flex-1 w-full h-full">
        {videoId ? (
          <iframe
            className="w-full h-full border-none"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&showinfo=0`}
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.mediaUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80"})` }}
          />
        )}
      </div>
    </div>
  );
}
