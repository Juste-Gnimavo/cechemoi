import { prisma } from '@/lib/prisma'

/**
 * Fiche couturier : ce qui part au couturier quand l'équipe clique sur
 * « Informer le couturier ».
 *
 * RÈGLE : le couturier ne voit jamais un montant. La garantie est structurelle :
 *   1. chaque requête ci-dessous sélectionne ses champs explicitement (`select`),
 *      aucun champ monétaire n'y figure ;
 *   2. le type `TailorBrief` est vérifié à la compilation contre la liste des clés
 *      monétaires (`_noMonetaryKeys` plus bas) ;
 *   3. `assertNoMonetaryKeys` revérifie l'objet à l'exécution avant tout envoi.
 * Le texte WhatsApp et le PDF ne reçoivent QUE cet objet.
 *
 * Exclusions volontaires, au-delà des champs monétaires :
 *   - les notes générales de la commande (`CustomOrder.notes`), où l'équipe note
 *     parfois un acompte ou un prix : l'équipe écrit une note dédiée au couturier ;
 *   - les notes des mouvements de matières ;
 *   - les pièces jointes de catégorie « document » (devis, reçus…) : seules les
 *     photos, les vocaux et les vidéos du modèle partent ;
 *   - le téléphone et le nom de famille de la cliente (prénom seulement).
 */

export interface TailorBriefItem {
  id: string
  label: string
  quantity: number
  description: string | null
  notes: string | null
}

export interface TailorBriefMeasurement {
  label: string
  value: string
}

export interface TailorBriefAttachment {
  id: string
  name: string
  category: 'image' | 'audio' | 'video'
  fileUrl: string
  fileType: string
  description: string | null
}

export interface TailorBriefMaterial {
  name: string
  color: string | null
  quantity: number
  unit: string
}

export interface TailorBrief {
  orderId: string
  orderNumber: string
  customerFirstName: string
  priority: string
  orderDate: Date
  pickupDate: Date
  customerDeadline: Date | null
  tailor: {
    id: string
    name: string
    phone: string | null
  }
  items: TailorBriefItem[]
  measurements: {
    unit: string
    takenAt: Date
    values: TailorBriefMeasurement[]
    observations: string | null
  } | null
  attachments: TailorBriefAttachment[]
  materials: TailorBriefMaterial[]
  note: string | null
}

// ---------------------------------------------------------------------------
// Garde anti-montant
// ---------------------------------------------------------------------------

export const MONETARY_KEYS = [
  'price',
  'unitPrice',
  'totalCost',
  'materialCost',
  'cost',
  'amount',
  'amountPaid',
  'total',
  'subtotal',
  'deposit',
  'balance',
  'profit',
  'paid',
  'payments',
] as const

type MonetaryKey = (typeof MONETARY_KEYS)[number]

// Toutes les clés de T, à toute profondeur (tableaux et objets imbriqués).
type DeepKeys<T> = T extends Date
  ? never
  : T extends readonly (infer U)[]
    ? DeepKeys<U>
    : T extends object
      ? { [K in keyof T]-?: K | DeepKeys<T[K]> }[keyof T]
      : never

// Échoue à la compilation si une clé monétaire apparaît dans TailorBrief.
type AssertNever<T extends never> = T
type _noMonetaryKeys = AssertNever<Extract<DeepKeys<TailorBrief>, MonetaryKey>>

/** Revérifie à l'exécution qu'aucune clé monétaire ne figure dans l'objet. */
export function assertNoMonetaryKeys(value: unknown, path = 'brief'): void {
  if (value === null || typeof value !== 'object' || value instanceof Date) return
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoMonetaryKeys(v, `${path}[${i}]`))
    return
  }
  for (const [key, v] of Object.entries(value)) {
    if ((MONETARY_KEYS as readonly string[]).includes(key)) {
      throw new Error(`Fiche couturier : clé monétaire interdite « ${path}.${key} »`)
    }
    assertNoMonetaryKeys(v, `${path}.${key}`)
  }
}

// ---------------------------------------------------------------------------
// Mesures
// ---------------------------------------------------------------------------

const MEASUREMENT_FIELDS = [
  ['dos', 'Dos'],
  ['carrureDevant', 'Carrure devant'],
  ['carrureDerriere', 'Carrure derrière'],
  ['epaule', 'Épaule'],
  ['epauleManche', 'Épaule manche'],
  ['poitrine', 'Poitrine'],
  ['tourDeTaille', 'Tour de taille'],
  ['longueurDetaille', 'Longueur de taille'],
  ['bassin', 'Bassin'],
  ['longueurManchesCourtes', 'Manches courtes'],
  ['longueurManchesAvantCoudes', 'Manches avant les coudes'],
  ['longueurManchesNiveau34', 'Manches 3/4'],
  ['longueurManchesLongues', 'Manches longues'],
  ['longueurManches', 'Longueur des manches'],
  ['tourDeManche', 'Tour de manche'],
  ['poignets', 'Poignets'],
  ['pinces', 'Pinces'],
  ['longueurTotale', 'Longueur totale'],
  ['longueurRobesAvantGenoux', 'Robe avant les genoux'],
  ['longueurRobesNiveauGenoux', 'Robe au genou'],
  ['longueurRobesApresGenoux', 'Robe après le genou'],
  ['longueurRobesMiMollets', 'Robe mi-mollet'],
  ['longueurRobesChevilles', 'Robe aux chevilles'],
  ['longueurRobesTresLongue', 'Robe très longue'],
  ['longueurRobes', 'Longueur des robes'],
  ['longueurTunique', 'Longueur tunique'],
  ['ceinture', 'Ceinture'],
  ['longueurPantalon', 'Longueur pantalon'],
  ['frappe', 'Frappe'],
  ['cuisse', 'Cuisse'],
  ['genoux', 'Genoux'],
  ['longueurJupeAvantGenoux', 'Jupe avant les genoux'],
  ['longueurJupeNiveauGenoux', 'Jupe au genou'],
  ['longueurJupeApresGenoux', 'Jupe après le genou'],
  ['longueurJupeMiMollets', 'Jupe mi-mollet'],
  ['longueurJupeChevilles', 'Jupe aux chevilles'],
  ['longueurJupeTresLongue', 'Jupe très longue'],
  ['longueurJupe', 'Longueur jupe'],
] as const

type MeasurementField = (typeof MEASUREMENT_FIELDS)[number][0]

const measurementSelect = Object.fromEntries(
  MEASUREMENT_FIELDS.map(([field]) => [field, true])
) as Record<MeasurementField, true>

// ---------------------------------------------------------------------------
// Constructeur
// ---------------------------------------------------------------------------

export class TailorBriefError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

function firstName(fullName: string | null): string {
  const first = (fullName || '').trim().split(/\s+/)[0]
  return first || 'Cliente'
}

/**
 * Construit la fiche d'un couturier pour une commande sur mesure : uniquement
 * les articles qui lui sont assignés. Lève `TailorBriefError` si la commande
 * n'existe pas ou si aucun article ne lui est assigné.
 */
export async function buildTailorBrief(
  customOrderId: string,
  tailorId: string,
  note?: string | null
): Promise<TailorBrief> {
  const order = await prisma.customOrder.findUnique({
    where: { id: customOrderId },
    select: {
      id: true,
      orderNumber: true,
      priority: true,
      orderDate: true,
      pickupDate: true,
      customerDeadline: true,
      customer: { select: { name: true } },
      measurement: {
        select: {
          unit: true,
          measurementDate: true,
          autresMesures: true,
          ...measurementSelect,
        },
      },
      items: {
        where: { tailorId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          garmentType: true,
          customType: true,
          quantity: true,
          description: true,
          notes: true,
        },
      },
      attachments: {
        where: { category: { in: ['image', 'audio', 'video'] } },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          originalName: true,
          category: true,
          fileUrl: true,
          fileType: true,
          description: true,
        },
      },
    },
  })

  if (!order) throw new TailorBriefError('Commande non trouvée', 404)

  const tailor = await prisma.user.findFirst({
    where: { id: tailorId, role: 'TAILOR' },
    select: { id: true, name: true, phone: true, whatsappNumber: true },
  })
  if (!tailor) throw new TailorBriefError('Couturier introuvable', 404)

  if (order.items.length === 0) {
    throw new TailorBriefError("Aucun article de cette commande n'est assigné à ce couturier", 400)
  }

  const itemIds = order.items.map((i) => i.id)
  const movements = await prisma.materialMovement.findMany({
    where: {
      customOrderId,
      type: 'OUT',
      OR: [{ tailorId }, { customOrderItemId: { in: itemIds } }],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      quantity: true,
      material: { select: { name: true, unit: true, color: true } },
    },
  })

  // Une ligne par matière, quantités cumulées.
  const materialsByKey = new Map<string, TailorBriefMaterial>()
  for (const m of movements) {
    const key = `${m.material.name}|${m.material.color ?? ''}|${m.material.unit}`
    const existing = materialsByKey.get(key)
    if (existing) existing.quantity += m.quantity
    else
      materialsByKey.set(key, {
        name: m.material.name,
        color: m.material.color,
        quantity: m.quantity,
        unit: m.material.unit,
      })
  }

  const measurement = order.measurement
  const measurementValues: TailorBriefMeasurement[] = measurement
    ? MEASUREMENT_FIELDS.flatMap(([field, label]) => {
        const value = measurement[field]?.trim()
        return value ? [{ label, value }] : []
      })
    : []

  const brief: TailorBrief = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerFirstName: firstName(order.customer.name),
    priority: order.priority,
    orderDate: order.orderDate,
    pickupDate: order.pickupDate,
    customerDeadline: order.customerDeadline,
    tailor: {
      id: tailor.id,
      name: tailor.name || 'Couturier',
      phone: tailor.whatsappNumber?.trim() || tailor.phone?.trim() || null,
    },
    items: order.items.map((item) => ({
      id: item.id,
      label:
        item.garmentType === 'Autre' && item.customType ? item.customType : item.garmentType,
      quantity: item.quantity,
      description: item.description,
      notes: item.notes,
    })),
    measurements: measurement
      ? {
          unit: measurement.unit,
          takenAt: measurement.measurementDate,
          values: measurementValues,
          observations: measurement.autresMesures,
        }
      : null,
    attachments: order.attachments.map((a) => ({
      id: a.id,
      name: a.originalName,
      category: a.category as TailorBriefAttachment['category'],
      fileUrl: a.fileUrl,
      fileType: a.fileType,
      description: a.description,
    })),
    materials: Array.from(materialsByKey.values()),
    note: note?.trim() || null,
  }

  assertNoMonetaryKeys(brief)
  return brief
}

// ---------------------------------------------------------------------------
// Message WhatsApp
// ---------------------------------------------------------------------------

const PRIORITY_LABELS: Record<string, string> = {
  NORMAL: 'Normale',
  URGENT: 'Urgente',
  VIP: 'VIP (rush)',
}

export function formatBriefDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Africa/Abidjan',
  })
}

/** Texte exact du message WhatsApp, construit depuis la fiche seule. */
export function buildTailorBriefMessage(brief: TailorBrief): string {
  const shown = brief.items.slice(0, 3)
  const rest = brief.items.length - shown.length

  const lines = [
    `Bonjour ${brief.tailor.name},`,
    '',
    `*Commande ${brief.orderNumber}* — cliente ${brief.customerFirstName}`,
    ...shown.map((i) => `• ${i.label} ×${i.quantity}`),
  ]
  if (rest > 0) lines.push(`• et ${rest} autre${rest > 1 ? 's' : ''} article${rest > 1 ? 's' : ''}`)

  lines.push('', `*Retrait prévu le ${formatBriefDate(brief.pickupDate)}*`)
  if (brief.priority !== 'NORMAL') {
    lines.push(`Priorité : ${PRIORITY_LABELS[brief.priority] ?? brief.priority}`)
  }
  if (brief.note) lines.push('', brief.note)
  lines.push('', 'Mesures, photos du modèle et matières : voir la fiche jointe.', '— CÈCHÉMOI')

  return lines.join('\n')
}

export const PRIORITY_LABEL_FR = PRIORITY_LABELS
