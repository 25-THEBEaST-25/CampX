#!/bin/sh
set -e

# Railway sets PORT dynamically; default to 80 for local
export PORT=${PORT:-80}

# Substitute env vars into nginx config template
envsubst '${PORT} ${BACKEND_INTERNAL_URL}' \
  < /etc/nginx/templates/nginx.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "Starting Nginx on port $PORT, proxying /api/ → $BACKEND_INTERNAL_URL"

exec nginx -g "daemon off;"
