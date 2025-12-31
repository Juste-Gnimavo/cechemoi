import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET /api/admin/tailors - List all tailors
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF', 'TAILOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const tailors = await prisma.user.findMany({
      where: {
        role: 'TAILOR',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        tailorAssignments: {
          where: {
            status: {
              notIn: ['COMPLETED', 'DELIVERED'],
            },
          },
          select: {
            id: true,
            status: true,
            garmentType: true,
            customOrder: {
              select: {
                orderNumber: true,
                pickupDate: true,
              },
            },
          },
        },
        _count: {
          select: {
            tailorAssignments: true,
          },
        },
        // Material usage (as tailor)
        materialUsages: {
          where: {
            type: 'OUT',
          },
          select: {
            id: true,
            totalCost: true,
            quantity: true,
            createdAt: true,
            material: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Last 5 material usages
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Add stats for each tailor
    const tailorsWithStats = tailors.map((tailor) => {
      const materialTotalCost = tailor.materialUsages.reduce((sum, m) => sum + m.totalCost, 0)
      const materialUsageCount = tailor.materialUsages.length

      return {
        id: tailor.id,
        name: tailor.name,
        phone: tailor.phone,
        email: tailor.email,
        createdAt: tailor.createdAt,
        activeItems: tailor.tailorAssignments.length,
        totalAssigned: tailor._count.tailorAssignments,
        currentWork: tailor.tailorAssignments.slice(0, 3), // Show first 3 active items
        // Material stats
        materialTotalCost,
        materialUsageCount,
        recentMaterialUsages: tailor.materialUsages.slice(0, 3),
      }
    })

    return NextResponse.json({
      success: true,
      tailors: tailorsWithStats,
      total: tailors.length,
    })
  } catch (error) {
    console.error('Error fetching tailors:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/tailors - Create a new tailor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN and MANAGER can create tailors
    if (!session || !['ADMIN', 'MANAGER'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await req.json()
    const { name, phone, email, password } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Nom et telephone requis' }, { status: 400 })
    }

    // Check if phone+role already exists (same phone can have different roles)
    const existingPhone = await prisma.user.findUnique({
      where: {
        phone_role: { phone, role: 'TAILOR' },
      },
    })

    if (existingPhone) {
      return NextResponse.json({ error: 'Ce numero est deja utilise pour un couturier' }, { status: 400 })
    }

    // Check if email+role already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email, role: 'TAILOR' },
      })

      if (existingEmail) {
        return NextResponse.json({ error: 'Cet email est deja utilise pour un couturier' }, { status: 400 })
      }
    }

    // Create tailor
    const tailor = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: password ? await bcrypt.hash(password, 10) : null,
        role: 'TAILOR',
        phoneVerified: new Date(),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      tailor,
      message: 'Couturier ajoute avec succes',
    })
  } catch (error) {
    console.error('Error creating tailor:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
