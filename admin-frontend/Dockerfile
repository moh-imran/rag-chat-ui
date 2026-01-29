# ---------- Development stage ----------
FROM node:20-bookworm AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# ---------- Build stage ----------
FROM node:20-bookworm AS build
WORKDIR /app

# Environment variables configuration
ARG VITE_API_URL=https://rag.congni.tech/backend

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
