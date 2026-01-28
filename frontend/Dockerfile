# ---------------- Base stage ----------------
# Use Node 18 LTS for better compatibility
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ---------------- Development stage ----------------
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---------------- Build stage ----------------
FROM base AS build
COPY . .
RUN npm run build

# ---------------- Production stage ----------------
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
