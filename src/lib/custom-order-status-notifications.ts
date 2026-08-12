// Notifications automatiques sur changement de statut d'une commande sur
// mesure (voir messages/04) : la cliente est prévenue à chaque étape de la
// confection, la propriétaire reçoit une copie de suivi.
//
// Envoi DIRECT via le proxy smsing (SMS + WhatsApp Baileys) — volontairement
// sans le système de templates en base (jamais seedé) et sans WhatsApp Cloud
// (aucun template approuvé chez Meta).

import { prisma } from './prisma'
import { smsingService } from './smsing-service'
import { getOwnerContact } from './owner-contact'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  IN_PRODUCTION: 'En production',
  FITTING: 'Essayage',
  ALTERATIONS: 'Retouches',
  READY: 'Prêt',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
}

// Messages clientes par statut — null : pas de notification cliente
function customerMessage(
  status: string,
  customerName: string,
  orderNumber: string
): string | null {
  const name = customerName || 'chère cliente'
  switch (status) {
    case 'IN_PRODUCTION':
      return `Bonjour ${name}, votre commande ${orderNumber} est maintenant en confection dans notre atelier. Nous vous tiendrons informée à chaque étape. — CÈCHÉMOI`
    case 'FITTING':
      return `Bonjour ${name}, votre tenue (commande ${orderNumber}) est prête pour l'essayage. Merci de passer à la boutique. — CÈCHÉMOI`
    case 'ALTERATIONS':
      return `Bonjour ${name}, suite à l'essayage, des retouches sont en cours sur votre tenue (commande ${orderNumber}). Nous vous prévenons dès qu'elle est prête. — CÈCHÉMOI`
    case 'READY':
      return `Bonjour ${name}, bonne nouvelle : votre tenue (commande ${orderNumber}) est prête ! Vous pouvez passer la récupérer à la boutique. — CÈCHÉMOI`
    case 'DELIVERED':
      return `Bonjour ${name}, votre commande ${orderNumber} a été livrée. Merci pour votre confiance, à très bientôt ! — CÈCHÉMOI`
    default:
      return null
  }
}

export async function notifyCustomOrderStatusChange(params: {
  customOrderId: string
  previousStatus: string
  newStatus: string
  changedByName?: string
}): Promise<void> {
  const { customOrderId, previousStatus, newStatus, changedByName } = params
  if (previousStatus === newStatus) return

  const order = await prisma.customOrder.findUnique({
    where: { id: customOrderId },
    select: {
      orderNumber: true,
      customer: { select: { name: true, phone: true, whatsappNumber: true } },
    },
  })
  if (!order) return

  const customerName = order.customer?.name || ''
  const customerPhone = order.customer?.whatsappNumber || order.customer?.phone

  // 1. Notification cliente (SMS + WhatsApp via proxy Baileys)
  const message = customerMessage(newStatus, customerName, order.orderNumber)
  if (message && customerPhone) {
    try {
      await smsingService.sendDual({ to: customerPhone, message })
    } catch (error) {
      console.error(
        `Notification cliente échouée (${order.orderNumber} → ${newStatus}):`,
        error
      )
    }
  }

  // 2. Copie de suivi à la propriétaire (WhatsApp uniquement — volume faible)
  const owner = getOwnerContact()
  if (owner.phone) {
    const ownerMessage =
      `Suivi atelier : ${order.orderNumber} (${customerName || 'client'}) ` +
      `est passée de « ${STATUS_LABELS[previousStatus] || previousStatus} » à ` +
      `« ${STATUS_LABELS[newStatus] || newStatus} »` +
      (changedByName ? ` par ${changedByName}.` : '.')
    try {
      await smsingService.sendWhatsAppBusiness({ to: owner.phone, message: ownerMessage })
    } catch (error) {
      console.error('Notification propriétaire échouée:', error)
    }
  }
}
