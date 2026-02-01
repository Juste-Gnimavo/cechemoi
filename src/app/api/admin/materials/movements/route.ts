import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/materials/movements - List movements with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const materialId = searchParams.get('materialId')
    const tailorId = searchParams.get('tailorId')
    const customOrderId = searchParams.get('customOrderId')
    const type = searchParams.get('type') // IN, OUT, ADJUST, RETURN
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (materialId) {
      where.materialId = materialId
    }

    if (tailorId) {
      where.tailorId = tailorId
    }

    if (customOrderId) {
      where.customOrderId = customOrderId
    }

    if (type) {
      where.type = type
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const [movements, total] = await Promise.all([
      prisma.materialMovement.findMany({
        where,
        include: {
          material: {
            select: {
              id: true,
              name: true,
              unit: true,
              category: {
                select: { id: true, name: true },
              },
            },
          },
          tailor: {
            select: { id: true, name: true, phone: true },
          },
          customOrder: {
            select: {
              id: true,
              orderNumber: true,
              customer: {
                select: { id: true, name: true },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.materialMovement.count({ where }),
    ])

    // Calculate totals for the filtered results
    const totals = await prisma.materialMovement.aggregate({
      where,
      _sum: {
        totalCost: true,
        quantity: true,
      },
    })

    return NextResponse.json({
      success: true,
      movements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      totals: {
        totalCost: totals._sum.totalCost || 0,
        totalQuantity: totals._sum.quantity || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching material movements:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/admin/materials/movements - Create a new movement (IN or OUT)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const {
      materialId,
      type,
      quantity,
      unitPrice,
      tailorId,
      customOrderId,
      customOrderItemId,
      notes,
      reference,
      createdAt, // Optional custom date for offline/past movements
    } = body

    if (!materialId || !type || !quantity) {
      return NextResponse.json(
        { error: 'Matériel, type et quantité sont requis' },
        { status: 400 }
      )
    }

    if (!['IN', 'OUT', 'ADJUST', 'RETURN'].includes(type)) {
      return NextResponse.json({ error: 'Type de mouvement invalide' }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'La quantité doit être positive' }, { status: 400 })
    }

    // Get material and its current stock
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    })

    if (!material) {
      return NextResponse.json({ error: 'Matériel non trouvé' }, { status: 404 })
    }

    // Check if tailor exists if provided
    if (tailorId) {
      const tailor = await prisma.user.findFirst({
        where: { id: tailorId, role: 'TAILOR' },
      })
      if (!tailor) {
        return NextResponse.json({ error: 'Couturier non trouvé' }, { status: 400 })
      }
    }

    // Check if custom order exists if provided
    if (customOrderId) {
      const order = await prisma.customOrder.findUnique({
        where: { id: customOrderId },
      })
      if (!order) {
        return NextResponse.json({ error: 'Commande non trouvée' }, { status: 400 })
      }
    }

    // Calculate new stock
    const previousStock = material.stock
    let newStock: number

    switch (type) {
      case 'IN':
        newStock = previousStock + quantity
        break
      case 'OUT':
        if (previousStock < quantity) {
          return NextResponse.json(
            { error: `Stock insuffisant. Stock actuel: ${previousStock} ${material.unit}` },
            { status: 400 }
          )
        }
        newStock = previousStock - quantity
        break
      case 'RETURN':
        newStock = previousStock + quantity
        break
      case 'ADJUST':
        // For adjustments, quantity is the new absolute value
        newStock = quantity
        break
      default:
        newStock = previousStock
    }

    // Use provided unit price or material's unit price
    const effectiveUnitPrice = unitPrice !== undefined ? unitPrice : material.unitPrice
    const totalCost = quantity * effectiveUnitPrice

    // Create movement and update stock in a transaction
    const [movement] = await prisma.$transaction([
      prisma.materialMovement.create({
        data: {
          materialId,
          type,
          quantity,
          unitPrice: effectiveUnitPrice,
          totalCost,
          previousStock,
          newStock,
          tailorId: tailorId || null,
          customOrderId: customOrderId || null,
          customOrderItemId: customOrderItemId || null,
          createdById: (session.user as any).id,
          createdByName: (session.user as any).name || 'Staff',
          notes: notes || null,
          reference: reference || null,
          ...(createdAt && { createdAt: new Date(createdAt) }), // Custom date for offline/past movements
        },
        include: {
          material: {
            select: { id: true, name: true, unit: true },
          },
          tailor: {
            select: { id: true, name: true },
          },
          customOrder: {
            select: { id: true, orderNumber: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.material.update({
        where: { id: materialId },
        data: { stock: newStock },
      }),
    ])

    const typeLabels: Record<string, string> = {
      IN: 'Entrée',
      OUT: 'Sortie',
      ADJUST: 'Ajustement',
      RETURN: 'Retour',
    }

    return NextResponse.json({
      success: true,
      movement,
      message: `${typeLabels[type]} enregistrée avec succès`,
    })
  } catch (error) {
    console.error('Error creating material movement:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
