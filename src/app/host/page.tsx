"use client";

import React, { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { parseCSV } from "@/utils/csvParser";
import { calculateScore } from "@/utils/scoreCalculator";
import { GameState, SlideData } from "@/types";
import { Play, Pause, FastForward, Settings, Zap, Music, Volume2, LogOut } from "lucide-react";

export default function HostPage() {
  const { isConnected, joinHost, socket, gameState, syncGameState, toggleJoker } = useSocket();
  const [hostCodeInput, setHostCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const [hasJoined, setHasJoined] = useState(false);
  const [localState, setLocalState] = useState<GameState | null>(null);

  // Sync our local mirror with the global game state to get live answers/players
  useEffect(() => {
    if (gameState) {
      setLocalState((prev) => {
        if (!prev) return gameState;
        
        // If the slide index changed globally (e.g., another host or session), sync fully
        if (gameState.currentSlideIndex !== prev.currentSlideIndex) {
          return gameState;
        }

        // Otherwise, keep our navigation but merge "live" data from players
        return {
          ...prev,
          players: gameState.players || prev.players,
          answers: gameState.answers || prev.answers,
          answerTimes: gameState.answerTimes || prev.answerTimes,
          isQuestionActive: gameState.isQuestionActive, // Sync timer state
          showResults: gameState.showResults,
          jokerModeEnabled: gameState.jokerModeEnabled,
          fastestCorrectAnswer: gameState.fastestCorrectAnswer,
          showLeaderboardOverlay: gameState.showLeaderboardOverlay
        };
      });
    }
  }, [gameState]);

  // Maintain local state to act as Source of Truth as the Host
  const pushState = (newState: GameState) => {
    setLocalState(newState);
    if (roomCode) {
      syncGameState(newState, roomCode);
    }
  };

  const initHost = (e?: React.FormEvent, code?: string) => {
    if (e) e.preventDefault();
    const finalCode = code || hostCodeInput.trim();
    if (!finalCode) return;

    joinHost(finalCode, (res) => {
      if (res.success && res.roomCode) {
        setRoomCode(res.roomCode);
        setHasJoined(true);
        localStorage.setItem("click_master_host_code", finalCode);
      } else {
        if (!code) alert(res.error || "Failed to join as Host");
        else console.log("Auto-rejoin failed:", res.error);
      }
    });
  };

  // Auto-rejoin on mount
  useEffect(() => {
    const savedHostCode = localStorage.getItem("click_master_host_code");
    if (isConnected && !hasJoined && savedHostCode) {
      setHostCodeInput(savedHostCode);
      initHost(undefined, savedHostCode);
    }
  }, [isConnected, hasJoined]);

  const handleLogout = () => {
    if (confirm("האם אתה בטוח שברצונך לצאת מניהול החידון?")) {
      setHasJoined(false);
      localStorage.removeItem("click_master_host_code");
      setRoomCode(null);
      setHostCodeInput("");
    }
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
      const isPoll = nextSlideData.type === "POLL";
      
      // Auto-enable joker if the next slide has a modifier marked in CSV
      const shouldAutoJoker = isQuestion && nextSlideData.modifier && nextSlideData.modifier > 1;

      pushState({
        ...localState,
        currentSlideIndex: nextIndex,
        isQuestionActive: false,
        questionStartTime: null,
        revealedOptionsCount: isPoll ? 4 : 0,
        showResults: false,
        answers: {},
        answerTimes: {},
        jokerModeEnabled: !!shouldAutoJoker,
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

    // Award points and track speedster
    const updatedPlayers = { ...state.players };
    let fastestThisTurn = state.fastestCorrectAnswer || null;
    
    // Determine dynamic multiplier (Manual Joker toggle is x2, CSV modifier can be higher)
    const activeModifier = Math.max(state.jokerModeEnabled ? 2 : 1, currentSlide.modifier || 1);

    Object.entries(state.answers).forEach(([playerId, selectedOption]) => {
      if (selectedOption === currentSlide.correctOption) {
        const timeRemaining = state.answerTimes[playerId] || 0.1;
        const timeTaken = state.baseTimeAllowed - timeRemaining;
        const pts = calculateScore(timeRemaining, state.baseTimeAllowed, activeModifier);
        
        if (updatedPlayers[playerId]) {
          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            score: (updatedPlayers[playerId].score || 0) + pts
          };

          // Check for new all-time speedster record
          if (!fastestThisTurn || timeTaken < fastestThisTurn.timeTaken) {
            fastestThisTurn = {
              playerName: updatedPlayers[playerId].name,
              timeTaken: timeTaken
            };
          }
        }
      }
    });

    pushState({
      ...state,
      players: updatedPlayers,
      isQuestionActive: false,
      showResults: true,
      fastestCorrectAnswer: fastestThisTurn || undefined
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

  const toggleLeaderboard = () => {
    if (!localState) return;
    pushState({
      ...localState,
      showLeaderboardOverlay: !localState.showLeaderboardOverlay
    });
  };

  const remoteBgMusicControl = (action: 'play' | 'pause' | 'toggle', volume?: number) => {
    if (socket && roomCode) {
      socket.emit("bgMusicControl", { roomCode, action, volume });
    }
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
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-zinc-500 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
            חדר: <span className="text-white">{roomCode}</span>
          </div>
          <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 p-1">
            <LogOut size={16} />
          </button>
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
              ) : currentSlide?.type === "POLL" ? (
                <div className="flex-1 flex flex-col gap-3">
                  {/* Poll Start Button */}
                  <button 
                    onClick={startQuestion}
                    disabled={localState.isQuestionActive}
                    className={`w-full py-6 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border-2 ${
                      !localState.isQuestionActive
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 border-indigo-400 text-white animate-pulse" 
                        : "bg-zinc-800 border-zinc-700 text-zinc-500 opacity-50 shadow-none pointer-events-none"
                    }`}
                  >
                    <Play fill="currentColor" size={24} />
                    <span className="text-xl font-black">הפעל סקר</span>
                  </button>

                  {/* Poll Stop Button */}
                  {localState.isQuestionActive && (
                    <button 
                      onClick={() => pushState({ ...localState, isQuestionActive: false })}
                      className="w-full py-6 rounded-xl bg-gradient-to-r from-zinc-600 to-zinc-700 border-zinc-500 text-white active:scale-95 flex flex-col items-center gap-1"
                    >
                      <Pause fill="currentColor" size={24} />
                      <span className="text-xl font-black">סגור הצבעה</span>
                    </button>
                  )}
                  
                  {/* Results Toggle if closed */}
                  {!localState.isQuestionActive && Object.keys(localState.answers).length > 0 && (
                     <button 
                      onClick={nextSlide}
                      className="w-full py-6 rounded-xl bg-amber-500 text-black font-black text-xl active:scale-95 transition-all"
                    >
                      לשקופית הבאה
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
                <Music className="text-blue-400" size={28} />
                <span className="font-bold text-sm">מחיאות כפיים</span>
              </button>

              <button 
                onClick={() => triggerSound("buzzer")}
                className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-zinc-700 transition"
              >
                <Volume2 className="text-red-400" size={28} />
                <span className="font-bold text-sm">באזר</span>
              </button>

              {/* Background Music Remote Control */}
              <button 
                onClick={() => remoteBgMusicControl('toggle')}
                className="col-span-2 py-4 rounded-xl bg-gradient-to-r from-fuchsia-600/20 to-indigo-600/20 border-fuchsia-500/30 text-fuchsia-300 font-bold flex items-center justify-center gap-3 active:scale-95 transition-all border shadow-lg"
              >
                <div className="relative">
                   <Volume2 size={20} />
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-fuchsia-500 rounded-full animate-ping" />
                </div>
                <span>שליטה במוזיקת רקע (מקרן)</span>
              </button>

              {/* Show Standings Quick Action */}
              <button 
                onClick={toggleLeaderboard}
                className={`col-span-2 py-4 rounded-xl font-black text-lg transition-all active:scale-95 border-2 flex items-center justify-center gap-3 ${
                  localState.showLeaderboardOverlay 
                    ? "bg-amber-500 border-amber-300 text-black" 
                    : "bg-zinc-800 border-zinc-700 text-zinc-300"
                }`}
              >
                <FastForward fill="currentColor" size={20} className={localState.showLeaderboardOverlay ? "rotate-90" : ""} />
                {localState.showLeaderboardOverlay ? "הסתר טבלת מובילים" : "הצג טבלת מובילים"}
              </button>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
