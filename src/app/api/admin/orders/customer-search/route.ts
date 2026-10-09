import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'

// Recherche de cliente pour la vente au comptoir (/admin/orders/new).
//
// Gardée par `orders.create`, et non par `customers` : le gestionnaire
// boutique doit retrouver la cliente au magasin sans accéder à l'annuaire
// (décision CEO du 09/10/2026). Ne renvoie donc que l'identifiant, le nom,
// le téléphone et les adresses de livraison — ni email, ni mensurations, ni
// historique, ni montants.
//
//   GET ?search=<nom ou téléphone>  → 10 clientes au plus (2 caractères min.)
//   GET ?id=<identifiant>           → une cliente (préremplissage par l'URL)

const customerSelect = {
  id: true,
  name: true,
  phone: true,
  addresses: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      quartier: true,
      cite: true,
      rue: true,
      city: true,
      country: true,
      description: true,
      isDefault: true,
    },
    orderBy: [{ isDefault: 'desc' as const }, { createdAt: 'desc' as const }],
  },
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'orders.create')
    if (denied) return denied

    const id = req.nextUrl.searchParams.get('id')?.trim()
    const search = req.nextUrl.searchParams.get('search')?.trim() || ''

    if (id) {
      const customer = await prisma.user.findFirst({
        where: { id, role: 'CUSTOMER' },
        select: customerSelect,
      })
      return NextResponse.json({ success: true, customers: customer ? [customer] : [] })
    }

    if (search.length < 2) {
      return NextResponse.json({ success: true, customers: [] })
    }

    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      },
      select: customerSelect,
      orderBy: { name: 'asc' },
      take: 10,
    })

    return NextResponse.json({ success: true, customers })
  } catch (error) {
    console.error('Recherche de cliente (vente au comptoir) :', error)
    return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 })
  }
}
