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
    update: {},
    create: {
      trigger: 'ORDER_PLACED',
      channel: 'SMS',
      name: 'Order Placed - SMS',
      description: 'Sent when customer places an order',
      recipientType: 'customer',
      content: `Bonjour {customer_name},
Votre commande de vin {order_product_with_qty} a été créée et est en cours de traitement. Commande: {order_number}. Montant: {order_total}.

WhatsApp: https://wa.me/2250556791431
Site: www.cave-express.ci`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_PLACED', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'ORDER_PLACED',
      channel: 'WHATSAPP',
      name: 'Order Placed - WhatsApp',
      description: 'Sent when customer places an order',
      recipientType: 'customer',
      content: `*[CaveExpress]*
Bonjour *{billing_first_name}*, Bienvenu(e) chez *CAVE EXPRESS*. _La QUALITÉ du vin, livrée à votre porte._

Votre *nouvelle commande* de vin *{order_product_with_qty}* numéro: *{order_number}*, Montant: *{order_total}* a été bien reçue.

*DETAILS DE VOTRE COMMANDE* :
• Date: {order_date}
• Total: {order_total}
• Nom: {billing_first_name} {billing_last_name}
• Téléphone: {billing_phone}
• Adresse: {billing_address}

*NUMEROS MOBILE DE PAIEMENT*
Veuillez effectuer votre dépôt sur le numéro correspondant:
ORANGE MONEY: +225 07 0346 0426
MTN MOMO: +225 05 5679 1431
WAVE: +225 05 5679 1431

N'hésitez pas à répondre à ce message si vous avez des questions.

++++++++++++++++++++++
Adresse: Faya Cité Genie 2000, Abidjan
Service Client 7j/7: +225 0556791431
Site web: www.cave-express.ci
WhatsApp: https://wa.me/2250556791431
Facebook: @cave express
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 2. PAYMENT_RECEIVED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_RECEIVED', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'PAYMENT_RECEIVED',
      channel: 'SMS',
      name: 'Payment Received - SMS',
      description: 'Sent when payment is confirmed',
      recipientType: 'customer',
      content: `Le paiement de votre commande {order_number} montant {order_total} pour le(s) vin(s) {order_product} a été reçu. Votre vin arrive très bientôt ! Merci !

WhatsApp: https://wa.me/2250556791431
Site: www.cave-express.ci`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_RECEIVED', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'PAYMENT_RECEIVED',
      channel: 'WHATSAPP',
      name: 'Payment Received - WhatsApp',
      description: 'Sent when payment is confirmed',
      recipientType: 'customer',
      content: `Bonjour *{customer_name}*,

Le paiement de votre commande *{order_number}* montant *{order_total}* pour le(s) vin(s) *{order_product}* a été reçu. La livraison de vos vins est maintenant en cours de préparation. Nous vous tiendrons informé de l'avancement.

Un grand merci pour votre fidélité. Votre vin arrive très bientôt !

++++++++++++++++++++++
*Cave Express*,
_La QUALITÉ du vin, livrée à votre porte. Livraison rapide partout à Abidjan. Vin Blanc, Rouge, Rosé, Mousseux, Moelleux, Sec Abidjan Côte d'Ivoire_
Adresse: *Faya Cité Genie 2000, Abidjan Côte d'Ivoire*
Service Client 7j/7: *+225 0556791431*
Site web: https://www.cave-express.ci
WhatsApp: *https://wa.me/2250556791431*
Facebook: *@cave express*
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 3. ORDER_SHIPPED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_SHIPPED', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'ORDER_SHIPPED',
      channel: 'SMS',
      name: 'Order Shipped - SMS',
      description: 'Sent when order is shipped',
      recipientType: 'customer',
      content: `Votre commande #{order_number} pour le(s) vin(s): {order_product} a été récupérée et est en cours de livraison. Numéro de suivi: {tracking_number}. Merci pour votre patience.

WhatsApp: https://wa.me/2250556791431
Site: www.cave-express.ci`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_SHIPPED', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'ORDER_SHIPPED',
      channel: 'WHATSAPP',
      name: 'Order Shipped - WhatsApp',
      description: 'Sent when order is shipped',
      recipientType: 'customer',
      content: `Bonjour *{customer_name}*,

Votre commande *#{order_number}* pour le(s) vin(s): *{order_product}* a été récupérée et est en cours de livraison.

📦 *Numéro de suivi*: {tracking_number}
🚚 *Livraison estimée*: {delivery_date}

Merci pour votre patience.

++++++++++++++++++++++
*Cave Express*,
_La QUALITÉ du vin, livrée à votre porte. Livraison rapide partout à Abidjan._
Adresse: *Faya Cité Genie 2000, Abidjan*
Service Client 7j/7: *+225 0556791431*
Site web: https://www.cave-express.ci
WhatsApp: *https://wa.me/2250556791431*
Facebook: *@cave express*
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 4. ORDER_DELIVERED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_DELIVERED', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'ORDER_DELIVERED',
      channel: 'SMS',
      name: 'Order Delivered - SMS',
      description: 'Sent when order is delivered',
      recipientType: 'customer',
      content: `Votre commande de vin {order_product}, montant: {order_total} a été livrée avec succès! Cave Express vous remercie.

WhatsApp: https://wa.me/2250556791431
Site: www.cave-express.ci`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_DELIVERED', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'ORDER_DELIVERED',
      channel: 'WHATSAPP',
      name: 'Order Delivered - WhatsApp',
      description: 'Sent when order is delivered',
      recipientType: 'customer',
      content: `Bonjour *{customer_name}*,

✅ Votre commande de vin *{order_product}*, montant: *{order_total}* a été livrée avec succès!

Merci pour votre achat et votre confiance. Nous espérons que vous apprécierez vos vins!

💬 N'hésitez pas à laisser un avis sur notre site.

++++++++++++++++++++++
*Cave Express*,
_La QUALITÉ du vin, livrée à votre porte._
Adresse: *Faya Cité Genie 2000, Abidjan*
Service Client 7j/7: *+225 0556791431*
Site web: https://www.cave-express.ci
WhatsApp: *https://wa.me/2250556791431*
Facebook: *@cave express*
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 5. ORDER_CANCELLED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_CANCELLED', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'ORDER_CANCELLED',
      channel: 'SMS',
      name: 'Order Cancelled - SMS',
      description: 'Sent when order is cancelled',
      recipientType: 'customer',
      content: `Votre commande #{order_number} a été annulée. Si vous n'êtes pas à l'origine de cette annulation, contactez-nous au +225 0556791431.

Site: www.cave-express.ci`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_CANCELLED', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'ORDER_CANCELLED',
      channel: 'WHATSAPP',
      name: 'Order Cancelled - WhatsApp',
      description: 'Sent when order is cancelled',
      recipientType: 'customer',
      content: `Bonjour *{customer_name}*,

Votre commande *#{order_number}* d'un montant de *{order_total}* a été annulée.

Si vous n'êtes pas à l'origine de cette annulation ou si vous avez des questions, n'hésitez pas à nous contacter.

++++++++++++++++++++++
*Cave Express*
Service Client 7j/7: *+225 0556791431*
Site web: https://www.cave-express.ci
WhatsApp: *https://wa.me/2250556791431*
++++++++++++++++++++++`,
      enabled: false,
    },
  })

  // 6. ORDER_REFUNDED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_REFUNDED', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'ORDER_REFUNDED',
      channel: 'SMS',
      name: 'Order Refunded - SMS',
      description: 'Sent when refund is processed',
      recipientType: 'customer',
      content: `Un remboursement de {order_total} pour votre commande #{order_number} a été traité. Les fonds seront disponibles sous 3-5 jours ouvrables.

Contact: +225 0556791431`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ORDER_REFUNDED', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'ORDER_REFUNDED',
      channel: 'WHATSAPP',
      name: 'Order Refunded - WhatsApp',
      description: 'Sent when refund is processed',
      recipientType: 'customer',
      content: `Bonjour *{customer_name}*,

Un remboursement de *{order_total}* pour votre commande *#{order_number}* a été traité avec succès.

💰 *Montant remboursé*: {order_total}
⏱️ *Délai*: 3-5 jours ouvrables
💳 *Méthode*: {payment_method}

Les fonds seront crédités sur votre compte sous peu.

Si vous avez des questions, n'hésitez pas à nous contacter.

++++++++++++++++++++++
*Cave Express*
Service Client 7j/7: *+225 0556791431*
Site web: https://www.cave-express.ci
++++++++++++++++++++++`,
      enabled: false,
    },
  })

  // 7. PAYMENT_FAILED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_FAILED', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'PAYMENT_FAILED',
      channel: 'SMS',
      name: 'Payment Failed - SMS',
      description: 'Sent when payment fails',
      recipientType: 'customer',
      content: `Le paiement de votre commande #{order_number} a échoué. Veuillez réessayer ou contactez-nous au +225 0556791431.

Site: www.cave-express.ci`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_FAILED', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'PAYMENT_FAILED',
      channel: 'WHATSAPP',
      name: 'Payment Failed - WhatsApp',
      description: 'Sent when payment fails',
      recipientType: 'customer',
      content: `Bonjour *{customer_name}*,

❌ Le paiement de votre commande *#{order_number}* d'un montant de *{order_total}* n'a pas pu être traité.

*Que faire?*
1. Vérifiez votre solde
2. Réessayez le paiement
3. Contactez-nous pour assistance

*NUMEROS MOBILE DE PAIEMENT*
ORANGE MONEY: +225 07 0346 0426
MTN MOMO: +225 05 5679 1431
WAVE: +225 05 5679 1431

++++++++++++++++++++++
*Cave Express*
Service Client 7j/7: *+225 0556791431*
Site web: https://www.cave-express.ci
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 8. CUSTOMER_NOTE (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'CUSTOMER_NOTE', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'CUSTOMER_NOTE',
      channel: 'SMS',
      name: 'Customer Note - SMS',
      description: 'Sent when admin adds a customer note',
      recipientType: 'customer',
      content: `[Cave Express] Note concernant votre commande #{order_number}: {note_content}

Contact: +225 0556791431`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'CUSTOMER_NOTE', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'CUSTOMER_NOTE',
      channel: 'WHATSAPP',
      name: 'Customer Note - WhatsApp',
      description: 'Sent when admin adds a customer note',
      recipientType: 'customer',
      content: `Bonjour *{customer_name}*,

📝 *Note concernant votre commande #{order_number}*:

{note_content}

Si vous avez des questions, n'hésitez pas à répondre à ce message.

++++++++++++++++++++++
*Cave Express*
Service Client 7j/7: *+225 0556791431*
++++++++++++++++++++++`,
      enabled: false,
    },
  })

  // 9. NEW_ACCOUNT (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_ACCOUNT', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'NEW_ACCOUNT',
      channel: 'SMS',
      name: 'New Account - SMS',
      description: 'Sent when customer registers',
      recipientType: 'customer',
      content: `Bienvenue chez Cave Express! Votre compte a été créé avec succès. Découvrez nos vins sur www.cave-express.ci

Téléphone: {billing_phone}`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_ACCOUNT', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'NEW_ACCOUNT',
      channel: 'WHATSAPP',
      name: 'New Account - WhatsApp',
      description: 'Sent when customer registers',
      recipientType: 'customer',
      content: `*Bienvenue chez Cave Express!* 🍷

Bonjour *{customer_name}*,

Votre compte a été créé avec succès!

Vous pouvez maintenant:
✅ Commander nos vins premium
✅ Suivre vos commandes
✅ Accumuler des points de fidélité
✅ Profiter d'offres exclusives

*Votre numéro*: {billing_phone}

Découvrez notre sélection sur notre site web.

++++++++++++++++++++++
*Cave Express*
_La QUALITÉ du vin, livrée à votre porte._
Site web: https://www.cave-express.ci
WhatsApp: *https://wa.me/2250556791431*
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 10. PASSWORD_RESET (SMS + WHATSAPP) - For admin only
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PASSWORD_RESET', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'PASSWORD_RESET',
      channel: 'SMS',
      name: 'Password Reset - SMS',
      description: 'Sent when password reset is requested (admin only)',
      recipientType: 'customer',
      content: `[Cave Express] Code de réinitialisation: {reset_code}

Utilisez ce code pour réinitialiser votre mot de passe. Valide 15 minutes.

Site: www.cave-express.ci`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PASSWORD_RESET', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'PASSWORD_RESET',
      channel: 'WHATSAPP',
      name: 'Password Reset - WhatsApp',
      description: 'Sent when password reset is requested (admin only)',
      recipientType: 'customer',
      content: `Bonjour *{customer_name}*,

Vous avez demandé la réinitialisation de votre mot de passe.

🔐 *Code de réinitialisation*: {reset_code}

⏱️ Ce code est valide pendant 15 minutes.

Si vous n'avez pas fait cette demande, ignorez ce message.

++++++++++++++++++++++
*Cave Express*
Sécurité: +225 0556791431
Site web: https://www.cave-express.ci
++++++++++++++++++++++`,
      enabled: false,
    },
  })

  // 11. LOYALTY_POINTS_EARNED (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'LOYALTY_POINTS_EARNED', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'LOYALTY_POINTS_EARNED',
      channel: 'SMS',
      name: 'Loyalty Points Earned - SMS',
      description: 'Sent when customer earns loyalty points',
      recipientType: 'customer',
      content: `Félicitations! Vous avez gagné {points_earned} points de fidélité. Solde total: {points_balance} points.

www.cave-express.ci`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'LOYALTY_POINTS_EARNED', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'LOYALTY_POINTS_EARNED',
      channel: 'WHATSAPP',
      name: 'Loyalty Points Earned - WhatsApp',
      description: 'Sent when customer earns loyalty points',
      recipientType: 'customer',
      content: `🎉 *Félicitations {customer_name}!*

Vous avez gagné *{points_earned} points de fidélité* suite à votre commande #{order_number}.

💰 *Solde total*: {points_balance} points
🎁 *Équivalent*: {points_value} CFA de réduction

Utilisez vos points lors de votre prochain achat!

++++++++++++++++++++++
*Cave Express*
Site web: https://www.cave-express.ci
++++++++++++++++++++++`,
      enabled: false,
    },
  })

  // 12. ABANDONED_CART (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ABANDONED_CART', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'ABANDONED_CART',
      channel: 'SMS',
      name: 'Abandoned Cart - SMS',
      description: 'Sent 1 hour after cart abandonment',
      recipientType: 'customer',
      content: `Vous avez oublié quelque chose! {cart_items_count} article(s) vous attend(ent) dans votre panier. Finalisez votre commande maintenant.

www.cave-express.ci`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'ABANDONED_CART', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'ABANDONED_CART',
      channel: 'WHATSAPP',
      name: 'Abandoned Cart - WhatsApp',
      description: 'Sent 1 hour after cart abandonment',
      recipientType: 'customer',
      content: `Bonjour *{customer_name}*,

🛒 Vous avez laissé *{cart_items_count} article(s)* dans votre panier:

{cart_items_list}

*Total*: {cart_total}

Ne manquez pas ces vins! Finalisez votre commande maintenant et profitez de la livraison rapide.

🎁 *Offre spéciale*: -10% avec le code RETOUR10

++++++++++++++++++++++
*Cave Express*
Site web: https://www.cave-express.ci
WhatsApp: *https://wa.me/2250556791431*
++++++++++++++++++++++`,
      enabled: false,
    },
  })

  // 13. BACK_IN_STOCK (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'BACK_IN_STOCK', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'BACK_IN_STOCK',
      channel: 'SMS',
      name: 'Back in Stock - SMS',
      description: 'Sent when product is back in stock',
      recipientType: 'customer',
      content: `Bonne nouvelle! Le vin "{product_name}" est de nouveau en stock. Commandez vite avant rupture!

www.cave-express.ci`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'BACK_IN_STOCK', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'BACK_IN_STOCK',
      channel: 'WHATSAPP',
      name: 'Back in Stock - WhatsApp',
      description: 'Sent when product is back in stock',
      recipientType: 'customer',
      content: `*Bonne nouvelle {customer_name}!* 🍷

Le vin *"{product_name}"* que vous attendiez est de nouveau en stock!

💰 *Prix*: {product_price}
📦 *Quantité disponible*: {product_stock}

⚡ Commandez vite avant rupture!

++++++++++++++++++++++
*Cave Express*
Site web: https://www.cave-express.ci
++++++++++++++++++++++`,
      enabled: false,
    },
  })

  // 14. NEW_ORDER_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_ORDER_ADMIN', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'NEW_ORDER_ADMIN',
      channel: 'SMS',
      name: 'New Order Alert - Admin SMS',
      description: 'Sent to admin when new order is placed',
      recipientType: 'admin',
      content: `[CaveExpress] - NOTIFICATION ADMIN: Nouvelle commande #{order_number} - de {customer_name} - montant {order_total}. Veuillez traiter.`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_ORDER_ADMIN', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'NEW_ORDER_ADMIN',
      channel: 'WHATSAPP',
      name: 'New Order Alert - Admin WhatsApp',
      description: 'Sent to admin when new order is placed',
      recipientType: 'admin',
      content: `+++++++++++++++++
[CaveExpress] - NOTIFICATION ADMIN
🆕 NOUVELLE COMMANDE
+++++++++++++++++

📋 *Commande ID*: #{order_number}
💰 *Montant*: {order_total}
📊 *Statut*: {order_status}
📅 *Date*: {order_date}

👤 *CLIENT*:
• Nom: {billing_first_name} {billing_last_name}
• Téléphone: {billing_phone}
• Adresse: {billing_address}

🍷 *ARTICLES COMMANDÉS*:
{order_product_with_qty}

💳 *PAIEMENT*:
• Méthode: {payment_method}
• Statut: {payment_status}

⚠️ *ACTION REQUISE*: Traiter cette commande

++++++++++++++++++++++
Cave Express - Admin Panel
Site: https://www.cave-express.ci/admin
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 15. PAYMENT_RECEIVED_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_RECEIVED_ADMIN', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'PAYMENT_RECEIVED_ADMIN',
      channel: 'SMS',
      name: 'Payment Received - Admin SMS',
      description: 'Sent to admin when payment is confirmed',
      recipientType: 'admin',
      content: `💰 PAIEMENT RECU #{order_number} - {order_total} - {customer_name}`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_RECEIVED_ADMIN', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'PAYMENT_RECEIVED_ADMIN',
      channel: 'WHATSAPP',
      name: 'Payment Received - Admin WhatsApp',
      description: 'Sent to admin when payment is confirmed',
      recipientType: 'admin',
      content: `+++++++++++++++++
✅ *PAIEMENT CONFIRMÉ*
[CaveExpress] - NOTIFICATION ADMIN
+++++++++++++++++

💰 *Montant reçu*: {order_total}
📋 *Commande*: #{order_number}
💳 *Méthode*: {payment_method}
📅 *Date*: {order_date}

👤 *CLIENT*:
• Nom: {billing_first_name} {billing_last_name}
• Téléphone: {billing_phone}

🍷 *ARTICLES*:
{order_product_with_qty}

⚠️ *PROCHAINE ÉTAPE*: Préparer la livraison

++++++++++++++++++++++
Cave Express - Admin Panel
Site: https://www.cave-express.ci/admin
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 16. LOW_STOCK_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'LOW_STOCK_ADMIN', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'LOW_STOCK_ADMIN',
      channel: 'SMS',
      name: 'Low Stock Alert - Admin SMS',
      description: 'Sent to admin when product stock is low',
      recipientType: 'admin',
      content: `⚠️ ALERTE STOCK BAS: "{product_name}" - Stock restant: {low_stock_quantity} unités. Réapprovisionner.`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'LOW_STOCK_ADMIN', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'LOW_STOCK_ADMIN',
      channel: 'WHATSAPP',
      name: 'Low Stock Alert - Admin WhatsApp',
      description: 'Sent to admin when product stock is low',
      recipientType: 'admin',
      content: `+++++++++++++++++
⚠️ *ALERTE STOCK BAS*
[CaveExpress] - NOTIFICATION ADMIN
+++++++++++++++++

🍷 *Produit*: {product_name}
📦 *Stock actuel*: {low_stock_quantity} unités
⚠️ *Seuil d'alerte*: {low_stock_threshold} unités

🔴 *ACTION REQUISE*: Réapprovisionner ce produit rapidement pour éviter une rupture de stock.

++++++++++++++++++++++
Cave Express - Gestion Inventaire
Site: https://www.cave-express.ci/admin/inventory
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 17. OUT_OF_STOCK_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'OUT_OF_STOCK_ADMIN', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'OUT_OF_STOCK_ADMIN',
      channel: 'SMS',
      name: 'Out of Stock Alert - Admin SMS',
      description: 'Sent to admin when product is out of stock',
      recipientType: 'admin',
      content: `🔴 RUPTURE DE STOCK: "{product_name}" est en rupture de stock. Action immédiate requise.`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'OUT_OF_STOCK_ADMIN', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'OUT_OF_STOCK_ADMIN',
      channel: 'WHATSAPP',
      name: 'Out of Stock Alert - Admin WhatsApp',
      description: 'Sent to admin when product is out of stock',
      recipientType: 'admin',
      content: `+++++++++++++++++
🔴 *RUPTURE DE STOCK*
[CaveExpress] - NOTIFICATION ADMIN
+++++++++++++++++

🍷 *Produit*: {product_name}
📦 *Stock actuel*: 0 unités

⚠️ *IMPACT*:
• Produit invisible sur le site
• Perte de ventes potentielles
• Clients sur liste d'attente

🔴 *ACTION URGENTE*: Réapprovisionner immédiatement

++++++++++++++++++++++
Cave Express - Gestion Inventaire
Site: https://www.cave-express.ci/admin/inventory
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 18. NEW_CUSTOMER_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_CUSTOMER_ADMIN', channel: 'SMS' } },
    update: {
      name: 'New Customer - Admin SMS',
      description: 'Sent to admin when new customer registers',
      content: `✅ Nouveau client enregistré: {customer_name} - {billing_phone} - {billing_city}`,
      enabled: true,
    },
    create: {
      trigger: 'NEW_CUSTOMER_ADMIN',
      channel: 'SMS',
      name: 'New Customer - Admin SMS',
      description: 'Sent to admin when new customer registers',
      recipientType: 'admin',
      content: `✅ Nouveau client enregistré: {customer_name} - {billing_phone} - {billing_city}`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_CUSTOMER_ADMIN', channel: 'WHATSAPP' } },
    update: {
      name: 'New Customer - Admin WhatsApp',
      description: 'Sent to admin when new customer registers',
      content: `+++++++++++++++++
✅ *NOUVEAU CLIENT*
[CaveExpress] - NOTIFICATION ADMIN
+++++++++++++++++

👤 *Client*:
• Nom: {customer_name}
• Téléphone: {billing_phone}
• Email: {billing_email}
• Ville: {billing_city}
• Pays: {billing_country}

📅 *Date d'inscription*: {registration_date}

++++++++++++++++++++++
Cave Express - Gestion Clients
Total clients: {total_customers}
++++++++++++++++++++++`,
      enabled: true,
    },
    create: {
      trigger: 'NEW_CUSTOMER_ADMIN',
      channel: 'WHATSAPP',
      name: 'New Customer - Admin WhatsApp',
      description: 'Sent to admin when new customer registers',
      recipientType: 'admin',
      content: `+++++++++++++++++
✅ *NOUVEAU CLIENT*
[CaveExpress] - NOTIFICATION ADMIN
+++++++++++++++++

👤 *Client*:
• Nom: {customer_name}
• Téléphone: {billing_phone}
• Email: {billing_email}
• Ville: {billing_city}
• Pays: {billing_country}

📅 *Date d'inscription*: {registration_date}

++++++++++++++++++++++
Cave Express - Gestion Clients
Total clients: {total_customers}
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 19. NEW_REVIEW_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_REVIEW_ADMIN', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'NEW_REVIEW_ADMIN',
      channel: 'SMS',
      name: 'New Review - Admin SMS',
      description: 'Sent to admin when new review is submitted',
      recipientType: 'admin',
      content: `⭐ Nouvel avis soumis par {customer_name} sur "{product_name}" - {rating}/5 étoiles. Modération requise.`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'NEW_REVIEW_ADMIN', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'NEW_REVIEW_ADMIN',
      channel: 'WHATSAPP',
      name: 'New Review - Admin WhatsApp',
      description: 'Sent to admin when new review is submitted',
      recipientType: 'admin',
      content: `+++++++++++++++++
⭐ *NOUVEL AVIS CLIENT*
[CaveExpress] - NOTIFICATION ADMIN
+++++++++++++++++

🍷 *Produit*: {product_name}
👤 *Client*: {customer_name}
⭐ *Note*: {rating}/5 étoiles
✅ *Achat vérifié*: {verified_purchase}

💬 *Commentaire*:
"{review_comment}"

⚠️ *ACTION REQUISE*: Modérer cet avis

++++++++++++++++++++++
Cave Express - Gestion Avis
Site: https://www.cave-express.ci/admin/reviews
++++++++++++++++++++++`,
      enabled: false,
    },
  })

  // 20. DAILY_REPORT_ADMIN (SMS + WHATSAPP)
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'DAILY_REPORT_ADMIN', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'DAILY_REPORT_ADMIN',
      channel: 'SMS',
      name: 'Daily Report - Admin SMS',
      description: 'Sent daily at 8 PM to admin',
      recipientType: 'admin',
      content: `📊 Rapport journalier: {orders_count} commandes - {total_revenue} CFA - {new_customers} nouveaux clients`,
      enabled: false,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'DAILY_REPORT_ADMIN', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'DAILY_REPORT_ADMIN',
      channel: 'WHATSAPP',
      name: 'Daily Report - Admin WhatsApp',
      description: 'Sent daily at 8 PM to admin',
      recipientType: 'admin',
      content: `+++++++++++++++++
📊 *RAPPORT JOURNALIER*
[CaveExpress] - {report_date}
+++++++++++++++++

💰 *CHIFFRE D'AFFAIRES*: {total_revenue} CFA

📦 *COMMANDES*:
• Total: {orders_count}
• En attente: {pending_orders}
• Traitées: {processing_orders}
• Livrées: {delivered_orders}
• Annulées: {cancelled_orders}

👥 *CLIENTS*:
• Nouveaux: {new_customers}
• Total: {total_customers}

🍷 *PRODUITS*:
• Ventes: {products_sold} unités
• Stock bas: {low_stock_products}

++++++++++++++++++++++
Cave Express - Tableau de Bord
Site: https://www.cave-express.ci/admin
++++++++++++++++++++++`,
      enabled: false,
    },
  })

  // 21. INVOICE_CREATED (SMS + WHATSAPP) - Sent with invoice link
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'INVOICE_CREATED', channel: 'SMS' } },
    update: {
      name: 'Invoice Created - SMS',
      description: 'Sent when invoice is generated with link',
      content: `[CaveExpress] Votre facture #{invoice_number} est disponible. Montant: {order_total}. Consultez-la ici: {invoice_url}

Contact: +225 0556791431`,
      enabled: true,
    },
    create: {
      trigger: 'INVOICE_CREATED',
      channel: 'SMS',
      name: 'Invoice Created - SMS',
      description: 'Sent when invoice is generated with link',
      recipientType: 'customer',
      content: `[CaveExpress] Votre facture #{invoice_number} est disponible. Montant: {order_total}. Consultez-la ici: {invoice_url}

Contact: +225 0556791431`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'INVOICE_CREATED', channel: 'WHATSAPP' } },
    update: {
      name: 'Invoice Created - WhatsApp',
      description: 'Sent when invoice is generated with link in message',
      content: `*[CaveExpress]*
📄 *VOTRE FACTURE EST PRÊTE*

Bonjour *{customer_name}*,

Votre facture pour la commande *#{order_number}* est maintenant disponible.

*Détails de la facture:*
• Numéro: *{invoice_number}*
• Montant: *{order_total}*
• Date: {order_date}

📥 *Télécharger votre facture PDF:*
{invoice_url}

++++++++++++++++++++++
*Cave Express*
_La QUALITÉ du vin, livrée à votre porte._
Service Client: *+225 0556791431*
++++++++++++++++++++++`,
      enabled: true,
    },
    create: {
      trigger: 'INVOICE_CREATED',
      channel: 'WHATSAPP',
      name: 'Invoice Created - WhatsApp',
      description: 'Sent when invoice is generated with link in message',
      recipientType: 'customer',
      content: `*[CaveExpress]*
📄 *VOTRE FACTURE EST PRÊTE*

Bonjour *{customer_name}*,

Votre facture pour la commande *#{order_number}* est maintenant disponible.

*Détails de la facture:*
• Numéro: *{invoice_number}*
• Montant: *{order_total}*
• Date: {order_date}

📥 *Télécharger votre facture PDF:*
{invoice_url}

++++++++++++++++++++++
*Cave Express*
_La QUALITÉ du vin, livrée à votre porte._
Service Client: *+225 0556791431*
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 22. INVOICE_PAID (SMS + WHATSAPP) - Sent when invoice is marked paid
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'INVOICE_PAID', channel: 'SMS' } },
    update: {
      name: 'Invoice Paid - SMS',
      description: 'Sent when invoice is marked as paid',
      content: `[CaveExpress] Paiement reçu! Facture #{invoice_number} - {order_total}. Merci! Votre facture acquittée: {invoice_url}

Contact: +225 0556791431`,
      enabled: true,
    },
    create: {
      trigger: 'INVOICE_PAID',
      channel: 'SMS',
      name: 'Invoice Paid - SMS',
      description: 'Sent when invoice is marked as paid',
      recipientType: 'customer',
      content: `[CaveExpress] Paiement reçu! Facture #{invoice_number} - {order_total}. Merci! Votre facture acquittée: {invoice_url}

Contact: +225 0556791431`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'INVOICE_PAID', channel: 'WHATSAPP' } },
    update: {
      name: 'Invoice Paid - WhatsApp',
      description: 'Sent when invoice is marked as paid with link in message',
      content: `*[CaveExpress]*
✅ *FACTURE ACQUITTÉE*

Bonjour *{customer_name}*,

Merci! Votre paiement pour la facture *#{invoice_number}* a été confirmé.

*Récapitulatif:*
• Commande: *#{order_number}*
• Montant payé: *{order_total}*
• Méthode: {payment_method}

📥 *Télécharger votre facture acquittée:*
{invoice_url}

Votre commande est maintenant en préparation. Nous vous tiendrons informé de l'expédition.

++++++++++++++++++++++
*Cave Express*
_La QUALITÉ du vin, livrée à votre porte._
Service Client: *+225 0556791431*
++++++++++++++++++++++`,
      enabled: true,
    },
    create: {
      trigger: 'INVOICE_PAID',
      channel: 'WHATSAPP',
      name: 'Invoice Paid - WhatsApp',
      description: 'Sent when invoice is marked as paid with link in message',
      recipientType: 'customer',
      content: `*[CaveExpress]*
✅ *FACTURE ACQUITTÉE*

Bonjour *{customer_name}*,

Merci! Votre paiement pour la facture *#{invoice_number}* a été confirmé.

*Récapitulatif:*
• Commande: *#{order_number}*
• Montant payé: *{order_total}*
• Méthode: {payment_method}

📥 *Télécharger votre facture acquittée:*
{invoice_url}

Votre commande est maintenant en préparation. Nous vous tiendrons informé de l'expédition.

++++++++++++++++++++++
*Cave Express*
_La QUALITÉ du vin, livrée à votre porte._
Service Client: *+225 0556791431*
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 23. REVIEW_REQUEST (SMS + WHATSAPP) - Ask for Trustpilot review 24h after delivery
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'REVIEW_REQUEST', channel: 'SMS' } },
    update: {
      description: 'Sent 24 hours after delivery to ask for Trustpilot review',
    },
    create: {
      trigger: 'REVIEW_REQUEST',
      channel: 'SMS',
      name: 'Review Request - SMS',
      description: 'Sent 24 hours after delivery to ask for Trustpilot review',
      recipientType: 'customer',
      content: `Vous avez goûté un vin de Cave Express? Dites-nous tout! Laissez votre avis: https://fr.trustpilot.com/evaluate/cave-express.ci Merci!`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'REVIEW_REQUEST', channel: 'WHATSAPP' } },
    update: {
      description: 'Sent 24 hours after delivery to ask for Trustpilot review',
    },
    create: {
      trigger: 'REVIEW_REQUEST',
      channel: 'WHATSAPP',
      name: 'Review Request - WhatsApp',
      description: 'Sent 24 hours after delivery to ask for Trustpilot review',
      recipientType: 'customer',
      content: `Vous avez goûté un vin de *Cave Express* ? 😋
Dites-nous tout : le goût, la livraison, l'expérience… On veut tout savoir ! 🍷

👉 *Cliquez ici pour laisser votre avis:*
https://fr.trustpilot.com/evaluate/cave-express.ci

💡 Chaque avis nous aide à sélectionner encore de meilleurs vins pour vous. 🥂

++++++++++++++++++++++
*Cave Express*
_La QUALITÉ du vin, livrée à votre porte._
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 24. PAYMENT_REMINDER_1 (SMS + WHATSAPP) - 1 day after unpaid order
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_1', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'PAYMENT_REMINDER_1',
      channel: 'SMS',
      name: 'Payment Reminder 1 - SMS',
      description: 'Sent 1 day after unpaid order',
      recipientType: 'customer',
      content: `[CaveExpress] Rappel: Votre commande #{order_number} ({order_total}) est en attente de paiement. Payez maintenant pour recevoir vos vins!

ORANGE: +225 07 0346 0426
MTN/WAVE: +225 05 5679 1431`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_1', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'PAYMENT_REMINDER_1',
      channel: 'WHATSAPP',
      name: 'Payment Reminder 1 - WhatsApp',
      description: 'Sent 1 day after unpaid order',
      recipientType: 'customer',
      content: `*[CaveExpress]*
⏰ *RAPPEL DE PAIEMENT*

Bonjour *{customer_name}*,

Votre commande *#{order_number}* est toujours en attente de paiement.

*Détails:*
• Produits: {order_product_with_qty}
• Montant: *{order_total}*

*MOYENS DE PAIEMENT:*
💰 ORANGE MONEY: +225 07 0346 0426
💰 MTN MOMO: +225 05 5679 1431
💰 WAVE: +225 05 5679 1431

Réglez maintenant pour recevoir vos vins rapidement! 🍷

++++++++++++++++++++++
*Cave Express*
Service Client: *+225 0556791431*
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 25. PAYMENT_REMINDER_2 (SMS + WHATSAPP) - 3 days after unpaid order
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_2', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'PAYMENT_REMINDER_2',
      channel: 'SMS',
      name: 'Payment Reminder 2 - SMS',
      description: 'Sent 3 days after unpaid order',
      recipientType: 'customer',
      content: `[CaveExpress] Votre commande #{order_number} expire bientôt! Montant: {order_total}. Payez vite pour ne pas manquer vos vins!

Contact: +225 0556791431`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_2', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'PAYMENT_REMINDER_2',
      channel: 'WHATSAPP',
      name: 'Payment Reminder 2 - WhatsApp',
      description: 'Sent 3 days after unpaid order',
      recipientType: 'customer',
      content: `*[CaveExpress]*
⚠️ *COMMANDE EN ATTENTE - 2ème Rappel*

Bonjour *{customer_name}*,

Votre commande *#{order_number}* est en attente de paiement depuis 3 jours.

*Récapitulatif:*
• Produits: {order_product_with_qty}
• Total: *{order_total}*

❗ *Attention*: Les stocks peuvent être limités. Réglez votre commande pour garantir la disponibilité de vos vins.

*MOYENS DE PAIEMENT:*
💰 ORANGE MONEY: +225 07 0346 0426
💰 MTN MOMO: +225 05 5679 1431
💰 WAVE: +225 05 5679 1431

Besoin d'aide? Répondez à ce message. 💬

++++++++++++++++++++++
*Cave Express*
Service Client: *+225 0556791431*
++++++++++++++++++++++`,
      enabled: true,
    },
  })

  // 26. PAYMENT_REMINDER_3 (SMS + WHATSAPP) - 5 days after unpaid order
  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_3', channel: 'SMS' } },
    update: {},
    create: {
      trigger: 'PAYMENT_REMINDER_3',
      channel: 'SMS',
      name: 'Payment Reminder 3 - SMS',
      description: 'Sent 5 days after unpaid order - Final reminder',
      recipientType: 'customer',
      content: `[CaveExpress] DERNIER RAPPEL: Commande #{order_number} ({order_total}) sera annulée sous 24h sans paiement. Agissez maintenant!

Contact: +225 0556791431`,
      enabled: true,
    },
  })

  await prisma.notificationTemplate.upsert({
    where: { trigger_channel: { trigger: 'PAYMENT_REMINDER_3', channel: 'WHATSAPP' } },
    update: {},
    create: {
      trigger: 'PAYMENT_REMINDER_3',
      channel: 'WHATSAPP',
      name: 'Payment Reminder 3 - WhatsApp',
      description: 'Sent 5 days after unpaid order - Final reminder',
      recipientType: 'customer',
      content: `*[CaveExpress]*
🚨 *DERNIER RAPPEL - COMMANDE EN ATTENTE*

Bonjour *{customer_name}*,

⚠️ *Votre commande #{order_number} sera automatiquement annulée sous 24h* si le paiement n'est pas effectué.

*Votre commande:*
• Produits: {order_product_with_qty}
• Total: *{order_total}*

*Pour conserver votre commande, réglez maintenant:*
💰 ORANGE MONEY: +225 07 0346 0426
💰 MTN MOMO: +225 05 5679 1431
💰 WAVE: +225 05 5679 1431

❓ Un problème avec le paiement? Contactez-nous, nous sommes là pour vous aider!

++++++++++++++++++++++
*Cave Express*
Service Client 7j/7: *+225 0556791431*
WhatsApp: https://wa.me/2250556791431
++++++++++++++++++++++`,
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
      adminPhones: ['+2250556791431'],
      adminWhatsApp: '+2250556791431',
      adminEmails: [],
      smsProvider: 'SMSING',
      smsApiKey: process.env.SMSING_SMS_WHATSAPP_BUSINESS_API_KEY || '',
      smsSenderId: 'CAVEEXPRESS',
      whatsappProvider: 'SMSING',
      whatsappApiKey: process.env.SMSING_SMS_WHATSAPP_BUSINESS_API_KEY || '',
      whatsappPhoneId: process.env.SMSING_FROM || 'CaveExpress',
      emailProvider: 'RESEND',
      emailApiKey: '',
      emailFromAddress: '',
      emailFromName: 'Cave Express',
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
