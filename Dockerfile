# ---- build stage ----
FROM node:20-bullseye-slim AS build
WORKDIR /app

# Install deps for building
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy sources and build
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# ---- runtime stage ----
FROM node:20-bullseye-slim
ENV NODE_ENV=production
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# App artifacts
COPY --from=build /app/dist ./dist
COPY public ./public
COPY storage ./storage

EXPOSE 3000

CMD ["node", "dist/src/server.js"]
