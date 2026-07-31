# ---- App TanStack Start ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --no-audit --no-fund

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
