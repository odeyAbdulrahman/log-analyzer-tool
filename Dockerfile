# Stage 1: Build the application
FROM node:latest AS builder

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
COPY package*.json ./
COPY package-lock.json ./ 
RUN npm ci --omit=dev
COPY . .
RUN npm run build

FROM node:latest AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

USER nextjs

ENV PORT=3000
ENV PORT 3000

CMD ["npm", "start"]