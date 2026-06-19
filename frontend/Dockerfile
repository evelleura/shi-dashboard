# Next.js 15 (App Router) — multi-stage build, bun runtime.
FROM oven/bun:1.1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

FROM oven/bun:1.1-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public uploads
RUN bun run build

FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.ts ./
# database/ (init.sql + seed.sql + setup.ts) and src/ (spiCalculator for backfill)
# are needed by the Fly release_command:
#   bun database/setup.ts --seed && bun database/backfill-spi.ts
COPY --from=builder /app/database ./database
COPY --from=builder /app/src ./src

EXPOSE 3000
CMD ["bun", "run", "start"]
