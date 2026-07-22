import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// crm.cechemoi.com sert le shell propriétaire :
//   /            → accueil tuiles (/owner)
//   /owner, /admin, /auth, /api → inchangés
//   /customers, /reports, …     → alias propres vers /admin/*
// cechemoi.com reste la boutique + /admin complet, sans aucun changement.
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const { pathname, search } = request.nextUrl

  if (!host.startsWith('crm.')) {
    return NextResponse.next()
  }

  // Fichiers statiques (logos, images, manifest…) : passer tel quel
  if (pathname.includes('.')) {
    return NextResponse.next()
  }

  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/owner', request.url))
  }

  if (
    pathname.startsWith('/owner') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  return NextResponse.rewrite(new URL(`/admin${pathname}${search}`, request.url))
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
