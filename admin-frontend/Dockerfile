# Base stage for shared dependencies
# Use Debian-slim for stable ARM/AMD64 builds (fixes Rollup issues)
FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Development stage (hot reload)
FROM base AS development
COPY . .
EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]

# Build stage
FROM base AS build
COPY . .
RUN npm run build

# Production stage - serve with Node (Vite Preview) instead of Nginx
FROM base AS production
COPY --from=build /app/dist /app/dist
EXPOSE 5174
CMD ["npm", "run", "preview"]
