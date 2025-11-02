import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { authMiddleware } from "./middlewares/auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "https://admin.socket.io",
    ],
    credentials: true,
  },
}); //IO가 중앙 서버라고 생각하시면 됩니다.

io.use(authMiddleware);
// 모든 소켓 연결에 인증 미들웨어를 적용합니다.

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});
//health Check api

io.on("connection", (socket) => {
  // socket이 클라이언트라고 생각하시면 됩니다. 저기에 메시지를 보내면 클라이언트가 확인 가능합니다.
  console.log("a user connected:", socket.data.user?.id);

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.data.user?.id);
  }); 

  socket.on("chat message", (msg) => {
    console.log(`message from ${socket.data.user?.id}: ${msg}`);
    
    io.emit("chat message", { from: socket.data.user?.id, message: msg });
  });
});


instrument(io, {
  auth: false,
  mode: "development",
}); //admin-ui 설정 추가(디버깅용 툴입니다.)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
