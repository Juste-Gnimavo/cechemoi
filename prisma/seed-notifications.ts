import { PrismaClient, NotificationTrigger, NotificationChannel } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed Notification Templates and Settings
 * Run with: npx prisma db seed
 */
async function main() {
  console.log('🌱 Seeding notification templates...')

  // 1. CUSTOMER NOTIFICATIONS - ORDER_PLACED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_PLACED', channel: 'SMS' } },
    update: {
      content: `Bonjour {customer_name}, votre commande {order_number} de {order_total} a été reçue. Merci pour votre confiance!

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'ORDER_PLACED',
      channel: 'SMS',
      name: 'Commande créée - SMS',
      description: 'Envoyé quand le client passe une commande',
      recipientType: 'customer',
      content: `Bonjour {customer_name}, votre commande {order_number} de {order_total} a été reçue. Merci pour votre confiance!

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_PLACED', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{billing_first_name}*,

Votre commande *{order_number}* a été reçue.

*Articles:* {order_product_with_qty}
*Total:* {order_total}
*Téléphone:* {billing_phone}
*Adresse:* {billing_address}

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'ORDER_PLACED',
      channel: 'WHATSAPP',
      name: 'Commande créée - WhatsApp',
      description: 'Envoyé quand le client passe une commande',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{billing_first_name}*,

Votre commande *{order_number}* a été reçue.

*Articles:* {order_product_with_qty}
*Total:* {order_total}
*Téléphone:* {billing_phone}
*Adresse:* {billing_address}

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 2. PAYMENT_RECEIVED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_RECEIVED', channel: 'SMS' } },
    update: {
      content: `Paiement reçu pour votre commande {order_number} ({order_total}). Préparation en cours. Merci!

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'PAYMENT_RECEIVED',
      channel: 'SMS',
      name: 'Paiement reçu - SMS',
      description: 'Envoyé quand le paiement est confirmé',
      recipientType: 'customer',
      content: `Paiement reçu pour votre commande {order_number} ({order_total}). Préparation en cours. Merci!

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_RECEIVED', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

Votre paiement de *{order_total}* pour la commande *{order_number}* a été confirmé.

Nous préparons votre commande avec soin.

Merci pour votre confiance!

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'PAYMENT_RECEIVED',
      channel: 'WHATSAPP',
      name: 'Paiement reçu - WhatsApp',
      description: 'Envoyé quand le paiement est confirmé',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

Votre paiement de *{order_total}* pour la commande *{order_number}* a été confirmé.

Nous préparons votre commande avec soin.

Merci pour votre confiance!

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 3. ORDER_SHIPPED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_SHIPPED', channel: 'SMS' } },
    update: {
      content: `Votre commande {order_number} est en livraison! Suivi: {tracking_number}. À très bientôt!

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'ORDER_SHIPPED',
      channel: 'SMS',
      name: 'Commande expédiée - SMS',
      description: 'Envoyé quand la commande est expédiée',
      recipientType: 'customer',
      content: `Votre commande {order_number} est en livraison! Suivi: {tracking_number}. À très bientôt!

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_SHIPPED', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

Votre commande *{order_number}* est en route!

📦 *Suivi:* {tracking_number}
🚚 *Livraison prévue:* {delivery_date}

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'ORDER_SHIPPED',
      channel: 'WHATSAPP',
      name: 'Commande expédiée - WhatsApp',
      description: 'Envoyé quand la commande est expédiée',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

Votre commande *{order_number}* est en route!

📦 *Suivi:* {tracking_number}
🚚 *Livraison prévue:* {delivery_date}

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 4. ORDER_DELIVERED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_DELIVERED', channel: 'SMS' } },
    update: {
      content: `Votre commande {order_number} a été livrée! Merci d'avoir choisi CÈCHÉMOI.

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'ORDER_DELIVERED',
      channel: 'SMS',
      name: 'Commande livrée - SMS',
      description: 'Envoyé quand la commande est livrée',
      recipientType: 'customer',
      content: `Votre commande {order_number} a été livrée! Merci d'avoir choisi CÈCHÉMOI.

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_DELIVERED', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

✅ Votre commande *{order_number}* a été livrée!

Nous espérons que vos articles vous plairont. N'hésitez pas à partager votre expérience.

Merci pour votre confiance!

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'ORDER_DELIVERED',
      channel: 'WHATSAPP',
      name: 'Commande livrée - WhatsApp',
      description: 'Envoyé quand la commande est livrée',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

✅ Votre commande *{order_number}* a été livrée!

Nous espérons que vos articles vous plairont. N'hésitez pas à partager votre expérience.

Merci pour votre confiance!

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 5. ORDER_CANCELLED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_CANCELLED', channel: 'SMS' } },
    update: {
      content: `Votre commande {order_number} a été annulée. Questions? Appelez-nous au +225 07 59 54 54 10.

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'ORDER_CANCELLED',
      channel: 'SMS',
      name: 'Commande annulée - SMS',
      description: 'Envoyé quand la commande est annulée',
      recipientType: 'customer',
      content: `Votre commande {order_number} a été annulée. Questions? Appelez-nous au +225 07 59 54 54 10.

— CÈCHÉMOI`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_CANCELLED', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

Votre commande *{order_number}* ({order_total}) a été annulée.

Si vous n'êtes pas à l'origine de cette annulation, contactez-nous.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'ORDER_CANCELLED',
      channel: 'WHATSAPP',
      name: 'Commande annulée - WhatsApp',
      description: 'Envoyé quand la commande est annulée',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

Votre commande *{order_number}* ({order_total}) a été annulée.

Si vous n'êtes pas à l'origine de cette annulation, contactez-nous.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: false,
    },
  })

  // 6. ORDER_REFUNDED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_REFUNDED', channel: 'SMS' } },
    update: {
      content: `Remboursement de {order_total} traité pour la commande {order_number}. Délai: 3-5 jours.

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'ORDER_REFUNDED',
      channel: 'SMS',
      name: 'Remboursement - SMS',
      description: 'Envoyé quand le remboursement est traité',
      recipientType: 'customer',
      content: `Remboursement de {order_total} traité pour la commande {order_number}. Délai: 3-5 jours.

— CÈCHÉMOI`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_REFUNDED', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

Votre remboursement de *{order_total}* pour la commande *{order_number}* a été traité.

Délai: 3-5 jours ouvrables.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'ORDER_REFUNDED',
      channel: 'WHATSAPP',
      name: 'Remboursement - WhatsApp',
      description: 'Envoyé quand le remboursement est traité',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

Votre remboursement de *{order_total}* pour la commande *{order_number}* a été traité.

Délai: 3-5 jours ouvrables.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: false,
    },
  })

  // 7. PAYMENT_FAILED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_FAILED', channel: 'SMS' } },
    update: {
      content: `Échec du paiement pour la commande {order_number}. Veuillez réessayer ou contactez-nous.

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'PAYMENT_FAILED',
      channel: 'SMS',
      name: 'Paiement échoué - SMS',
      description: 'Envoyé quand le paiement échoue',
      recipientType: 'customer',
      content: `Échec du paiement pour la commande {order_number}. Veuillez réessayer ou contactez-nous.

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_FAILED', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

❌ Le paiement de votre commande *{order_number}* ({order_total}) n'a pas abouti.

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

Besoin d'aide? Répondez à ce message.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'PAYMENT_FAILED',
      channel: 'WHATSAPP',
      name: 'Paiement échoué - WhatsApp',
      description: 'Envoyé quand le paiement échoue',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

❌ Le paiement de votre commande *{order_number}* ({order_total}) n'a pas abouti.

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

Besoin d'aide? Répondez à ce message.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 8. CUSTOMER_NOTE (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'CUSTOMER_NOTE', channel: 'SMS' } },
    update: {
      content: `Note concernant votre commande {order_number}: {note_content}

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'CUSTOMER_NOTE',
      channel: 'SMS',
      name: 'Note client - SMS',
      description: 'Envoyé quand l\'admin ajoute une note client',
      recipientType: 'customer',
      content: `Note concernant votre commande {order_number}: {note_content}

— CÈCHÉMOI`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'CUSTOMER_NOTE', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

📝 *Note pour votre commande {order_number}:*

{note_content}

Des questions? Répondez à ce message.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'CUSTOMER_NOTE',
      channel: 'WHATSAPP',
      name: 'Note client - WhatsApp',
      description: 'Envoyé quand l\'admin ajoute une note client',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

📝 *Note pour votre commande {order_number}:*

{note_content}

Des questions? Répondez à ce message.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: false,
    },
  })

  // 9. NEW_ACCOUNT (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_ACCOUNT', channel: 'SMS' } },
    update: {
      content: `Bienvenue chez CÈCHÉMOI! Votre compte est créé. Découvrez notre collection sur cechemoi.com

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'NEW_ACCOUNT',
      channel: 'SMS',
      name: 'Nouveau compte - SMS',
      description: 'Envoyé quand un client s\'inscrit',
      recipientType: 'customer',
      content: `Bienvenue chez CÈCHÉMOI! Votre compte est créé. Découvrez notre collection sur cechemoi.com

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_ACCOUNT', channel: 'WHATSAPP' } },
    update: {
      content: `*Bienvenue chez CÈCHÉMOI!* 👗

Bonjour *{customer_name}*,

Votre compte est créé!

Vous pouvez maintenant:
✅ Commander nos créations
✅ Suivre vos commandes
✅ Cumuler des points fidélité

Découvrez notre collection sur cechemoi.com

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'NEW_ACCOUNT',
      channel: 'WHATSAPP',
      name: 'Nouveau compte - WhatsApp',
      description: 'Envoyé quand un client s\'inscrit',
      recipientType: 'customer',
      content: `*Bienvenue chez CÈCHÉMOI!* 👗

Bonjour *{customer_name}*,

Votre compte est créé!

Vous pouvez maintenant:
✅ Commander nos créations
✅ Suivre vos commandes
✅ Cumuler des points fidélité

Découvrez notre collection sur cechemoi.com

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 10. PASSWORD_RESET (SMS + WHATSAPP) - For admin only
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PASSWORD_RESET', channel: 'SMS' } },
    update: {
      content: `Code de réinitialisation CÈCHÉMOI: {reset_code}. Valide 15 minutes.

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'PASSWORD_RESET',
      channel: 'SMS',
      name: 'Réinitialisation mot de passe - SMS',
      description: 'Envoyé quand une réinitialisation est demandée (admin)',
      recipientType: 'customer',
      content: `Code de réinitialisation CÈCHÉMOI: {reset_code}. Valide 15 minutes.

— CÈCHÉMOI`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PASSWORD_RESET', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

🔐 *Code de réinitialisation:* {reset_code}

Valide 15 minutes. Si vous n'avez pas fait cette demande, ignorez ce message.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'PASSWORD_RESET',
      channel: 'WHATSAPP',
      name: 'Réinitialisation mot de passe - WhatsApp',
      description: 'Envoyé quand une réinitialisation est demandée (admin)',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

🔐 *Code de réinitialisation:* {reset_code}

Valide 15 minutes. Si vous n'avez pas fait cette demande, ignorez ce message.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: false,
    },
  })

  // 11. LOYALTY_POINTS_EARNED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'LOYALTY_POINTS_EARNED', channel: 'SMS' } },
    update: {
      content: `Bravo! +{points_earned} points fidélité. Solde: {points_balance} points.

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'LOYALTY_POINTS_EARNED',
      channel: 'SMS',
      name: 'Points fidélité gagnés - SMS',
      description: 'Envoyé quand le client gagne des points',
      recipientType: 'customer',
      content: `Bravo! +{points_earned} points fidélité. Solde: {points_balance} points.

— CÈCHÉMOI`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'LOYALTY_POINTS_EARNED', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

🎉 Bravo *{customer_name}*!

+*{points_earned}* points fidélité pour la commande {order_number}.

💰 *Solde:* {points_balance} points
🎁 *Valeur:* {points_value} CFA

Utilisez-les lors de votre prochain achat!

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'LOYALTY_POINTS_EARNED',
      channel: 'WHATSAPP',
      name: 'Points fidélité gagnés - WhatsApp',
      description: 'Envoyé quand le client gagne des points',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

🎉 Bravo *{customer_name}*!

+*{points_earned}* points fidélité pour la commande {order_number}.

💰 *Solde:* {points_balance} points
🎁 *Valeur:* {points_value} CFA

Utilisez-les lors de votre prochain achat!

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: false,
    },
  })

  // 12. ABANDONED_CART (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ABANDONED_CART', channel: 'SMS' } },
    update: {
      content: `Vous avez oublié {cart_items_count} article(s) dans votre panier! Finalisez votre commande sur cechemoi.com

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'ABANDONED_CART',
      channel: 'SMS',
      name: 'Panier abandonné - SMS',
      description: 'Envoyé 1h après abandon du panier',
      recipientType: 'customer',
      content: `Vous avez oublié {cart_items_count} article(s) dans votre panier! Finalisez votre commande sur cechemoi.com

— CÈCHÉMOI`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ABANDONED_CART', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

🛒 Vous avez laissé *{cart_items_count}* article(s) dans votre panier:

{cart_items_list}

*Total:* {cart_total}

Finalisez votre commande maintenant!

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'ABANDONED_CART',
      channel: 'WHATSAPP',
      name: 'Panier abandonné - WhatsApp',
      description: 'Envoyé 1h après abandon du panier',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*,

🛒 Vous avez laissé *{cart_items_count}* article(s) dans votre panier:

{cart_items_list}

*Total:* {cart_total}

Finalisez votre commande maintenant!

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_
+225 07 59 54 54 10`,
      enabled: false,
    },
  })

  // 13. BACK_IN_STOCK (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'BACK_IN_STOCK', channel: 'SMS' } },
    update: {
      content: `Bonne nouvelle! "{product_name}" est de retour en stock. Commandez vite sur cechemoi.com

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'BACK_IN_STOCK',
      channel: 'SMS',
      name: 'Retour en stock - SMS',
      description: 'Envoyé quand un produit est de retour en stock',
      recipientType: 'customer',
      content: `Bonne nouvelle! "{product_name}" est de retour en stock. Commandez vite sur cechemoi.com

— CÈCHÉMOI`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'BACK_IN_STOCK', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*

Bonne nouvelle *{customer_name}*! 👗

*{product_name}* est de retour en stock!

💰 *Prix:* {product_price}
📦 *Quantité:* {product_stock}

Commandez vite avant rupture!

— *CÈCHÉMOI*
cechemoi.com`,
    },
    create: {
      trigger: 'BACK_IN_STOCK',
      channel: 'WHATSAPP',
      name: 'Retour en stock - WhatsApp',
      description: 'Envoyé quand un produit est de retour en stock',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonne nouvelle *{customer_name}*! 👗

*{product_name}* est de retour en stock!

💰 *Prix:* {product_price}
📦 *Quantité:* {product_stock}

Commandez vite avant rupture!

— *CÈCHÉMOI*
cechemoi.com`,
      enabled: false,
    },
  })

  // 14. NEW_ORDER_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_ORDER_ADMIN', channel: 'SMS' } },
    update: {
      content: `[ADMIN] Nouvelle commande {order_number} - {customer_name} - {order_total}`,
    },
    create: {
      trigger: 'NEW_ORDER_ADMIN',
      channel: 'SMS',
      name: 'Nouvelle commande - Admin SMS',
      description: 'Envoyé à l\'admin quand une commande est passée',
      recipientType: 'admin',
      content: `[ADMIN] Nouvelle commande {order_number} - {customer_name} - {order_total}`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_ORDER_ADMIN', channel: 'WHATSAPP' } },
    update: {
      content: `*[ADMIN CÈCHÉMOI]*
🆕 *NOUVELLE COMMANDE*

📋 *Commande:* {order_number}
💰 *Montant:* {order_total}
📅 *Date:* {order_date}

👤 *Client:*
• {billing_first_name} {billing_last_name}
• {billing_phone}
• {billing_address}

📦 *Articles:*
{order_product_with_qty}

💳 *Paiement:* {payment_method} - {payment_status}

⚠️ *ACTION:* Traiter cette commande`,
    },
    create: {
      trigger: 'NEW_ORDER_ADMIN',
      channel: 'WHATSAPP',
      name: 'Nouvelle commande - Admin WhatsApp',
      description: 'Envoyé à l\'admin quand une commande est passée',
      recipientType: 'admin',
      content: `*[ADMIN CÈCHÉMOI]*
🆕 *NOUVELLE COMMANDE*

📋 *Commande:* {order_number}
💰 *Montant:* {order_total}
📅 *Date:* {order_date}

👤 *Client:*
• {billing_first_name} {billing_last_name}
• {billing_phone}
• {billing_address}

📦 *Articles:*
{order_product_with_qty}

💳 *Paiement:* {payment_method} - {payment_status}

⚠️ *ACTION:* Traiter cette commande`,
      enabled: true,
    },
  })

  // 15. PAYMENT_RECEIVED_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_RECEIVED_ADMIN', channel: 'SMS' } },
    update: {
      content: `[ADMIN] 💰 Paiement reçu {order_number} - {order_total} - {customer_name}`,
    },
    create: {
      trigger: 'PAYMENT_RECEIVED_ADMIN',
      channel: 'SMS',
      name: 'Paiement reçu - Admin SMS',
      description: 'Envoyé à l\'admin quand un paiement est confirmé',
      recipientType: 'admin',
      content: `[ADMIN] 💰 Paiement reçu {order_number} - {order_total} - {customer_name}`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_RECEIVED_ADMIN', channel: 'WHATSAPP' } },
    update: {
      content: `*[ADMIN CÈCHÉMOI]*
✅ *PAIEMENT CONFIRMÉ*

💰 *Montant:* {order_total}
📋 *Commande:* {order_number}
💳 *Méthode:* {payment_method}

👤 *Client:*
• {billing_first_name} {billing_last_name}
• {billing_phone}

📦 *Articles:*
{order_product_with_qty}

⚠️ *ACTION:* Préparer la livraison`,
    },
    create: {
      trigger: 'PAYMENT_RECEIVED_ADMIN',
      channel: 'WHATSAPP',
      name: 'Paiement reçu - Admin WhatsApp',
      description: 'Envoyé à l\'admin quand un paiement est confirmé',
      recipientType: 'admin',
      content: `*[ADMIN CÈCHÉMOI]*
✅ *PAIEMENT CONFIRMÉ*

💰 *Montant:* {order_total}
📋 *Commande:* {order_number}
💳 *Méthode:* {payment_method}

👤 *Client:*
• {billing_first_name} {billing_last_name}
• {billing_phone}

📦 *Articles:*
{order_product_with_qty}

⚠️ *ACTION:* Préparer la livraison`,
      enabled: true,
    },
  })

  // 16. LOW_STOCK_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'LOW_STOCK_ADMIN', channel: 'SMS' } },
    update: {
      content: `[ADMIN] ⚠️ Stock bas: "{product_name}" - {low_stock_quantity} unités restantes`,
    },
    create: {
      trigger: 'LOW_STOCK_ADMIN',
      channel: 'SMS',
      name: 'Stock bas - Admin SMS',
      description: 'Envoyé à l\'admin quand le stock est bas',
      recipientType: 'admin',
      content: `[ADMIN] ⚠️ Stock bas: "{product_name}" - {low_stock_quantity} unités restantes`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'LOW_STOCK_ADMIN', channel: 'WHATSAPP' } },
    update: {
      content: `*[ADMIN CÈCHÉMOI]*
⚠️ *STOCK BAS*

👗 *Produit:* {product_name}
📦 *Stock actuel:* {low_stock_quantity} unités
⚠️ *Seuil:* {low_stock_threshold} unités

🔴 *ACTION:* Réapprovisionner`,
    },
    create: {
      trigger: 'LOW_STOCK_ADMIN',
      channel: 'WHATSAPP',
      name: 'Stock bas - Admin WhatsApp',
      description: 'Envoyé à l\'admin quand le stock est bas',
      recipientType: 'admin',
      content: `*[ADMIN CÈCHÉMOI]*
⚠️ *STOCK BAS*

👗 *Produit:* {product_name}
📦 *Stock actuel:* {low_stock_quantity} unités
⚠️ *Seuil:* {low_stock_threshold} unités

🔴 *ACTION:* Réapprovisionner`,
      enabled: true,
    },
  })

  // 17. OUT_OF_STOCK_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'OUT_OF_STOCK_ADMIN', channel: 'SMS' } },
    update: {
      content: `[ADMIN] 🔴 Rupture: "{product_name}" - Action urgente requise`,
    },
    create: {
      trigger: 'OUT_OF_STOCK_ADMIN',
      channel: 'SMS',
      name: 'Rupture de stock - Admin SMS',
      description: 'Envoyé à l\'admin quand un produit est en rupture',
      recipientType: 'admin',
      content: `[ADMIN] 🔴 Rupture: "{product_name}" - Action urgente requise`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'OUT_OF_STOCK_ADMIN', channel: 'WHATSAPP' } },
    update: {
      content: `*[ADMIN CÈCHÉMOI]*
🔴 *RUPTURE DE STOCK*

👗 *Produit:* {product_name}
📦 *Stock:* 0 unités

⚠️ *Impact:*
• Produit invisible sur le site
• Perte de ventes potentielles

🔴 *ACTION URGENTE:* Réapprovisionner`,
    },
    create: {
      trigger: 'OUT_OF_STOCK_ADMIN',
      channel: 'WHATSAPP',
      name: 'Rupture de stock - Admin WhatsApp',
      description: 'Envoyé à l\'admin quand un produit est en rupture',
      recipientType: 'admin',
      content: `*[ADMIN CÈCHÉMOI]*
🔴 *RUPTURE DE STOCK*

👗 *Produit:* {product_name}
📦 *Stock:* 0 unités

⚠️ *Impact:*
• Produit invisible sur le site
• Perte de ventes potentielles

🔴 *ACTION URGENTE:* Réapprovisionner`,
      enabled: true,
    },
  })

  // 18. NEW_CUSTOMER_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_CUSTOMER_ADMIN', channel: 'SMS' } },
    update: {
      name: 'Nouveau client - Admin SMS',
      description: 'Envoyé à l\'admin quand un nouveau client s\'inscrit',
      content: `[ADMIN] ✅ Nouveau client: {customer_name} - {billing_phone} - {billing_city}`,
      enabled: true,
    },
    create: {
      trigger: 'NEW_CUSTOMER_ADMIN',
      channel: 'SMS',
      name: 'Nouveau client - Admin SMS',
      description: 'Envoyé à l\'admin quand un nouveau client s\'inscrit',
      recipientType: 'admin',
      content: `[ADMIN] ✅ Nouveau client: {customer_name} - {billing_phone} - {billing_city}`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_CUSTOMER_ADMIN', channel: 'WHATSAPP' } },
    update: {
      name: 'Nouveau client - Admin WhatsApp',
      description: 'Envoyé à l\'admin quand un nouveau client s\'inscrit',
      content: `*[ADMIN CÈCHÉMOI]*
✅ *NOUVEAU CLIENT*

👤 *Client:*
• Nom: {customer_name}
• Téléphone: {billing_phone}
• Email: {billing_email}
• Ville: {billing_city}

📅 *Inscription:* {registration_date}
👥 *Total clients:* {total_customers}`,
      enabled: true,
    },
    create: {
      trigger: 'NEW_CUSTOMER_ADMIN',
      channel: 'WHATSAPP',
      name: 'Nouveau client - Admin WhatsApp',
      description: 'Envoyé à l\'admin quand un nouveau client s\'inscrit',
      recipientType: 'admin',
      content: `*[ADMIN CÈCHÉMOI]*
✅ *NOUVEAU CLIENT*

👤 *Client:*
• Nom: {customer_name}
• Téléphone: {billing_phone}
• Email: {billing_email}
• Ville: {billing_city}

📅 *Inscription:* {registration_date}
👥 *Total clients:* {total_customers}`,
      enabled: true,
    },
  })

  // 19. NEW_REVIEW_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_REVIEW_ADMIN', channel: 'SMS' } },
    update: {
      content: `[ADMIN] ⭐ Nouvel avis: {customer_name} sur "{product_name}" - {rating}/5`,
    },
    create: {
      trigger: 'NEW_REVIEW_ADMIN',
      channel: 'SMS',
      name: 'Nouvel avis - Admin SMS',
      description: 'Envoyé à l\'admin quand un avis est soumis',
      recipientType: 'admin',
      content: `[ADMIN] ⭐ Nouvel avis: {customer_name} sur "{product_name}" - {rating}/5`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_REVIEW_ADMIN', channel: 'WHATSAPP' } },
    update: {
      content: `*[ADMIN CÈCHÉMOI]*
⭐ *NOUVEL AVIS*

👗 *Produit:* {product_name}
👤 *Client:* {customer_name}
⭐ *Note:* {rating}/5
✅ *Achat vérifié:* {verified_purchase}

💬 *Commentaire:*
"{review_comment}"

⚠️ *ACTION:* Modérer cet avis`,
    },
    create: {
      trigger: 'NEW_REVIEW_ADMIN',
      channel: 'WHATSAPP',
      name: 'Nouvel avis - Admin WhatsApp',
      description: 'Envoyé à l\'admin quand un avis est soumis',
      recipientType: 'admin',
      content: `*[ADMIN CÈCHÉMOI]*
⭐ *NOUVEL AVIS*

👗 *Produit:* {product_name}
👤 *Client:* {customer_name}
⭐ *Note:* {rating}/5
✅ *Achat vérifié:* {verified_purchase}

💬 *Commentaire:*
"{review_comment}"

⚠️ *ACTION:* Modérer cet avis`,
      enabled: false,
    },
  })

  // 20. DAILY_REPORT_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'DAILY_REPORT_ADMIN', channel: 'SMS' } },
    update: {
      content: `[ADMIN] 📊 Rapport: {orders_count} commandes - {total_revenue} CFA - {new_customers} nouveaux clients`,
    },
    create: {
      trigger: 'DAILY_REPORT_ADMIN',
      channel: 'SMS',
      name: 'Rapport journalier - Admin SMS',
      description: 'Envoyé chaque jour à 20h',
      recipientType: 'admin',
      content: `[ADMIN] 📊 Rapport: {orders_count} commandes - {total_revenue} CFA - {new_customers} nouveaux clients`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'DAILY_REPORT_ADMIN', channel: 'WHATSAPP' } },
    update: {
      content: `*[ADMIN CÈCHÉMOI]*
📊 *RAPPORT JOURNALIER*
{report_date}

💰 *Chiffre d'affaires:* {total_revenue} CFA

📦 *Commandes:*
• Total: {orders_count}
• En attente: {pending_orders}
• En cours: {processing_orders}
• Livrées: {delivered_orders}

👥 *Clients:*
• Nouveaux: {new_customers}
• Total: {total_customers}

👗 *Produits:*
• Vendus: {products_sold} unités
• Stock bas: {low_stock_products}`,
    },
    create: {
      trigger: 'DAILY_REPORT_ADMIN',
      channel: 'WHATSAPP',
      name: 'Rapport journalier - Admin WhatsApp',
      description: 'Envoyé chaque jour à 20h',
      recipientType: 'admin',
      content: `*[ADMIN CÈCHÉMOI]*
📊 *RAPPORT JOURNALIER*
{report_date}

💰 *Chiffre d'affaires:* {total_revenue} CFA

📦 *Commandes:*
• Total: {orders_count}
• En attente: {pending_orders}
• En cours: {processing_orders}
• Livrées: {delivered_orders}

👥 *Clients:*
• Nouveaux: {new_customers}
• Total: {total_customers}

👗 *Produits:*
• Vendus: {products_sold} unités
• Stock bas: {low_stock_products}`,
      enabled: false,
    },
  })

  // 21. INVOICE_CREATED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'INVOICE_CREATED', channel: 'SMS' } },
    update: {
      name: 'Facture créée - SMS',
      description: 'Envoyé quand la facture est générée',
      content: `Votre facture {invoice_number} ({order_total}) est prête: {invoice_url}

— CÈCHÉMOI`,
      enabled: true,
    },
    create: {
      trigger: 'INVOICE_CREATED',
      channel: 'SMS',
      name: 'Facture créée - SMS',
      description: 'Envoyé quand la facture est générée',
      recipientType: 'customer',
      content: `Votre facture {invoice_number} ({order_total}) est prête: {invoice_url}

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'INVOICE_CREATED', channel: 'WHATSAPP' } },
    update: {
      name: 'Facture créée - WhatsApp',
      description: 'Envoyé quand la facture est générée',
      content: `*CÈCHÉMOI*
📄 *VOTRE FACTURE*

Bonjour *{customer_name}*,

Votre facture pour la commande *{order_number}* est prête.

• Numéro: *{invoice_number}*
• Montant: *{order_total}*

📥 *Télécharger:*
{invoice_url}

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: true,
    },
    create: {
      trigger: 'INVOICE_CREATED',
      channel: 'WHATSAPP',
      name: 'Facture créée - WhatsApp',
      description: 'Envoyé quand la facture est générée',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*
📄 *VOTRE FACTURE*

Bonjour *{customer_name}*,

Votre facture pour la commande *{order_number}* est prête.

• Numéro: *{invoice_number}*
• Montant: *{order_total}*

📥 *Télécharger:*
{invoice_url}

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 22. INVOICE_PAID (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'INVOICE_PAID', channel: 'SMS' } },
    update: {
      name: 'Facture payée - SMS',
      description: 'Envoyé quand la facture est payée',
      content: `Paiement reçu! Facture {invoice_number} ({order_total}). Télécharger: {invoice_url}

— CÈCHÉMOI`,
      enabled: true,
    },
    create: {
      trigger: 'INVOICE_PAID',
      channel: 'SMS',
      name: 'Facture payée - SMS',
      description: 'Envoyé quand la facture est payée',
      recipientType: 'customer',
      content: `Paiement reçu! Facture {invoice_number} ({order_total}). Télécharger: {invoice_url}

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'INVOICE_PAID', channel: 'WHATSAPP' } },
    update: {
      name: 'Facture payée - WhatsApp',
      description: 'Envoyé quand la facture est payée',
      content: `*CÈCHÉMOI*
✅ *FACTURE ACQUITTÉE*

Bonjour *{customer_name}*,

Merci! Votre paiement pour la facture *{invoice_number}* est confirmé.

• Commande: *{order_number}*
• Montant: *{order_total}*

📥 *Facture acquittée:*
{invoice_url}

Votre commande est en préparation!

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: true,
    },
    create: {
      trigger: 'INVOICE_PAID',
      channel: 'WHATSAPP',
      name: 'Facture payée - WhatsApp',
      description: 'Envoyé quand la facture est payée',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*
✅ *FACTURE ACQUITTÉE*

Bonjour *{customer_name}*,

Merci! Votre paiement pour la facture *{invoice_number}* est confirmé.

• Commande: *{order_number}*
• Montant: *{order_total}*

📥 *Facture acquittée:*
{invoice_url}

Votre commande est en préparation!

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 23. REVIEW_REQUEST (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'REVIEW_REQUEST', channel: 'SMS' } },
    update: {
      description: 'Envoyé 24h après livraison pour demander un avis Trustpilot',
      content: `Satisfait(e) de votre achat CÈCHÉMOI? Donnez votre avis: https://fr.trustpilot.com/evaluate/cechemoi.com Merci!

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'REVIEW_REQUEST',
      channel: 'SMS',
      name: 'Demande d\'avis - SMS',
      description: 'Envoyé 24h après livraison pour demander un avis Trustpilot',
      recipientType: 'customer',
      content: `Satisfait(e) de votre achat CÈCHÉMOI? Donnez votre avis: https://fr.trustpilot.com/evaluate/cechemoi.com Merci!

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'REVIEW_REQUEST', channel: 'WHATSAPP' } },
    update: {
      description: 'Envoyé 24h après livraison pour demander un avis Trustpilot',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*! 👗

Comment trouvez-vous votre commande?

Votre avis nous aide à nous améliorer!

👉 *Donnez votre avis:*
https://fr.trustpilot.com/evaluate/cechemoi.com

Merci pour votre confiance!

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_`,
    },
    create: {
      trigger: 'REVIEW_REQUEST',
      channel: 'WHATSAPP',
      name: 'Demande d\'avis - WhatsApp',
      description: 'Envoyé 24h après livraison pour demander un avis Trustpilot',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*

Bonjour *{customer_name}*! 👗

Comment trouvez-vous votre commande?

Votre avis nous aide à nous améliorer!

👉 *Donnez votre avis:*
https://fr.trustpilot.com/evaluate/cechemoi.com

Merci pour votre confiance!

— *CÈCHÉMOI*
_Originalité, Créativité et Beauté_`,
      enabled: true,
    },
  })

  // 24. PAYMENT_REMINDER_1 (SMS + WHATSAPP) - 1 day after unpaid order
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_1', channel: 'SMS' } },
    update: {
      content: `Rappel: Votre commande {order_number} ({order_total}) attend votre paiement. Orange: +225 07 0346 0426 | MTN/Wave: +225 05 5679 1431

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'PAYMENT_REMINDER_1',
      channel: 'SMS',
      name: 'Rappel paiement 1 - SMS',
      description: 'Envoyé 1 jour après commande impayée',
      recipientType: 'customer',
      content: `Rappel: Votre commande {order_number} ({order_total}) attend votre paiement. Orange: +225 07 0346 0426 | MTN/Wave: +225 05 5679 1431

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_1', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*
⏰ *RAPPEL PAIEMENT*

Bonjour *{customer_name}*,

Votre commande *{order_number}* attend votre paiement.

*Articles:* {order_product_with_qty}
*Total:* {order_total}

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'PAYMENT_REMINDER_1',
      channel: 'WHATSAPP',
      name: 'Rappel paiement 1 - WhatsApp',
      description: 'Envoyé 1 jour après commande impayée',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*
⏰ *RAPPEL PAIEMENT*

Bonjour *{customer_name}*,

Votre commande *{order_number}* attend votre paiement.

*Articles:* {order_product_with_qty}
*Total:* {order_total}

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 25. PAYMENT_REMINDER_2 (SMS + WHATSAPP) - 3 days after unpaid order
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_2', channel: 'SMS' } },
    update: {
      content: `Votre commande {order_number} ({order_total}) expire bientôt. Réglez pour recevoir vos articles!

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'PAYMENT_REMINDER_2',
      channel: 'SMS',
      name: 'Rappel paiement 2 - SMS',
      description: 'Envoyé 3 jours après commande impayée',
      recipientType: 'customer',
      content: `Votre commande {order_number} ({order_total}) expire bientôt. Réglez pour recevoir vos articles!

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_2', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*
⚠️ *COMMANDE EN ATTENTE*

Bonjour *{customer_name}*,

Votre commande *{order_number}* est en attente depuis 3 jours.

*Articles:* {order_product_with_qty}
*Total:* {order_total}

❗ Les stocks peuvent être limités.

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

Besoin d'aide? Répondez à ce message.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'PAYMENT_REMINDER_2',
      channel: 'WHATSAPP',
      name: 'Rappel paiement 2 - WhatsApp',
      description: 'Envoyé 3 jours après commande impayée',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*
⚠️ *COMMANDE EN ATTENTE*

Bonjour *{customer_name}*,

Votre commande *{order_number}* est en attente depuis 3 jours.

*Articles:* {order_product_with_qty}
*Total:* {order_total}

❗ Les stocks peuvent être limités.

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

Besoin d'aide? Répondez à ce message.

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  // 26. PAYMENT_REMINDER_3 (SMS + WHATSAPP) - 5 days after unpaid order
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_3', channel: 'SMS' } },
    update: {
      content: `DERNIER RAPPEL: Commande {order_number} ({order_total}) sera annulée sous 24h sans paiement.

— CÈCHÉMOI`,
    },
    create: {
      trigger: 'PAYMENT_REMINDER_3',
      channel: 'SMS',
      name: 'Rappel paiement 3 - SMS',
      description: 'Envoyé 5 jours après commande impayée - Dernier rappel',
      recipientType: 'customer',
      content: `DERNIER RAPPEL: Commande {order_number} ({order_total}) sera annulée sous 24h sans paiement.

— CÈCHÉMOI`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_3', channel: 'WHATSAPP' } },
    update: {
      content: `*CÈCHÉMOI*
🚨 *DERNIER RAPPEL*

Bonjour *{customer_name}*,

⚠️ Votre commande *{order_number}* sera annulée sous 24h sans paiement.

*Articles:* {order_product_with_qty}
*Total:* {order_total}

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

Un problème? Contactez-nous!

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
    },
    create: {
      trigger: 'PAYMENT_REMINDER_3',
      channel: 'WHATSAPP',
      name: 'Rappel paiement 3 - WhatsApp',
      description: 'Envoyé 5 jours après commande impayée - Dernier rappel',
      recipientType: 'customer',
      content: `*CÈCHÉMOI*
🚨 *DERNIER RAPPEL*

Bonjour *{customer_name}*,

⚠️ Votre commande *{order_number}* sera annulée sous 24h sans paiement.

*Articles:* {order_product_with_qty}
*Total:* {order_total}

*Paiement Mobile Money:*
• Orange: +225 07 0346 0426
• MTN/Wave: +225 05 5679 1431

Un problème? Contactez-nous!

— *CÈCHÉMOI*
+225 07 59 54 54 10`,
      enabled: true,
    },
  })

  console.log('✅ Seeded 52 notification templates (26 triggers x 2 channels)')

  // Seed NotificationSettings
  console.log('🌱 Seeding notification settings...')

  await prisma.notificationSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      adminPhones: ['+2250759545410'],
      adminWhatsApp: '+2250759545410',
      adminEmails: [],
      smsProvider: 'SMSING',
      smsApiKey: process.env.SMSING_SMS_WHATSAPP_BUSINESS_API_KEY || '',
      smsSenderId: 'CECHEMOI',
      whatsappProvider: 'SMSING',
      whatsappApiKey: process.env.SMSING_SMS_WHATSAPP_BUSINESS_API_KEY || '',
      whatsappPhoneId: process.env.SMSING_FROM || 'CECHEMOI',
      emailProvider: 'RESEND',
      emailApiKey: '',
      emailFromAddress: '',
      emailFromName: 'CÈCHÉMOI',
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: false,
      failoverEnabled: true,
      failoverOrder: ['WHATSAPP', 'SMS'],
      testMode: false,
      testPhoneNumber: '',
    },
  })

  console.log('✅ Seeded notification settings')

  // Seed PaymentFollowUpSettings
  console.log('🌱 Seeding payment follow-up settings...')

  await prisma.paymentFollowUpSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      enabled: true,
      reminder1Delay: 24,   // 1 day
      reminder2Delay: 72,   // 3 days
      reminder3Delay: 120,  // 5 days
      reminder1Enabled: true,
      reminder2Enabled: true,
      reminder3Enabled: true,
    },
  })

  console.log('✅ Seeded payment follow-up settings')
  console.log('🎉 Notification seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding notifications:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
