export interface MessageResponseDTO {
    messageId : string;
    roomId : string;
    senderId : string;
    content : string;
    senderNickname : string;
    type: string;
    createdAt : Date;
}

export namespace MessageResponseDTO {
    export function from(data: any): MessageResponseDTO {
        return {
            messageId: data.id.toString(),
            roomId: data.room_id.toString(),
            senderId: data.member_id.toString(),
            content: data.content,
            senderNickname: data.members.nickname,
            type: data.type,
            createdAt: data.created_at
        };
    }  
}

export interface MessageRequestDTO {
    roomId : bigint;
    content : string;
    type: string;
}