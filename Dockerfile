# Stage 1: Build the application
FROM node:latest AS builder

# Set timezone to UTC
RUN echo "#!/bin/sh\n\
    echo 'y' | sh -c 'debconf-set-selections <<< \"tzdata tzdata/Areas select Etc\"'\n\
    echo 'y' | sh -c 'debconf-set-selections <<< \"tzdata tzdata/Zones/Etc select UTC\"'\n\
    apt-get update && \
    apt-get install -y tzdata && \
    apt-get clean" > /tmp/script.sh && \
    chmod +x /tmp/script.sh && \
    /tmp/script.sh && \
    rm /tmp/script.sh

WORKDIR /app

# Set custom registry for scoped packages
RUN npm config set @MUNS.FrontEnd.Projects:registry https://registry.npmjs.org/

COPY package*.json ./

RUN npm ci --omit=dev
COPY . .
RUN npm run build

# Stage 2: Serve the application
FROM node:18-slim@sha256:3c7b9f8f4e8b8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8 AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]