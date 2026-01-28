# Base stage for shared dependencies
FROM node:18-alpine AS base
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

# Production stage - serve static files with nginx
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5174
CMD ["nginx", "-g", "daemon off;"]
