# CÈCHÉMOI — Annuaire de la boutique en ligne et de l'espace client

## Référence des pages publiques et de l'espace client

Document de référence imprimable. Liste exhaustive des pages côté visiteurs et clients, avec leur URL directe, ce que le visiteur ou le client peut y faire, et leur niveau d'accès.

**Base URL** : toutes les pages sont sous `https://cechemoi.com/...`.

**Légende des accès** :
- **Public** : page accessible sans connexion (visiteurs, moteurs de recherche, partage de lien).
- **Client connecté** : page nécessitant que le client soit connecté à son compte (téléphone + OTP).

---

## Sommaire

1. [Page d'accueil et navigation principale](#1-page-daccueil-et-navigation-principale)
2. [Catalogue et fiches produits](#2-catalogue-et-fiches-produits)
3. [Sur-mesure et consultations](#3-sur-mesure-et-consultations)
4. [Showroom et blog](#4-showroom-et-blog)
5. [Panier, commande et confirmation](#5-panier-commande-et-confirmation)
6. [Paiements](#6-paiements)
7. [Suivi de commande](#7-suivi-de-commande)
8. [Connexion et inscription](#8-connexion-et-inscription)
9. [Espace client](#9-espace-client)
10. [Pages légales et informatives](#10-pages-légales-et-informatives)

---

## 1. Page d'accueil et navigation principale

### Page d'accueil
- **URL** : https://cechemoi.com
- **Description** : Vitrine principale de la boutique — collections, produits phares, mises en avant, accès rapide au catalogue et à la prise de mensurations.
- **Accès** : Public

---

## 2. Catalogue et fiches produits

### Catalogue complet
- **URL** : https://cechemoi.com/catalogue
- **Description** : Tous les produits disponibles avec filtres (catégorie, prix, taille, couleur) et tri.
- **Accès** : Public

### Page d'une catégorie
- **URL** : https://cechemoi.com/categorie/[nom-de-la-categorie]
- **Description** : Produits filtrés sur une catégorie précise (exemple : `/categorie/robes`, `/categorie/accessoires`). L'URL est générée automatiquement à partir du nom de la catégorie.
- **Accès** : Public

### Fiche d'un produit
- **URL** : https://cechemoi.com/produit/[nom-du-produit]
- **Description** : Détail d'un produit : photos, description, options (taille, couleur), prix, avis clients, ajout au panier, ajout à la liste de souhaits.
- **Accès** : Public

---

## 3. Sur-mesure et consultations

### Page Sur-mesure
- **URL** : https://cechemoi.com/sur-mesure
- **Description** : Présentation du service sur-mesure — étapes (prise de mensurations, création unique, confection artisanale, accompagnement), galerie d'exemples, appel à l'action pour prendre rendez-vous.
- **Accès** : Public

### Prise de rendez-vous (consultation)
- **URL** : https://cechemoi.com/consultation
- **Description** : Formulaire de prise de rendez-vous pour une consultation : choix du type de consultation, choix d'un créneau disponible, coordonnées.
- **Accès** : Public

---

## 4. Showroom et blog

### Showroom
- **URL** : https://cechemoi.com/showroom
- **Description** : Galerie photos des créations CÈCHÉMOI — visualisation plein écran, lightbox.
- **Accès** : Public

### Blog CÈCHÉMOI
- **URL** : https://cechemoi.com/blog
- **Description** : Liste des articles publiés — actualités, conseils mode, histoires de marque.
- **Accès** : Public

### Article de blog
- **URL** : https://cechemoi.com/blog/[titre-de-larticle]
- **Description** : Lecture d'un article individuel.
- **Accès** : Public

---

## 5. Panier, commande et confirmation

### Panier
- **URL** : https://cechemoi.com/cart
- **Description** : Récapitulatif des produits ajoutés, modification des quantités, suppression d'articles, code promo, total.
- **Accès** : Public (panier persisté localement même sans compte)

### Passage de commande (Checkout)
- **URL** : https://cechemoi.com/checkout
- **Description** : Tunnel de commande : adresse de livraison, méthode de paiement, récapitulatif final, validation. Le client doit être connecté ou se créer un compte ici.
- **Accès** : Client connecté

### Confirmation de commande
- **URL** : https://cechemoi.com/order-confirmation/[numero-de-commande]
- **Description** : Page de remerciement affichée après validation : numéro de commande, récapitulatif, prochaines étapes.
- **Accès** : Client connecté (lien direct généré à la validation)

---

## 6. Paiements

### Payer une facture (par lien)
- **URL** : https://cechemoi.com/invoice-payment
- **Description** : Page permettant à un client de payer une facture émise par CÈCHÉMOI à partir d'un lien envoyé par SMS ou WhatsApp.
- **Accès** : Public (sécurisé par le lien unique de la facture)

### Confirmation de paiement d'une facture
- **URL** : https://cechemoi.com/invoice-payment/success
- **Description** : Confirmation affichée après paiement réussi d'une facture.
- **Accès** : Public (post-paiement)

### Paiement libre (montant personnalisé)
- **URL** : https://cechemoi.com/payer/[montant]
- **Description** : Page de paiement libre pour un montant arbitraire (exemple : `/payer/50000` pour 50 000 FCFA). Utile pour les acomptes ou paiements ponctuels.
- **Accès** : Public

### Confirmation de paiement libre
- **URL** : https://cechemoi.com/payer/success
- **Description** : Page de succès affichée après un paiement libre validé.
- **Accès** : Public (post-paiement)

### Échec de paiement libre
- **URL** : https://cechemoi.com/payer/failed
- **Description** : Page d'échec affichée si le paiement libre a été rejeté ou annulé.
- **Accès** : Public (post-paiement)

### Confirmation de paiement (général)
- **URL** : https://cechemoi.com/payment/success
- **Description** : Page générique de confirmation de paiement utilisée par certains flux (commande boutique notamment).
- **Accès** : Public (post-paiement)

---

## 7. Suivi de commande

### Suivi de commande publique
- **URL** : https://cechemoi.com/order-progress
- **Description** : Page permettant de suivre l'état d'avancement d'une commande à partir de son numéro et du téléphone du client.
- **Accès** : Public (sécurisé par numéro de commande + téléphone)

---

## 8. Connexion et inscription

### Connexion (téléphone + OTP)
- **URL** : https://cechemoi.com/auth/login-phone
- **Description** : Connexion par numéro de téléphone — un code à 4 chiffres est envoyé par SMS ou WhatsApp pour valider l'identité. Aucun mot de passe à retenir.
- **Accès** : Public

### Inscription (téléphone + OTP)
- **URL** : https://cechemoi.com/auth/register-phone
- **Description** : Création d'un compte client par numéro de téléphone — mêmes principes que la connexion, avec saisie du nom et du prénom.
- **Accès** : Public

*Note : les URLs `/auth/login` et `/auth/register` existent également et redirigent automatiquement vers les pages téléphone ci-dessus. CÈCHÉMOI n'utilise pas de mot de passe pour les clients.*

---

## 9. Espace client

> Toutes les pages de cette section nécessitent que le client soit connecté. Si un visiteur clique sur un lien `/account/...` sans être connecté, il est redirigé vers la page de connexion.

### Tableau de bord du compte
- **URL** : https://cechemoi.com/account
- **Description** : Page d'accueil du compte client — résumé : dernière commande, points de fidélité, raccourcis vers chaque section.
- **Accès** : Client connecté

### Mon profil
- **URL** : https://cechemoi.com/account/profile
- **Description** : Informations personnelles du client : nom, prénom, téléphone, email, date de naissance, photo.
- **Accès** : Client connecté

### Mes adresses
- **URL** : https://cechemoi.com/account/addresses
- **Description** : Carnet d'adresses — ajout, modification, suppression, choix d'une adresse par défaut.
- **Accès** : Client connecté

### Mes commandes
- **URL** : https://cechemoi.com/account/orders
- **Description** : Liste de toutes les commandes passées par le client (boutique et sur-mesure), avec statut et lien vers le détail.
- **Accès** : Client connecté

### Détail d'une commande
- **URL** : https://cechemoi.com/account/orders/[numero-de-commande]
- **Description** : Détail complet d'une commande : produits, montants, adresse de livraison, statut de la livraison, lien de suivi, possibilité de demander un remboursement.
- **Accès** : Client connecté

### Mes factures
- **URL** : https://cechemoi.com/account/invoices
- **Description** : Liste des factures émises au nom du client (boutique, sur-mesure, autres prestations).
- **Accès** : Client connecté

### Détail d'une facture
- **URL** : https://cechemoi.com/account/invoices/[numero-de-facture]
- **Description** : Affichage d'une facture avec possibilité de la télécharger en PDF et de la payer si elle est en attente.
- **Accès** : Client connecté

### Mes paiements
- **URL** : https://cechemoi.com/account/payments
- **Description** : Historique des paiements effectués par le client (canal, montant, date, facture ou commande associée).
- **Accès** : Client connecté

### Ma liste de souhaits
- **URL** : https://cechemoi.com/account/wishlist
- **Description** : Produits sauvegardés par le client en favoris, avec possibilité de les ajouter au panier ou de les retirer.
- **Accès** : Client connecté

### Programme de fidélité
- **URL** : https://cechemoi.com/account/loyalty
- **Description** : Points de fidélité accumulés, niveau du client, avantages débloqués, historique des points gagnés et utilisés.
- **Accès** : Client connecté

### Mes rendez-vous
- **URL** : https://cechemoi.com/account/appointments
- **Description** : Rendez-vous pris par le client (consultations, prises de mensurations), prochains et passés, possibilité d'annulation.
- **Accès** : Client connecté

### Mes avis
- **URL** : https://cechemoi.com/account/reviews
- **Description** : Avis laissés par le client sur les produits, possibilité de modifier ou supprimer.
- **Accès** : Client connecté

### Mes notifications
- **URL** : https://cechemoi.com/account/notifications
- **Description** : Boîte de réception des notifications envoyées par CÈCHÉMOI (suivi commande, promotions, anniversaires, etc.).
- **Accès** : Client connecté

### Mes paramètres
- **URL** : https://cechemoi.com/account/settings
- **Description** : Préférences de communication (SMS, WhatsApp, email), langue, suppression de compte.
- **Accès** : Client connecté

---

## 10. Pages légales et informatives

Ces pages sont typiquement liées depuis le pied de page (footer) du site, et peuvent aussi être trouvées via les moteurs de recherche.

### Qui sommes-nous
- **URL** : https://cechemoi.com/qui-sommes-nous
- **Description** : Présentation de la marque CÈCHÉMOI — histoire, valeurs, savoir-faire, équipe.
- **Accès** : Public

### Contact
- **URL** : https://cechemoi.com/contact
- **Description** : Formulaire de contact, coordonnées, adresse de la boutique, horaires.
- **Accès** : Public

### Conditions générales de vente
- **URL** : https://cechemoi.com/conditions-generales
- **Description** : Conditions contractuelles applicables à toute commande passée sur le site.
- **Accès** : Public

### Politique de confidentialité
- **URL** : https://cechemoi.com/politique-confidentialite
- **Description** : Traitement des données personnelles, droits du client, durées de conservation.
- **Accès** : Public

### Politique des cookies
- **URL** : https://cechemoi.com/politique-cookies
- **Description** : Cookies utilisés par le site, finalités et durées.
- **Accès** : Public

### Politique de livraison
- **URL** : https://cechemoi.com/politique-livraison
- **Description** : Zones desservies, délais, tarifs, modalités de livraison.
- **Accès** : Public

### Politique de retour
- **URL** : https://cechemoi.com/politique-retour
- **Description** : Conditions et procédure de retour ou d'échange d'un produit.
- **Accès** : Public

---

**Version du document** : 1.0
**Dernière mise à jour** : 2026-06-04
**Destiné à** : Direction Générale CÈCHÉMOI
