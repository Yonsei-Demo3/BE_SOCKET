# 💬 SAI Chat Server

> **SAI(사이)** — 영화, 도서 등 콘텐츠를 함께 즐긴 사람들이 실시간으로 감상을 나누는 채팅 서비스의 **실시간 채팅 서버**입니다.

SAI는 콘텐츠를 즐긴 후 찾아오는 여운을 혼자 간직하는 아쉬움을 해결하고자 합니다. 같은 취향을 가진 사람들과 실시간 채팅을 통해 생각을 나누고 감동을 확장할 수 있는 공간을 제공합니다.

---

## 🏗️ 아키텍처

SAI는 **하이브리드 백엔드** 구조를 채택합니다.

```
[Client]
   │
   ├─── HTTP API ──────────► [Spring Boot] ──► MySQL (RDS)
   │                               │
   │                          Redis Pub/Sub
   │                               │
   └─── WebSocket ────────► [Node.js + Socket.IO] ◄── Redis Adapter
                                                            │
                                               (Scale-out 시 Room 공유)
```

| 서버 | 역할 |
|------|------|
| **Spring Boot** | 회원 인증, 채팅방 CRUD API, 비즈니스 로직 |
| **Node.js (이 레포)** | 실시간 메시지 송수신, WebSocket 연결 관리 |
| **Redis** | Pub/Sub (서버 간 이벤트), Socket.IO Adapter (Room 공유) |

---

## ⚙️ 기술 스택

| 분류 | 기술 |
|------|------|
| Runtime | Node.js |
| Language | TypeScript |
| 실시간 통신 | Socket.IO |
| 메시지 브로커 | Redis Pub/Sub |
| 확장성 | Socket.IO Redis Adapter |
| 컨테이너 | Docker |

---

## 🔍 기술적 의사결정

### 왜 Spring이 아닌 Node.js인가?

초기에는 Spring Boot WebSocket으로 채팅을 구현하려 했습니다. 하지만 Spring의 **Thread-per-Request 모델**은 채팅 서비스에 적합하지 않다고 판단했습니다.

| | Spring WebSocket | Node.js + Socket.IO |
|-|------------------|---------------------|
| 동시 연결 처리 | 연결당 Thread 1개 점유 | Single Thread + Event Loop |
| 1,000명 동시 접속 | ~1,000 Threads 필요 | Event Loop로 처리 |
| I/O 대기 시 | Thread가 대기 상태로 낭비 | 다른 요청 처리 (Non-blocking) |
| 채팅 특화 기능 | 직접 구현 필요 | Room, Namespace 등 내장 |

채팅은 **I/O 대기 시간이 대부분**이기 때문에 이벤트 루프 기반의 Node.js가 훨씬 효율적입니다. 채팅 서버만 Node.js로 분리함으로써 나머지 API는 팀이 익숙한 Spring을 유지할 수 있었습니다.

---

### 채팅방 격리: Socket ID 방식 vs Room 방식

**Socket ID 방식의 문제점 (초기 고려안)**

- User ↔ Socket ID 매핑 테이블을 DB에 저장/관리해야 함
- 서버 스케일 아웃 시 Socket ID가 각 서버에 분산되어 관리 불가

**최종 선택: Socket.IO Room 기능 활용**

```ts
// 채팅방 입장
socket.join(roomId);

// 채팅방 전체 메시지 전송
io.to(roomId).emit('message', payload);
```

DB 매핑 없이 간단하게 채팅방을 격리할 수 있고, **Redis Adapter**를 붙이면 다중 서버 환경에서도 Room 정보가 자동으로 공유됩니다.

---

### Spring ↔ Node.js 이벤트 브리지

두 서버 간 직접 HTTP 호출 대신 **Redis Pub/Sub**을 사용해 느슨한 결합을 유지합니다.

```
Spring Boot → Redis Publish → Node.js Subscribe → Socket.IO emit
```

예: Spring에서 새로운 채팅방이 생성되면, Node.js가 이를 구독해 관련 사용자에게 실시간 알림을 전송합니다.

---

## 🚀 실행 방법

### 환경 변수 설정

```env
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

### Docker 실행

```bash
docker build -t sai-chat-server .
docker run -p 3000:3000 sai-chat-server
```

---

## 📌 관련 레포지토리

| 오가니제이션 | 설명 |
|------|------|
| [sai](https://github.com/Yonsei-Demo3) | 오가니제이션 |

---

## 👥 팀 정보

**프로젝트 기간**: 2025.09 ~ 2025.12  
**팀 구성**: 4명 (프론트엔드 2명, 백엔드 2명)
