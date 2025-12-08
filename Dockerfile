# ===================================================
# CÈCHÉMOI - Production Dockerfile for EasyPanel
# ===================================================
# Uses multi-stage build for optimal image size
# Node.js 22 LTS with Alpine for smallest footprint
# ===================================================

# Stage 1: Dependencies
# Using LTS Alpine for stability + security updates
FROM node:lts-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies with legacy peer deps (required for this project)
RUN npm ci --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Builder
FROM node:lts-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for build-time environment (with production defaults)
ARG NEXT_PUBLIC_SITE_URL=https://cechemoi.com
ARG NEXT_PUBLIC_APP_URL=https://cechemoi.com
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

# Set environment for build - NEXT_PUBLIC_* must be ENV for Next.js to embed them
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Build the application
RUN npm run build

# Stage 3: Production Runner
FROM node:lts-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set production environment with sane defaults
# These can be overridden at runtime via docker-compose or EasyPanel
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXTAUTH_URL=https://cechemoi.com

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Create uploads directory with correct permissions for file uploads
# IMPORTANT: Mount a persistent volume to /app/public/uploads in EasyPanel
# Without a volume, uploads will be lost on container restart
RUN mkdir -p ./public/uploads/products ./public/uploads/categories ./public/uploads/temp ./public/uploads/blog ./public/uploads/campaigns
RUN chown -R nextjs:nodejs ./public/uploads/products
RUN chown -R nextjs:nodejs ./public/uploads/categories
RUN chown -R nextjs:nodejs ./public/uploads/campaigns
RUN chown -R nextjs:nodejs ./public/uploads/temp
RUN chown -R nextjs:nodejs ./public/uploads/blog

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma client and schema for migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]
