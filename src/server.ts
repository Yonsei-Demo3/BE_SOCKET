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
      "https://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8080",
      "https://admin.socket.io",
      "https://talkwithsai.com",
      "https://sai-front-68ex.vercel.app"
    ],
    credentials: true,
  },
});

//TODO: 배포환경과 로컬에서 다르게 작동하도록
const subscriber = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

subscriber.on("error", (err) => {
  console.error("Redis Client Error", err);
});
// Handle Redis connection end (disconnection)
subscriber.on("end", () => {
  console.error("❌ Redis connection closed. Attempting to reconnect...");
  // The redis client will automatically try to reconnect by default.
});
// Log when Redis client is reconnecting
subscriber.on("reconnecting", () => {
  console.warn("🔄 Redis client reconnecting...");
});

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


interface NotificationMessage {
  receiverId: number;      // Java Long -> TS number
  type: string;            // Java Enum -> TS string (예: "QUESTION_FULL")      // 선택 사항
}

//TODO: Redis 연결 및 구독, 서버 시작 로직을 별도의 함수로 분리
async function startServer() {
  try {
    await subscriber.connect();
    console.log("✅ Redis Connected!");

    await subscriber.subscribe('notification-topic', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data && data.receiverId !== undefined && data.receiverId !== null && data.receiverId !== "") {
          const targetRoom = `user:${data.receiverId}`;
          io.to(targetRoom).emit('new notification', data);
          console.log(`🔔 알림 발송 완료 -> Target: ${targetRoom}, Type: ${data.type}`);
        } else {
          console.warn("❗️ Redis 메시지에 receiverId가 없습니다. 알림을 발송하지 않습니다.", { data });
        }
      } catch (error) {
        console.error("❌ Redis 메시지 파싱 실패:", error);
      }
    });

    // (3) Express/Socket 서버 시작
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    const handleShutdown = async (signal: string) => {
      console.log(`\n👋 ${signal} 신호를 받았습니다. 서버를 종료합니다...`);
      
      try {
        // 1. Redis 연결 끊기 (가장 중요!)
        await subscriber.quit();
        console.log('✅ Redis 연결이 정상적으로 종료되었습니다.');

        // 2. 소켓/HTTP 서버 닫기 (더 이상 요청 안 받음)
        io.close(() => { // 또는 server.close()
            console.log('✅ 소켓 서버가 종료되었습니다.');
            process.exit(0); // 프로세스 정상 종료
        });
        
      } catch (err) {
        console.error('❌ 종료 중 에러 발생:', err);
        process.exit(1); // 에러 종료
      }
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));   // Ctrl + C 눌렀을 때
    process.on('SIGTERM', () => handleShutdown('SIGTERM')); // Docker/AWS가 멈출 때



  } catch (error) {
    console.error("❌ 서버 시작 중 에러 발생:", error);
    process.exit(1);
  }
}

// 실행
startServer();
