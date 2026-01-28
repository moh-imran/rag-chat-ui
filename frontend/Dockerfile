# ---------- Base ----------
FROM node:20-slim AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ---------- Build ----------
FROM base AS build
COPY . .
RUN npm run build

# ---------- Production ----------
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
