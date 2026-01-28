# ---------------- Base stage ----------------
# Use Debian-slim for stable ARM/AMD64 builds (fixes Rollup issues)
FROM node:20-slim AS base
WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
# Use 'npm install' instead of 'npm ci' to allow fetching architecture-specific optional dependencies
RUN npm install --legacy-peer-deps

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
# Use Node instead of Nginx as requested
FROM base AS production
COPY --from=build /app/dist /app/dist
# No Nginx here, using Vite Preview
EXPOSE 5173
CMD ["npm", "run", "preview"]
