# Build from repo root (scrapper-admin-ui/):
#   docker build -t scrapper-admin-ui .
#
# Production: nginx serves dist/ and proxies /scrapper-api → SCRAPPER_UPSTREAM.
# Bearer token from SCRAPPER_ADMIN_API_KEY (k8s secret), not the JS bundle.
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_SCRAPPER_API_BASE_URL=/scrapper-api
ENV VITE_SCRAPPER_API_BASE_URL=$VITE_SCRAPPER_API_BASE_URL
ARG VITE_SCRAPPER_ADMIN_API_KEY=
ENV VITE_SCRAPPER_ADMIN_API_KEY=$VITE_SCRAPPER_ADMIN_API_KEY

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache gettext

# Bust stale GHA layer cache when deploy passes CACHEBUST=<git sha>.
ARG CACHEBUST=
RUN test -n "$CACHEBUST" || true

COPY nginx/default.conf.template /etc/nginx/scrapper/default.conf.template
COPY docker-entrypoint.d/99-scrapper-proxy-config.sh /docker-entrypoint.d/99-scrapper-proxy-config.sh
# Strip CRLF if checked out on Windows; fail build if hook or nginx entrypoint is missing.
RUN sed -i 's/\r$//' /docker-entrypoint.d/99-scrapper-proxy-config.sh \
  && chmod +x /docker-entrypoint.d/99-scrapper-proxy-config.sh \
  && test -x /docker-entrypoint.d/99-scrapper-proxy-config.sh \
  && test -f /docker-entrypoint.sh \
  && test -x /docker-entrypoint.sh \
  && rm -f /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

# Use nginx's entrypoint script from the base image — never COPY a custom file over this path.
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
