# ---- build stage ----
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:20-bullseye-slim
ENV NODE_ENV=production
WORKDIR /app
# install prod deps only
COPY package*.json ./
RUN npm ci --omit=dev
# app code
COPY --from=build /app/dist ./dist
# include your local storage (has originals/seed.png)
COPY storage ./storage
EXPOSE 3000
CMD ["node", "dist/src/server.js"]
