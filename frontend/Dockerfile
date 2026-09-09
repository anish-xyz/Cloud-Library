# Frontend Dockerfile (Next.js Dev Server - Fast startup without heavy compilation)
FROM node:20-alpine
WORKDIR /app

# Install curl for healthcheck
RUN apk --no-cache add curl

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["npm", "run", "dev"]
