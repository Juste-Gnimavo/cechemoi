# Notification Templates - CAVE EXPRESS
## WooCommerce-Style Complete Notification System

**Version**: 2.0
**Last Updated**: 2025-11-23
**Channels**: SMS, WhatsApp

---

## 📋 Template Variables

### Customer Variables
- `{customer_name}` - Full customer name
- `{billing_first_name}` - First name
- `{billing_last_name}` - Last name
- `{billing_phone}` - Phone number
- `{billing_email}` - Email address
- `{billing_address}` - Full billing address
- `{billing_city}` - City
- `{billing_country}` - Country

### Order Variables
- `{order_number}` - Order number (e.g., ORD-1234)
- `{order_id}` - Order ID
- `{order_date}` - Order creation date
- `{order_status}` - Order status (PENDING, PROCESSING, etc.)
- `{order_total}` - Total amount with currency
- `{order_subtotal}` - Subtotal amount
- `{order_tax}` - Tax amount
- `{order_shipping}` - Shipping cost
- `{order_discount}` - Discount amount
- `{order_product}` - Product names (comma-separated)
- `{order_product_with_qty}` - Products with quantities
- `{order_items_count}` - Number of items

### Payment Variables
- `{payment_method}` - Payment method name
- `{payment_reference}` - Payment reference number
- `{payment_status}` - Payment status

### Shipping Variables
- `{tracking_number}` - Tracking number
- `{shipping_address}` - Shipping address
- `{shipping_city}` - Shipping city
- `{delivery_date}` - Expected delivery date

### Product Variables
- `{product_name}` - Product name
- `{product_quantity}` - Quantity
- `{product_price}` - Unit price
- `{low_stock_quantity}` - Current stock quantity

### Store Variables
- `{store_name}` - Cave Express
- `{store_url}` - www.cave-express.ci
- `{store_phone}` - +225 0556791431
- `{store_whatsapp}` - https://wa.me/2250556791431
- `{store_address}` - Faya Cité Genie 2000, Abidjan

---

## 🛒 CUSTOMER NOTIFICATIONS

### 1. Order Placed (PENDING)

**Trigger**: When customer places an order
**Status**: PENDING
**Send To**: Customer

**SMS Template**:
```
Bonjour {customer_name},
Votre commande de vin {order_product_with_qty} a été créée et est en cours de traitement. Commande: {order_number}. Montant: {order_total}.

WhatsApp: https://wa.me/2250556791431
Site: www.cave-express.ci
```

**WhatsApp Template**:
```
*[CaveExpress]*
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
++++++++++++++++++++++
```

---

### 2. Payment Received (PROCESSING)

**Trigger**: When payment is confirmed
**Status**: PROCESSING
**Send To**: Customer

**SMS Template**:
```
Le paiement de votre commande {order_number} montant {order_total} pour le(s) vin(s) {order_product} a été reçu. Votre vin arrive très bientôt ! Merci !

WhatsApp: https://wa.me/2250556791431
Site: www.cave-express.ci
```

**WhatsApp Template**:
```
Bonjour *{customer_name}*,

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
++++++++++++++++++++++
```

---

### 3. Order Shipped (SHIPPED)

**Trigger**: When order is shipped
**Status**: SHIPPED
**Send To**: Customer

**SMS Template**:
```
Votre commande #{order_number} pour le(s) vin(s): {order_product} a été récupérée et est en cours de livraison. Numéro de suivi: {tracking_number}. Merci pour votre patience.

WhatsApp: https://wa.me/2250556791431
Site: www.cave-express.ci
```

**WhatsApp Template**:
```
Bonjour *{customer_name}*,

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
++++++++++++++++++++++
```

---

### 4. Order Delivered (DELIVERED)

**Trigger**: When order is delivered
**Status**: DELIVERED
**Send To**: Customer

**SMS Template**:
```
Votre commande de vin {order_product}, montant: {order_total} a été livrée avec succès! Cave Express vous remercie.

WhatsApp: https://wa.me/2250556791431
Site: www.cave-express.ci
```

**WhatsApp Template**:
```
Bonjour *{customer_name}*,

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
++++++++++++++++++++++
```

---

### 5. Order Cancelled (CANCELLED)

**Trigger**: When order is cancelled
**Status**: CANCELLED
**Send To**: Customer

**SMS Template**:
```
Votre commande #{order_number} a été annulée. Si vous n'êtes pas à l'origine de cette annulation, contactez-nous au +225 0556791431.

Site: www.cave-express.ci
```

**WhatsApp Template**:
```
Bonjour *{customer_name}*,

Votre commande *#{order_number}* d'un montant de *{order_total}* a été annulée.

Si vous n'êtes pas à l'origine de cette annulation ou si vous avez des questions, n'hésitez pas à nous contacter.

++++++++++++++++++++++
*Cave Express*
Service Client 7j/7: *+225 0556791431*
Site web: https://www.cave-express.ci
WhatsApp: *https://wa.me/2250556791431*
++++++++++++++++++++++
```

---

### 6. Order Refunded (REFUNDED)

**Trigger**: When refund is processed
**Status**: REFUNDED
**Send To**: Customer

**SMS Template**:
```
Un remboursement de {order_total} pour votre commande #{order_number} a été traité. Les fonds seront disponibles sous 3-5 jours ouvrables.

Contact: +225 0556791431
```

**WhatsApp Template**:
```
Bonjour *{customer_name}*,

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
++++++++++++++++++++++
```

---

### 7. Failed Payment (FAILED)

**Trigger**: When payment fails
**Status**: PENDING (payment failed)
**Send To**: Customer

**SMS Template**:
```
Le paiement de votre commande #{order_number} a échoué. Veuillez réessayer ou contactez-nous au +225 0556791431.

Site: www.cave-express.ci
```

**WhatsApp Template**:
```
Bonjour *{customer_name}*,

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
++++++++++++++++++++++
```

---

### 8. Customer Note Added

**Trigger**: When admin adds a note to order
**Send To**: Customer

**SMS Template**:
```
[Cave Express] Note concernant votre commande #{order_number}: {note_content}

Contact: +225 0556791431
```

**WhatsApp Template**:
```
Bonjour *{customer_name}*,

📝 *Note concernant votre commande #{order_number}*:

{note_content}

Si vous avez des questions, n'hésitez pas à répondre à ce message.

++++++++++++++++++++++
*Cave Express*
Service Client 7j/7: *+225 0556791431*
++++++++++++++++++++++
```

---

### 9. New Account Created

**Trigger**: When customer registers
**Send To**: Customer

**SMS Template**:
```
Bienvenue chez Cave Express! Votre compte a été créé avec succès. Découvrez nos vins sur www.cave-express.ci

Téléphone: {billing_phone}
```

**WhatsApp Template**:
```
*Bienvenue chez Cave Express!* 🍷

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
++++++++++++++++++++++
```

---

### 10. Password Reset

**Trigger**: When customer requests password reset
**Send To**: Customer

**SMS Template**:
```
[Cave Express] Code de réinitialisation: {reset_code}

Utilisez ce code pour réinitialiser votre mot de passe. Valide 15 minutes.

Site: www.cave-express.ci
```

**WhatsApp Template**:
```
Bonjour *{customer_name}*,

Vous avez demandé la réinitialisation de votre mot de passe.

🔐 *Code de réinitialisation*: {reset_code}

⏱️ Ce code est valide pendant 15 minutes.

Si vous n'avez pas fait cette demande, ignorez ce message.

++++++++++++++++++++++
*Cave Express*
Sécurité: +225 0556791431
Site web: https://www.cave-express.ci
++++++++++++++++++++++
```

---

### 11. Loyalty Points Earned

**Trigger**: When customer earns loyalty points
**Send To**: Customer

**SMS Template**:
```
Félicitations! Vous avez gagné {points_earned} points de fidélité. Solde total: {points_balance} points.

www.cave-express.ci
```

**WhatsApp Template**:
```
🎉 *Félicitations {customer_name}!*

Vous avez gagné *{points_earned} points de fidélité* suite à votre commande #{order_number}.

💰 *Solde total*: {points_balance} points
🎁 *Équivalent*: {points_value} CFA de réduction

Utilisez vos points lors de votre prochain achat!

++++++++++++++++++++++
*Cave Express*
Site web: https://www.cave-express.ci
++++++++++++++++++++++
```

---

### 12. Abandoned Cart Reminder

**Trigger**: 1 hour after cart abandonment
**Send To**: Customer

**SMS Template**:
```
Vous avez oublié quelque chose! {cart_items_count} article(s) vous attend(ent) dans votre panier. Finalisez votre commande maintenant.

www.cave-express.ci
```

**WhatsApp Template**:
```
Bonjour *{customer_name}*,

🛒 Vous avez laissé *{cart_items_count} article(s)* dans votre panier:

{cart_items_list}

*Total*: {cart_total}

Ne manquez pas ces vins! Finalisez votre commande maintenant et profitez de la livraison rapide.

🎁 *Offre spéciale*: -10% avec le code RETOUR10

++++++++++++++++++++++
*Cave Express*
Site web: https://www.cave-express.ci
WhatsApp: *https://wa.me/2250556791431*
++++++++++++++++++++++
```

---

### 13. Stock Back in Stock Alert

**Trigger**: When product is back in stock
**Send To**: Customers on waitlist

**SMS Template**:
```
Bonne nouvelle! Le vin "{product_name}" est de nouveau en stock. Commandez vite avant rupture!

www.cave-express.ci
```

**WhatsApp Template**:
```
*Bonne nouvelle {customer_name}!* 🍷

Le vin *"{product_name}"* que vous attendiez est de nouveau en stock!

💰 *Prix*: {product_price}
📦 *Quantité disponible*: {product_stock}

⚡ Commandez vite avant rupture!

[Lien du produit]

++++++++++++++++++++++
*Cave Express*
Site web: https://www.cave-express.ci
++++++++++++++++++++++
```

---

## 👨‍💼 ADMIN NOTIFICATIONS

### 14. New Order Alert (Admin)

**Trigger**: When new order is placed
**Send To**: Admin

**SMS Template**:
```
[CaveExpress] - NOTIFICATION ADMIN: Nouvelle commande #{order_number} - de {customer_name} - montant {order_total}. Veuillez traiter.
```

**WhatsApp Template**:
```
+++++++++++++++++
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
++++++++++++++++++++++
```

---

### 15. Payment Received (Admin)

**Trigger**: When payment is confirmed
**Send To**: Admin

**SMS Template**:
```
💰 PAIEMENT RECU #{order_number} - {order_total} - {customer_name}
```

**WhatsApp Template**:
```
+++++++++++++++++
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
++++++++++++++++++++++
```

---

### 16. Low Stock Alert (Admin)

**Trigger**: When product stock <= low stock threshold
**Send To**: Admin

**SMS Template**:
```
⚠️ ALERTE STOCK BAS: "{product_name}" - Stock restant: {low_stock_quantity} unités. Réapprovisionner.
```

**WhatsApp Template**:
```
+++++++++++++++++
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
++++++++++++++++++++++
```

---

### 17. Out of Stock Alert (Admin)

**Trigger**: When product stock = 0
**Send To**: Admin

**SMS Template**:
```
🔴 RUPTURE DE STOCK: "{product_name}" est en rupture de stock. Action immédiate requise.
```

**WhatsApp Template**:
```
+++++++++++++++++
🔴 *RUPTURE DE STOCK*
[CaveExpress] - NOTIFICATION ADMIN
+++++++++++++++++

🍷 *Produit*: {product_name}
📦 *Stock actuel*: 0 unités
📊 *Demandes en attente*: {waitlist_count}

⚠️ *IMPACT*:
• Produit invisible sur le site
• Perte de ventes potentielles
• Clients sur liste d'attente

🔴 *ACTION URGENTE*: Réapprovisionner immédiatement

++++++++++++++++++++++
Cave Express - Gestion Inventaire
Site: https://www.cave-express.ci/admin/inventory
++++++++++++++++++++++
```

---

### 18. New Customer Registration (Admin)

**Trigger**: When new customer registers
**Send To**: Admin

**SMS Template**:
```
✅ Nouveau client enregistré: {customer_name} - {billing_phone} - {billing_city}
```

**WhatsApp Template**:
```
+++++++++++++++++
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
++++++++++++++++++++++
```

---

### 19. New Review Submitted (Admin)

**Trigger**: When customer submits a review
**Send To**: Admin

**SMS Template**:
```
⭐ Nouvel avis soumis par {customer_name} sur "{product_name}" - {rating}/5 étoiles. Modération requise.
```

**WhatsApp Template**:
```
+++++++++++++++++
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
++++++++++++++++++++++
```

---

### 20. Daily Sales Report (Admin)

**Trigger**: Every day at 8 PM
**Send To**: Admin

**SMS Template**:
```
📊 Rapport journalier: {orders_count} commandes - {total_revenue} CFA - {new_customers} nouveaux clients
```

**WhatsApp Template**:
```
+++++++++++++++++
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
++++++++++++++++++++++
```

---

## 🔧 Notification Settings

### Enabled by Default
- ✅ Order Placed
- ✅ Payment Received
- ✅ Order Shipped
- ✅ Order Delivered
- ✅ New Order (Admin)
- ✅ Payment Received (Admin)
- ✅ Low Stock Alert (Admin)

### Optional (Can be enabled by admin)
- ⚪ Order Cancelled
- ⚪ Order Refunded
- ⚪ Failed Payment
- ⚪ Customer Note
- ⚪ New Account
- ⚪ Password Reset
- ⚪ Loyalty Points
- ⚪ Abandoned Cart
- ⚪ Back in Stock
- ⚪ Out of Stock (Admin)
- ⚪ New Customer (Admin)
- ⚪ New Review (Admin)
- ⚪ Daily Report (Admin)

---

## 📞 Contact Information (Template Footer)

```
++++++++++++++++++++++
*Cave Express*
_La QUALITÉ du vin, livrée à votre porte._
Livraison rapide partout à Abidjan
Vin Blanc, Rouge, Rosé, Mousseux, Moelleux, Sec

📍 Adresse: Faya Cité Genie 2000, Abidjan Côte d'Ivoire
📞 Service Client 7j/7: +225 0556791431
🌐 Site web: https://www.cave-express.ci
💬 WhatsApp: https://wa.me/2250556791431
📘 Facebook: @cave express
++++++++++++++++++++++
```

---

## 🎯 Best Practices

1. **Timing**: Send notifications immediately for critical events (payment, order status)
2. **Personalization**: Always use customer name
3. **Clear CTA**: Include clear next steps
4. **Branding**: Maintain consistent brand voice
5. **Opt-out**: Allow customers to manage notification preferences
6. **A/B Testing**: Test different message variations
7. **Analytics**: Track delivery rates, open rates, click rates

---

**Total Templates**: 20 (10 Customer + 10 Admin)
**Channels**: SMS + WhatsApp
**Status**: Production Ready ✅
