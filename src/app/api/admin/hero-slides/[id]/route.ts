import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'
import { isValidSlideLink } from '@/lib/hero-slides'

export const dynamic = 'force-dynamic'

// PUT /api/admin/hero-slides/[id] — image, description, lien, activation
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'storefront.manage')
    if (denied) return denied

    const existing = await prisma.heroSlide.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Image introuvable' }, { status: 404 })

    const body = await req.json()
    const data: { image?: string; alt?: string; link?: string | null; active?: boolean } = {}

    if (body.image !== undefined) {
      const image = String(body.image).trim()
      if (!image) return NextResponse.json({ error: 'Image requise' }, { status: 400 })
      data.image = image
    }
    if (body.alt !== undefined) {
      const alt = String(body.alt).trim()
      if (!alt) return NextResponse.json({ error: 'Description de l’image requise' }, { status: 400 })
      data.alt = alt
    }
    if (body.link !== undefined) {
      const link = body.link ? String(body.link).trim() : null
      if (link && !isValidSlideLink(link)) {
        return NextResponse.json({ error: 'Lien invalide : page du site (/catalogue) ou adresse https' }, { status: 400 })
      }
      data.link = link
    }
    if (body.active !== undefined) data.active = Boolean(body.active)

    const slide = await prisma.heroSlide.update({ where: { id: params.id }, data })

    revalidatePath('/')
    return NextResponse.json({ success: true, slide })
  } catch (error) {
    console.error('Error updating hero slide:', error)
    return NextResponse.json({ error: 'Erreur lors de la modification de l’image' }, { status: 500 })
  }
}

// DELETE /api/admin/hero-slides/[id] — suppression définitive, direction seulement.
// Le Personnel désactive (bouton « Masquer »), il ne supprime pas.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'storefront.delete')
    if (denied) return denied

    const existing = await prisma.heroSlide.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Image introuvable' }, { status: 404 })

    await prisma.heroSlide.delete({ where: { id: params.id } })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting hero slide:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l’image' }, { status: 500 })
  }
}
