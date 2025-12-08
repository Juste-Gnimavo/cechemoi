import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'
import { z } from 'zod'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

const createAddressSchema = z.object({
  fullName: z.string().min(1, 'Le nom complet est requis'),
  phone: z.string().min(1, 'Le numéro de téléphone est requis'),
  addressLine1: z.string().min(1, "L'adresse est requise"),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, 'La ville est requise'),
  country: z.string().min(1, 'Le pays est requis'),
  postalCode: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  geoAccuracy: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
})

// Helper to map database fields to frontend expected format
function mapAddressResponse(address: any) {
  return {
    ...address,
    postalCode: address.zipCode, // Map zipCode to postalCode for frontend
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Map addresses to include postalCode (from zipCode)
    const mappedAddresses = addresses.map(mapAddressResponse)

    return NextResponse.json({ addresses: mappedAddresses })
  } catch (error) {
    console.error('Addresses fetch error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()

    const validation = createAddressSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const {
      fullName, phone, addressLine1, addressLine2, city, country,
      postalCode, latitude, longitude, geoAccuracy, isDefault
    } = validation.data

    // If this is being set as default, unset all other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId,
        fullName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        country,
        zipCode: postalCode || null,
        latitude: latitude || null,
        longitude: longitude || null,
        geoAccuracy: geoAccuracy || null,
        geoSource: latitude ? 'browser' : null,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ address: mapAddressResponse(address) }, { status: 201 })
  } catch (error) {
    console.error('Address creation error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
