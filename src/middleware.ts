import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  // Redirect crm.cechemoi.com to cechemoi.com/auth/admin
  if (host.startsWith('crm.')) {
    const mainDomain = host.replace('crm.', '')
    return NextResponse.redirect(
      new URL(`https://${mainDomain}/auth/admin`, request.url),
      301 // Permanent redirect
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
