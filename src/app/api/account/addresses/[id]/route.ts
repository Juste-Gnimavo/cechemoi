import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth-helper'
import { z } from 'zod'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

const updateAddressSchema = z.object({
  fullName: z.string().min(1, 'Le nom complet est requis').optional(),
  phone: z.string().min(1, 'Le numéro de téléphone est requis').optional(),
  addressLine1: z.string().min(1, "L'adresse est requise").optional(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, 'La ville est requise').optional(),
  country: z.string().min(1, 'Le pays est requis').optional(),
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const body = await req.json()

    const validation = updateAddressSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: 'Adresse non trouvée' }, { status: 404 })
    }

    const {
      fullName, phone, addressLine1, addressLine2, city, country,
      postalCode, latitude, longitude, geoAccuracy, isDefault
    } = validation.data

    // If this is being set as default, unset all other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      })
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(addressLine1 && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(city && { city }),
        ...(country && { country }),
        ...(postalCode !== undefined && { zipCode: postalCode }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(geoAccuracy !== undefined && { geoAccuracy }),
        ...(latitude !== undefined && { geoSource: latitude ? 'browser' : null }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json({ address: mapAddressResponse(updatedAddress) })
  } catch (error) {
    console.error('Address update error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: 'Adresse non trouvée' }, { status: 404 })
    }

    // Delete the address
    await prisma.address.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Address deletion error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
