# ---------- Build stage ----------
FROM node:20-bookworm AS build
WORKDIR /app

# Environment variables configuration
ARG RAG_API_URL=http://rag-qa-api:8000
ARG MONGODB_URL=mongodb://mongodb:27017/rag_chat

ENV RAG_API_URL=$RAG_API_URL
ENV MONGODB_URL=$MONGODB_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
