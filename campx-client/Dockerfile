# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite bakes env vars at build time — set VITE_API_URL to empty so
# all /api/* calls use relative paths (proxied by Nginx at runtime)
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET_ITEMS
ARG VITE_CLOUDINARY_UPLOAD_PRESET_AVATARS
ARG VITE_CLOUDINARY_UPLOAD_PRESET_IDS
ARG VITE_ABLY_API_KEY
ARG VITE_MAPBOX_ACCESS_TOKEN
ARG VITE_RAZORPAY_KEY_ID

ENV VITE_API_URL=""
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_CLOUDINARY_UPLOAD_PRESET_ITEMS=$VITE_CLOUDINARY_UPLOAD_PRESET_ITEMS
ENV VITE_CLOUDINARY_UPLOAD_PRESET_AVATARS=$VITE_CLOUDINARY_UPLOAD_PRESET_AVATARS
ENV VITE_CLOUDINARY_UPLOAD_PRESET_IDS=$VITE_CLOUDINARY_UPLOAD_PRESET_IDS
ENV VITE_ABLY_API_KEY=$VITE_ABLY_API_KEY
ENV VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config template and entrypoint
COPY nginx.conf /etc/nginx/templates/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

EXPOSE $PORT

ENTRYPOINT ["/docker-entrypoint.sh"]
