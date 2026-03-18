"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { GameState, Player } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";

interface SocketContextContextValue {
  socket: any | null; // Keep name for now, but it's a supabase channel
  isConnected: boolean;
  gameState: GameState | null;
  players: Record<string, Player>;
  createRoom: (slides: any[], teams: string[], callback: (res: {roomCode: string, hostCode: string}) => void) => void;
  joinPlayer: (roomCode: string, name: string, callback: (res: {success: boolean, error?: string}) => void) => void;
  joinHost: (hostCode: string, callback: (res: {success: boolean, roomCode?: string, error?: string}) => void) => void;
  syncGameState: (state: GameState, roomCode: string) => void;
  sendAnswer: (roomCode: string, answerIndex: number, timeRemaining: number) => void;
  changeSlide: (roomCode: string, slideIndex: number) => void;
  toggleJoker: (roomCode: string, enabled: boolean) => void;
  errorMsg: string | null;
}

const SocketContext = createContext<SocketContextContextValue | null>(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(true); // Default true for serverless (ready to start)
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);

  const gameStateRef = useRef<GameState | null>(null);
  gameStateRef.current = gameState;

  // Cleanup on unmount
  useEffect(() => {
    // Check if we have real credentials
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
       console.warn("Supabase credentials missing - using placeholders. Screens may stay disconnected.");
    }

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [channel]);

  const setupChannel = (roomCode: string) => {
    if (channel) channel.unsubscribe();

    const newChannel = supabase.channel(`room_${roomCode}`, {
      config: {
        presence: {
          key: roomCode,
        },
      },
    });

    newChannel
      .on("broadcast", { event: "gameStateSynced" }, (payload) => {
        setGameState(payload.payload);
        if (payload.payload.players) setPlayers(payload.payload.players);
      })
      .on("broadcast", { event: "playSound" }, (payload) => {
        // Handled by AudioContext listening to the same channel or via global event bus
        window.dispatchEvent(new CustomEvent("playSound", { detail: payload.payload }));
      })
      .on("broadcast", { event: "bgMusicAction" }, (payload) => {
        window.dispatchEvent(new CustomEvent("bgMusicAction", { detail: payload.payload }));
      })
      .on("presence", { event: "sync" }, () => {
        const state = newChannel.presenceState();
        console.log("Presence state changed:", state);
        // We handle player list primarily through the GameState synced from Projector/Host
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setCurrentRoomCode(roomCode);
        }
      });

    setChannel(newChannel);
    return newChannel;
  };

  const createRoom = async (slides: any[], teams: string[], callback: (res: {roomCode: string, hostCode: string}) => void) => {
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const hostCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Save to DB for discovery
    const { error } = await supabase.from("rooms").insert({ room_code: roomCode, host_code: hostCode });
    if (error) {
       console.error("Error creating room in DB:", error);
    }

    const initialGameState: GameState = {
      roomCode,
      hostCode,
      hostConnected: false,
      screenId: "projector",
      players: {},
      teams: (teams && teams.length > 0) ? teams : ["הנמרים", "הכרישים", "האריות"],
      slides: slides || [],
      currentSlideIndex: 0,
      jokerModeEnabled: false,
      isQuestionActive: false,
      questionStartTime: null,
      baseTimeAllowed: 15,
      revealedOptionsCount: 0,
      showResults: false,
      answers: {},
      answerTimes: {},
      showLeaderboardOverlay: false,
    };

    setupChannel(roomCode);
    setGameState(initialGameState);
    callback({ roomCode, hostCode });
  };

  const joinPlayer = (roomCode: string, name: string, callback: (res: {success: boolean, error?: string}) => void) => {
    const chan = setupChannel(roomCode);
    
    // Players send a join request via broadcast
    chan.send({
      type: "broadcast",
      event: "playerJoined",
      payload: { name, id: Math.random().toString(36).substring(7) }
    });

    callback({ success: true });
  };

  const joinHost = async (hostCode: string, callback: (res: {success: boolean, roomCode?: string, error?: string}) => void) => {
    // Look up the room by hostCode
    const { data, error } = await supabase
      .from("rooms")
      .select("room_code")
      .eq("host_code", hostCode)
      .maybeSingle();

    if (error || !data) {
      callback({ success: false, error: "Invalid Host Code or Room Not Found" });
      return;
    }

    const roomCode = data.room_code;
    setupChannel(roomCode);
    setCurrentRoomCode(roomCode);
    callback({ success: true, roomCode });
  };

  const syncGameState = (state: GameState, roomCode: string) => {
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "gameStateSynced",
        payload: state
      });
    }
  };

  const sendAnswer = (roomCode: string, answerIndex: number, timeRemaining: number) => {
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "answer",
        payload: { answer: answerIndex, timeRemaining }
      });
    }
  };

  const changeSlide = (roomCode: string, slideIndex: number) => {
    if (gameStateRef.current && channel) {
      const newState = { ...gameStateRef.current, currentSlideIndex: slideIndex, showResults: false, revealedOptionsCount: 0, answers: {}, answerTimes: {} };
      syncGameState(newState, roomCode);
    }
  };

  const toggleJoker = (roomCode: string, enabled: boolean) => {
    if (gameStateRef.current && channel) {
      const newState = { ...gameStateRef.current, jokerModeEnabled: enabled };
      syncGameState(newState, roomCode);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: channel, // Alias for compatibility
        isConnected,
        gameState,
        players,
        createRoom,
        joinPlayer,
        joinHost,
        syncGameState,
        sendAnswer,
        changeSlide,
        toggleJoker,
        errorMsg,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
