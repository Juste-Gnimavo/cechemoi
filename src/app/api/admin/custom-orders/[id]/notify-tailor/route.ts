import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomBytes } from 'crypto'
import { authOptions } from '@/lib/auth-phone'
import { denyUnlessPermitted, unauthenticated, type AdminSessionUser } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'
import { smsingService } from '@/lib/smsing-service'
import { getBaseUrl } from '@/lib/utils'
import {
  TailorBriefError,
  buildTailorBrief,
  buildTailorBriefMessage,
} from '@/lib/tailor-brief'

export const dynamic = 'force-dynamic'

const MAX_NOTE_LENGTH = 1000

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof TailorBriefError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error(fallback, error)
  return NextResponse.json({ error: fallback }, { status: 500 })
}

function itemLabel(item: { garmentType: string; customType: string | null }) {
  return item.garmentType === 'Autre' && item.customType ? item.customType : item.garmentType
}

/** URL publique du PDF : jeton aléatoire, nom de fichier lisible dans WhatsApp. */
function tailorBriefPdfUrl(token: string, orderNumber: string) {
  const file = `fiche-couturier-${orderNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`
  return `${getBaseUrl()}/api/fiche-couturier/${token}/${file}`
}

/**
 * GET /api/admin/custom-orders/[id]/notify-tailor
 *   sans paramètre : couturiers concernés, articles non assignés, derniers envois ;
 *   ?tailorId=…&note=… : aperçu exact (numéro, texte du message, contenu de la fiche).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'production')
    if (denied) return denied

    const tailorId = req.nextUrl.searchParams.get('tailorId')

    if (tailorId) {
      const note = (req.nextUrl.searchParams.get('note') || '').slice(0, MAX_NOTE_LENGTH)
      const brief = await buildTailorBrief(params.id, tailorId, note)
      return NextResponse.json({
        phone: brief.tailor.phone,
        message: buildTailorBriefMessage(brief),
        items: brief.items.map((i) => ({ label: i.label, quantity: i.quantity })),
        measurementCount: brief.measurements?.values.length ?? 0,
        materials: brief.materials,
        attachments: brief.attachments.map((a) => ({
          name: a.name,
          category: a.category,
          description: a.description,
        })),
      })
    }

    const order = await prisma.customOrder.findUnique({
      where: { id: params.id },
      select: {
        items: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            garmentType: true,
            customType: true,
            tailor: { select: { id: true, name: true, phone: true, whatsappNumber: true } },
          },
        },
        tailorBriefShares: {
          orderBy: { sentAt: 'desc' },
          select: { id: true, tailorId: true, sentAt: true, sentByName: true, revokedAt: true },
        },
      },
    })
    if (!order) return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })

    const tailors = new Map<
      string,
      {
        id: string
        name: string
        phone: string | null
        itemCount: number
        lastSentAt: Date | null
        lastSentBy: string | null
        activeShareId: string | null
      }
    >()
    for (const item of order.items) {
      if (!item.tailor) continue
      const existing = tailors.get(item.tailor.id)
      if (existing) {
        existing.itemCount++
        continue
      }
      const shares = order.tailorBriefShares.filter((s) => s.tailorId === item.tailor!.id)
      tailors.set(item.tailor.id, {
        id: item.tailor.id,
        name: item.tailor.name || 'Couturier',
        phone: item.tailor.whatsappNumber?.trim() || item.tailor.phone?.trim() || null,
        itemCount: 1,
        lastSentAt: shares[0]?.sentAt ?? null,
        lastSentBy: shares[0]?.sentByName ?? null,
        activeShareId: shares.find((s) => !s.revokedAt)?.id ?? null,
      })
    }

    return NextResponse.json({
      tailors: Array.from(tailors.values()),
      unassignedItems: order.items
        .filter((i) => !i.tailor)
        .map((i) => ({ id: i.id, label: itemLabel(i) })),
      lastSentAt: order.tailorBriefShares[0]?.sentAt ?? null,
    })
  } catch (error) {
    return errorResponse(error, "Erreur lors de la préparation de l'envoi au couturier")
  }
}

/**
 * POST /api/admin/custom-orders/[id]/notify-tailor  { tailorId, note? }
 * Envoie la fiche du couturier par WhatsApp (texte + PDF à jeton). Un renvoi
 * révoque les liens précédents de ce couturier pour cette commande.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'production')
    if (denied) return denied
    const user = session.user as AdminSessionUser

    const body = await req.json().catch(() => ({}))
    const tailorId = typeof body.tailorId === 'string' ? body.tailorId : ''
    const note =
      typeof body.note === 'string' ? body.note.trim().slice(0, MAX_NOTE_LENGTH) || null : null
    if (!tailorId) {
      return NextResponse.json({ error: 'Couturier non précisé' }, { status: 400 })
    }

    const brief = await buildTailorBrief(params.id, tailorId, note)
    if (!brief.tailor.phone) {
      return NextResponse.json(
        {
          error: `${brief.tailor.name} n'a aucun numéro WhatsApp ni téléphone. Renseignez-le dans la fiche du couturier.`,
        },
        { status: 400 }
      )
    }

    const share = await prisma.tailorBriefShare.create({
      data: {
        token: randomBytes(24).toString('base64url'),
        customOrderId: params.id,
        tailorId,
        note,
        phone: brief.tailor.phone,
        sentById: user.id,
        sentByName: user.name ?? null,
      },
    })

    const result = await smsingService.sendWhatsAppBusiness({
      to: brief.tailor.phone,
      message: buildTailorBriefMessage(brief),
      mediaUrl: tailorBriefPdfUrl(share.token, brief.orderNumber),
    })

    if (!result.success) {
      await prisma.tailorBriefShare.delete({ where: { id: share.id } })
      return NextResponse.json(
        {
          error: `L'envoi WhatsApp a échoué (${result.error || 'service indisponible'}). Rien n'est parti ; réessayez plus tard.`,
        },
        { status: 502 }
      )
    }

    // Un seul lien actif par couturier et par commande : le plus récent.
    await prisma.$transaction([
      prisma.tailorBriefShare.updateMany({
        where: {
          customOrderId: params.id,
          tailorId,
          revokedAt: null,
          id: { not: share.id },
        },
        data: { revokedAt: new Date() },
      }),
      prisma.customOrderTimeline.create({
        data: {
          customOrderId: params.id,
          event: `Couturier informé : ${brief.tailor.name}`,
          description: `Fiche couturier envoyée par WhatsApp au ${brief.tailor.phone} (${brief.items.length} article${brief.items.length > 1 ? 's' : ''}).${note ? `\nNote : ${note}` : ''}`,
          userId: user.id,
          userName: user.name ?? null,
        },
      }),
    ])

    return NextResponse.json({ success: true, sentAt: share.sentAt })
  } catch (error) {
    return errorResponse(error, "Erreur lors de l'envoi au couturier")
  }
}

/**
 * DELETE /api/admin/custom-orders/[id]/notify-tailor?tailorId=…
 * Révoque le lien actif de la fiche de ce couturier : le PDF devient inaccessible.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthenticated()
    const denied = denyUnlessPermitted(session, 'production')
    if (denied) return denied
    const user = session.user as AdminSessionUser

    const tailorId = req.nextUrl.searchParams.get('tailorId')
    if (!tailorId) {
      return NextResponse.json({ error: 'Couturier non précisé' }, { status: 400 })
    }

    const tailor = await prisma.user.findUnique({ where: { id: tailorId }, select: { name: true } })
    const { count } = await prisma.tailorBriefShare.updateMany({
      where: { customOrderId: params.id, tailorId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    if (count === 0) {
      return NextResponse.json({ error: 'Aucun lien actif pour ce couturier' }, { status: 404 })
    }

    await prisma.customOrderTimeline.create({
      data: {
        customOrderId: params.id,
        event: `Lien de la fiche couturier révoqué : ${tailor?.name || 'couturier'}`,
        description: 'Le PDF envoyé par WhatsApp ne s\'ouvre plus.',
        userId: user.id,
        userName: user.name ?? null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, 'Erreur lors de la révocation du lien')
  }
}
