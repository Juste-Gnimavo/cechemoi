import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed Birthday Greeting Notification Templates
 * Run with: npx ts-node prisma/seed-birthday-notifications.ts
 *
 * Variables available for birthday notifications:
 * - {customer_name}: Customer's full name
 * - {customer_first_name}: Customer's first name
 * - {store_name}: Store name (CÈCHÉMOI)
 * - {store_phone}: Store phone number
 */
async function main() {
  console.log('🌱 Seeding birthday greeting notification templates...')

  // 1. BIRTHDAY_GREETING - SMS (short, under 160 chars)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'BIRTHDAY_GREETING', channel: 'SMS' } },
    update: {
      content: `CECHEMOI: Joyeux anniversaire {customer_first_name}! Toute l'equipe vous souhaite une merveilleuse journee. A tres bientot! Tel:0759545410`,
    },
    create: {
      trigger: 'BIRTHDAY_GREETING',
      channel: 'SMS',
      name: 'Birthday Greeting - SMS',
      description: 'Voeux d\'anniversaire envoyés automatiquement le jour J',
      recipientType: 'customer',
      content: `CECHEMOI: Joyeux anniversaire {customer_first_name}! Toute l'equipe vous souhaite une merveilleuse journee. A tres bientot! Tel:0759545410`,
      enabled: true,
    },
  })

  // 2. BIRTHDAY_GREETING - WhatsApp (rich format with emoji)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'BIRTHDAY_GREETING', channel: 'WHATSAPP' } },
    update: {
      content: `*[CECHEMOI]*
🎂 *JOYEUX ANNIVERSAIRE!*

Bonjour *{customer_name}*,

Toute l'equipe *CECHEMOI* vous souhaite un tres _joyeux anniversaire_! 🎉

Que cette journee speciale soit remplie de bonheur, de joie et de belles surprises.

Merci pour votre fidelite et votre confiance. C'est un plaisir de vous accompagner dans votre style!

A tres bientot chez CECHEMOI! 💫

++++++++++++++++++++++
*CECHEMOI*
_Mode sur-mesure et pret-a-porter de qualite._
Service Client 7j/7: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
    },
    create: {
      trigger: 'BIRTHDAY_GREETING',
      channel: 'WHATSAPP',
      name: 'Birthday Greeting - WhatsApp',
      description: 'Voeux d\'anniversaire envoyés automatiquement le jour J (WhatsApp)',
      recipientType: 'customer',
      content: `*[CECHEMOI]*
🎂 *JOYEUX ANNIVERSAIRE!*

Bonjour *{customer_name}*,

Toute l'equipe *CECHEMOI* vous souhaite un tres _joyeux anniversaire_! 🎉

Que cette journee speciale soit remplie de bonheur, de joie et de belles surprises.

Merci pour votre fidelite et votre confiance. C'est un plaisir de vous accompagner dans votre style!

A tres bientot chez CECHEMOI! 💫

++++++++++++++++++++++
*CECHEMOI*
_Mode sur-mesure et pret-a-porter de qualite._
Service Client 7j/7: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  console.log('✅ Seeded 2 birthday greeting notification templates (1 trigger x 2 channels)')
  console.log('')
  console.log('📋 Trigger created:')
  console.log('   - BIRTHDAY_GREETING (customer): Voeux d\'anniversaire automatiques')
  console.log('')
  console.log('🎉 Birthday notification seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding birthday notifications:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
