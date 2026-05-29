# Durbar — API + static server. Zero runtime dependencies (Node built-ins).
FROM node:22-alpine
WORKDIR /app

# If you add dependencies later, uncomment to install them:
# COPY package*.json ./
# RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production \
    PORT=3000 \
    DURBAR_DB=/data/durbar.db
# Mount a persistent volume at /data so the SQLite database survives restarts.
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "--no-warnings", "server/index.js"]
