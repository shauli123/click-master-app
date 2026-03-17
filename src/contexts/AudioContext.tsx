"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSocket } from "./SocketContext";

interface AudioContextType {
  isPlayingBg: boolean;
  toggleBgMusic: () => void;
  playSFX: (soundName: string) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within an AudioProvider");
  return ctx;
};

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket } = useSocket();
  const [isPlayingBg, setIsPlayingBg] = useState(false);
  
  // Audio Refs
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const sfxRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // Initialize Background Music
    const bg = new Audio("/sonican-tech-quiz-news-loop-274362.mp3");
    bg.loop = true;
    bg.volume = 0.4;
    bgMusicRef.current = bg;

    // Load SFX
    const sounds = {
      applause: "/applause.mp3",
      buzzer: "/buzzer.mp3",
      correct: "/correct.mp3", // Note: Need to verify if correct.mp3 exists or use buzzer for now
      transition: "/next.svg" // Wait, next.svg is not a sound. I'll need to find placeholders or wait.
    };

    // Actually I'll just load what I found in public/
    const availableSounds = ["applause", "buzzer", "applause1", "buzzer1"];
    availableSounds.forEach(name => {
      sfxRefs.current[name] = new Audio(`/${name}.mp3`);
    });

    return () => {
      bg.pause();
      bgMusicRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handlePlaySound = (soundName: string) => {
      console.log("Playing sound from socket:", soundName);
      playSFX(soundName);
    };

    socket.on("playSound", handlePlaySound);

    socket.on("bgMusicAction", ({ action, volume }) => {
      if (!bgMusicRef.current) return;
      
      if (action === 'play') {
        bgMusicRef.current.play().catch(e => console.log("Autoplay blocked:", e));
        setIsPlayingBg(true);
      } else if (action === 'pause') {
        bgMusicRef.current.pause();
        setIsPlayingBg(false);
      } else if (action === 'toggle') {
        toggleBgMusic();
      }

      if (volume !== undefined) {
        bgMusicRef.current.volume = volume;
      }
    });

    return () => {
      socket.off("playSound", handlePlaySound);
      socket.off("bgMusicAction");
    };
  }, [socket]);

  const toggleBgMusic = () => {
    if (!bgMusicRef.current) return;
    if (isPlayingBg) {
      bgMusicRef.current.pause();
      setIsPlayingBg(false);
    } else {
      bgMusicRef.current.play().catch(e => console.log("Autoplay blocked:", e));
      setIsPlayingBg(true);
    }
  };

  const playSFX = (soundName: string) => {
    // Basic mapping for legacy strings
    const name = soundName.toLowerCase();
    const audio = sfxRefs.current[name];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log("SFX play failed:", e));
    } else {
       // Fallback for names like 'applause' if they aren't in the ref yet
       const newAudio = new Audio(`/${name}.mp3`);
       newAudio.play().catch(() => {
          // If file doesn't exist, just ignore
       });
       sfxRefs.current[name] = newAudio;
    }
  };

  return (
    <AudioContext.Provider value={{ isPlayingBg, toggleBgMusic, playSFX }}>
      {children}
    </AudioContext.Provider>
  );
};
