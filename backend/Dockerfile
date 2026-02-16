FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=base /app/dist ./dist
COPY --from=base /app/dist/config ./config
COPY --from=base /app/dist/src ./src
COPY --from=base /app/dist/build ./build
COPY --from=base /app/public ./public
COPY --from=base /app/favicon.png ./favicon.png
COPY --from=base /app/database ./database

EXPOSE 1337

CMD ["npm", "run", "start"]
