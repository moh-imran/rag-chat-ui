# ---------- Build ----------
FROM node:20-slim AS build

WORKDIR /app

# Copy only lockfiles first (cache-friendly)
COPY package.json package-lock.json ./

# Force optional deps (fixes rollup bug)
RUN npm ci --include=optional

# Now copy source
COPY . .

# Build
RUN npm run build

# ---------- Production ----------
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
