# Base stage for shared dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Development stage (for hot reloading)
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Build stage (for production)
FROM base AS build
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
