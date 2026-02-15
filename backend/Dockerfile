FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=base /app/dist ./dist
COPY --from=base /app/config ./config
COPY --from=base /app/database ./database
COPY --from=base /app/public ./public
COPY --from=base /app/favicon.png ./favicon.png

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:1337/_health', (r) => { if (r.statusCode !== 200) process.exit(1); }).on('error', () => process.exit(1))"

CMD ["npm", "run", "start"]
