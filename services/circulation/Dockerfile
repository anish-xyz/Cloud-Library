# Circulation Service Dockerfile (Node.js / TypeScript)
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install curl for docker healthcheck
RUN apk --no-cache add curl

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8082
USER node

CMD ["node", "dist/index.js"]
