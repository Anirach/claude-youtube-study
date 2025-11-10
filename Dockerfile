# Multi-stage Dockerfile for YouTube Study App

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Backend and Final Image
FROM node:18-alpine

# Install Python for youtube-transcript
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci

COPY backend/ ./

# Generate Prisma Client
RUN npx prisma generate

# Copy frontend build
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/.next ./.next
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder /app/frontend/package*.json ./
COPY --from=frontend-builder /app/frontend/next.config.js ./
RUN npm ci --production

# Create data directory for SQLite
RUN mkdir -p /app/data

# Create startup script
WORKDIR /app
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000 4000

CMD ["/app/docker-entrypoint.sh"]
