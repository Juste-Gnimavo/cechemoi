import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'
import { isValidSlideLink } from '@/lib/hero-slides'

export const dynamic = 'force-dynamic'

// GET /api/admin/hero-slides — toutes les slides, actives ou non, ordonnées
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'storefront')
    if (denied) return denied

    const slides = await prisma.heroSlide.findMany({ orderBy: { position: 'asc' } })
    return NextResponse.json({ success: true, slides })
  } catch (error) {
    console.error('Error listing hero slides:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des images' }, { status: 500 })
  }
}

// POST /api/admin/hero-slides — ajouter une slide en fin de bandeau
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'storefront.manage')
    if (denied) return denied

    const body = await req.json()
    const image = typeof body.image === 'string' ? body.image.trim() : ''
    const alt = typeof body.alt === 'string' ? body.alt.trim() : ''
    const link = body.link ? String(body.link).trim() : null

    if (!image) return NextResponse.json({ error: 'Image requise' }, { status: 400 })
    if (!alt) return NextResponse.json({ error: 'Description de l’image requise' }, { status: 400 })
    if (link && !isValidSlideLink(link)) {
      return NextResponse.json({ error: 'Lien invalide : page du site (/catalogue) ou adresse https' }, { status: 400 })
    }

    const last = await prisma.heroSlide.findFirst({ orderBy: { position: 'desc' }, select: { position: true } })
    const slide = await prisma.heroSlide.create({
      data: {
        image,
        alt,
        link,
        position: (last?.position ?? -1) + 1,
        active: body.active === undefined ? true : Boolean(body.active),
      },
    })

    revalidatePath('/')
    return NextResponse.json({ success: true, slide })
  } catch (error) {
    console.error('Error creating hero slide:', error)
    return NextResponse.json({ error: 'Erreur lors de l’ajout de l’image' }, { status: 500 })
  }
}
