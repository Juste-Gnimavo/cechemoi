# CÈCHÉMOI — Annuaire des liens de l'admin dashboard

Document de référence imprimable. Liste exhaustive des pages de l'espace administration avec leur intitulé d'action, leur URL directe et le niveau d'accès requis.

**Base URL** : toutes les pages de l'admin sont sous `https://cechemoi.com/admin/...`.
*Note* : l'adresse `crm.cechemoi.com` est une simple redirection vers la page de connexion (`/admin/login`) et n'est pas utilisée pour les liens directs.

**Légende des rôles** :
- **DG** = Direction Générale (rôle technique : `ADMIN`)
- **Manager** = Responsable (rôle technique : `MANAGER`)
- **Staff** = Employé de vente / administratif (rôle technique : `STAFF`)
- **Couturier** = Personnel atelier (rôle technique : `TAILOR`)

---

## Sommaire

1. [Tableau de bord](#1-tableau-de-bord)
2. [Clients](#2-clients)
3. [Rendez-vous](#3-rendez-vous)
4. [Sur-Mesure (Atelier)](#4-sur-mesure-atelier)
5. [Caisse](#5-caisse)
6. [Rapports financiers](#6-rapports-financiers)
7. [Boutique en ligne](#7-boutique-en-ligne)
8. [Communication](#8-communication)
9. [Équipe](#9-équipe)
10. [Réglages](#10-réglages)
11. [Analytics & Marketing](#11-analytics--marketing)
12. [Mon compte](#12-mon-compte)
13. [Astuce — Recherche rapide ⌘K](#13-astuce--recherche-rapide-k)

---

## 1. Tableau de bord

### Comment voir la vue d'ensemble du business
- **Lien** : https://cechemoi.com/admin/
- **Description** : KPI globaux, ventes du jour, alertes, dernières activités.
- **Accès** : DG · Manager · Staff · Couturier

---

## 2. Clients

### Comment voir et chercher des clients
- **Lien** : https://cechemoi.com/admin/customers
- **Description** : Rechercher, filtrer et consulter la base clients.
- **Accès** : DG · Manager · Staff

### Comment ajouter un nouveau client
- **Lien** : https://cechemoi.com/admin/customers/new
- **Description** : Créer une fiche client (saisie manuelle individuelle).
- **Accès** : DG · Manager · Staff

### Comment importer ou exporter une liste de clients
- **Lien** : https://cechemoi.com/admin/customers/import
- **Description** : Import CSV ou export Excel de la base clients (utile pour les migrations en masse).
- **Accès** : DG · Manager · Staff

### Comment voir d'où viennent les clients (sources d'acquisition)
- **Lien** : https://cechemoi.com/admin/customers/sources
- **Description** : Origine des clients : réseaux sociaux, bouche-à-oreille, publicité, etc.
- **Accès** : DG uniquement

### Comment envoyer un SMS à un client précis
- **Lien** : https://cechemoi.com/admin/customers/send-sms
- **Description** : Envoyer un SMS individuel à un client (message direct, non campagne).
- **Accès** : DG · Manager · Staff

### Comment envoyer un message WhatsApp à un client précis
- **Lien** : https://cechemoi.com/admin/customers/send-whatsapp
- **Description** : Envoyer un message WhatsApp individuel à un client.
- **Accès** : DG · Manager · Staff

---

## 3. Rendez-vous

### Comment voir le tableau de bord des rendez-vous
- **Lien** : https://cechemoi.com/admin/appointments
- **Description** : Vue calendrier et statistiques des rendez-vous.
- **Accès** : DG · Manager

### Comment voir la liste complète des rendez-vous
- **Lien** : https://cechemoi.com/admin/appointments/list
- **Description** : Liste complète avec filtres avancés.
- **Accès** : DG · Manager

### Comment voir les rendez-vous en attente de confirmation
- **Lien** : https://cechemoi.com/admin/appointments?status=pending
- **Description** : Nouveaux rendez-vous à confirmer.
- **Accès** : DG · Manager

### Comment voir les rendez-vous confirmés
- **Lien** : https://cechemoi.com/admin/appointments?status=confirmed
- **Description** : Rendez-vous confirmés à venir.
- **Accès** : DG · Manager

### Comment voir les rendez-vous terminés
- **Lien** : https://cechemoi.com/admin/appointments?status=completed
- **Description** : Historique des rendez-vous passés et clôturés.
- **Accès** : DG · Manager

### Comment définir les créneaux de disponibilité
- **Lien** : https://cechemoi.com/admin/appointments/availability
- **Description** : Configurer les horaires d'ouverture et les plages où un rendez-vous est possible.
- **Accès** : DG · Manager · Staff

### Comment configurer les types de consultation proposés
- **Lien** : https://cechemoi.com/admin/appointments/services
- **Description** : Créer / modifier les types de consultations (durée, prix).
- **Accès** : DG · Manager

---

## 4. Sur-Mesure (Atelier)

### Commandes sur mesure

#### Comment voir toutes les commandes sur mesure
- **Lien** : https://cechemoi.com/admin/custom-orders
- **Description** : Liste complète des commandes couture, broderie, retouches.
- **Accès** : DG · Manager · Staff · Couturier

#### Comment créer une nouvelle commande sur mesure
- **Lien** : https://cechemoi.com/admin/custom-orders/new
- **Description** : Saisir une nouvelle commande sur mesure (client + mensurations + modèle).
- **Accès** : DG · Manager · Staff

#### Comment voir l'audit et les statistiques sur mesure
- **Lien** : https://cechemoi.com/admin/custom-orders/audit
- **Description** : Statistiques avancées, anomalies, analyse globale des commandes atelier.
- **Accès** : DG uniquement

#### Comment suivre la production en atelier
- **Lien** : https://cechemoi.com/admin/production
- **Description** : Workflow de production : étapes, deadlines, état d'avancement.
- **Accès** : DG · Manager · Staff · Couturier

#### Comment imprimer une fiche de suivi confection
- **Lien** : https://cechemoi.com/admin/custom-orders/fiche-suivi-confection
- **Description** : Fiche de suivi confection imprimable pour l'atelier.
- **Accès** : DG · Manager · Staff · Couturier

### Stock atelier (matières premières)

#### Comment voir le stock matières premières
- **Lien** : https://cechemoi.com/admin/materials
- **Description** : Stock atelier : tissus, fils, accessoires, fournitures.
- **Accès** : DG · Manager · Staff

#### Comment ajouter une nouvelle matière première
- **Lien** : https://cechemoi.com/admin/materials/new
- **Description** : Créer une nouvelle référence de matière (tissu, fil, accessoire).
- **Accès** : DG · Manager · Staff

#### Comment enregistrer une sortie de matière
- **Lien** : https://cechemoi.com/admin/materials/out
- **Description** : Tracer la consommation / utilisation d'une matière pour une commande.
- **Accès** : DG · Manager · Staff

#### Comment enregistrer une entrée de matière
- **Lien** : https://cechemoi.com/admin/materials/in
- **Description** : Enregistrer une réception / achat de matière (réapprovisionnement).
- **Accès** : DG · Manager · Staff

#### Comment voir l'historique des mouvements de stock atelier
- **Lien** : https://cechemoi.com/admin/materials/movements
- **Description** : Journal complet entrées / sorties pour la traçabilité.
- **Accès** : DG · Manager · Staff

#### Comment voir les rapports de consommation atelier
- **Lien** : https://cechemoi.com/admin/materials/reports
- **Description** : Rapports de consommation et valorisation du stock matières.
- **Accès** : DG · Manager · Staff

#### Comment gérer les catégories de matières premières
- **Lien** : https://cechemoi.com/admin/materials/categories
- **Description** : Classer les matières (tissus, fils, accessoires, etc.).
- **Accès** : DG · Manager · Staff

---

## 5. Caisse

### Factures

#### Comment voir toutes les factures
- **Lien** : https://cechemoi.com/admin/invoices
- **Description** : Liste complète des factures émises (boutique, sur-mesure, autonomes).
- **Accès** : DG · Manager · Staff

#### Comment créer une nouvelle facture
- **Lien** : https://cechemoi.com/admin/invoices/new
- **Description** : Émettre une nouvelle facture (depuis zéro ou à partir d'une commande).
- **Accès** : DG · Manager · Staff

#### Comment voir les paiements reçus sans facture rattachée
- **Lien** : https://cechemoi.com/admin/invoices/standalone-payments
- **Description** : Paiements autonomes / orphelins (encaissements libres à rattacher).
- **Accès** : DG · Manager · Staff

### Reçus

#### Comment voir tous les reçus
- **Lien** : https://cechemoi.com/admin/receipts
- **Description** : Tous les reçus émis (preuves de paiement / justificatifs).
- **Accès** : DG · Manager · Staff

#### Comment voir uniquement les reçus du jour
- **Lien** : https://cechemoi.com/admin/receipts?today=true
- **Description** : Reçus émis aujourd'hui — utile pour la clôture journalière.
- **Accès** : DG · Manager · Staff

### Ventes

#### Comment voir toutes les ventes
- **Lien** : https://cechemoi.com/admin/sales
- **Description** : Vue agrégée de toutes les ventes (boutique + sur-mesure).
- **Accès** : DG · Manager · Staff

#### Comment voir les ventes du jour
- **Lien** : https://cechemoi.com/admin/sales/today
- **Description** : Récapitulatif des ventes du jour en cours (caisse du jour).
- **Accès** : DG · Manager · Staff

#### Comment voir les ventes de la semaine
- **Lien** : https://cechemoi.com/admin/sales/week
- **Description** : Récapitulatif des ventes de la semaine en cours.
- **Accès** : DG · Manager · Staff

#### Comment voir les ventes du mois
- **Lien** : https://cechemoi.com/admin/sales/month
- **Description** : Récapitulatif des ventes du mois en cours.
- **Accès** : DG · Manager · Staff

#### Comment voir les ventes de l'année
- **Lien** : https://cechemoi.com/admin/sales/year
- **Description** : Récapitulatif des ventes de l'année en cours.
- **Accès** : DG · Manager · Staff

### Dépenses

#### Comment gérer les catégories de dépenses
- **Lien** : https://cechemoi.com/admin/expenses/categories
- **Description** : Rubriques de dépenses (électricité, loyer, fournitures…).
- **Accès** : DG · Manager

#### Comment voir toutes les dépenses
- **Lien** : https://cechemoi.com/admin/expenses
- **Description** : Liste complète des dépenses enregistrées.
- **Accès** : DG · Manager

#### Comment ajouter une nouvelle dépense
- **Lien** : https://cechemoi.com/admin/expenses/new
- **Description** : Enregistrer une dépense (facture d'électricité, loyer, achat…).
- **Accès** : DG · Manager

#### Comment voir les rapports de dépenses
- **Lien** : https://cechemoi.com/admin/expenses/reports
- **Description** : Analyse des dépenses par catégorie et par période.
- **Accès** : DG · Manager

#### Comment voir le journal des transactions financières
- **Lien** : https://cechemoi.com/admin/transactions
- **Description** : Journal de toutes les opérations de trésorerie (entrées + sorties).
- **Accès** : DG · Manager

---

## 6. Rapports financiers

### Comment voir le hub des rapports financiers
- **Lien** : https://cechemoi.com/admin/reports
- **Description** : Hub comptable principal — accès à tous les onglets et exports.
- **Accès** : DG · Manager

### Comment voir le rapport des ventes boutique en ligne
- **Lien** : https://cechemoi.com/admin/reports?tab=online-sales
- **Description** : Chiffre d'affaires et détail des ventes e-commerce.
- **Accès** : DG · Manager

### Comment voir le rapport des commandes sur mesure
- **Lien** : https://cechemoi.com/admin/reports?tab=custom-orders
- **Description** : Chiffre d'affaires et marges des commandes atelier.
- **Accès** : DG · Manager

### Comment voir le rapport détaillé des factures
- **Lien** : https://cechemoi.com/admin/reports?tab=invoices
- **Description** : Analyse de la facturation (émises, payées, en attente).
- **Accès** : DG · Manager

### Comment voir le rapport des transactions encaissées
- **Lien** : https://cechemoi.com/admin/reports?tab=transactions
- **Description** : Toutes les transactions encaissées par période (cash flow réel).
- **Accès** : DG · Manager

### Comment voir le rapport des remboursements
- **Lien** : https://cechemoi.com/admin/reports?tab=refunds
- **Description** : Liste et analyse des remboursements clients.
- **Accès** : DG · Manager

### Comment voir le rapport des dépenses (vue comptable)
- **Lien** : https://cechemoi.com/admin/reports?tab=expenses
- **Description** : Vue comptable des dépenses par période.
- **Accès** : DG · Manager

---

## 7. Boutique en ligne

### Commandes boutique

#### Comment voir toutes les commandes boutique
- **Lien** : https://cechemoi.com/admin/orders
- **Description** : Liste complète des commandes passées en ligne.
- **Accès** : DG · Manager · Staff

#### Comment voir les commandes en attente
- **Lien** : https://cechemoi.com/admin/orders?status=pending
- **Description** : Nouvelles commandes à traiter / confirmer.
- **Accès** : DG · Manager · Staff

#### Comment voir les commandes actives
- **Lien** : https://cechemoi.com/admin/orders?status=active
- **Description** : Commandes en cours de préparation ou de livraison.
- **Accès** : DG · Manager · Staff

#### Comment voir les commandes annulées
- **Lien** : https://cechemoi.com/admin/orders?status=cancelled
- **Description** : Historique des commandes annulées.
- **Accès** : DG · Manager · Staff

#### Comment créer une commande boutique manuellement
- **Lien** : https://cechemoi.com/admin/orders/new
- **Description** : Saisir une commande en magasin pour un client.
- **Accès** : DG · Manager · Staff

### Produits / Catalogue

#### Comment voir tous les produits du catalogue
- **Lien** : https://cechemoi.com/admin/products
- **Description** : Catalogue produits (vêtements, accessoires).
- **Accès** : DG · Manager · Staff

#### Comment ajouter un nouveau produit
- **Lien** : https://cechemoi.com/admin/products/new
- **Description** : Créer une nouvelle fiche produit dans le catalogue.
- **Accès** : DG · Manager · Staff

#### Comment gérer les catégories produits
- **Lien** : https://cechemoi.com/admin/categories
- **Description** : Arborescence des catégories du catalogue.
- **Accès** : DG · Manager · Staff

#### Comment ajouter une nouvelle catégorie produit
- **Lien** : https://cechemoi.com/admin/categories/new
- **Description** : Créer une nouvelle catégorie / rayon dans le catalogue.
- **Accès** : DG · Manager · Staff

#### Comment gérer les étiquettes (tags) produits
- **Lien** : https://cechemoi.com/admin/tags
- **Description** : Étiquettes / mots-clés associés aux produits.
- **Accès** : DG · Manager · Staff

### Stock & Prix

#### Comment gérer le stock produits boutique
- **Lien** : https://cechemoi.com/admin/inventory
- **Description** : Quantités disponibles, alertes de rupture, ajustements.
- **Accès** : DG · Manager

#### Comment voir les mouvements de stock boutique
- **Lien** : https://cechemoi.com/admin/inventory/movements
- **Description** : Historique entrées / sorties du stock produits.
- **Accès** : DG · Manager

#### Comment gérer les codes promo (coupons)
- **Lien** : https://cechemoi.com/admin/coupons
- **Description** : Liste des coupons et codes de réduction actifs.
- **Accès** : DG · Manager

#### Comment créer un nouveau code promo / coupon
- **Lien** : https://cechemoi.com/admin/coupons/new
- **Description** : Créer un coupon (pourcentage de réduction ou montant fixe).
- **Accès** : DG · Manager

### Médias

#### Comment accéder à la galerie d'images
- **Lien** : https://cechemoi.com/admin/media
- **Description** : Bibliothèque centrale des images et médias uploadés.
- **Accès** : DG · Manager

### Avis clients

#### Comment modérer les avis clients
- **Lien** : https://cechemoi.com/admin/reviews
- **Description** : Modération des avis et commentaires sur les produits.
- **Accès** : DG · Manager

---

## 8. Communication

### Campagnes

#### Comment voir le tableau de bord des campagnes
- **Lien** : https://cechemoi.com/admin/campaigns
- **Description** : Vue d'ensemble des campagnes marketing.
- **Accès** : DG · Manager · Staff

#### Comment lancer une campagne SMS de masse
- **Lien** : https://cechemoi.com/admin/campaigns/sms
- **Description** : Envoyer un SMS à un groupe de clients (campagne marketing).
- **Accès** : DG · Manager · Staff

#### Comment lancer une campagne WhatsApp Business
- **Lien** : https://cechemoi.com/admin/campaigns/whatsapp
- **Description** : Campagne marketing via WhatsApp Business.
- **Accès** : DG · Manager · Staff

#### Comment utiliser WhatsApp Cloud API
- **Lien** : https://cechemoi.com/admin/campaigns/whatsapp-cloud
- **Description** : WhatsApp Cloud API (templates, broadcasts officiels Meta).
- **Accès** : DG · Manager · Staff

#### Comment envoyer des notifications push mobiles
- **Lien** : https://cechemoi.com/admin/campaigns/push
- **Description** : Notifications push vers l'app mobile des clients.
- **Accès** : DG · Manager · Staff

#### Comment voir les rapports de performance des campagnes
- **Lien** : https://cechemoi.com/admin/campaigns/reports
- **Description** : Taux d'ouverture, ROI, statistiques de livraison.
- **Accès** : DG · Manager · Staff

### Notifications transactionnelles

#### Comment voir le hub des notifications
- **Lien** : https://cechemoi.com/admin/notifications
- **Description** : Tableau de bord des notifications transactionnelles.
- **Accès** : DG · Manager · Staff

#### Comment voir les logs des notifications envoyées
- **Lien** : https://cechemoi.com/admin/notifications/logs
- **Description** : Journal complet des notifications expédiées (debug + traçabilité).
- **Accès** : DG · Manager · Staff

#### Comment gérer les modèles de messages
- **Lien** : https://cechemoi.com/admin/notifications/templates
- **Description** : Modèles réutilisables pour SMS, WhatsApp et notifications.
- **Accès** : DG · Manager · Staff

#### Comment configurer les messages de relance
- **Lien** : https://cechemoi.com/admin/notifications/follow-up
- **Description** : Messages de relance automatique (paniers abandonnés, etc.).
- **Accès** : DG · Manager · Staff

#### Comment configurer les messages d'anniversaire
- **Lien** : https://cechemoi.com/admin/notifications/birthdays
- **Description** : Vœux d'anniversaire automatiques aux clients.
- **Accès** : DG · Manager · Staff

#### Comment régler les paramètres globaux des notifications
- **Lien** : https://cechemoi.com/admin/notifications/settings
- **Description** : Configuration des canaux et préférences globales.
- **Accès** : DG · Manager · Staff

### Blog

#### Comment voir le tableau de bord du blog
- **Lien** : https://cechemoi.com/admin/blog
- **Description** : Vue d'ensemble du blog (articles, audience).
- **Accès** : DG · Manager · Staff

#### Comment voir tous les articles du blog
- **Lien** : https://cechemoi.com/admin/blog/posts
- **Description** : Liste complète des articles publiés et en brouillon.
- **Accès** : DG · Manager · Staff

#### Comment rédiger un nouvel article de blog
- **Lien** : https://cechemoi.com/admin/blog/posts/new
- **Description** : Créer un nouvel article (éditeur riche).
- **Accès** : DG · Manager · Staff

#### Comment gérer les catégories d'articles
- **Lien** : https://cechemoi.com/admin/blog/categories
- **Description** : Rubriques du blog.
- **Accès** : DG · Manager · Staff

#### Comment gérer les étiquettes d'articles
- **Lien** : https://cechemoi.com/admin/blog/tags
- **Description** : Tags / mots-clés des articles.
- **Accès** : DG · Manager · Staff

---

## 9. Équipe

### Comment gérer le staff (employés administratifs et vente)
- **Lien** : https://cechemoi.com/admin/team
- **Description** : Membres de l'équipe : créer, désactiver, attribuer un rôle.
- **Accès** : DG · Manager

### Comment gérer les couturiers (atelier)
- **Lien** : https://cechemoi.com/admin/tailors
- **Description** : Gestion spécifique des couturiers (rôle TAILOR).
- **Accès** : DG · Manager

### Comment voir les indicateurs de performance de l'équipe
- **Lien** : https://cechemoi.com/admin/staff-performance
- **Description** : KPI par membre : productivité, ventes, classement.
- **Accès** : DG · Manager

---

## 10. Réglages

### Comment configurer les informations générales de la boutique
- **Lien** : https://cechemoi.com/admin/settings
- **Description** : Branding, infos magasin, SEO, paramètres globaux.
- **Accès** : DG · Manager

### Comment configurer les méthodes de livraison
- **Lien** : https://cechemoi.com/admin/shipping
- **Description** : Zones, tarifs, transporteurs, frais de port.
- **Accès** : DG · Manager

### Comment configurer la TVA et les taxes
- **Lien** : https://cechemoi.com/admin/tax
- **Description** : Taux de TVA et règles fiscales par zone.
- **Accès** : DG · Manager

### Comment gérer les coupons (depuis Réglages)
- **Lien** : https://cechemoi.com/admin/coupons
- **Description** : Accès rapide à la gestion des coupons depuis les réglages.
- **Accès** : DG · Manager

---

## 11. Analytics & Marketing

### Comment accéder au hub marketing
- **Lien** : https://cechemoi.com/admin/marketing
- **Description** : Centre marketing : campagnes, promotions, SEO.
- **Accès** : DG · Manager

### Comment voir les statistiques globales (Analytics)
- **Lien** : https://cechemoi.com/admin/analytics
- **Description** : Trafic, conversions, comportements visiteurs.
- **Accès** : DG · Manager

### Comment voir les analytics par produit
- **Lien** : https://cechemoi.com/admin/analytics/products
- **Description** : Performances détaillées produit par produit (best sellers, etc.).
- **Accès** : DG · Manager

### Comment voir les analytics de revenus
- **Lien** : https://cechemoi.com/admin/analytics/revenue
- **Description** : Vue analytique des revenus et tendances.
- **Accès** : DG · Manager

---

## 12. Mon compte

### Comment sécuriser mon compte (mot de passe, sessions, 2FA)
- **Lien** : https://cechemoi.com/admin/account/security
- **Description** : Changer le mot de passe, gérer les sessions actives, activer la double authentification.
- **Accès** : Tous les rôles connectés

---

## 13. Astuce — Recherche rapide ⌘K

À tout moment dans l'admin, appuyez sur **⌘K** (Mac) ou **Ctrl+K** (Windows / Linux) pour ouvrir la palette de recherche.

Tapez ce que vous cherchez en langage naturel — la recherche tolère les fautes d'accents et les synonymes.

**Exemples qui marchent** :
- `transactions` → rapport des transactions encaissées
- `nouvelle facture` → création de facture
- `depense electricite` → ajout d'une dépense
- `pourcentage reduction` → création d'un coupon
- `stock matieres` → stock atelier
- `ventes du jour` → caisse du jour
- `recus aujourdhui` → reçus émis aujourd'hui
- `campagne sms` → lancement de campagne SMS
- `parametres boutique` → réglages généraux

La palette filtre automatiquement selon votre rôle : un membre du staff ne voit que les pages auxquelles il a accès.

---

**Version du document** : 1.0
**Dernière mise à jour** : 2026-06-04
