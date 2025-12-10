import { PrismaClient, NotificationTrigger, NotificationChannel } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed Appointment Notification Templates
 * Run with: npx ts-node prisma/seed-appointment-notifications.ts
 *
 * Variables available for appointment notifications:
 * - {customer_name}: Customer's full name
 * - {customer_phone}: Customer's phone number
 * - {appointment_reference}: Appointment reference code
 * - {appointment_date}: Formatted date (e.g., "Lundi 15 Janvier 2025")
 * - {appointment_time}: Time slot (e.g., "10:00")
 * - {service_name}: Consultation type name
 * - {service_price}: Service price formatted
 * - {service_duration}: Duration in minutes
 * - {customer_message}: Optional message from customer
 */
async function main() {
  console.log('🌱 Seeding appointment notification templates...')

  // 1. APPOINTMENT_BOOKED - Customer receives confirmation after booking
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_BOOKED', channel: 'SMS' } },
    update: {
      content: `CECHEMOI: RDV enregistre! {service_name} le {appointment_date} a {appointment_time}. Ref:{appointment_reference}. Confirmation sous 24h. Tel:0759545410`,
    },
    create: {
      trigger: 'APPOINTMENT_BOOKED',
      channel: 'SMS',
      name: 'Appointment Booked - SMS',
      description: 'Sent to customer immediately after booking an appointment',
      recipientType: 'customer',
      content: `CECHEMOI: RDV enregistre! {service_name} le {appointment_date} a {appointment_time}. Ref:{appointment_reference}. Confirmation sous 24h. Tel:0759545410`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_BOOKED', channel: 'WHATSAPP' } },
    update: {
      content: `*[CECHEMOI]*
📅 *DEMANDE DE RENDEZ-VOUS ENREGISTREE*

Bonjour *{customer_name}*,

Votre demande de rendez-vous a bien ete enregistree!

*Details:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date: {appointment_date}
• Heure: {appointment_time}
• Duree: {service_duration} min

⏳ *Prochaine etape*: Un conseiller vous contactera sous 24h pour confirmer votre rendez-vous.

++++++++++++++++++++++
*CECHEMOI*
_Mode sur-mesure et pret-a-porter de qualite._
Adresse: Cocody Riviera Palmeraie, Abidjan
Service Client 7j/7: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
    },
    create: {
      trigger: 'APPOINTMENT_BOOKED',
      channel: 'WHATSAPP',
      name: 'Appointment Booked - WhatsApp',
      description: 'Sent to customer immediately after booking an appointment',
      recipientType: 'customer',
      content: `*[CECHEMOI]*
📅 *DEMANDE DE RENDEZ-VOUS ENREGISTREE*

Bonjour *{customer_name}*,

Votre demande de rendez-vous a bien ete enregistree!

*Details:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date: {appointment_date}
• Heure: {appointment_time}
• Duree: {service_duration} min

⏳ *Prochaine etape*: Un conseiller vous contactera sous 24h pour confirmer votre rendez-vous.

++++++++++++++++++++++
*CECHEMOI*
_Mode sur-mesure et pret-a-porter de qualite._
Adresse: Cocody Riviera Palmeraie, Abidjan
Service Client 7j/7: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 2. APPOINTMENT_CONFIRMED - Customer receives when admin confirms
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_CONFIRMED', channel: 'SMS' } },
    update: {
      content: `CECHEMOI: RDV CONFIRME! {service_name} le {appointment_date} a {appointment_time}. Lieu: Cocody Riviera Palmeraie. A bientot!`,
    },
    create: {
      trigger: 'APPOINTMENT_CONFIRMED',
      channel: 'SMS',
      name: 'Appointment Confirmed - SMS',
      description: 'Sent when admin confirms an appointment',
      recipientType: 'customer',
      content: `CECHEMOI: RDV CONFIRME! {service_name} le {appointment_date} a {appointment_time}. Lieu: Cocody Riviera Palmeraie. A bientot!`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_CONFIRMED', channel: 'WHATSAPP' } },
    update: {
      content: `*[CECHEMOI]*
✅ *RENDEZ-VOUS CONFIRME*

Bonjour *{customer_name}*,

Votre rendez-vous est confirme!

*Details de votre RDV:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date: *{appointment_date}*
• Heure: *{appointment_time}*
• Duree: {service_duration} min

📍 *Adresse:*
Cocody Riviera Palmeraie, Abidjan

💰 *Tarif:* {service_price}

📝 *A noter:*
• Merci d'arriver 5 minutes avant l'heure
• En cas d'empechement, prevenez-nous 24h a l'avance

A tres bientot chez CECHEMOI!

++++++++++++++++++++++
*CECHEMOI*
_Mode sur-mesure et pret-a-porter de qualite._
Service Client 7j/7: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
    },
    create: {
      trigger: 'APPOINTMENT_CONFIRMED',
      channel: 'WHATSAPP',
      name: 'Appointment Confirmed - WhatsApp',
      description: 'Sent when admin confirms an appointment',
      recipientType: 'customer',
      content: `*[CECHEMOI]*
✅ *RENDEZ-VOUS CONFIRME*

Bonjour *{customer_name}*,

Votre rendez-vous est confirme!

*Details de votre RDV:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date: *{appointment_date}*
• Heure: *{appointment_time}*
• Duree: {service_duration} min

📍 *Adresse:*
Cocody Riviera Palmeraie, Abidjan

💰 *Tarif:* {service_price}

📝 *A noter:*
• Merci d'arriver 5 minutes avant l'heure
• En cas d'empechement, prevenez-nous 24h a l'avance

A tres bientot chez CECHEMOI!

++++++++++++++++++++++
*CECHEMOI*
_Mode sur-mesure et pret-a-porter de qualite._
Service Client 7j/7: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 3. APPOINTMENT_REMINDER - Sent before appointment (e.g., 24h before)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_REMINDER', channel: 'SMS' } },
    update: {
      content: `CECHEMOI: RAPPEL! RDV demain {appointment_date} a {appointment_time} pour {service_name}. Lieu: Cocody Riviera Palmeraie. A demain!`,
    },
    create: {
      trigger: 'APPOINTMENT_REMINDER',
      channel: 'SMS',
      name: 'Appointment Reminder - SMS',
      description: 'Sent 24h before the appointment as a reminder',
      recipientType: 'customer',
      content: `CECHEMOI: RAPPEL! RDV demain {appointment_date} a {appointment_time} pour {service_name}. Lieu: Cocody Riviera Palmeraie. A demain!`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_REMINDER', channel: 'WHATSAPP' } },
    update: {
      content: `*[CECHEMOI]*
⏰ *RAPPEL DE RENDEZ-VOUS*

Bonjour *{customer_name}*,

N'oubliez pas votre rendez-vous demain chez CECHEMOI!

*Rappel:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date: *{appointment_date}*
• Heure: *{appointment_time}*

📍 *Adresse:*
Cocody Riviera Palmeraie, Abidjan

📝 *Rappel:*
• Arrivez 5 minutes a l'avance
• Apportez vos inspirations/photos si vous en avez

❓ Un empechement? Contactez-nous pour reporter.

A tres bientot!

++++++++++++++++++++++
*CECHEMOI*
Service Client: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
    },
    create: {
      trigger: 'APPOINTMENT_REMINDER',
      channel: 'WHATSAPP',
      name: 'Appointment Reminder - WhatsApp',
      description: 'Sent 24h before the appointment as a reminder',
      recipientType: 'customer',
      content: `*[CECHEMOI]*
⏰ *RAPPEL DE RENDEZ-VOUS*

Bonjour *{customer_name}*,

N'oubliez pas votre rendez-vous demain chez CECHEMOI!

*Rappel:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date: *{appointment_date}*
• Heure: *{appointment_time}*

📍 *Adresse:*
Cocody Riviera Palmeraie, Abidjan

📝 *Rappel:*
• Arrivez 5 minutes a l'avance
• Apportez vos inspirations/photos si vous en avez

❓ Un empechement? Contactez-nous pour reporter.

A tres bientot!

++++++++++++++++++++++
*CECHEMOI*
Service Client: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 4. APPOINTMENT_CANCELLED - Sent when appointment is cancelled
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_CANCELLED', channel: 'SMS' } },
    update: {
      content: `CECHEMOI: RDV annule. Votre RDV du {appointment_date} a {appointment_time} est annule. Contactez-nous pour reprogrammer: 0759545410`,
    },
    create: {
      trigger: 'APPOINTMENT_CANCELLED',
      channel: 'SMS',
      name: 'Appointment Cancelled - SMS',
      description: 'Sent when an appointment is cancelled',
      recipientType: 'customer',
      content: `CECHEMOI: RDV annule. Votre RDV du {appointment_date} a {appointment_time} est annule. Contactez-nous pour reprogrammer: 0759545410`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_CANCELLED', channel: 'WHATSAPP' } },
    update: {
      content: `*[CECHEMOI]*
❌ *RENDEZ-VOUS ANNULE*

Bonjour *{customer_name}*,

Nous vous informons que votre rendez-vous a ete annule.

*Details:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date prevue: {appointment_date} a {appointment_time}

Nous nous excusons pour ce desagrement.

📅 *Reprogrammer?*
Contactez-nous pour fixer un nouveau rendez-vous a votre convenance.

++++++++++++++++++++++
*CECHEMOI*
_Mode sur-mesure et pret-a-porter de qualite._
Service Client 7j/7: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
    },
    create: {
      trigger: 'APPOINTMENT_CANCELLED',
      channel: 'WHATSAPP',
      name: 'Appointment Cancelled - WhatsApp',
      description: 'Sent when an appointment is cancelled',
      recipientType: 'customer',
      content: `*[CECHEMOI]*
❌ *RENDEZ-VOUS ANNULE*

Bonjour *{customer_name}*,

Nous vous informons que votre rendez-vous a ete annule.

*Details:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date prevue: {appointment_date} a {appointment_time}

Nous nous excusons pour ce desagrement.

📅 *Reprogrammer?*
Contactez-nous pour fixer un nouveau rendez-vous a votre convenance.

++++++++++++++++++++++
*CECHEMOI*
_Mode sur-mesure et pret-a-porter de qualite._
Service Client 7j/7: *+225 0759545410*
WhatsApp: https://wa.me/2250759545410
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 5. APPOINTMENT_BOOKED_ADMIN - Admin notification for new booking
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_BOOKED_ADMIN', channel: 'SMS' } },
    update: {
      content: `ADMIN: Nouveau RDV! {customer_name} ({customer_phone}) - {service_name} le {appointment_date} a {appointment_time}. Ref:{appointment_reference}`,
    },
    create: {
      trigger: 'APPOINTMENT_BOOKED_ADMIN',
      channel: 'SMS',
      name: 'New Appointment - Admin SMS',
      description: 'Sent to admin when a new appointment is booked',
      recipientType: 'admin',
      content: `ADMIN: Nouveau RDV! {customer_name} ({customer_phone}) - {service_name} le {appointment_date} a {appointment_time}. Ref:{appointment_reference}`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'APPOINTMENT_BOOKED_ADMIN', channel: 'WHATSAPP' } },
    update: {
      content: `+++++++++++++++++
📅 *NOUVEAU RENDEZ-VOUS*
[CECHEMOI] - NOTIFICATION ADMIN
+++++++++++++++++

*Details du RDV:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date: *{appointment_date}*
• Heure: *{appointment_time}*
• Duree: {service_duration} min
• Tarif: {service_price}

👤 *CLIENT:*
• Nom: *{customer_name}*
• Telephone: {customer_phone}

💬 *Message du client:*
{customer_message}

⚠️ *ACTION REQUISE:*
Contactez le client pour confirmer le RDV

++++++++++++++++++++++
CECHEMOI - Admin Panel
Site: https://www.cechemoi.com/admin/appointments
++++++++++++++++++++++`,
    },
    create: {
      trigger: 'APPOINTMENT_BOOKED_ADMIN',
      channel: 'WHATSAPP',
      name: 'New Appointment - Admin WhatsApp',
      description: 'Sent to admin when a new appointment is booked',
      recipientType: 'admin',
      content: `+++++++++++++++++
📅 *NOUVEAU RENDEZ-VOUS*
[CECHEMOI] - NOTIFICATION ADMIN
+++++++++++++++++

*Details du RDV:*
• Reference: *{appointment_reference}*
• Service: *{service_name}*
• Date: *{appointment_date}*
• Heure: *{appointment_time}*
• Duree: {service_duration} min
• Tarif: {service_price}

👤 *CLIENT:*
• Nom: *{customer_name}*
• Telephone: {customer_phone}

💬 *Message du client:*
{customer_message}

⚠️ *ACTION REQUISE:*
Contactez le client pour confirmer le RDV

++++++++++++++++++++++
CECHEMOI - Admin Panel
Site: https://www.cechemoi.com/admin/appointments
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  console.log('✅ Seeded 10 appointment notification templates (5 triggers x 2 channels)')
  console.log('')
  console.log('📋 Triggers created:')
  console.log('   - APPOINTMENT_BOOKED (customer): Confirmation after booking')
  console.log('   - APPOINTMENT_CONFIRMED (customer): Admin confirms appointment')
  console.log('   - APPOINTMENT_REMINDER (customer): 24h before reminder')
  console.log('   - APPOINTMENT_CANCELLED (customer): Cancellation notice')
  console.log('   - APPOINTMENT_BOOKED_ADMIN (admin): New booking alert')
  console.log('')
  console.log('🎉 Appointment notification seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding appointment notifications:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
