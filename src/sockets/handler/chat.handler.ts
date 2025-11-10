import { Server, Socket } from "socket.io";
import prisma from "../../services/prisma.service.js";

export const chatHandler = (io: Server, socket: Socket) => {
  socket.on("chat message", async (data: { roomId: bigint; message: string }) => {
    try {
      const { roomId, message } = data;
      const memberIdStr = socket.data.memberId;
      const memberId = BigInt(memberIdStr);

      const roomMember = await prisma.room_members.findFirst({
        where: {
          room_id: roomId,
          member_id: memberId,
        },
      });

      if (!roomMember) {
        socket.emit("error", { message: "이 방에 메시지를 보낼 권한이 없습니다." });
        return;
      }

      // 1. 메시지를 데이터베이스에 저장
      await prisma.message.create({
        data: {
          member_id: memberId,
          room_id: roomId,
          content: message,
          type: "TEXT", //TODO 타입 세분화
        },
      });

      // 2. 방에 있는 모든 클라이언트에게 메시지 전송
      const roomIdStr = roomId.toString();
      console.log(`message from ${memberIdStr} in room ${roomIdStr}: ${message}`);
      io.to(roomIdStr).emit("chat message", {
        from: memberIdStr,
        message: message,
        room: roomIdStr,
      });
      
    } catch (error) {
      console.error("Error handling chat message:", error);
      socket.emit("error", { message: "메시지를 처리하는 중 오류가 발생했습니다." });
    }
  });
};
