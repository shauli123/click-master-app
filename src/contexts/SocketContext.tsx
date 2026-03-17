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

  const createRoom = (slides: any[], teams: string[], callback: (res: {roomCode: string, hostCode: string}) => void) => {
    if (socket) socket.emit("createRoom", { slides, teams }, callback);
  };

  const joinPlayer = (roomCode: string, name: string, callback: (res: {success: boolean, error?: string}) => void) => {
    if (socket) socket.emit("joinPlayer", { roomCode, name }, callback);
  };

  const joinHost = (hostCode: string, callback: (res: {success: boolean, roomCode?: string, error?: string}) => void) => {
    if (socket) socket.emit("joinHost", { hostCode }, (res) => {
      // If host joins successfully, we want to know the roomCode, but the server will also send gameStateSynced
      callback(res);
    });
  };

  const syncGameState = (state: GameState, roomCode: string) => {
    if (socket) socket.emit("syncState", { roomCode, state });
  };

  const sendAnswer = (roomCode: string, answerIndex: number, timeRemaining: number) => {
    if (socket) socket.emit("answer", { roomCode, answer: answerIndex, timeRemaining });
  };

  const changeSlide = (roomCode: string, slideIndex: number) => {
    if (socket) socket.emit("changeSlide", { roomCode, slideIndex });
  };

  const toggleJoker = (roomCode: string, enabled: boolean) => {
    if (socket) socket.emit("toggleJoker", { roomCode, enabled });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
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
