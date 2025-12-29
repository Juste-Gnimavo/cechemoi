import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


// Force dynamic rendering for API routes using auth
export const dynamic = 'force-dynamic'

// GET /api/admin/team - List all team members (ADMIN, MANAGER, STAFF)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'MANAGER', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get all team members (not customers)
    const members = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'MANAGER', 'STAFF'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: [
        { role: 'asc' }, // ADMIN first, then MANAGER, then STAFF
        { createdAt: 'desc' },
      ],
    })

    // Calculate stats
    const stats = {
      total: members.length,
      admins: members.filter((m) => m.role === 'ADMIN').length,
      managers: members.filter((m) => m.role === 'MANAGER').length,
      staff: members.filter((m) => m.role === 'STAFF').length,
    }

    // Map lastLoginAt to lastLogin for frontend compatibility
    const membersWithLastLogin = members.map((member) => ({
      ...member,
      lastLogin: member.lastLoginAt,
      lastLoginAt: undefined, // Remove from response
    }))

    return NextResponse.json({
      success: true,
      members: membersWithLastLogin,
      stats,
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des membres' },
      { status: 500 }
    )
  }
}

// POST /api/admin/team - Create a new team member
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only ADMIN can create team members
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, phone, password, role } = body

    // Validation
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }

    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Check if email+role already exists (same email can have different roles)
    const existingUser = await prisma.user.findFirst({
      where: { email, role },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est deja utilise pour ce role' }, { status: 400 })
    }

    // Check if phone+role already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone_role: { phone, role } },
    })

    if (existingPhone) {
      return NextResponse.json({ error: 'Ce telephone est deja utilise pour ce role' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newMember = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        emailVerified: new Date(), // Admin users are pre-verified
        phoneVerified: new Date(),
      },
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
      member: newMember,
      message: 'Membre ajouté avec succès',
    })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du membre' },
      { status: 500 }
    )
  }
}
