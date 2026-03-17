"use client";

import React, { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { parseCSV } from "@/utils/csvParser";
import { calculateScore } from "@/utils/scoreCalculator";
import { GameState, SlideData, Player } from "@/types";
import { Play, Pause, FastForward, Upload, Settings, Zap, Music, Volume2 } from "lucide-react";

export default function HostPage() {
  const { isConnected, joinRoom, socket, gameState, syncGameState, players, toggleJoker } = useSocket();
  const roomCode = "MAIN";

  const [hasJoined, setHasJoined] = useState(false);
  const [localState, setLocalState] = useState<GameState | null>(null);

  // Sync our local mirror with the global game state on mount or change
  useEffect(() => {
    if (gameState && !localState) {
      setLocalState(gameState);
    }
  }, [gameState, localState]);

  // Maintain local state to act as Source of Truth as the Host
  const pushState = (newState: GameState) => {
    setLocalState(newState);
    syncGameState(newState, roomCode);
  };

  const initHost = () => {
    joinRoom(roomCode, "host");
    setHasJoined(true);
    
    // If no state exists yet, init an empty one
    if (!gameState) {
      const init: GameState = {
        roomCode,
        hostId: "local-host",
        players: {},
        teams: ["הנמרים", "הכרישים", "האריות"],
        slides: [],
        currentSlideIndex: 0,
        jokerModeEnabled: false,
        isQuestionActive: false,
        questionStartTime: null,
        baseTimeAllowed: 15,
        answers: {},
        answerTimes: {},
      };
      pushState(init);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !localState) return;

    const text = await file.text();
    try {
      const parsed = await parseCSV(text);
      pushState({
        ...localState,
        teams: parsed.teams,
        slides: parsed.slides,
        currentSlideIndex: 0, // Reset to start
        isQuestionActive: false,
        answers: {},
        answerTimes: {},
      });
      alert(`CSV Loaded successfully! ${parsed.slides.length} slides ready.`);
    } catch (err) {
      alert("Error parsing CSV");
      console.error(err);
    }
  };

  // Timeline Controls
  const nextSlide = () => {
    if (!localState) return;
    
    // Auto-calculate scores if moving from active question
    if (localState.isQuestionActive) {
      resolveScores(localState);
      return; // Resolving stops question without advancing slide immediately, host clicks NEXT again
    }

    if (localState.currentSlideIndex < localState.slides.length - 1) {
      const nextIndex = localState.currentSlideIndex + 1;
      const nextSlideData = localState.slides[nextIndex];
      
      pushState({
        ...localState,
        currentSlideIndex: nextIndex,
        isQuestionActive: nextSlideData.type === "QUESTION",
        questionStartTime: nextSlideData.type === "QUESTION" ? Date.now() : null,
        answers: {},
        answerTimes: {},
        jokerModeEnabled: false,
      });
    }
  };

  const resolveScores = (state: GameState) => {
    const currentSlide = state.slides[state.currentSlideIndex];
    if (currentSlide.type !== "QUESTION" || currentSlide.correctOption === undefined) {
      // Just stop if not a real scored question
      pushState({
        ...state,
        isQuestionActive: false,
      });
      return;
    }

    // Award points
    const updatedPlayers = { ...state.players }; // Trust the server players currently in state
    
    Object.entries(state.answers).forEach(([playerId, selectedOption]) => {
      if (selectedOption === currentSlide.correctOption) {
        const timeRemaining = state.answerTimes[playerId] || 1;
        const pts = calculateScore(timeRemaining, state.baseTimeAllowed, state.jokerModeEnabled ? 2 : currentSlide.modifier || 1);
        
        if (updatedPlayers[playerId]) {
          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            score: (updatedPlayers[playerId].score || 0) + pts
          };
        }
      }
    });

    pushState({
      ...state,
      players: updatedPlayers,
      isQuestionActive: false,
    });
  };

  const handleToggleJoker = () => {
    if (!localState) return;
    const newState = !localState.jokerModeEnabled;
    pushState({ ...localState, jokerModeEnabled: newState });
    toggleJoker(roomCode, newState);
  };

  const triggerSound = (soundType: string) => {
    if (socket) socket.emit("playSound", { room: roomCode, sound: soundType });
  };

  if (!isConnected || !hasJoined) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full">
        <h1 className="text-4xl font-black mb-8 text-fuchsia-500">HOST REMOTE</h1>
        <button 
          onClick={initHost}
          className="px-12 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-2xl"
        >
          CONNECT REMOTE
        </button>
      </div>
    );
  }

  if (!localState) return <div className="p-8 text-center text-zinc-500">Loading State...</div>;

  const currentSlide: SlideData | undefined = localState.slides[localState.currentSlideIndex];
  const nextSlideData: SlideData | undefined = localState.slides[localState.currentSlideIndex + 1];

  return (
    <div className="flex-1 flex flex-col pt-4 gap-6 select-none bg-zinc-900 text-zinc-100">
      
      {/* Header & Stats */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 px-2">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-blue-400">
            Click-Master Control
          </h2>
          <div className="text-sm text-zinc-400 mt-1 flex gap-4">
            <span>👥 {Object.keys(localState.players).length} Players</span>
            {localState.isQuestionActive && (
              <span className="text-emerald-400 font-bold">● Live Answers: {Object.keys(localState.answers).length}</span>
            )}
          </div>
        </div>
        
        <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <Upload size={16} />
          <span>Upload CSV</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {localState.slides.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 font-medium">
          Upload a Timeline CSV to begin.
        </div>
      ) : (
        <>
          {/* Main Action Area */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Current Slide Info Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-inner relative overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Current Activity</div>
              <h3 className="text-3xl font-black text-white leading-tight">
                {currentSlide?.content || "Waiting..."}
              </h3>
              <div className="mt-4 flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-zinc-800 text-sm font-bold rounded-md border border-zinc-700">
                  {currentSlide?.type || "N/A"}
                </span>
                {currentSlide?.type === "QUESTION" && (
                  <span className="px-3 py-1 bg-indigo-900 text-indigo-200 text-sm font-bold rounded-md border border-indigo-700">
                    Mod: {currentSlide.modifier || 1}x
                  </span>
                )}
              </div>
            </div>

            {/* Giant NEXT Button */}
            <button 
              onClick={nextSlide}
              className={`w-full py-8 md:py-12 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                localState.isQuestionActive 
                  ? "bg-gradient-to-r from-rose-600 to-red-600 shadow-red-500/30" 
                  : "bg-gradient-to-r from-amber-500 to-yellow-500 shadow-amber-500/20"
              }`}
            >
              {localState.isQuestionActive ? (
                <>
                  <Pause fill="currentColor" size={48} className="text-white drop-shadow-md" />
                  <span className="text-3xl font-black text-white drop-shadow-md tracking-wide">
                    CLOSE ARBITRATION
                  </span>
                </>
              ) : (
                <>
                  <FastForward fill="currentColor" size={48} className="text-black/80 drop-shadow-sm" />
                  <span className="text-3xl font-black text-black/90 drop-shadow-sm tracking-wide">
                    NEXT EVENT
                  </span>
                </>
              )}
            </button>
            <div className="text-center text-zinc-500 text-sm font-medium">
              Up Next: <span className="font-bold text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-[200px] align-bottom">
                {nextSlideData ? `${nextSlideData.type} - ${nextSlideData.content}` : "End"}
              </span>
            </div>
            
            <hr className="border-zinc-800 my-2" />

            {/* Overrides & Controls */}
            <div className="grid grid-cols-2 gap-4">
              
              <button 
                onClick={handleToggleJoker}
                className={`col-span-2 py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-xl transition-all border-2 ${
                  localState.jokerModeEnabled 
                    ? "bg-fuchsia-900 border-fuchsia-500 text-fuchsia-200 shadow-[0_0_15px_theme(colors.fuchsia.500/40)] animate-pulse" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <Zap fill={localState.jokerModeEnabled ? "currentColor" : "none"} />
                {localState.jokerModeEnabled ? "JOKER MODE ACTIVE" : "ACTIVATE JOKER"}
              </button>
              
              <div className="col-span-2 mt-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
                SOUNDBOARD
              </div>

              <button 
                onClick={() => triggerSound("applause")}
                className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-zinc-700 transition"
              >
                <Volume2 className="text-blue-400" size={28} />
                <span className="font-bold text-sm">Applause</span>
              </button>

              <button 
                onClick={() => triggerSound("buzzer")}
                className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-zinc-700 transition"
              >
                <Music className="text-red-400" size={28} />
                <span className="font-bold text-sm">Buzzer</span>
              </button>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
