import { Server, Socket } from "socket.io";

export const chatHandler = (io: Server, socket: Socket) => {
  socket.on("chat message", (data: { roomName: string; message: string }) => {
    console.log(`message from ${socket.data.user?.id}: ${data.message}`);

    io.to(data.roomName).emit("chat message", { from: socket.data.user?.id, message: data.message, room: data.roomName });
  });
};
