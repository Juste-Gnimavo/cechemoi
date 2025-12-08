/**
 * Seed Payment Follow-up Settings
 *
 * This script:
 * 1. Creates/updates PaymentFollowUpSettings with delays (48h, 120h, 168h)
 * 2. Creates PAYMENT_REMINDER templates ONLY if they don't exist (preserves admin customizations)
 *
 * Run with: npx ts-node prisma/seed-payment-follow-up.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding payment follow-up settings...\n')

  // =========================================================================
  // 1. Upsert PaymentFollowUpSettings (always update delays)
  // =========================================================================
  const settings = await prisma.paymentFollowUpSettings.upsert({
    where: { id: 'default' },
    update: {
      enabled: true,
      reminder1Delay: 48,   // 2 days
      reminder2Delay: 120,  // 5 days
      reminder3Delay: 168,  // 7 days
      reminder1Enabled: true,
      reminder2Enabled: true,
      reminder3Enabled: true,
    },
    create: {
      id: 'default',
      enabled: true,
      reminder1Delay: 48,
      reminder2Delay: 120,
      reminder3Delay: 168,
      reminder1Enabled: true,
      reminder2Enabled: true,
      reminder3Enabled: true,
    },
  })

  console.log('✅ PaymentFollowUpSettings configured:')
  console.log(`   Reminder 1: ${settings.reminder1Delay}h (${settings.reminder1Delay / 24} days)`)
  console.log(`   Reminder 2: ${settings.reminder2Delay}h (${settings.reminder2Delay / 24} days)`)
  console.log(`   Reminder 3: ${settings.reminder3Delay}h (${settings.reminder3Delay / 24} days)`)
  console.log('')

  // =========================================================================
  // 2. Check if PAYMENT_REMINDER templates exist (DO NOT overwrite if they do)
  // =========================================================================
  const requiredTemplates = [
    { trigger: 'PAYMENT_REMINDER_1', channel: 'SMS' },
    { trigger: 'PAYMENT_REMINDER_1', channel: 'WHATSAPP' },
    { trigger: 'PAYMENT_REMINDER_2', channel: 'SMS' },
    { trigger: 'PAYMENT_REMINDER_2', channel: 'WHATSAPP' },
    { trigger: 'PAYMENT_REMINDER_3', channel: 'SMS' },
    { trigger: 'PAYMENT_REMINDER_3', channel: 'WHATSAPP' },
  ]

  console.log('📋 Checking PAYMENT_REMINDER templates...\n')

  let allExist = true
  const missingTemplates: string[] = []

  for (const t of requiredTemplates) {
    const exists = await prisma.notificationTemplate.findUnique({
      where: {
        trigger_channel: {
          trigger: t.trigger as any,
          channel: t.channel as any,
        },
      },
    })

    if (exists) {
      console.log(`   ✅ ${t.trigger} (${t.channel}) - EXISTS (content preserved)`)
    } else {
      console.log(`   ❌ ${t.trigger} (${t.channel}) - MISSING`)
      missingTemplates.push(`${t.trigger} (${t.channel})`)
      allExist = false
    }
  }

  console.log('')

  if (allExist) {
    console.log('🎉 All templates exist! No changes made to template content.')
    console.log('   Admin can edit templates at: /admin/notifications/templates')
  } else {
    console.log('⚠️  Missing templates detected:')
    missingTemplates.forEach(t => console.log(`   - ${t}`))
    console.log('')
    console.log('Please create these templates via:')
    console.log('   1. Admin UI: /admin/notifications/templates')
    console.log('   2. Or run: npx ts-node prisma/seed-payment-follow-up.ts --create-missing')
  }

  // =========================================================================
  // 3. Create missing templates only if --create-missing flag is passed
  // =========================================================================
  if (process.argv.includes('--create-missing') && !allExist) {
    console.log('\n📝 Creating missing templates with default content...\n')

    const defaultTemplates = getDefaultTemplates()

    for (const template of defaultTemplates) {
      const exists = await prisma.notificationTemplate.findUnique({
        where: {
          trigger_channel: {
            trigger: template.trigger as any,
            channel: template.channel as any,
          },
        },
      })

      if (!exists) {
        await prisma.notificationTemplate.create({
          data: template as any,
        })
        console.log(`   ✅ Created: ${template.trigger} (${template.channel})`)
      }
    }

    console.log('\n🎉 Missing templates created with default content.')
    console.log('   Admin can customize them at: /admin/notifications/templates')
  }

  console.log('\n✅ Payment follow-up seeding complete!')
}

function getDefaultTemplates() {
  return [
    // PAYMENT_REMINDER_1 - SMS
    {
      trigger: 'PAYMENT_REMINDER_1',
      channel: 'SMS',
      name: 'Rappel Paiement 1 - SMS',
      description: 'Premier rappel de paiement (2 jours après commande)',
      recipientType: 'customer',
      content: `[CaveExpress] Rappel: Votre commande #{order_number} ({order_total}) est en attente de paiement. Payez maintenant!

ORANGE: +225 07 0346 0426
MTN/WAVE: +225 05 5679 1431`,
      enabled: true,
    },
    // PAYMENT_REMINDER_1 - WhatsApp
    {
      trigger: 'PAYMENT_REMINDER_1',
      channel: 'WHATSAPP',
      name: 'Rappel Paiement 1 - WhatsApp',
      description: 'Premier rappel de paiement (2 jours après commande)',
      recipientType: 'customer',
      content: `⏰ *RAPPEL DE PAIEMENT*

Bonjour {customer_name},

Votre commande *#{order_number}* est en attente de paiement.

📦 *Détails:*
{order_product_with_qty}

💰 *Montant: {order_total}*

📱 *Modes de paiement:*
• Orange Money: +225 07 0346 0426
• MTN MoMo: +225 05 5679 1431
• Wave: +225 05 5679 1431

Réglez maintenant pour recevoir vos vins rapidement! 🍷`,
      enabled: true,
    },
    // PAYMENT_REMINDER_2 - SMS
    {
      trigger: 'PAYMENT_REMINDER_2',
      channel: 'SMS',
      name: 'Rappel Paiement 2 - SMS',
      description: 'Deuxième rappel de paiement (5 jours après commande)',
      recipientType: 'customer',
      content: `[CaveExpress] Votre commande #{order_number} expire bientôt! Montant: {order_total}. Payez vite!

ORANGE: +225 07 0346 0426
MTN/WAVE: +225 05 5679 1431`,
      enabled: true,
    },
    // PAYMENT_REMINDER_2 - WhatsApp
    {
      trigger: 'PAYMENT_REMINDER_2',
      channel: 'WHATSAPP',
      name: 'Rappel Paiement 2 - WhatsApp',
      description: 'Deuxième rappel de paiement (5 jours après commande)',
      recipientType: 'customer',
      content: `⚠️ *COMMANDE EN ATTENTE - 2ème Rappel*

Bonjour {customer_name},

Votre commande *#{order_number}* n'est toujours pas réglée.

📦 *Détails:*
{order_product_with_qty}

💰 *Montant: {order_total}*

⚠️ Les stocks peuvent être limités.

📱 *Modes de paiement:*
• Orange Money: +225 07 0346 0426
• MTN MoMo: +225 05 5679 1431
• Wave: +225 05 5679 1431`,
      enabled: true,
    },
    // PAYMENT_REMINDER_3 - SMS
    {
      trigger: 'PAYMENT_REMINDER_3',
      channel: 'SMS',
      name: 'Rappel Paiement 3 - SMS',
      description: 'Dernier rappel de paiement (7 jours après commande)',
      recipientType: 'customer',
      content: `[CaveExpress] DERNIER RAPPEL: Commande #{order_number} ({order_total}) sera annulée sous 24h!

ORANGE: +225 07 0346 0426
MTN/WAVE: +225 05 5679 1431`,
      enabled: true,
    },
    // PAYMENT_REMINDER_3 - WhatsApp
    {
      trigger: 'PAYMENT_REMINDER_3',
      channel: 'WHATSAPP',
      name: 'Rappel Paiement 3 - WhatsApp',
      description: 'Dernier rappel de paiement (7 jours après commande)',
      recipientType: 'customer',
      content: `🚨 *DERNIER RAPPEL - COMMANDE EN ATTENTE*

Bonjour {customer_name},

Votre commande *#{order_number}* sera *automatiquement annulée sous 24h* sans paiement.

📦 *Détails:*
{order_product_with_qty}

💰 *Montant: {order_total}*

📱 *Réglez maintenant:*
• Orange Money: +225 07 0346 0426
• MTN MoMo: +225 05 5679 1431
• Wave: +225 05 5679 1431

Un problème? Contactez-nous! 🤝`,
      enabled: true,
    },
  ]
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
