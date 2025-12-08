import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth-helper'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/account/invoices - Get customer's invoices
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = user.id
    const userPhone = user.phone
    const userEmail = user.email

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    // Build where clause - get invoices linked to user's orders OR matching user's phone/email
    const whereConditions: any[] = [
      // Invoices linked to user's orders
      {
        order: {
          userId: userId,
        },
      },
    ]

    // Also match by phone if available
    if (userPhone) {
      whereConditions.push({
        customerPhone: userPhone,
      })
    }

    // Also match by email if available
    if (userEmail) {
      whereConditions.push({
        customerEmail: userEmail,
      })
    }

    const where: any = {
      OR: whereConditions,
      // Only show non-draft invoices to customers
      status: {
        not: 'DRAFT',
      },
    }

    // Apply status filter if provided
    if (status && status !== 'all') {
      where.status = status
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { issueDate: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              unitPrice: true,
              total: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching customer invoices:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des factures' },
      { status: 500 }
    )
  }
}
