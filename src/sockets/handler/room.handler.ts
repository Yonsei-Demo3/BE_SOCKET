import { Server, Socket } from "socket.io";
import prisma from "../../services/prisma.service.js";

export const roomHandler = (io: Server, socket: Socket) => {
  socket.on("join room", async (data: { roomId: bigint }) => {
    try {
      const { roomId } = data;
      const memberIdStr = socket.data.memberId;
      const memberId = BigInt(memberIdStr);

      const roomMember = await prisma.room_members.findFirst({
        where: {
          room_id: roomId,
          member_id: memberId,
        },
      });

      if (!roomMember) {
        socket.emit("error", { message: "이 방에 참여할 권한이 없습니다." });
        return;
      }

      const roomIdStr = roomId.toString();
      socket.join(roomIdStr);
      console.log(`User ${memberIdStr} joined room: ${roomIdStr}`);

      io.to(roomIdStr).emit("user joined", {
        userId: memberIdStr,
        message: `${memberIdStr}님이 입장했습니다.`,
      });
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", { message: "방에 참여하는 중 오류가 발생했습니다." });
    }
  });

  socket.on("leave room", (data: { roomId: bigint }) => {
    try {
      const { roomId } = data;
      const memberIdStr = socket.data.memberId;
      const roomIdStr = roomId.toString();

      socket.leave(roomIdStr);
      console.log(`User ${memberIdStr} left room: ${roomIdStr}`);

      io.to(roomIdStr).emit("user left", {
        userId: memberIdStr,
        message: `${memberIdStr}님이 퇴장했습니다.`,
      });

    } catch (error) {
      console.error("Error leaving room:", error);
      socket.emit("error", { message: "방에서 나가는 중 오류가 발생했습니다." });
    }
    
  });
};
