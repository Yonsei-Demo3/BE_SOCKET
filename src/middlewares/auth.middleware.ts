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
  // 프로덕션 환경에서는 반드시 환경 변수를 사용하여 시크릿 키를 관리해야 합니다.
  // 예: const secret = process.env.JWT_SECRET;
  // 여기서는 데모를 위해 플레이스홀더를 사용합니다.
  const secret = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';
  if (!secret || secret === 'YOUR_SECRET_KEY') {
    // 실제 앱에서는 이 경우를 적절히 처리해야 합니다.
    console.error("JWT_SECRET이 설정되지 않았습니다. .env 파일을 확인하세요.");
    return next(new Error('서버 설정 오류입니다.'));
  }

  // 토큰은 연결 시 `auth` 객체를 통해 전달될 것으로 예상됩니다.
  const token = socket.handshake.auth.token;

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
};
