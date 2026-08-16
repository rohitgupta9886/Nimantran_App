# syntax=docker/dockerfile:1
# ------------------------------------------------------------------------------
# Nimantran AI — Production Frontend Dockerfile
# Multi-Stage Build: Node 20 Alpine Builder -> Nginx Alpine Runner
# ------------------------------------------------------------------------------

# Stage 1: Build Static Assets
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine as runner

# Copy Custom Nginx Configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Compiled Static Assets from Builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
