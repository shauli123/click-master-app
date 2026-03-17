"use client";

import React, { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { parseCSV } from "@/utils/csvParser";
import { calculateScore } from "@/utils/scoreCalculator";
import { GameState, SlideData } from "@/types";
import { Play, Pause, FastForward, Settings, Zap, Music, Volume2 } from "lucide-react";

export default function HostPage() {
  const { isConnected, joinHost, socket, gameState, syncGameState, toggleJoker } = useSocket();
  const [hostCodeInput, setHostCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);

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
    if (roomCode) {
      syncGameState(newState, roomCode);
    }
  };

  const initHost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostCodeInput.trim()) return;

    joinHost(hostCodeInput.trim(), (res) => {
      if (res.success && res.roomCode) {
        setRoomCode(res.roomCode);
        setHasJoined(true);
      } else {
        alert(res.error || "Failed to join as Host");
      }
    });
  };

  // handleFileUpload removed since Screen uploads the CSV now

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
      const isQuestion = nextSlideData.type === "QUESTION";
      
      pushState({
        ...localState,
        currentSlideIndex: nextIndex,
        isQuestionActive: false, // Initially false for questions
        questionStartTime: null,
        revealedOptionsCount: 0,
        showResults: false,
        answers: {},
        answerTimes: {},
        jokerModeEnabled: false,
      });
    }
  };

  const revealNextOption = () => {
    if (!localState || localState.revealedOptionsCount >= 4) return;
    pushState({
      ...localState,
      revealedOptionsCount: localState.revealedOptionsCount + 1
    });
  };

  const startQuestion = () => {
    if (!localState) return;
    pushState({
      ...localState,
      isQuestionActive: true,
      questionStartTime: Date.now(),
      showResults: false
    });
  };

  const showQuestionResults = () => {
    if (!localState) return;
    resolveScores(localState);
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
      showResults: true,
    });
  };

  const handleToggleJoker = () => {
    if (!localState) return;
    const newState = !localState.jokerModeEnabled;
    pushState({ ...localState, jokerModeEnabled: newState });
    if (roomCode) toggleJoker(roomCode, newState);
  };

  const triggerSound = (soundType: string) => {
    if (socket && roomCode) socket.emit("playSound", { roomCode, sound: soundType });
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full">
        <h1 className="text-4xl font-black mb-8 text-fuchsia-500">שלט מנחה</h1>
        <div className="animate-pulse font-bold text-zinc-500">מתחבר לשרת...</div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full p-6">
        <h1 className="text-4xl font-black mb-8 text-amber-500">כניסת מנחה</h1>
        <form onSubmit={initHost} className="w-full max-w-sm flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="הזן קוד מנחה" 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center text-3xl font-black tracking-widest text-white focus:border-amber-500 outline-none"
            value={hostCodeInput}
            onChange={e => setHostCodeInput(e.target.value)}
            maxLength={4}
          />
          <button 
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 font-bold text-2xl shadow-xl shadow-amber-900/20 active:scale-95 transition"
          >
            קבלת שליטה
          </button>
        </form>
      </div>
    );
  }

  if (!localState) return <div className="p-8 text-center text-zinc-500">טוען נתונים...</div>;

  const currentSlide: SlideData | undefined = localState.slides[localState.currentSlideIndex];
  const nextSlideData: SlideData | undefined = localState.slides[localState.currentSlideIndex + 1];

  return (
    <div className="relative min-h-[100svh] flex flex-col pt-4 gap-6 select-none bg-zinc-900 text-zinc-100 overflow-y-auto pb-12">
      
      {/* Header & Stats */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 px-2">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-blue-400">
            בקרת Click-Master
          </h2>
          <div className="text-sm text-zinc-400 mt-1 flex gap-4">
            <span>👥 {Object.keys(localState.players).length} שחקנים</span>
            {localState.isQuestionActive && (
              <span className="text-emerald-400 font-bold">● תשובות: {Object.keys(localState.answers).length}</span>
            )}
          </div>
        </div>
        <div className="text-xs font-bold text-zinc-500 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
          חדר: <span className="text-white">{roomCode}</span>
        </div>
      </div>

      {localState.slides.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 font-medium">
          העלה CSV במקרן כדי להתחיל.
        </div>
      ) : (
        <>
          {/* Main Action Area */}
          <div className="flex-1 flex flex-col gap-3 px-2">
            
            {/* Current Slide Info Card (Compact) */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-inner relative overflow-hidden">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">פעילות נוכחית</div>
              <h3 className="text-xl font-black text-white leading-tight truncate">
                {currentSlide?.content || "ממתין..."}
              </h3>
              <div className="mt-2 flex gap-2" dir="ltr">
                <span className="px-2 py-0.5 bg-zinc-800 text-[10px] font-bold rounded border border-zinc-700">
                  {currentSlide?.type || "N/A"}
                </span>
              </div>
            </div>

            {/* Giant Action Buttons Grid */}
            <div className="flex-1 flex flex-col gap-3">
              {currentSlide?.type === "QUESTION" && !localState.showResults ? (
                <div className="flex-1 flex flex-col gap-3">
                  {/* Step 1: Reveal Options */}
                  <button 
                    onClick={revealNextOption}
                    disabled={localState.revealedOptionsCount >= 4 || localState.isQuestionActive}
                    className={`w-full py-4 rounded-xl font-black text-lg transition-all active:scale-95 border-2 ${
                      localState.revealedOptionsCount < 4 && !localState.isQuestionActive
                        ? "bg-blue-600 border-blue-400 text-white" 
                        : "bg-zinc-800 border-zinc-700 text-zinc-500 opacity-50 shadow-none pointer-events-none"
                    }`}
                  >
                    {localState.revealedOptionsCount < 4 
                      ? `חשיפת תשובה (${localState.revealedOptionsCount}/4)` 
                      : "כל התשובות נחשפו"}
                  </button>

                  {/* Step 2: Start Timer */}
                  <button 
                    onClick={startQuestion}
                    disabled={localState.isQuestionActive || localState.revealedOptionsCount < 4}
                    className={`w-full py-6 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border-2 ${
                      !localState.isQuestionActive && localState.revealedOptionsCount >= 4
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-400 text-black animate-pulse" 
                        : "bg-zinc-800 border-zinc-700 text-zinc-500 opacity-50 shadow-none pointer-events-none"
                    }`}
                  >
                    <Play fill="currentColor" size={24} />
                    <span className="text-xl font-black">הפעל טיימר</span>
                  </button>

                  {/* Step 3: Resolve / Show Results */}
                  {localState.isQuestionActive && (
                    <button 
                      onClick={showQuestionResults}
                      className="w-full py-6 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 border-rose-400 text-white shadow-red-500/30 active:scale-95 flex flex-col items-center gap-1"
                    >
                      <Pause fill="currentColor" size={24} />
                      <span className="text-xl font-black">סגור תשובות</span>
                    </button>
                  )}
                </div>
              ) : (
                <button 
                  onClick={nextSlide}
                  className="w-full flex-1 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-lg bg-gradient-to-r from-amber-500 to-yellow-500 shadow-amber-500/20"
                >
                  <FastForward fill="currentColor" size={40} className="text-black/80" />
                  <span className="text-2xl font-black text-black/90">
                    {localState.showResults ? "לשקופית הבאה" : "הבא בתור"}
                  </span>
                </button>
              )}
            </div>
            <div className="text-center text-zinc-500 text-[10px] font-bold uppercase tracking-tight">
              הבא: <span className="text-zinc-400 truncate max-w-[150px] inline-block align-bottom px-1">
                {nextSlideData ? `${nextSlideData.type} - ${nextSlideData.content}` : "סוף"}
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
                {localState.jokerModeEnabled ? "מצב ג'וקר פעיל" : "הפעל ג'וקר"}
              </button>
              
              <div className="col-span-2 mt-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
                לוח סאונד
              </div>

              <button 
                onClick={() => triggerSound("applause")}
                className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-zinc-700 transition"
              >
                <Volume2 className="text-blue-400" size={28} />
                <span className="font-bold text-sm">מחיאות כפיים</span>
              </button>

              <button 
                onClick={() => triggerSound("buzzer")}
                className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-zinc-700 transition"
              >
                <Music className="text-red-400" size={28} />
                <span className="font-bold text-sm">באזר</span>
              </button>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
