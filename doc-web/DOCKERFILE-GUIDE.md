# Docker Deployment Guide for Modern JS Frameworks

**Author**: Cave Express DevOps
**Last Updated**: 2025-11-27
**Covers**: Next.js, React (Vite), SolidJS

---

## Table of Contents

1. [Common Build Errors & Solutions](#common-build-errors--solutions)
   - [Dynamic Server Usage Error](#1-dynamic-server-usage-error-nextjs)
   - [useSearchParams Suspense Error](#2-usesearchparams-suspense-error-nextjs)
   - [Prisma Client Generation Error](#3-prisma-client-generation-error)
   - [Sharp/Image Optimization Error](#4-sharpimage-optimization-error)
   - [Serving Uploaded Files in Standalone Mode](#5-serving-uploaded-files-in-standalone-mode)
2. [Next.js Dockerfile](#nextjs-dockerfile)
3. [React (Vite) Dockerfile](#react-vite-dockerfile)
4. [SolidJS Dockerfile](#solidjs-dockerfile)
5. [Docker Compose Templates](#docker-compose-templates)
6. [EasyPanel Deployment Checklist](#easypanel-deployment-checklist)
7. [Environment Variables Best Practices](#environment-variables-best-practices)

---

## Common Build Errors & Solutions

### 1. Dynamic Server Usage Error (Next.js)

**Error:**
```
Error: Dynamic server usage: Route /api/xxx couldn't be rendered statically because it used `headers`
```

**Cause:** Next.js tries to statically render API routes during build, but routes using `getServerSession`, `headers()`, or `cookies()` cannot be static.

**Solution:** Add this export to ALL API route files:

```typescript
// src/app/api/*/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Your code here
}
```

**Automated Fix Script:**
```javascript
// fix-dynamic-routes.js
const fs = require('fs');
const path = require('path');

function findRoutes(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findRoutes(fullPath));
    } else if (item === 'route.ts' || item === 'route.js') {
      files.push(fullPath);
    }
  }
  return files;
}

const apiDir = './src/app/api';
const routes = findRoutes(apiDir);

for (const routePath of routes) {
  let content = fs.readFileSync(routePath, 'utf8');

  if (content.includes("export const dynamic")) continue;

  const lines = content.split('\n');
  let insertIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) insertIndex = i + 1;
  }

  while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
    insertIndex++;
  }

  lines.splice(insertIndex, 0, '',
    "// Force dynamic rendering for API routes",
    "export const dynamic = 'force-dynamic'", '');

  fs.writeFileSync(routePath, lines.join('\n'));
  console.log('Fixed:', routePath);
}
```

---

### 2. useSearchParams Suspense Error (Next.js)

**Error:**
```
Error: useSearchParams() should be wrapped in a suspense boundary at page "/xxx"
```

**Cause:** `useSearchParams()` requires a Suspense boundary in Next.js 14+ for static generation.

**Solution:** Wrap components using `useSearchParams()` in Suspense:

```tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Component that uses useSearchParams
function PageContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return (
    <div>
      {/* Your component content */}
    </div>
  )
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

// Export default with Suspense wrapper
export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PageContent />
    </Suspense>
  )
}
```

---

### 3. Prisma Client Generation Error

**Error:**
```
Error: @prisma/client did not initialize yet
```

**Solution:** Generate Prisma client in Dockerfile:

```dockerfile
# In deps stage
COPY prisma ./prisma/
RUN npx prisma generate
```

---

### 4. Sharp/Image Optimization Error

**Error:**
```
Error: Could not load the "sharp" module
```

**Solution:** Install required system packages:

```dockerfile
RUN apk add --no-cache libc6-compat openssl
```

---

### 5. Serving Uploaded Files in Standalone Mode

**Problem:**
When using `output: 'standalone'` in Next.js, uploaded files stored in `public/uploads/` return **404 errors**. Files exist on disk but cannot be served.

```bash
# Files exist in container
/app/public/uploads/products $ ls
1764246826754-5n2ubfc.png

# But browser returns 404
https://your-domain.com/uploads/products/1764246826754-5n2ubfc.png
```

**Cause:**
Next.js standalone mode only serves files from `public/` that existed **at build time**. The standalone `server.js` doesn't include a static file server for dynamically uploaded files.

**Solution:**
Create an API route to serve uploaded files and add a URL rewrite.

**Step 1: Create API route** (`src/app/api/uploads/[...path]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

// MIME types mapping
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
}

// Cache duration (1 year for immutable content)
const CACHE_MAX_AGE = 31536000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = pathSegments.join('/')

    // Security: prevent directory traversal
    if (filePath.includes('..') || filePath.includes('//')) {
      return new NextResponse('Invalid path', { status: 400 })
    }

    // Only allow specific directories
    const allowedDirs = ['products', 'categories', 'blog', 'campaigns', 'temp']
    const firstSegment = pathSegments[0]
    if (!allowedDirs.includes(firstSegment)) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Construct full path
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath)

    // Check if file exists
    try {
      await stat(fullPath)
    } catch {
      return new NextResponse('Not found', { status: 404 })
    }

    // Get file extension and MIME type
    const ext = path.extname(fullPath).toLowerCase()
    const mimeType = MIME_TYPES[ext]

    if (!mimeType) {
      return new NextResponse('Unsupported file type', { status: 415 })
    }

    // Read and return file
    const fileBuffer = await readFile(fullPath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, immutable`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error serving upload:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
```

**Step 2: Add rewrite to next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... other config

  // Rewrite /uploads/* to API route for serving uploaded files in production
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ]
  },
}
```

**Step 3: Ensure Dockerfile creates upload directories**

```dockerfile
# In runner stage - create upload directories with correct permissions
RUN mkdir -p ./public/uploads/products ./public/uploads/categories ./public/uploads/temp ./public/uploads/blog
RUN chown -R nextjs:nodejs ./public/uploads
```

**Step 4: Mount persistent volume in EasyPanel**

> **IMPORTANT:** Without a persistent volume, uploads will be lost on container restart!

In EasyPanel:
1. Go to your app → Storage
2. Add volume mount: `/app/public/uploads`
3. This ensures uploads persist across deployments

**Result:**
- URLs like `/uploads/products/image.png` work in production
- Security: directory traversal prevention, allowed directories whitelist
- Performance: 1-year cache headers for immutable content
- Existing code doesn't need changes (same URL paths)

---

## Next.js Dockerfile

### Production Dockerfile (Recommended)

```dockerfile
# ===================================================
# Next.js Production Dockerfile
# Multi-stage build for optimal image size
# ===================================================

# Stage 1: Dependencies
FROM node:lts-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies based on lockfile
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "No lockfile found" && exit 1; \
  fi

# Copy and generate Prisma client (if using Prisma)
COPY prisma ./prisma/
RUN npx prisma generate 2>/dev/null || true

# Stage 2: Builder
FROM node:lts-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for public env vars (build-time)
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_URL

# Set build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Stage 3: Production Runner
FROM node:lts-alpine AS runner
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Set up .next directory
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files (if using Prisma)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma 2>/dev/null || true
COPY --from=builder /app/prisma ./prisma 2>/dev/null || true

USER nextjs

EXPOSE 3000

# Health check using curl (wget not installed by default in Alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
```

> **Important**: Alpine images don't have `wget` or `curl` installed by default. You must install one in your runner stage:
> ```dockerfile
> RUN apk add --no-cache libc6-compat openssl curl
> ```

### Required next.config.js Settings

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // REQUIRED for Docker standalone build
  output: 'standalone',

  // Recommended optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', '@headlessui/react'],
  },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'your-cdn.com' },
    ],
  },
}

module.exports = nextConfig
```

### Health Check Endpoints

For Docker/Kubernetes deployments, you need two types of health checks:

1. **Liveness probe** (`/health`) - Simple check, always returns 200 if app is running
2. **Readiness probe** (`/api/health`) - Full check including database connectivity

```typescript
// src/app/health/route.ts - LIVENESS (for Docker HEALTHCHECK)
// Simple endpoint - no DB access, always returns 200
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return new NextResponse('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
}
```

```typescript
// src/app/api/health/route.ts - READINESS (for load balancers)
// Full health check with database verification
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    status: 'healthy' as 'healthy' | 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'unknown' as string, latency: 0 }
    }
  }

  try {
    // Database check with latency measurement
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.checks.database = {
      status: 'connected',
      latency: Date.now() - dbStart
    }
  } catch (error) {
    checks.status = 'unhealthy'
    checks.checks.database = {
      status: 'disconnected',
      latency: 0
    }
    return NextResponse.json(checks, { status: 503 })
  }

  return NextResponse.json(checks)
}
```

> **Docker HEALTHCHECK**: Use `/health` (liveness) for Docker - it's fast and doesn't hit the database.
> **Load Balancer**: Use `/api/health` (readiness) for load balancers to verify full system health.

---

## React (Vite) Dockerfile

```dockerfile
# ===================================================
# React + Vite Production Dockerfile
# Multi-stage build with Nginx
# ===================================================

# Stage 1: Build
FROM node:lts-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm install; \
  fi

COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_APP_NAME

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Add health check (nginx has wget available)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf for React SPA

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Health check endpoint
    location /health {
        return 200 'healthy';
        add_header Content-Type text/plain;
    }

    # Static assets with cache
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional)
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## SolidJS Dockerfile

```dockerfile
# ===================================================
# SolidJS Production Dockerfile
# Works with SolidStart or Vite
# ===================================================

# Stage 1: Build
FROM node:lts-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else npm install; \
  fi

COPY . .

# Build arguments
ARG VITE_API_URL

ENV NODE_ENV=production

RUN npm run build

# Stage 2: Production
# For SolidStart (SSR)
FROM node:lts-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 solidjs

# Copy built application
COPY --from=builder --chown=solidjs:nodejs /app/.output ./
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

USER solidjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server/index.mjs"]
```

### For SolidJS + Vite (Static)

Use the same Nginx approach as React Vite above.

---

## Docker Compose Templates

### Full Stack with Database & Redis

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

---

## EasyPanel Deployment Checklist

### Pre-Deployment

- [ ] **next.config.js** has `output: 'standalone'`
- [ ] All API routes have `export const dynamic = 'force-dynamic'`
- [ ] Pages using `useSearchParams()` wrapped in `<Suspense>`
- [ ] Health check endpoint exists at `/api/health`
- [ ] `.dockerignore` file excludes `node_modules`, `.next`, `.env`
- [ ] Build succeeds locally: `npm run build`

### EasyPanel Configuration

1. **Create App**
   - Select Docker deployment
   - Connect GitHub repository
   - Set branch: `main`

2. **Environment Variables** (Add all in EasyPanel UI)
   ```
   NODE_ENV=production
   DATABASE_URL=your-db-url
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

3. **Add Services** (if needed)
   - PostgreSQL
   - Redis
   - Copy connection strings to env vars

4. **Domain & SSL**
   - Add custom domain
   - Enable SSL (automatic Let's Encrypt)

5. **Deploy & Monitor**
   - Check build logs
   - Verify health endpoint
   - Monitor resource usage

---

## Environment Variables Best Practices

### Build-time vs Runtime

```dockerfile
# Build-time (ARG) - for NEXT_PUBLIC_* vars
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Runtime (ENV) - for secrets, set in EasyPanel
ENV DATABASE_URL=
ENV NEXTAUTH_SECRET=
```

### .env.example Template

```env
# ===================
# Required for Build
# ===================
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# ===================
# Required at Runtime
# ===================
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ===================
# Optional Services
# ===================
# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Storage
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

---

## Quick Reference Commands

```bash
# Build Docker image
docker build -t myapp .

# Run locally
docker run -p 3000:3000 --env-file .env myapp

# Build with compose
docker-compose up --build

# View logs
docker-compose logs -f app

# Shell into container
docker exec -it myapp sh

# Check health
curl http://localhost:3000/api/health

# Prune unused images
docker image prune -a
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `EACCES permission denied` | Check file ownership, use non-root user |
| `Module not found` | Ensure all deps in package.json, check .dockerignore |
| `Cannot find module '.prisma/client'` | Run `npx prisma generate` in Dockerfile |
| `sharp module error` | Add `RUN apk add --no-cache libc6-compat` |
| `Memory exceeded` | Increase Docker memory limit or use swap |
| `Connection refused to DB` | Check service names in docker-compose |
| `Health check failing (exec_die)` | Install curl: `apk add --no-cache curl` in runner stage |
| `wget: not found` | Alpine doesn't have wget by default, use curl or node http |
| `Health check timeout` | Increase `--start-period` to 60s or more for slow startups |
| `Uploaded images return 404` | Standalone mode doesn't serve dynamic uploads - see [Serving Uploaded Files](#5-serving-uploaded-files-in-standalone-mode) |

### Health Check Command Options

For Alpine-based Node.js images, choose one of these approaches:

```dockerfile
# Option 1: Install curl (recommended)
RUN apk add --no-cache curl
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1

# Option 2: Use Node.js built-in http (no extra install)
HEALTHCHECK CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Option 3: Install wget
RUN apk add --no-cache wget
HEALTHCHECK CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

---

**Document Version**: 1.1
**Tested With**: Node 22 LTS, Next.js 14, React 18, SolidJS 1.8
