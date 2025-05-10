# Stage 1: Build the application
FROM node:18.17.1 AS builder

WORKDIR /app
COPY package.json package-lock.json /app/

# Install pnpm if needed
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

COPY . /app/
RUN pnpm run build

# Stage 2: Run the application
FROM node:18.17.1 AS runner

WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set permissions for the non-root user
USER nextjs

# Expose the port and set the default command
EXPOSE 3000
CMD ["npm", "start"]