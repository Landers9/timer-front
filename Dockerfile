# =============================================================================
# TASKY Time Manager - Frontend Dockerfile
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Production
FROM nginx:alpine

COPY --from=builder /app/dist/time-manager-frontend/browser /usr/share/nginx/html

# Config Nginx pour Angular SPA (routing)
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]