import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/health - Health check endpoint with environment verification
 */
export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      jwt_secret: {
        configured: !!process.env.JWT_SECRET,
        length: process.env.JWT_SECRET?.length || 0,
        valid: (process.env.JWT_SECRET?.length || 0) >= 32
      },
      supabase_url: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET'
      },
      supabase_anon_key: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      },
      supabase_service_key: {
        configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      },
      vercel: {
        url: process.env.VERCEL_URL || 'Not on Vercel',
        region: process.env.VERCEL_REGION || 'N/A',
        env: process.env.VERCEL_ENV || 'N/A'
      }
    }
  }

  // Calculate health status
  const isHealthy = 
    checks.checks.jwt_secret.valid &&
    checks.checks.supabase_url.configured &&
    checks.checks.supabase_anon_key.configured &&
    checks.checks.supabase_service_key.configured

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    ...checks,
    warnings: !isHealthy ? [
      !checks.checks.jwt_secret.valid && 'JWT_SECRET not properly configured (needs 32+ chars)',
      !checks.checks.supabase_url.configured && 'NEXT_PUBLIC_SUPABASE_URL not set',
      !checks.checks.supabase_anon_key.configured && 'NEXT_PUBLIC_SUPABASE_ANON_KEY not set',
      !checks.checks.supabase_service_key.configured && 'SUPABASE_SERVICE_ROLE_KEY not set',
    ].filter(Boolean) : []
  }, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}

/**
 * OPTIONS /api/health - Handle preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}