"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, ClientToServerEvents, ServerToClientEvents, Player } from "@/types";

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextContextValue {
  socket: SocketType | null;
  isConnected: boolean;
  gameState: GameState | null;
  players: Record<string, Player>;
  joinRoom: (room: string, role: "host" | "player" | "screen", name?: string, team?: string) => void;
  syncGameState: (state: GameState, room: string) => void;
  sendAnswer: (room: string, answerIndex: number, timeRemaining: number) => void;
  changeSlide: (room: string, slideIndex: number) => void;
  toggleJoker: (room: string, enabled: boolean) => void;
  errorMsg: string | null;
}

const SocketContext = createContext<SocketContextContextValue | null>(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Connect to the socket server
    const socketInstance: SocketType = io({
      // Auto connects to same origin
      path: "/socket.io", 
    });

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.IO server:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
      setIsConnected(false);
    });

    socketInstance.on("error", (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 3000);
    });

    socketInstance.on("gameStateSynced", (state) => {
      setGameState(state);
      if (state.players) setPlayers(state.players);
    });

    socketInstance.on("playerJoined", (player) => {
      console.log("Player joined:", player);
      setPlayers((prev) => ({ ...prev, [player.id]: player }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = (room: string, role: "host" | "player" | "screen", name?: string, team?: string) => {
    if (socket) socket.emit("join", { room, role, name, team });
  };

  const syncGameState = (state: GameState, room: string) => {
    if (socket) socket.emit("syncState", { room, state });
  };

  const sendAnswer = (room: string, answerIndex: number, timeRemaining: number) => {
    if (socket) socket.emit("answer", { room, answer: answerIndex, timeRemaining });
  };

  const changeSlide = (room: string, slideIndex: number) => {
    if (socket) socket.emit("changeSlide", { room, slideIndex });
  };

  const toggleJoker = (room: string, enabled: boolean) => {
    if (socket) socket.emit("toggleJoker", { room, enabled });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        gameState,
        players,
        joinRoom,
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
