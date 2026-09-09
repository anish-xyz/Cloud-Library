FROM nginx:alpine

# Copy template configuration (Nginx docker-entrypoint automatically parses /etc/nginx/templates/*.template with envsubst)
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Install curl for docker healthcheck
RUN apk --no-cache add curl

EXPOSE 80
