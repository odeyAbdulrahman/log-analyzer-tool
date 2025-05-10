# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    npm install -g pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  else \
    npm ci; \
  fi

# Stage 2: Build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables
ARG NEXT_PUBLIC_APP_VERSION=1.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Verify standalone output exists
RUN \
  if [ ! -f ".next/standalone/server.js" ]; then \
    echo "ERROR: Standalone output missing!"; \
    echo "Verify:"; \
    echo "1. next.config.js has output: 'standalone'"; \
    echo "2. Next.js version ≥ 12.3.0"; \
    exit 1; \
  fi

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs

# 1. Copy standalone server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 2. Copy static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# 3. Copy public files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Health check
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --spider http://localhost:3000/api/health || exit 1

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]