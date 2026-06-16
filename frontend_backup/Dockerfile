# syntax=docker/dockerfile:1.6
# Next.js 15 + bun, multi-stage. Builds and serves the SHI dashboard.

# -------- deps stage --------
FROM oven/bun:1.1 AS deps
WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
RUN bun install --frozen-lockfile || bun install

# -------- builder stage --------
FROM oven/bun:1.1 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js convention: ensure public/ exists even when project has no static assets.
# Without this, runner stage's `COPY --from=builder /app/public ./public` fails
# because the source dir is missing in the build context.
RUN mkdir -p public
RUN bun run build

# -------- runtime stage --------
FROM oven/bun:1.1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Minimal runtime payload
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./
# database/ needed by the in-app setup helper (`bunx tsx database/setup.ts`)
COPY --from=builder /app/database ./database

EXPOSE 3000

CMD ["bun", "run", "start"]
