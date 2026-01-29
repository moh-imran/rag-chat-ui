# ---------- Build stage ----------
FROM node:20-bookworm AS build
WORKDIR /app

# Environment variables configuration
ARG VITE_API_URL=https://backend:8001

ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
