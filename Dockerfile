FROM node:24.22.1-bookworm-slim AS frontend-build

ARG BASE_PATH=/surfspot/
ENV BASE_PATH=${BASE_PATH}

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:24.22.1-bookworm-slim AS backend-dependencies

WORKDIR /app/backend/express
COPY backend/express/package.json backend/express/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24.22.1-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=backend-dependencies --chown=node:node \
  /app/backend/express/node_modules ./backend/express/node_modules
COPY --chown=node:node backend/express/package.json backend/express/package-lock.json \
  ./backend/express/
COPY --chown=node:node backend/express/src/ ./backend/express/src/
COPY --from=frontend-build --chown=node:node \
  /app/frontend/dist/ ./frontend/dist/

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "backend/express/src/server.js"]
