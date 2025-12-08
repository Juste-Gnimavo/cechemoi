/**
 * Seed Standalone Payment Notification Templates
 *
 * Run with: npx tsx prisma/seed-standalone-notifications.ts
 *
 * This creates notification templates for:
 * - STANDALONE_PAYMENT_RECEIVED (SMS + WhatsApp)
 * - STANDALONE_PAYMENT_FAILED (SMS + WhatsApp)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedStandaloneNotifications() {
  console.log('🔔 Seeding standalone payment notification templates...')

  const templates = [
    // STANDALONE_PAYMENT_RECEIVED - SMS
    {
      trigger: 'STANDALONE_PAYMENT_RECEIVED' as const,
      channel: 'SMS' as const,
      name: 'Paiement autonome reçu - SMS',
      description: 'SMS envoyé quand un paiement autonome est confirmé',
      content: `Paiement recu! {amount} FCFA - Ref: {reference}. Merci {customer_name}! Cave Express {store_phone}`,
      recipientType: 'customer',
      enabled: true,
    },
    // STANDALONE_PAYMENT_RECEIVED - WhatsApp
    {
      trigger: 'STANDALONE_PAYMENT_RECEIVED' as const,
      channel: 'WHATSAPP' as const,
      name: 'Paiement autonome reçu - WhatsApp',
      description: 'WhatsApp envoyé quand un paiement autonome est confirmé',
      content: `✅ *Paiement confirmé!*

Montant: *{amount} FCFA*
Référence: {reference}

Merci {customer_name} pour votre confiance!

🍷 *Cave Express*
📞 {store_phone}`,
      recipientType: 'customer',
      enabled: true,
    },
    // STANDALONE_PAYMENT_FAILED - SMS
    {
      trigger: 'STANDALONE_PAYMENT_FAILED' as const,
      channel: 'SMS' as const,
      name: 'Paiement autonome échoué - SMS',
      description: 'SMS envoyé quand un paiement autonome échoue',
      content: `Paiement echoue - {amount} FCFA. Ref: {reference}. Reessayez: cave-express.ci/payer/{amount}. Cave Express {store_phone}`,
      recipientType: 'customer',
      enabled: true,
    },
    // STANDALONE_PAYMENT_FAILED - WhatsApp
    {
      trigger: 'STANDALONE_PAYMENT_FAILED' as const,
      channel: 'WHATSAPP' as const,
      name: 'Paiement autonome échoué - WhatsApp',
      description: 'WhatsApp envoyé quand un paiement autonome échoue',
      content: `❌ *Paiement non abouti*

Montant: *{amount} FCFA*
Référence: {reference}

Veuillez réessayer en cliquant sur le lien ci-dessous:
👉 cave-express.ci/payer/{amount}

Si le problème persiste, contactez-nous.

🍷 *Cave Express*
📞 {store_phone}`,
      recipientType: 'customer',
      enabled: true,
    },
  ]

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: {
        trigger_channel: {
          trigger: template.trigger,
          channel: template.channel,
        },
      },
      update: {
        name: template.name,
        description: template.description,
        content: template.content,
        recipientType: template.recipientType,
        enabled: template.enabled,
      },
      create: template,
    })
    console.log(`  ✓ ${template.name}`)
  }

  console.log('✅ Standalone payment notification templates seeded successfully!')
}

// Run the seed
seedStandaloneNotifications()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error seeding standalone notifications:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
