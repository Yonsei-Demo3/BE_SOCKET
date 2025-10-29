import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui"; // 1. admin-ui import 추가
import { authMiddleware } from "./middlewares/auth.middleware.js";

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
}); //io가 중앙 서버

// 모든 소켓 연결에 인증 미들웨어를 적용합니다.
io.use(authMiddleware);

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

io.on("connection", (socket) => {
  // 이 시점에는 소켓이 인증되었습니다.
  // 사용자 정보는 socket.data.user에서 확인할 수 있습니다.
  console.log("a user connected:", socket.data.user?.id);

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.data.user?.id);
  });

  socket.on("chat message", (msg) => {
    console.log(`message from ${socket.data.user?.id}: ${msg}`);
    // 예시: 사용자 ID와 함께 메시지를 브로드캐스트합니다.
    io.emit("chat message", { from: socket.data.user?.id, message: msg });
  });
});
//socket이 클라이언트
instrument(io, {
  auth: false,
  mode: "development",
}); // 3. admin-ui 설정 추가

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
