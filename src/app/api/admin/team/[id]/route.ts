import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/team/[id] - Get a team member
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const member = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        metadata: true,
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
    }

    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(member.role)) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      member,
    })
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du membre' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/team/[id] - Update a team member
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN can update team members
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, phone, password, role } = body

    // Validation
    if (!name || !email || !phone || !role) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // Check if member exists
    const existingMember = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingMember) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
    }

    // Check if email+role is taken by another user
    if (email !== existingMember.email || role !== existingMember.role) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email,
          role,
          id: { not: params.id }, // Exclude current user
        },
      })

      if (emailTaken) {
        return NextResponse.json({ error: 'Cet email est deja utilise pour ce role' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      phone,
      role,
    }

    // Update password if provided
    if (password && password.trim()) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Le mot de passe doit contenir au moins 8 caractères' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update member
    const updatedMember = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: 'Membre mis à jour avec succès',
    })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du membre' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/team/[id] - Delete a team member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN can delete team members
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    // Check if member exists
    const member = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!member) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
    }

    // Prevent deleting yourself
    if (member.id === (session.user as any).id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    // Delete member
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Membre supprimé avec succès',
    })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du membre' },
      { status: 500 }
    )
  }
}
