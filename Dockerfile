# 1. 빌드 스테이지
FROM node:20-alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json을 복사하여 종속성 설치
COPY package*.json ./
RUN npm install

# Prisma 스키마 복사
COPY prisma ./prisma/

# Prisma 클라이언트 생성
RUN npx prisma generate

# 소스 코드 전체 복사
COPY . .

# TypeScript 코드 컴파일
RUN npm run build

# 2. 프로덕션 스테이지
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 프로덕션용 종속성만 설치하기 위해 package.json과 package-lock.json 복사
COPY package*.json ./
RUN npm install --omit=dev

# 빌드 스테이지에서 컴파일된 코드와 Prisma 클라이언트 복사
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/

# 애플리케이션이 사용할 포트 노출
EXPOSE 3000

# 컨테이너 시작 명령어
CMD ["node", "dist/server.js"]
