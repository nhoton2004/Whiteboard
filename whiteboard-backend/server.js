// backend/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const USERS_FILE = path.join(__dirname, "users.json");

// ensure users file exists
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf8");

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
  } catch {
    return [];
  }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

// simple endpoints
app.post("/api/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password required" });
  const users = readUsers();
  if (users.find(u => u.username === username)) return res.status(400).json({ error: "username exists" });
  users.push({ username, password });
  writeUsers(users);
  return res.json({ ok: true });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password required" });
  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ error: "invalid credentials" });
  return res.json({ ok: true, username });
});

// health and root
app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/", (req, res) => res.send("Whiteboard backend is running."));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// in-memory rooms (demo)
const rooms = {}; // roomId -> { operations: [], clients: Set, cursors: {} }

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("join-room", ({ roomId, username }, ack) => {
    if (!roomId || !username) return ack?.({ ok: false, error: "roomId/username required" });
    if (!rooms[roomId]) rooms[roomId] = { operations: [], clients: new Set(), cursors: {} };
    const room = rooms[roomId];
    if (room.clients.size >= 2) return ack?.({ ok: false, error: "room-full" });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;
    room.clients.add(socket.id);
    socket.emit("sync-state", { operations: room.operations });
    socket.to(roomId).emit("user-joined", { id: socket.id, username });
    ack?.({ ok: true });
    console.log(`${username} joined ${roomId}`);
  });

  socket.on("draw-op", (op, ack) => {
    const roomId = socket.data.roomId;
    if (!roomId) return ack?.({ ok: false });
    rooms[roomId].operations.push(op);
    socket.to(roomId).emit("draw-op", op);
    ack?.({ ok: true });
  });

  socket.on("clear", (_, ack) => {
    const roomId = socket.data.roomId;
    if (!roomId) return ack?.({ ok: false });
    rooms[roomId].operations = [];
    io.in(roomId).emit("clear");
    ack?.({ ok: true });
  });

  socket.on("undo", (_, ack) => {
    const roomId = socket.data.roomId;
    if (!roomId) return ack?.({ ok: false });
    const room = rooms[roomId];
    const removed = room.operations.pop();
    io.in(roomId).emit("undo", { op: removed });
    ack?.({ ok: true });
  });

  socket.on("cursor", (c) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    rooms[roomId].cursors[socket.id] = { ...c, username: socket.data.username };
    socket.to(roomId).emit("cursor", { id: socket.id, ...c, username: socket.data.username });
  });

  socket.on("chat", (msg) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    io.in(roomId).emit("chat", { from: socket.data.username || "Anonymous", text: msg, at: Date.now() });
  });

  socket.on("leave", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    room.clients.delete(socket.id);
    delete room.cursors[socket.id];
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", { id: socket.id, username: socket.data.username });
    if (room.clients.size === 0) delete rooms[roomId];
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    console.log("disconnect", socket.id, "room:", roomId);
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      room.clients.delete(socket.id);
      delete room.cursors[socket.id];
      socket.to(roomId).emit("user-left", { id: socket.id, username: socket.data.username });
      if (room.clients.size === 0) delete rooms[roomId];
    }
  });
});

server.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
