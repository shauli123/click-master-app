import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { GameState, Player, SlideData } from "./src/types";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// In-memory state for all active rooms
const activeRooms: Record<string, GameState> = {};

// Helper: generate 4-digit code
const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Projector Creates Room
    socket.on("createRoom", ({ slides, teams }, callback) => {
      let roomCode: string;
      do {
        roomCode = generateCode();
      } while (activeRooms[roomCode]); // ensure uniqueness
      
      const hostCode = generateCode();

      const newRoom: GameState = {
        roomCode,
        hostCode,
        hostConnected: false,
        screenId: socket.id,
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
      };

      activeRooms[roomCode] = newRoom;
      socket.join(roomCode);
      console.log(`[${roomCode}] Screen created room. HostCode: ${hostCode}`);
      
      // Sync state back to the creator immediately
      socket.emit("gameStateSynced", newRoom);
      
      callback({ roomCode, hostCode });
    });

    // Player Joins
    socket.on("joinPlayer", ({ roomCode, name }, callback) => {
      const room = activeRooms[roomCode];
      if (!room) {
        return callback({ success: false, error: "לא נמצא חדר עם קוד זה" });
      }

      socket.join(roomCode);
      
      // Check if player already exists by name
      const existingPlayerId = Object.keys(room.players).find(id => room.players[id].name === name);
      
      if (existingPlayerId) {
        console.log(`[${roomCode}] Player ${name} reconnected. Updating ID from ${existingPlayerId} to ${socket.id}`);
        const player = room.players[existingPlayerId];
        delete room.players[existingPlayerId];
        player.id = socket.id;
        room.players[socket.id] = player;
        
        // Also update answers and answerTimes if they exist
        if (room.answers[existingPlayerId] !== undefined) {
          room.answers[socket.id] = room.answers[existingPlayerId];
          delete room.answers[existingPlayerId];
        }
        if (room.answerTimes[existingPlayerId] !== undefined) {
          room.answerTimes[socket.id] = room.answerTimes[existingPlayerId];
          delete room.answerTimes[existingPlayerId];
        }
      } else {
        const newPlayer: Player = {
          id: socket.id,
          name,
          team: "None",
          joinedAt: Date.now(),
          score: 0,
        };
        room.players[socket.id] = newPlayer;
        console.log(`[${roomCode}] Player joined: ${name} (${socket.id})`);
        socket.to(roomCode).emit("playerJoined", newPlayer);
      }
      
      io.to(room.screenId).emit("gameStateSynced", room);
      callback({ success: true });
    });

    // Host Joins
    socket.on("joinHost", ({ hostCode }, callback) => {
      // Find the room that has this hostCode
      const roomCode = Object.keys(activeRooms).find(rc => activeRooms[rc].hostCode === hostCode);
      const room = roomCode ? activeRooms[roomCode] : null;

      if (!room) {
        return callback({ success: false, error: "קוד מנחה שגוי" });
      }

      socket.join(room.roomCode);
      room.hostConnected = true;
      activeRooms[room.roomCode] = room; // Ensure saved (though it's a ref anyway)

      console.log(`[${room.roomCode}] Host joined successfully.`);
      
      io.to(room.roomCode).emit("hostJoined");
      
      // Sync state to the host immediately so they don't hang on loading
      socket.emit("gameStateSynced", room);
      
      callback({ success: true, roomCode: room.roomCode });
    });

    // Answer handling
    socket.on("answer", ({ roomCode, answer, timeRemaining }) => {
      console.log(`[ANSWER_DEBUG] Room: ${roomCode}, Player: ${socket.id}, Answer: ${answer}, Time: ${timeRemaining}`);
      const room = activeRooms[roomCode];
      if (!room) {
        console.log(`[ANSWER_ERROR] Room ${roomCode} not found`);
        return;
      }
      if (!room.isQuestionActive) {
        console.log(`[ANSWER_ERROR] Question not active in room ${roomCode}`);
        return;
      }

      room.answers[socket.id] = answer;
      room.answerTimes[socket.id] = timeRemaining;

      console.log(`[${roomCode}] Player ${socket.id} (Name: ${room.players[socket.id]?.name}) answered: ${answer}`);
      io.to(roomCode).emit("gameStateSynced", room);
    });

    // Host controls -> Override entire state efficiently
    socket.on("syncState", ({ roomCode, state }) => {
      console.log(`[${roomCode}] Host synced state. Slide ${state.currentSlideIndex}`);
      const currentRoom = activeRooms[roomCode];
      if (!currentRoom) return;

      const isSameSlide = state.currentSlideIndex === currentRoom.currentSlideIndex;

      activeRooms[roomCode] = {
        ...state,
        roomCode, 
        hostCode: currentRoom.hostCode,
        screenId: currentRoom.screenId,
        // PRESERVE the live data that players send directly to server
        // If it's the same slide, merge answers. If it's a new slide, take host's state (usually empty)
        answers: isSameSlide 
          ? { ...currentRoom.answers, ...state.answers } 
          : state.answers,
        answerTimes: isSameSlide 
          ? { ...currentRoom.answerTimes, ...state.answerTimes } 
          : state.answerTimes,
        players: { ...currentRoom.players, ...state.players }
      };
      
      socket.to(roomCode).emit("gameStateSynced", activeRooms[roomCode]);
    });
    
    // Legacy passthroughs we can still use for specific triggers
    socket.on("playSound", ({ roomCode, sound }) => {
      socket.to(roomCode).emit("playSound", sound);
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
      // Cleanup: If a player disconnects, we might want to remove them or mark inactive
      // If the screen disconnects, we might tear down the room
      const roomCodeObj = Object.entries(activeRooms).find(([code, state]) => 
        state.screenId === socket.id
      );

      if (roomCodeObj) {
        console.log(`[${roomCodeObj[0]}] Screen disconnected. Tearing down room.`);
        delete activeRooms[roomCodeObj[0]];
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
