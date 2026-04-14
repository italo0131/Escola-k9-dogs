# Etapa 1: build
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
COPY . .
RUN npm install

RUN npx prisma generate
RUN npm run build

# Etapa 2: produção
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
CMD ["sh", "-c", "npx prisma migrate deploy 2>&1 | tee /proc/1/fd/1 && npm start"]
