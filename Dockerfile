FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://postpilot:postpilot_secret@localhost:5432/postpilot?schema=public"
ENV NEXTAUTH_SECRET="super_secret_postpilot_jwt_signing_key_32bytes"
ENV NEXTAUTH_URL="http://localhost:3000"
RUN npx prisma generate
RUN npm run build

# Web Runner
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app ./
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads && chmod 777 /app/public/uploads

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]

# Worker Runner
FROM base AS worker
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app ./
RUN mkdir -p /app/public/uploads && chmod 777 /app/public/uploads
CMD ["npx", "tsx", "worker/index.ts"]
