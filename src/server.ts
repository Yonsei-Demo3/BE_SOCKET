import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui"; // 1. admin-ui import 추가

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "https://admin.socket.io",
    ], // 2. admin 주소 cors 추가
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg);
  });
});

instrument(io, {
  auth: false,
  mode: "development",
}); // 3. admin-ui 설정 추가

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
