/**
 * Modes de paiement des commandes sur mesure.
 * Sans dépendance à Prisma : importable côté client comme côté serveur.
 *
 * CustomOrderPayment.paymentMethod est un texte libre ; on y stocke désormais
 * le code (WAVE, CASH…). Les anciens enregistrements contiennent le libellé
 * (« Wave », « Espèces »), d'où la table de normalisation ci-dessous.
 */

export const CUSTOM_ORDER_PAYMENT_METHODS = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'MTN_MOBILE_MONEY', label: 'MTN MoMo' },
  { value: 'WAVE', label: 'Wave' },
  { value: 'CARD', label: 'Carte bancaire' },
  { value: 'BANK_TRANSFER', label: 'Virement' },
  { value: 'CHECK', label: 'Chèque' },
  { value: 'OTHER', label: 'Autre' },
] as const

const LEGACY_LABELS: Record<string, string> = {
  'espèces': 'CASH',
  'especes': 'CASH',
  'orange money': 'ORANGE_MONEY',
  'mtn momo': 'MTN_MOBILE_MONEY',
  'wave': 'WAVE',
  'carte': 'CARD',
  'carte bancaire': 'CARD',
  'virement': 'BANK_TRANSFER',
  'virement bancaire': 'BANK_TRANSFER',
  'chèque': 'CHECK',
  'cheque': 'CHECK',
  'autre': 'OTHER',
}

/** Code canonique (WAVE, CASH…) depuis un code ou un ancien libellé ; null si inconnu ou vide. */
export function normalizePaymentMethod(method: string | null | undefined): string | null {
  if (!method) return null
  const trimmed = method.trim()
  if (CUSTOM_ORDER_PAYMENT_METHODS.some((m) => m.value === trimmed)) return trimmed
  return LEGACY_LABELS[trimmed.toLowerCase()] ?? null
}

/** Libellé français d'un code ou d'un ancien libellé ; la valeur brute sinon. */
export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return ''
  const code = normalizePaymentMethod(method)
  return CUSTOM_ORDER_PAYMENT_METHODS.find((m) => m.value === code)?.label ?? method
}
