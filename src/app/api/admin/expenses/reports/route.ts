import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Helper to get date range based on period
function getDateRange(period: string, startDate?: string, endDate?: string) {
  const now = new Date()
  let start: Date
  let end: Date = new Date(now)
  end.setHours(23, 59, 59, 999)

  switch (period) {
    case 'today':
      start = new Date(now)
      start.setHours(0, 0, 0, 0)
      break
    case 'yesterday':
      start = new Date(now)
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end = new Date(start)
      end.setHours(23, 59, 59, 999)
      break
    case 'week':
      start = new Date(now)
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      break
    case 'month':
      start = new Date(now)
      start.setMonth(start.getMonth() - 1)
      start.setHours(0, 0, 0, 0)
      break
    case 'year':
      start = new Date(now)
      start.setFullYear(start.getFullYear() - 1)
      start.setHours(0, 0, 0, 0)
      break
    case 'custom':
      if (startDate && endDate) {
        start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
      } else {
        start = new Date(now)
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
      }
      break
    default:
      start = new Date(now)
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
  }

  return { start, end }
}

// GET /api/admin/expenses/reports - Get expense reports and stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'finance.expenses')
    if (denied) return denied

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month'
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const { start, end } = getDateRange(period, startDate, endDate)

    // Base where clause for the period
    const periodWhere = {
      paymentDate: {
        gte: start,
        lte: end,
      },
    }

    const [
      totalExpenses,
      byCategory,
      byPaymentMethod,
      byStaff,
      byCreator,
      salaryByStaff,
      recentExpenses,
    ] = await Promise.all([
      // Total expenses for the period
      prisma.expense.aggregate({
        where: periodWhere,
        _sum: { amount: true },
        _count: true,
      }),

      // Expenses by category
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: periodWhere,
        _sum: { amount: true },
        _count: true,
        orderBy: {
          _sum: { amount: 'desc' },
        },
      }),

      // Expenses by payment method
      prisma.expense.groupBy({
        by: ['paymentMethod'],
        where: periodWhere,
        _sum: { amount: true },
        _count: true,
        orderBy: {
          _sum: { amount: 'desc' },
        },
      }),

      // Expenses by staff (for salaries)
      prisma.expense.groupBy({
        by: ['staffId'],
        where: {
          ...periodWhere,
          staffId: { not: null },
        },
        _sum: { amount: true },
        _count: true,
        orderBy: {
          _sum: { amount: 'desc' },
        },
      }),

      // Expenses by creator (who recorded)
      prisma.expense.groupBy({
        by: ['createdById'],
        where: {
          ...periodWhere,
          createdById: { not: null },
        },
        _sum: { amount: true },
        _count: true,
        orderBy: {
          _count: { createdById: 'desc' },
        },
        take: 10,
      }),

      // Get salary category expenses by staff member
      prisma.$queryRaw`
        SELECT
          u.id as "staffId",
          u.name as "staffName",
          u.role as "staffRole",
          COUNT(e.id)::int as count,
          SUM(e.amount) as "totalAmount"
        FROM "Expense" e
        JOIN "User" u ON e."staffId" = u.id
        JOIN "ExpenseCategory" ec ON e."categoryId" = ec.id
        WHERE e."paymentDate" >= ${start}
          AND e."paymentDate" <= ${end}
          AND ec.name LIKE '%Salaire%'
        GROUP BY u.id, u.name, u.role
        ORDER BY "totalAmount" DESC
      ` as Promise<any[]>,

      // Recent expenses
      prisma.expense.findMany({
        where: periodWhere,
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
          staff: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { paymentDate: 'desc' },
        take: 20,
      }),
    ])

    // Get category details — toutes les catégories (table courte), car un
    // parent sans dépense directe doit quand même apparaître si ses
    // sous-catégories en ont
    const categories = await prisma.expenseCategory.findMany({
      select: { id: true, name: true, icon: true, color: true, parentId: true },
    })
    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    // Roll-up hiérarchique : les montants des sous-catégories remontent dans
    // leur catégorie principale, avec le détail par enfant conservé
    type CategoryAgg = {
      category: { id: string; name: string; icon: string | null; color: string | null }
      count: number
      totalAmount: number
      children: { category: { id: string; name: string; icon: string | null; color: string | null }; count: number; totalAmount: number }[]
    }
    const rollup = new Map<string, CategoryAgg>()
    for (const c of byCategory) {
      const cat = categoryMap.get(c.categoryId)
      if (!cat) continue
      const parent = cat.parentId ? categoryMap.get(cat.parentId) : undefined
      const root = parent || cat
      let agg = rollup.get(root.id)
      if (!agg) {
        agg = {
          category: { id: root.id, name: root.name, icon: root.icon, color: root.color },
          count: 0,
          totalAmount: 0,
          children: [],
        }
        rollup.set(root.id, agg)
      }
      agg.count += c._count
      agg.totalAmount += c._sum.amount || 0
      if (parent) {
        agg.children.push({
          category: { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color },
          count: c._count,
          totalAmount: c._sum.amount || 0,
        })
      }
    }
    const byCategoryRolled = Array.from(rollup.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    )
    for (const agg of byCategoryRolled) {
      agg.children.sort((a, b) => b.totalAmount - a.totalAmount)
    }

    // Get staff details for salary expenses
    const staffIds = byStaff.map((s) => s.staffId).filter(Boolean) as string[]
    const staffMembers = await prisma.user.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, name: true, role: true },
    })
    const staffMap = new Map(staffMembers.map((s) => [s.id, s]))

    // Get creator details
    const creatorIds = byCreator.map((c) => c.createdById).filter(Boolean) as string[]
    const creators = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true, role: true },
    })
    const creatorMap = new Map(creators.map((c) => [c.id, c]))

    // Payment method labels
    const paymentMethodLabels: Record<string, string> = {
      CASH: 'Especes',
      BANK_TRANSFER: 'Virement',
      ORANGE_MONEY: 'Orange Money',
      MTN_MOMO: 'MTN MoMo',
      WAVE: 'Wave',
      CHECK: 'Cheque',
      CARD: 'Carte',
    }

    return NextResponse.json({
      success: true,
      period: {
        type: period,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalAmount: totalExpenses._sum.amount || 0,
        count: totalExpenses._count,
      },
      byCategory: byCategoryRolled,
      byPaymentMethod: byPaymentMethod.map((p) => ({
        method: p.paymentMethod,
        label: paymentMethodLabels[p.paymentMethod] || p.paymentMethod,
        count: p._count,
        totalAmount: p._sum.amount || 0,
      })),
      byStaff: byStaff.map((s) => ({
        staff: staffMap.get(s.staffId!),
        count: s._count,
        totalAmount: s._sum.amount || 0,
      })),
      byCreator: byCreator.map((c) => ({
        creator: creatorMap.get(c.createdById!),
        count: c._count,
        totalAmount: c._sum.amount || 0,
      })),
      salaryByStaff: salaryByStaff.map((s: any) => ({
        staffId: s.staffId,
        staffName: s.staffName,
        staffRole: s.staffRole,
        count: s.count,
        totalAmount: Number(s.totalAmount) || 0,
      })),
      recentExpenses,
    })
  } catch (error) {
    console.error('Error generating expense report:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
