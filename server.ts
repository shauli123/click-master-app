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
        teams: teams || ["הנמרים", "הכרישים", "האריות"],
        slides: slides || [],
        currentSlideIndex: 0,
        jokerModeEnabled: false,
        isQuestionActive: false,
        questionStartTime: null,
        baseTimeAllowed: 15,
        answers: {},
        answerTimes: {},
      };

      activeRooms[roomCode] = newRoom;
      socket.join(roomCode);
      console.log(`[${roomCode}] Screen created room. HostCode: ${hostCode}`);
      
      callback({ roomCode, hostCode });
    });

    // Player Joins
    socket.on("joinPlayer", ({ roomCode, name }, callback) => {
      const room = activeRooms[roomCode];
      if (!room) {
        return callback({ success: false, error: "לא נמצא חדר עם קוד זה" });
      }

      socket.join(roomCode);
      
      const newPlayer: Player = {
        id: socket.id,
        name,
        team: "None", // Teams removed for now
        joinedAt: Date.now(),
        score: 0,
      };

      room.players[socket.id] = newPlayer;
      console.log(`[${roomCode}] Player joined: ${name} (${socket.id})`);
      
      // Notify everyone in the room
      socket.to(roomCode).emit("playerJoined", newPlayer);
      
      // If host is connected, they will receive playerJoined, but let's sync state to screen just in case
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
      
      callback({ success: true, roomCode: room.roomCode });
    });

    // Answer handling
    socket.on("answer", ({ roomCode, answer, timeRemaining }) => {
      const room = activeRooms[roomCode];
      if (!room || !room.isQuestionActive) return;

      room.answers[socket.id] = answer;
      room.answerTimes[socket.id] = timeRemaining;

      console.log(`[${roomCode}] Player ${socket.id} answered: ${answer}`);
      io.to(roomCode).emit("gameStateSynced", room); // Sync full state to show progress
    });

    // Host controls -> Override entire state efficiently
    socket.on("syncState", ({ roomCode, state }) => {
      console.log(`[${roomCode}] Host synced state. Slide ${state.currentSlideIndex}`);
      // Security check: ensure the socket doing this actually has host privileges 
      // Simplified for prototype: we trust the sender
      activeRooms[roomCode] = {
        ...state,
        roomCode, // prevent host from overwriting structural setup
        hostCode: activeRooms[roomCode].hostCode,
        screenId: activeRooms[roomCode].screenId,
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
