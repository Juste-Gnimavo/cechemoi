import { PrismaClient, NotificationTrigger, NotificationChannel } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Push Notification Templates Seed
 * Creates PUSH channel templates and updates existing templates with push content
 * Run with: npx ts-node prisma/seed-push-notifications.ts
 */

// Push notification content for all 27 triggers
const pushNotificationTemplates: Record<NotificationTrigger, {
  title: string
  body: string
  name: string
  description: string
  recipientType: 'customer' | 'admin'
}> = {
  // ============================================
  // CUSTOMER NOTIFICATIONS
  // ============================================

  ORDER_PLACED: {
    title: 'Commande confirmee',
    body: 'Votre commande #{order_number} de {order_total} a ete recue. Merci!',
    name: 'Commande passee - Push',
    description: 'Notification push quand une commande est passee',
    recipientType: 'customer',
  },

  ORDER_PROCESSING: {
    title: 'Commande en preparation',
    body: 'Votre commande #{order_number} est en cours de preparation.',
    name: 'Commande en preparation - Push',
    description: 'Notification push quand la commande est en preparation',
    recipientType: 'customer',
  },

  PAYMENT_RECEIVED: {
    title: 'Paiement recu',
    body: 'Paiement de {order_total} confirme pour #{order_number}. Livraison en preparation!',
    name: 'Paiement recu - Push',
    description: 'Notification push quand le paiement est confirme',
    recipientType: 'customer',
  },

  ORDER_SHIPPED: {
    title: 'Commande en livraison',
    body: 'Votre commande #{order_number} est en route! Suivi: {tracking_number}',
    name: 'Commande expediee - Push',
    description: 'Notification push quand la commande est expediee',
    recipientType: 'customer',
  },

  ORDER_DELIVERED: {
    title: 'Commande livree',
    body: 'Votre commande #{order_number} a ete livree avec succes. Bon degustation!',
    name: 'Commande livree - Push',
    description: 'Notification push quand la commande est livree',
    recipientType: 'customer',
  },

  ORDER_CANCELLED: {
    title: 'Commande annulee',
    body: 'Votre commande #{order_number} a ete annulee. Contactez-nous pour plus d\'infos.',
    name: 'Commande annulee - Push',
    description: 'Notification push quand la commande est annulee',
    recipientType: 'customer',
  },

  ORDER_REFUNDED: {
    title: 'Remboursement effectue',
    body: 'Remboursement de {order_total} traite pour #{order_number}. Delai: 3-5 jours.',
    name: 'Commande remboursee - Push',
    description: 'Notification push quand un remboursement est effectue',
    recipientType: 'customer',
  },

  PAYMENT_FAILED: {
    title: 'Echec du paiement',
    body: 'Le paiement pour #{order_number} a echoue. Veuillez reessayer.',
    name: 'Paiement echoue - Push',
    description: 'Notification push quand le paiement echoue',
    recipientType: 'customer',
  },

  CUSTOMER_NOTE: {
    title: 'Note sur votre commande',
    body: 'Nouvelle note concernant #{order_number}: {note_content}',
    name: 'Note client - Push',
    description: 'Notification push quand un admin ajoute une note',
    recipientType: 'customer',
  },

  NEW_ACCOUNT: {
    title: 'Bienvenue chez Cave Express!',
    body: 'Votre compte a ete cree. Decouvrez notre selection de vins premium!',
    name: 'Nouveau compte - Push',
    description: 'Notification push de bienvenue',
    recipientType: 'customer',
  },

  PASSWORD_RESET: {
    title: 'Reinitialisation mot de passe',
    body: 'Code de reinitialisation: {reset_code}. Valide 15 minutes.',
    name: 'Reset mot de passe - Push',
    description: 'Notification push pour reset mot de passe',
    recipientType: 'customer',
  },

  LOYALTY_POINTS_EARNED: {
    title: 'Points fidelite gagnes!',
    body: '+{points_earned} points! Solde: {points_balance} pts ({points_value} CFA)',
    name: 'Points gagnes - Push',
    description: 'Notification push quand des points sont gagnes',
    recipientType: 'customer',
  },

  ABANDONED_CART: {
    title: 'Panier en attente',
    body: '{cart_items_count} article(s) vous attendent. Finalisez votre commande!',
    name: 'Panier abandonne - Push',
    description: 'Notification push pour panier abandonne',
    recipientType: 'customer',
  },

  BACK_IN_STOCK: {
    title: 'De retour en stock!',
    body: '"{product_name}" est disponible. Commandez avant rupture!',
    name: 'Retour en stock - Push',
    description: 'Notification push produit de retour en stock',
    recipientType: 'customer',
  },

  // ============================================
  // ADMIN NOTIFICATIONS
  // ============================================

  NEW_ORDER_ADMIN: {
    title: 'Nouvelle commande!',
    body: '#{order_number} - {customer_name} - {order_total}. Action requise.',
    name: 'Nouvelle commande Admin - Push',
    description: 'Notification push admin nouvelle commande',
    recipientType: 'admin',
  },

  PAYMENT_RECEIVED_ADMIN: {
    title: 'Paiement recu',
    body: '#{order_number} - {order_total} - Preparer livraison.',
    name: 'Paiement recu Admin - Push',
    description: 'Notification push admin paiement recu',
    recipientType: 'admin',
  },

  LOW_STOCK_ADMIN: {
    title: 'Stock bas',
    body: '"{product_name}" - {low_stock_quantity} unites restantes. Reapprovisionner!',
    name: 'Stock bas Admin - Push',
    description: 'Notification push admin stock bas',
    recipientType: 'admin',
  },

  OUT_OF_STOCK_ADMIN: {
    title: 'Rupture de stock!',
    body: '"{product_name}" epuise. Action urgente requise.',
    name: 'Rupture stock Admin - Push',
    description: 'Notification push admin rupture de stock',
    recipientType: 'admin',
  },

  NEW_CUSTOMER_ADMIN: {
    title: 'Nouveau client',
    body: '{customer_name} - {billing_phone} - {billing_city}',
    name: 'Nouveau client Admin - Push',
    description: 'Notification push admin nouveau client',
    recipientType: 'admin',
  },

  NEW_REVIEW_ADMIN: {
    title: 'Nouvel avis client',
    body: '{customer_name} - {rating}/5 sur "{product_name}". Moderer.',
    name: 'Nouvel avis Admin - Push',
    description: 'Notification push admin nouvel avis',
    recipientType: 'admin',
  },

  DAILY_REPORT_ADMIN: {
    title: 'Rapport journalier',
    body: '{orders_count} commandes - {total_revenue} - {new_customers} nouveaux clients',
    name: 'Rapport journalier Admin - Push',
    description: 'Notification push admin rapport journalier',
    recipientType: 'admin',
  },

  // ============================================
  // INVOICE & REVIEW NOTIFICATIONS
  // ============================================

  INVOICE_CREATED: {
    title: 'Facture disponible',
    body: 'Facture #{invoice_number} - {order_total}. Telechargez-la dans l\'app.',
    name: 'Facture creee - Push',
    description: 'Notification push facture disponible',
    recipientType: 'customer',
  },

  INVOICE_PAID: {
    title: 'Facture acquittee',
    body: 'Paiement confirme pour facture #{invoice_number}. Merci!',
    name: 'Facture payee - Push',
    description: 'Notification push facture payee',
    recipientType: 'customer',
  },

  REVIEW_REQUEST: {
    title: 'Votre avis compte!',
    body: 'Comment etait votre vin? Laissez-nous un avis sur Trustpilot!',
    name: 'Demande avis - Push',
    description: 'Notification push demande d\'avis',
    recipientType: 'customer',
  },

  // ============================================
  // PAYMENT REMINDER NOTIFICATIONS
  // ============================================

  PAYMENT_REMINDER_1: {
    title: 'Rappel de paiement',
    body: 'Commande #{order_number} en attente ({order_total}). Payez pour recevoir vos vins!',
    name: 'Rappel paiement 1 - Push',
    description: 'Notification push rappel paiement jour 1',
    recipientType: 'customer',
  },

  PAYMENT_REMINDER_2: {
    title: 'Commande en attente',
    body: '#{order_number} expire bientot! {order_total}. Ne manquez pas vos vins.',
    name: 'Rappel paiement 2 - Push',
    description: 'Notification push rappel paiement jour 3',
    recipientType: 'customer',
  },

  PAYMENT_REMINDER_3: {
    title: 'Dernier rappel!',
    body: 'Commande #{order_number} sera annulee sous 24h sans paiement.',
    name: 'Rappel paiement 3 - Push',
    description: 'Notification push rappel paiement final',
    recipientType: 'customer',
  },

  // ============================================
  // STANDALONE PAYMENT NOTIFICATIONS
  // ============================================

  STANDALONE_PAYMENT_RECEIVED: {
    title: 'Paiement recu!',
    body: 'Paiement de {amount} FCFA confirme. Ref: {reference}. Merci!',
    name: 'Paiement autonome recu - Push',
    description: 'Notification push paiement autonome confirme',
    recipientType: 'customer',
  },

  STANDALONE_PAYMENT_FAILED: {
    title: 'Paiement echoue',
    body: 'Paiement de {amount} FCFA non abouti. Reessayez.',
    name: 'Paiement autonome echoue - Push',
    description: 'Notification push paiement autonome echoue',
    recipientType: 'customer',
  },
}

async function seedPushTemplates() {
  console.log('📱 Seeding push notification templates...')
  console.log('')

  let createdCount = 0
  let updatedCount = 0

  for (const [trigger, template] of Object.entries(pushNotificationTemplates)) {
    const triggerEnum = trigger as NotificationTrigger

    // Check if PUSH template exists for this trigger
    const existingPush = await prisma.notificationTemplate.findFirst({
      where: {
        trigger: triggerEnum,
        channel: 'PUSH' as NotificationChannel,
      },
    })

    if (existingPush) {
      // Update existing PUSH template
      await prisma.notificationTemplate.update({
        where: { id: existingPush.id },
        data: {
          name: template.name,
          description: template.description,
          content: template.body,
          pushTitle: template.title,
          pushBody: template.body,
          recipientType: template.recipientType,
        },
      })
      console.log(`  📝 Updated PUSH: ${trigger}`)
      updatedCount++
    } else {
      // Create new PUSH template
      await prisma.notificationTemplate.create({
        data: {
          trigger: triggerEnum,
          channel: 'PUSH' as NotificationChannel,
          name: template.name,
          description: template.description,
          content: template.body,
          pushTitle: template.title,
          pushBody: template.body,
          recipientType: template.recipientType,
          enabled: true,
        },
      })
      console.log(`  ✅ Created PUSH: ${trigger}`)
      createdCount++
    }

    // Also update SMS/WhatsApp templates with push content
    await prisma.notificationTemplate.updateMany({
      where: {
        trigger: triggerEnum,
        channel: { in: ['SMS', 'WHATSAPP'] },
      },
      data: {
        pushTitle: template.title,
        pushBody: template.body,
      },
    })
  }

  console.log('')
  console.log('📊 Push Templates Summary:')
  console.log(`  - Created: ${createdCount}`)
  console.log(`  - Updated: ${updatedCount}`)
}

async function seedFirebaseConfig() {
  console.log('')
  console.log('🔥 Checking Firebase configuration...')

  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
    console.log('  ⚠️  Firebase env vars not set. Push notifications will not work.')
    console.log('  Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')
    return
  }

  // Get or create NotificationSettings
  let settings = await prisma.notificationSettings.findFirst()

  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: {
        adminPhones: [],
        adminEmails: [],
        firebaseProjectId,
        firebaseClientEmail,
        firebasePrivateKey,
        pushEnabled: true,
      },
    })
    console.log('  ✅ Created NotificationSettings with Firebase config')
  } else if (!settings.firebaseProjectId) {
    await prisma.notificationSettings.update({
      where: { id: settings.id },
      data: {
        firebaseProjectId,
        firebaseClientEmail,
        firebasePrivateKey,
        pushEnabled: true,
      },
    })
    console.log('  ✅ Updated NotificationSettings with Firebase config')
  } else {
    console.log('  ℹ️  Firebase already configured in database')
  }
}

async function main() {
  console.log('🔔 Push Notification Seed Script')
  console.log('================================')
  console.log('')

  await seedPushTemplates()
  await seedFirebaseConfig()

  console.log('')
  console.log('✅ Push notification seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding push notifications:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
