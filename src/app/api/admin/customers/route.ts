import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { smsingService } from '@/lib/smsing-service'
import { notificationService } from '@/lib/notification-service'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/customers - Get all customers with filtering and analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const segment = searchParams.get('segment') || '' // vip, new, inactive, high-value
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {
      role: 'CUSTOMER', // Only show customers, not admins
    }

    // Search by name or phone
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Segment filtering
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // Get total count
    const totalCount = await prisma.user.count({ where })

    // Get stats for the page header
    const [
      totalCustomers,
      todayCustomers,
      weekCustomers,
      monthCustomers,
      yearCustomers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfDay } } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfWeek } } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfYear } } }),
    ])

    const stats = {
      total: totalCustomers,
      today: todayCustomers,
      week: weekCustomers,
      month: monthCustomers,
      year: yearCustomers,
    }

    // Fetch customers
    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        whatsappNumber: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Fetch PAID standalone invoices for all customers in this batch (matched by phone)
    const customerPhones = customers.map(c => c.phone).filter(Boolean)
    const paidStandaloneInvoices = await prisma.invoice.findMany({
      where: {
        orderId: null, // Standalone invoices only
        status: 'PAID',
        customerPhone: { in: customerPhones },
      },
      select: {
        customerPhone: true,
        total: true,
      },
    })

    // Group standalone invoice totals by phone
    const invoiceTotalsByPhone = paidStandaloneInvoices.reduce((acc: Record<string, number>, inv) => {
      if (inv.customerPhone) {
        acc[inv.customerPhone] = (acc[inv.customerPhone] || 0) + inv.total
      }
      return acc
    }, {})

    // Calculate analytics for each customer
    const customersWithAnalytics = customers.map((customer) => {
      const totalOrders = customer.orders.length
      const orderLifetimeValue = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const standaloneInvoiceValue = invoiceTotalsByPhone[customer.phone] || 0
      const lifetimeValue = orderLifetimeValue + standaloneInvoiceValue
      const averageOrderValue = totalOrders > 0 ? orderLifetimeValue / totalOrders : 0

      // Get last order date
      const lastOrder = customer.orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
      const lastOrderDate = lastOrder ? lastOrder.createdAt : null

      // Determine segment
      let segments: string[] = []
      const isNewCustomer = new Date(customer.createdAt) > thirtyDaysAgo

      // New customer (registered within last 30 days)
      if (isNewCustomer) {
        segments.push('new')
      }

      // Inactive (no orders in last 90 days or never ordered)
      // BUT don't mark as inactive if they're a new customer (give them time to order)
      if (!isNewCustomer && (!lastOrder || new Date(lastOrder.createdAt) < ninetyDaysAgo)) {
        segments.push('inactive')
      }

      // VIP (5+ orders or lifetime value > 100,000 CFA)
      if (totalOrders >= 5 || lifetimeValue >= 100000) {
        segments.push('vip')
      }

      // High value (lifetime value > 50,000 CFA)
      if (lifetimeValue >= 50000) {
        segments.push('high-value')
      }

      // Active customer (has ordered within last 90 days)
      if (lastOrder && new Date(lastOrder.createdAt) >= ninetyDaysAgo) {
        segments.push('active')
      }

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        whatsappNumber: customer.whatsappNumber,
        email: customer.email,
        image: customer.image,
        createdAt: customer.createdAt,
        totalOrders,
        lifetimeValue,
        lifetimeValueFromOrders: orderLifetimeValue,
        lifetimeValueFromInvoices: standaloneInvoiceValue,
        averageOrderValue,
        lastOrderDate,
        segments,
        reviewsCount: customer._count.reviews,
      }
    })

    // Apply segment filter if specified
    let filteredCustomers = customersWithAnalytics
    if (segment) {
      filteredCustomers = customersWithAnalytics.filter((c) =>
        c.segments.includes(segment)
      )
    }

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      customers: filteredCustomers,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clients' },
      { status: 500 }
    )
  }
}

// POST /api/admin/customers - Create a new customer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()

    // Validation schema
    const schema = z.object({
      name: z.string().min(1, 'Le nom est requis'),
      email: z.string().email('Email invalide').optional().nullable(),
      phone: z.string().min(10, 'Téléphone requis'),
      whatsappNumber: z.string().optional().nullable(),
      image: z.string().url('URL invalide').optional().nullable(),
      dateOfBirth: z.string().optional().nullable(),
      howDidYouHearAboutUs: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      country: z.string().optional().nullable(),
      countryCode: z.string().length(2, 'Code pays doit être 2 lettres').optional().nullable(),
      loyaltyTier: z.enum(['bronze', 'silver', 'gold', 'platinum']).default('bronze'),
      initialPoints: z.number().int().min(0).default(0),
      notes: z.string().optional().nullable(),
      inscriptionDate: z.string().optional().nullable(),
      address: z.object({
        fullName: z.string(),
        phone: z.string(),
        rue: z.string().optional().nullable(),
        quartier: z.string().optional().nullable(),
        cite: z.string().optional().nullable(),
        city: z.string(),
        description: z.string().optional().nullable(),
        addressLine1: z.string(),
        addressLine2: z.string().optional().nullable(),
        country: z.string().default('Côte d\'Ivoire'),
        latitude: z.number().optional().nullable(),
        longitude: z.number().optional().nullable(),
        geoAccuracy: z.number().optional().nullable(),
        geoSource: z.string().optional().nullable(),
        isDefault: z.boolean().default(true),
      }).optional().nullable(),
      measurements: z.any().optional().nullable(),
      sendWelcomeSMS: z.boolean().default(false),
      sendWelcomeWhatsApp: z.boolean().default(false),
    })

    const validatedData = schema.parse(body)

    // Check if phone already exists for CUSTOMER role
    const existingCustomer = await prisma.user.findFirst({
      where: {
        phone: validatedData.phone,
        role: 'CUSTOMER',
      },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Un client avec ce numéro de téléphone existe déjà' },
        { status: 400 }
      )
    }

    // Check if email+role already exists (if provided) - customers can have same email as admin
    if (validatedData.email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: validatedData.email, role: 'CUSTOMER' },
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Un client avec cet email existe déjà' },
          { status: 400 }
        )
      }
    }

    // Create customer with staff tracking
    const customer = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        whatsappNumber: validatedData.whatsappNumber || validatedData.phone,
        image: validatedData.image,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        howDidYouHearAboutUs: validatedData.howDidYouHearAboutUs,
        city: validatedData.city,
        country: validatedData.country,
        countryCode: validatedData.countryCode,
        role: 'CUSTOMER',
        phoneVerified: new Date(), // Admin created, so mark as verified
        createdAt: validatedData.inscriptionDate ? new Date(validatedData.inscriptionDate) : new Date(),
        // Staff tracking - who created this customer
        createdByStaffId: (session.user as any).id,
        createdByStaffName: (session.user as any).name || 'Admin',
      },
    })

    // Create loyalty points record
    await prisma.loyaltyPoints.create({
      data: {
        userId: customer.id,
        points: validatedData.initialPoints,
        totalEarned: validatedData.initialPoints,
        tier: validatedData.loyaltyTier,
      },
    })

    // Create customer note if provided
    if (validatedData.notes) {
      await prisma.customerNote.create({
        data: {
          customerId: customer.id,
          content: validatedData.notes,
          noteType: 'private',
          authorId: (session.user as any).id,
          authorName: (session.user as any).name || 'Admin',
        },
      })
    }

    // Create address if provided
    let createdAddress = null
    if (validatedData.address) {
      createdAddress = await prisma.address.create({
        data: {
          userId: customer.id,
          fullName: validatedData.address.fullName,
          phone: validatedData.address.phone,
          rue: validatedData.address.rue,
          quartier: validatedData.address.quartier,
          cite: validatedData.address.cite,
          city: validatedData.address.city,
          description: validatedData.address.description,
          addressLine1: validatedData.address.addressLine1,
          addressLine2: validatedData.address.addressLine2,
          country: validatedData.address.country,
          latitude: validatedData.address.latitude,
          longitude: validatedData.address.longitude,
          geoAccuracy: validatedData.address.geoAccuracy,
          geoSource: validatedData.address.geoSource,
          isDefault: validatedData.address.isDefault,
        },
      })
    }

    // Create measurements if provided
    let createdMeasurement = null
    if (validatedData.measurements && Object.keys(validatedData.measurements).length > 0) {
      const m = validatedData.measurements
      // Check if there are any actual measurement values (not just unit and date)
      const hasMeasurements = Object.entries(m).some(([key, value]) =>
        !['measurementDate', 'unit'].includes(key) && value !== null && value !== undefined && value !== ''
      )

      if (hasMeasurements) {
        createdMeasurement = await prisma.customerMeasurement.create({
          data: {
            customerId: customer.id,
            measurementDate: m.measurementDate ? new Date(m.measurementDate) : new Date(),
            unit: m.unit || 'cm',
            takenByStaffId: (session.user as any).id,
            takenByStaffName: (session.user as any).name || 'Admin',
            // Upper body (1-9)
            dos: m.dos || null,
            carrureDevant: m.carrureDevant || null,
            carrureDerriere: m.carrureDerriere || null,
            epaule: m.epaule || null,
            epauleManche: m.epauleManche || null,
            poitrine: m.poitrine || null,
            tourDeTaille: m.tourDeTaille || null,
            longueurDetaille: m.longueurDetaille || null,
            bassin: m.bassin || null,
            // 10. LONGUEUR DES MANCHES - 4 sub-fields
            longueurManchesCourtes: m.longueurManchesCourtes || null,
            longueurManchesAvantCoudes: m.longueurManchesAvantCoudes || null,
            longueurManchesNiveau34: m.longueurManchesNiveau34 || null,
            longueurManchesLongues: m.longueurManchesLongues || null,
            // Arms continued (11-12)
            tourDeManche: m.tourDeManche || null,
            poignets: m.poignets || null,
            // Torso (13-14)
            pinces: m.pinces || null,
            longueurTotale: m.longueurTotale || null,
            // 15. LONGUEUR DES ROBES - 6 sub-fields
            longueurRobesAvantGenoux: m.longueurRobesAvantGenoux || null,
            longueurRobesNiveauGenoux: m.longueurRobesNiveauGenoux || null,
            longueurRobesApresGenoux: m.longueurRobesApresGenoux || null,
            longueurRobesMiMollets: m.longueurRobesMiMollets || null,
            longueurRobesChevilles: m.longueurRobesChevilles || null,
            longueurRobesTresLongue: m.longueurRobesTresLongue || null,
            // Torso continued (16-17)
            longueurTunique: m.longueurTunique || null,
            ceinture: m.ceinture || null,
            // Lower body (18-21)
            longueurPantalon: m.longueurPantalon || null,
            frappe: m.frappe || null,
            cuisse: m.cuisse || null,
            genoux: m.genoux || null,
            // 22. LONGUEUR JUPE - 6 sub-fields
            longueurJupeAvantGenoux: m.longueurJupeAvantGenoux || null,
            longueurJupeNiveauGenoux: m.longueurJupeNiveauGenoux || null,
            longueurJupeApresGenoux: m.longueurJupeApresGenoux || null,
            longueurJupeMiMollets: m.longueurJupeMiMollets || null,
            longueurJupeChevilles: m.longueurJupeChevilles || null,
            longueurJupeTresLongue: m.longueurJupeTresLongue || null,
            // Notes
            autresMesures: m.autresMesures || null,
          },
        })
      }
    }

    // Send welcome notifications if requested (using database templates)
    const welcomeMessages: string[] = []

    if (validatedData.sendWelcomeSMS || validatedData.sendWelcomeWhatsApp) {
      try {
        await notificationService.sendNotification({
          trigger: 'NEW_ACCOUNT',
          recipientType: 'customer',
          data: {
            userId: customer.id,
            customer_name: validatedData.name,
            billing_phone: validatedData.phone,
            recipientPhone: validatedData.whatsappNumber || validatedData.phone,
          },
          sendBoth: validatedData.sendWelcomeSMS && validatedData.sendWelcomeWhatsApp,
        })
        welcomeMessages.push('Notification de bienvenue envoyée')
      } catch (error) {
        console.error('Error sending welcome notification:', error)
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        whatsappNumber: customer.whatsappNumber,
        image: customer.image,
        city: customer.city,
        country: customer.country,
        countryCode: customer.countryCode,
        createdAt: customer.createdAt,
      },
      address: createdAddress ? {
        id: createdAddress.id,
        city: createdAddress.city,
        quartier: createdAddress.quartier,
        isDefault: createdAddress.isDefault,
      } : null,
      welcomeMessages,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du client' },
      { status: 500 }
    )
  }
}
