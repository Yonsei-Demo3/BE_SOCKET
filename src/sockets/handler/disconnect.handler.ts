import { Socket } from "socket.io";

export const disconnectHandler = (socket: Socket) => {
  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.data.user?.id);
  }); 
};
