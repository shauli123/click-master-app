import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  // Initialize Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join room handling
    socket.on("join", ({ room, role, name, team }) => {
      socket.join(room);
      console.log(`[${room}] ${role} joined (ID: ${socket.id}, Name: ${name || 'N/A'})`);
      
      if (role === 'player') {
        const player = { id: socket.id, name, team, joinedAt: Date.now() };
        socket.to(room).emit("playerJoined", player);
      }
    });

    // Answer handling
    socket.on("answer", ({ room, answer, timeRemaining }) => {
      console.log(`[${room}] Player ${socket.id} answered: ${answer} (Time: ${timeRemaining}s)`);
      socket.to(room).emit("playerAnswered", { playerId: socket.id, answer, timeRemaining });
    });

    // Host controls -> Projector & Players
    socket.on("changeSlide", ({ room, slideIndex }) => {
      console.log(`[${room}] Host changed slide to ${slideIndex}`);
      socket.to(room).emit("slideChanged", slideIndex);
    });

    socket.on("jokerMode", ({ room, enabled }) => {
      console.log(`[${room}] Host toggled Joker Mode: ${enabled}`);
      socket.to(room).emit("jokerModeToggled", enabled);
    });
    
    socket.on("playSound", ({ room, sound }) => {
      console.log(`[${room}] Host playing sound: ${sound}`);
      socket.to(room).emit("playSound", sound);
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
      // Notify rooms that player left
      // We don't have room context easily accessible here without tracking it in a map, 
      // but simplistic broadcast works for MVP if needed, or keeping it lightweight.
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
