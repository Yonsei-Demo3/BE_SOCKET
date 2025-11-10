import { Server, Socket } from "socket.io";

export const roomHandler = (io: Server, socket: Socket) => {
  socket.on("join room", (data: { roomName: string; }) => {
    // 자기가 속한 룸인지 확인하기
    socket.join(data.roomName); // 1. 소켓을 특정 방(roomName)에 입장시킵니다.
    console.log(`User ${socket.data.user?.id} joined room: ${data.roomName}`);

    // (선택) 방에 있는 사람들에게 입장 알림
    io.to(data.roomName).emit("user joined", {
      userId: socket.data.user?.id,
      message: `${socket.data.user?.id}님이 입장했습니다.`
    });
  });

  socket.on("leave room", (roomName: string) => {
    socket.leave(roomName);
    console.log(`User ${socket.data.user?.id} left room: ${roomName}`);
    
    io.to(roomName).emit("user left", {
      userId: socket.data.user?.id,
      message: `${socket.data.user?.id}님이 퇴장했습니다.`
    });
  });
};
