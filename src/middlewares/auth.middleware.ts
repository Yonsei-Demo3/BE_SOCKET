import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

// 실제 토큰의 사용자 페이로드에 맞게 이 인터페이스를 정의해야 합니다.
interface UserPayload {
  id: string;
}

// user를 포함하도록 소켓 데이터 객체를 확장합니다.
declare module 'socket.io' {
  interface SocketData {
      user?: UserPayload;
  }
}

export const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const secret = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

  if (!secret || secret === 'YOUR_SECRET_KEY') { //env 설정 확인
    console.error("JWT_SECRET이 설정되지 않았습니다. .env 파일을 확인하세요.");
    return next(new Error('서버 설정 오류입니다.'));
  }

  //인증 헤더 가져오기
  const authHeader = socket.handshake.headers.authorization;

  // 'Authorization' 헤더가 없거나 'Bearer' 타입이 아니면 에러를 반환합니다.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new Error('인증 오류: Bearer 토큰이 제공되지 않았습니다.'));
  }

  // 'Bearer ' 부분을 제외한 실제 토큰 값만 추출합니다.
  const token = authHeader.split(' ')[1];

  // 토큰이 없는 경우 에러를 처리합니다.
  if (!token) {
    return next(new Error('인증 오류: 토큰이 제공되지 않았습니다.'));
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, secret) as UserPayload;

    // 나중에 사용할 수 있도록 소켓 객체에 사용자 페이로드를 첨부합니다.
    socket.data.user = decoded;
    next();
  } catch (err) {
    return next(new Error('인증 오류: 유효하지 않은 토큰입니다.'));
  }

  // TODO: 토큰 정책 확립 후 상세화.
};
