FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY backend ./backend

EXPOSE 3000

CMD ["npx", "ts-node", "backend/src/index.ts"]