import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// POST /api/admin/customers/[id]/notes - Add customer note
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { content, noteType = 'private' } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Le contenu de la note est requis' }, { status: 400 })
    }

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Create note
    const note = await prisma.customerNote.create({
      data: {
        customerId: params.id,
        content: content.trim(),
        noteType,
        authorId: (session.user as any).id,
        authorName: (session.user as any).name || 'Admin',
      },
    })

    // TODO: Add customer note notification template if needed

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Error creating customer note:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de la note' },
      { status: 500 }
    )
  }
}

// GET /api/admin/customers/[id]/notes - Get all customer notes
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const notes = await prisma.customerNote.findMany({
      where: { customerId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, notes })
  } catch (error) {
    console.error('Error fetching customer notes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notes' },
      { status: 500 }
    )
  }
}
