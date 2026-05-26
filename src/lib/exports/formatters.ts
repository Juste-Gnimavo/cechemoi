// Formatters partagés pour les exports comptables (Excel + PDF)

export function formatXOF(amount: number | null | undefined): string {
  if (amount == null) return '0 F CFA'
  const rounded = Math.round(amount)
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(rounded)
  return `${formatted} F CFA`
}

export function formatNumberFR(amount: number | null | undefined): string {
  if (amount == null) return '0'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(
    Math.round(amount)
  )
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

export function formatDateFR(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

export function formatDateTimeFR(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  return `${formatDateFR(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function periodLabel(start: Date, end: Date): string {
  return `du ${formatDateFR(start)} au ${formatDateFR(end)}`
}

// Libellés français pour les enums

export function labelPaymentMethod(m: string | null | undefined): string {
  if (!m) return '—'
  const map: Record<string, string> = {
    STRIPE: 'Stripe',
    WAVE: 'Wave',
    ORANGE_MONEY: 'Orange Money',
    MTN_MOBILE_MONEY: 'MTN Mobile Money',
    MTN_MOMO: 'MTN MoMo',
    CASH_ON_DELIVERY: 'Paiement à la livraison',
    PAIEMENTPRO: 'PaiementPro',
    CASH: 'Espèces',
    BANK_TRANSFER: 'Virement bancaire',
    CHECK: 'Chèque',
    CARD: 'Carte bancaire',
    OTHER: 'Autre',
  }
  return map[m] || m
}

export function labelChannel(c: string | null | undefined): string {
  if (!c) return '—'
  const map: Record<string, string> = {
    OMCIV2: 'Orange Money',
    MOMOCI: 'MTN MoMo',
    FLOOZ: 'Flooz',
    WAVECI: 'Wave',
    CARD: 'Carte',
    PAYPAL: 'PayPal',
  }
  return map[c] || c
}

export function labelOrderStatus(s: string | null | undefined): string {
  if (!s) return '—'
  const map: Record<string, string> = {
    PENDING: 'En attente',
    PROCESSING: 'En traitement',
    SHIPPED: 'Expédiée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
    REFUNDED: 'Remboursée',
  }
  return map[s] || s
}

export function labelPaymentStatus(s: string | null | undefined): string {
  if (!s) return '—'
  const map: Record<string, string> = {
    PENDING: 'En attente',
    COMPLETED: 'Encaissé',
    FAILED: 'Échec',
    REFUNDED: 'Remboursé',
  }
  return map[s] || s
}

export function labelCustomOrderStatus(s: string | null | undefined): string {
  if (!s) return '—'
  const map: Record<string, string> = {
    PENDING: 'En attente',
    IN_PRODUCTION: 'En production',
    FITTING: 'Essayage',
    ALTERATIONS: 'Retouches',
    READY: 'Prêt',
    DELIVERED: 'Livré',
    CANCELLED: 'Annulé',
  }
  return map[s] || s
}

export function labelInvoiceStatus(s: string | null | undefined): string {
  if (!s) return '—'
  const map: Record<string, string> = {
    DRAFT: 'Brouillon',
    SENT: 'Envoyée',
    PARTIAL: 'Partiellement payée',
    PAID: 'Payée',
    OVERDUE: 'En retard',
    CANCELLED: 'Annulée',
    REFUNDED: 'Remboursée',
    ISSUED: 'Émise',
  }
  return map[s] || s
}

export function labelInvoiceSource(invoice: { orderId?: string | null; customOrderId?: string | null }): string {
  if (invoice.orderId) return 'En ligne'
  if (invoice.customOrderId) return 'Sur mesure'
  return 'Autonome'
}

export function labelCustomPaymentType(t: string | null | undefined): string {
  if (!t) return '—'
  const map: Record<string, string> = {
    DEPOSIT: 'Avance',
    INSTALLMENT: 'Acompte',
    FINAL: 'Solde',
  }
  return map[t] || t
}

export function labelTransactionSource(s: string): string {
  const map: Record<string, string> = {
    online: 'Vente en ligne',
    custom: 'Commande sur mesure',
    invoice: 'Facture',
    standalone: 'Paiement autonome',
  }
  return map[s] || s
}

// Helper de plage de dates (réutilisé entre routes)
export function resolveDateRange(
  period: string | null | undefined,
  startDate?: string | null,
  endDate?: string | null
): { start: Date; end: Date; period: string } {
  const now = new Date()
  let start = new Date(now)
  let end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const p = period || 'month'

  switch (p) {
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
  return { start, end, period: p }
}
