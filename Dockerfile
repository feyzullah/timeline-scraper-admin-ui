# Build from repo root (scrapper-admin-ui/):
#   docker build -t scrapper-admin-ui .
#
# Production: Node serves dist/ and proxies /scrapper-api → SCRAPPER_UPSTREAM.
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

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80

COPY server.mjs ./
COPY --from=build /app/dist ./dist

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1/healthz').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
