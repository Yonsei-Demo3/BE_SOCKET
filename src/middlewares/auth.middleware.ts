import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.service.js';

interface TokenPayload {
  sub: string; // user_id
}
// 3. memberId를 포함하도록 소켓 데이터 객체를 확장합니다.
declare module 'socket.io' {
  interface SocketData {
      memberId?: string;
  }
}

export const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET이 설정되지 않았습니다. .env 파일을 확인하세요.");
    return next(new Error('서버 설정 오류입니다.'));
  }

  const authToken = socket.handshake.auth.token;

  if (!authToken || !authToken.startsWith('Bearer ')) {
    return next(new Error('인증 오류: Bearer 토큰이 제공되지 않았습니다.'));
  }

  const token = authToken.split(' ')[1];

  if (!token) {
    return next(new Error('인증 오류: 토큰이 제공되지 않았습니다.'));
  }

  try {
    // 4. 토큰 검증
    const decoded = jwt.verify(token, secret) as TokenPayload;

    // 5. 토큰의 sub(user_id)를 사용하여 DB에서 사용자 정보 조회
    const member = await prisma.members.findUnique({
      where: {
        user_id: decoded.sub,
      },
    });

    if (!member) {
      return next(new Error('인증 오류: 사용자를 찾을 수 없습니다.'));
    }

    // 6. 나중에 사용할 수 있도록 소켓 객체에 memberId를 문자열로 저장
    socket.data.memberId = member.id.toString();
    next();
  } catch (err) {
    return next(new Error('인증 오류: 유효하지 않은 토큰입니다.'));
  }
};
