# Build from repo root (scrapper-admin-ui/):
#   docker build -t scrapper-admin-ui .
#
# Production: Node serves dist/ under APP_BASE_PATH and proxies {base}/scrapper-api.
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_APP_BASE_PATH=/sports-data-admin
ENV VITE_APP_BASE_PATH=$VITE_APP_BASE_PATH
ARG VITE_SCRAPPER_ADMIN_API_KEY=
ENV VITE_SCRAPPER_ADMIN_API_KEY=$VITE_SCRAPPER_ADMIN_API_KEY

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ARG APP_BASE_PATH=/sports-data-admin
ENV APP_BASE_PATH=$APP_BASE_PATH

COPY server.mjs ./
COPY shared ./shared
COPY --from=build /app/dist ./dist

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1/healthz').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
