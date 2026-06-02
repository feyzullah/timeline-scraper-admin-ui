# Build from repo root:
#   docker build -t scrapper-admin-ui .
#
# Production uses same-origin /scrapper-api (nginx → timeline-scraper). Admin Bearer is
# injected by nginx from SCRAPPER_ADMIN_API_KEY — do not bake secrets into the JS bundle.
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_SCRAPPER_API_BASE_URL=/scrapper-api
ENV VITE_SCRAPPER_API_BASE_URL=$VITE_SCRAPPER_API_BASE_URL
# Leave empty in prod; nginx adds Authorization. Optional for local docker without proxy.
ARG VITE_SCRAPPER_ADMIN_API_KEY=
ENV VITE_SCRAPPER_ADMIN_API_KEY=$VITE_SCRAPPER_ADMIN_API_KEY

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache gettext

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
