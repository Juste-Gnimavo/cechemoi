import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET - List all blog tags
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'blog')
    if (denied) return denied

    const { searchParams } = new URL(request.url)
    const includePostCount = searchParams.get('includePostCount') === 'true'

    const tags = await prisma.blogTag.findMany({
      include: {
        _count: includePostCount ? {
          select: { posts: true }
        } : undefined
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, tags })
  } catch (error) {
    console.error('Error fetching blog tags:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des tags' },
      { status: 500 }
    )
  }
}

// POST - Create a new blog tag
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'blog.manage')
    if (denied) return denied

    const body = await request.json()
    const { name, slug, description, color } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Le nom est requis' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const finalSlug = slug || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingTag = await prisma.blogTag.findUnique({
      where: { slug: finalSlug }
    })

    if (existingTag) {
      return NextResponse.json(
        { success: false, error: 'Ce slug existe déjà' },
        { status: 400 }
      )
    }

    const tag = await prisma.blogTag.create({
      data: {
        name,
        slug: finalSlug,
        description,
        color
      }
    })

    return NextResponse.json({ success: true, tag }, { status: 201 })
  } catch (error) {
    console.error('Error creating blog tag:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du tag' },
      { status: 500 }
    )
  }
}
