import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface HealthCheck {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  checks: {
    database: {
      status: 'connected' | 'disconnected'
      latency: number
    }
  }
}

// Comprehensive health check with database verification
// Use this for load balancers and readiness probes
export async function GET() {
  const startTime = Date.now()

  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: {
        status: 'disconnected',
        latency: 0
      }
    }
  }

  try {
    // Database connectivity check with latency measurement
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = {
      status: 'connected',
      latency: Date.now() - dbStart
    }
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.database = {
      status: 'disconnected',
      latency: 0
    }

    // Return 503 Service Unavailable if database is down
    return NextResponse.json(health, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })
  }

  return NextResponse.json(health, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Response-Time': `${Date.now() - startTime}ms`
    }
  })
}
