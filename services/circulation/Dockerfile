# Circulation Service Dockerfile (Node.js / TypeScript)
FROM node:20-alpine
WORKDIR /app

# Install curl for docker healthcheck
RUN apk --no-cache add curl

COPY package*.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build && npm prune --omit=dev

EXPOSE 8082
USER node

CMD ["node", "dist/index.js"]
