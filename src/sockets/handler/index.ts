import { Server, Socket } from "socket.io";
import { roomHandler } from "./room.handler.js";
import { chatHandler } from "./chat.handler.js";
import { disconnectHandler } from "./disconnect.handler.js";

export const mainHandler = (io: Server, socket: Socket) => {
  console.log("a user connected:", socket.data.user?.id);
  const memberIdStr = socket.data.user?.id;
  const userRoomName = `user:${memberIdStr}`;
  socket.join(userRoomName);

  roomHandler(io, socket);
  chatHandler(io, socket);
  disconnectHandler(socket);
};
