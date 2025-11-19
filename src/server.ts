import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import { mainHandler } from "./sockets/handler/index.js";
import { createClient } from "redis";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "https://admin.socket.io"
    ],
    credentials: true,
  },
}); //IO가 중앙 서버라고 생각하시면 됩니다.

//TODO: 배포환경과 로컬에서 다르게 작동하도록
const subscriber = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

subscriber.on("error", (err) => console.error("Redis Client Error", err));

io.use(authMiddleware);
// 모든 소켓 연결에 인증 미들웨어를 적용합니다.

const PORT = process.env.PORT || 3000;

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "OK" });
});
//health Check api


io.on("connection", (socket) => {
  mainHandler(io, socket);
});


instrument(io, {
  auth: false,
  mode: "development",
}); //admin-ui 설정 추가(디버깅용 툴입니다.)

async function startServer() {
  try {
    await subscriber.connect();
    console.log("✅ Redis Connected!");

    await subscriber.subscribe('notification-topic', (message) => {
      try {
        const data = JSON.parse(message);
        
        const targetRoom = `user:${data.receiverId}`;

        io.to(targetRoom).emit('new notification', data);
        
        console.log(`🔔 알림 발송 완료 -> Target: ${targetRoom}, Type: ${data.type}`);
      } catch (error) {
        console.error("❌ Redis 메시지 파싱 실패:", error);
      }
    });

    // (3) Express/Socket 서버 시작
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ 서버 시작 중 에러 발생:", error);
  }
}

// 실행
startServer();
