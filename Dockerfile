# syntax=docker/dockerfile:1.7

# Reconstructed Dockerfile based on the deployed image config:
#   Node 20.20.2 / standalone Next.js output / Prisma migrate-on-start
# Tweak as needed — package manager (npm/pnpm/yarn) is unknown from the image
# alone, this version assumes npm. If the original used pnpm or yarn, swap the
# install commands accordingly.

ARG NODE_VERSION=20.20.2

# ---------- deps ----------
FROM node:${NODE_VERSION}-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- builder ----------
FROM node:${NODE_VERSION}-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ---------- runner ----------
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Prisma needs schema + migrations + generated client at runtime so
# `prisma migrate deploy` works at container start.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Next.js standalone output: a minimal server.js + only the deps actually used.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
