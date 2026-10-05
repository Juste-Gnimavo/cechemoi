import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT /api/admin/hero-slides/reorder — body { ids: string[] } dans l'ordre voulu
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'storefront.manage')
    if (denied) return denied

    const body = await req.json()
    const ids: unknown = body.ids
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
      return NextResponse.json({ error: 'Liste d’identifiants requise' }, { status: 400 })
    }

    const count = await prisma.heroSlide.count({ where: { id: { in: ids } } })
    if (count !== ids.length || new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: 'Liste d’images incohérente, rechargez la page' }, { status: 400 })
    }

    await prisma.$transaction(
      ids.map((id, position) => prisma.heroSlide.update({ where: { id }, data: { position } }))
    )

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering hero slides:', error)
    return NextResponse.json({ error: 'Erreur lors du réordonnancement' }, { status: 500 })
  }
}
