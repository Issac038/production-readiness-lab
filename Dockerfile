FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first for better layer caching.
COPY app/package*.json ./
RUN npm install --omit=dev

# Copy application source.
COPY app/ ./

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "app.js"]
