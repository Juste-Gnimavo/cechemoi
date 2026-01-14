import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/admin/customers/import - Import customers from text
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { customers } = body // Array of { firstName, lastName, phone, email? }

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ error: 'Aucun client à importer' }, { status: 400 })
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const customer of customers) {
      try {
        // Validate required fields
        if (!customer.firstName || !customer.phone) {
          results.errors.push(`Ligne ignorée: prénom et téléphone requis`)
          results.skipped++
          continue
        }

        // Normalize phone number
        let phone = customer.phone.toString().trim()
        // Remove spaces, dashes, dots
        phone = phone.replace(/[\s\-\.]/g, '')
        // Add country code if not present
        if (!phone.startsWith('+')) {
          if (phone.startsWith('00')) {
            phone = '+' + phone.slice(2)
          } else if (phone.startsWith('0')) {
            phone = '+225' + phone.slice(1) // Default to Ivory Coast
          } else {
            phone = '+225' + phone
          }
        }

        // Check if phone already exists
        const existingCustomer = await prisma.user.findFirst({
          where: {
            OR: [
              { phone },
              { whatsappNumber: phone },
            ],
          },
        })

        if (existingCustomer) {
          results.errors.push(`${customer.firstName} ${customer.lastName || ''}: téléphone ${phone} existe déjà`)
          results.skipped++
          continue
        }

        // Create customer
        const fullName = customer.lastName
          ? `${customer.firstName.trim()} ${customer.lastName.trim()}`
          : customer.firstName.trim()

        await prisma.user.create({
          data: {
            name: fullName,
            phone,
            whatsappNumber: phone,
            email: customer.email || null,
            role: 'CUSTOMER',
            createdByStaffId: (session.user as any).id,
            createdByStaffName: (session.user as any).name,
          },
        })

        results.created++
      } catch (error: any) {
        results.errors.push(`Erreur pour ${customer.firstName}: ${error.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Error importing customers:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
