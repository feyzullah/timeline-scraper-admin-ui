#!/bin/sh
set -eu

export SCRAPPER_UPSTREAM="${SCRAPPER_UPSTREAM:-http://timeline-scraper:4011}"
export SCRAPPER_ADMIN_API_KEY="${SCRAPPER_ADMIN_API_KEY:-}"

envsubst '${SCRAPPER_UPSTREAM} ${SCRAPPER_ADMIN_API_KEY}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
