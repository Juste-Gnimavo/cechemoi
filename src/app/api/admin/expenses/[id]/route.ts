import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, sessionCan, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/expenses/[id] - Get single expense
/**
 * Sans le droit de vue complète, on n'accède qu'à ses propres écritures : une
 * dépense saisie par quelqu'un d'autre — un salaire, notamment — reste invisible.
 * On renvoie 404 et non 403, pour ne pas confirmer l'existence de la dépense.
 */
function forbidsOthersExpense(
  session: { user?: unknown } | null,
  expense: { createdById: string | null }
): boolean {
  if (sessionCan(session, 'finance.expenses')) return false
  const userId = (session?.user as { id?: string } | undefined)?.id
  return !userId || expense.createdById !== userId
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'finance.expenses.create')
    if (denied) return denied

    const { id } = await params

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!expense || forbidsOthersExpense(session, expense)) {
      return NextResponse.json({ error: 'Dépense non trouvée' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      expense,
    })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/admin/expenses/[id] - Update expense
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'finance.expenses.create')
    if (denied) return denied

    const { id } = await params
    const body = await req.json()
    const {
      categoryId,
      description,
      amount,
      paymentMethod,
      paymentDate,
      reference,
      staffId,
      attachmentUrl,
      notes,
    } = body

    // Check if expense exists
    const existing = await prisma.expense.findUnique({
      where: { id },
    })

    if (!existing || forbidsOthersExpense(session, existing)) {
      return NextResponse.json({ error: 'Dépense non trouvée' }, { status: 404 })
    }

    // Check if category exists if provided
    if (categoryId) {
      const category = await prisma.expenseCategory.findUnique({
        where: { id: categoryId },
      })
      if (!category) {
        return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
      }
    }

    // Check if staff exists if provided
    if (staffId) {
      const staff = await prisma.user.findUnique({
        where: { id: staffId },
      })
      if (!staff) {
        return NextResponse.json({ error: 'Membre du personnel non trouvé' }, { status: 404 })
      }
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        categoryId: categoryId || existing.categoryId,
        description: description !== undefined ? description : existing.description,
        amount: amount !== undefined ? amount : existing.amount,
        paymentMethod: paymentMethod || existing.paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
        reference: reference !== undefined ? reference : existing.reference,
        staffId: staffId !== undefined ? staffId : existing.staffId,
        attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existing.attachmentUrl,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      expense,
      message: 'Dépense mise à jour',
    })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/admin/expenses/[id] - Delete expense
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'finance.expenses')
    if (denied) return denied

    const { id } = await params

    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Dépense non trouvée' }, { status: 404 })
    }

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Dépense supprimée',
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
