# CECHEMOI - Administration CRM Backoffice

## Presentation Complete des Fonctionnalites

**Version**: 1.0
**Date**: Decembre 2025
**Stack**: Next.js 14, Prisma, PostgreSQL, NextAuth

---

## SOMMAIRE

1. [Tableau de Bord Principal](#1-tableau-de-bord-principal)
2. [Gestion des Campagnes Marketing](#2-gestion-des-campagnes-marketing)
3. [Gestion des Clients](#3-gestion-des-clients)
4. [Gestion des Rendez-vous](#4-gestion-des-rendez-vous)
5. [Gestion des Commandes](#5-gestion-des-commandes)
6. [Facturation et Paiements](#6-facturation-et-paiements)
7. [Rapports de Ventes](#7-rapports-de-ventes)
8. [Gestion du Blog](#8-gestion-du-blog)
9. [Catalogue Produits](#9-catalogue-produits)
10. [Systeme de Notifications](#10-systeme-de-notifications)
11. [Parametres et Configuration](#11-parametres-et-configuration)
12. [Analytics et Rapports](#12-analytics-et-rapports)

---

## 1. TABLEAU DE BORD PRINCIPAL

### Vue d'ensemble
Le dashboard offre une vision complete de l'activite de la boutique en temps reel.

### Statistiques Principales (KPIs)
- **Revenu Net**: Total des factures payees avec comparaison periodique
- **En Attente**: Commandes non payees en cours
- **Commandes**: Nombre total avec valeur moyenne par commande
- **Clients**: Nombre total de clients actifs
- **Produits**: Taille du catalogue actif
- **Rendez-vous**: Statistiques des consultations

### Detail du Revenu
- Sous-total produits
- Taxes collectees
- Frais de livraison
- Reductions appliquees

### Commandes Recentes
- Affichage des 5 dernieres commandes
- N° de commande, client, articles, total, statut
- Codes couleur par statut (En attente, En traitement, Expedie, Livre, Annule, Rembourse)

### Rendez-vous du Jour
- Statistiques avec codes couleur
- Total, en attente, confirmes, aujourd'hui
- Acces rapide a la gestion

### Top 5 Produits
- Classement des meilleures ventes
- Quantite vendue et revenu genere

### Envoi Rapide de Notifications
- Selecteur de canal (WhatsApp / SMS / WhatsApp Cloud)
- Champ destinataire
- Zone de texte message
- Historique des envois

### Actions Rapides
- Gerer les commandes
- Gerer les produits
- Gerer les clients
- Analytics detailles
- Gerer les rendez-vous

---

## 2. GESTION DES CAMPAGNES MARKETING

### 2.1 Campagnes SMS

**Ciblage des Destinataires**
- Tous les clients (envoi massif)
- Numeros personnalises (saisie manuelle)

**Variables Personnalisables (9 variables)**
- {customer_name} - Nom du client
- {customer_phone} - Numero de telephone
- {customer_email} - Email
- {order_count} - Nombre de commandes
- {total_spent} - Montant total depense
- {last_order_date} - Date derniere commande
- {store_name} - Nom du magasin
- {store_phone} - Telephone du magasin
- {store_url} - URL du magasin

**Fonctionnalites**
- Limite de caracteres: 160 par SMS, max 5 SMS (800 caracteres)
- Compteur SMS dynamique avec code couleur
- Apercu iPhone en temps reel
- Sauvegarde en brouillon
- Confirmation avant envoi

### 2.2 Campagnes WhatsApp Business

**Fonctionnalites Specifiques**
- Message jusqu'a 4096 caracteres
- Support des medias (images, documents PDF)
- Upload direct ou selection depuis mediatheque
- Taille max: 5MB
- Memes variables que SMS

**Mediatheque Integree**
- Navigation par categories
- Recherche par nom de fichier
- Apercu en grille
- Metadonnees (categorie, date, taille)

### 2.3 WhatsApp Cloud (API Officielle)

**Caracteristiques**
- Templates pre-approuves par WhatsApp
- Integration via SMSing
- Taux de delivrabilite tres eleve
- Format proprietaire SMSing

### 2.4 Notifications Push

**Options de Ciblage**
- ALL_USERS: Tous les appareils
- SPECIFIC_USERS: Selection manuelle
- BY_TIER: Par niveau de fidelite (Bronze, Silver, Gold, Platinum)
- BY_LOCATION: Par ville

**Contenu**
- Titre: Max 65 caracteres
- Message: Max 240 caracteres
- Image optionnelle
- Deep Link (lien vers section de l'app)

**Planification**
- Envoi immediat
- Planification a date/heure precise

**Apercu iOS**
- Simulation de notification native

### 2.5 Rapports de Campagnes

**Statistiques Globales**
- Total campagnes
- Messages envoyes
- Taux de succes
- Repartition par canal

**Filtrage**
- Par canal (SMS, WhatsApp, Push)
- Par statut (Brouillon, Programmee, En cours, Envoyee, Echouee)

**Details par Campagne**
- Statistiques d'envoi
- Contenu du message
- Logs detailles par destinataire

---

## 3. GESTION DES CLIENTS

### 3.1 Liste des Clients

**Donnees Affichees**
- Nom, photo de profil, nombre d'avis
- Telephone, email
- Nombre de commandes
- Valeur totale (Lifetime Value)
- Panier moyen
- Segment client (VIP, Haute valeur, Actif, Nouveau, Inactif)
- Date d'inscription

**Filtres**
- Recherche texte (nom, telephone, email)
- Segment de client

**Statistiques**
- Total clients
- Inscrits aujourd'hui, cette semaine, ce mois, cette annee

### 3.2 Ajouter un Nouveau Client

**Informations Personnelles**
- Prenom (requis)
- Nom
- Email
- Telephone (requis, format international)
- WhatsApp
- Photo de profil (URL)

**Localisation**
- Ville
- Pays (liste predefinite)
- Code Pays

**Programme de Fidelite**
- Niveau: Bronze, Argent, Or, Platine
- Points initiaux

**Adresse de Livraison**
- Nom complet, telephone
- Rue, quartier, cite
- Ville, pays
- Indications/Directions
- Geolocalisation (latitude, longitude)

**Options**
- Antidater la date d'inscription
- Envoyer SMS/WhatsApp de bienvenue

### 3.3 Fiche Client Detaillee

**Profil Complet**
- Informations personnelles
- Derniere connexion
- Statut 2FA

**Statistiques**
- Total commandes
- Commandes livrees
- Valeur vie client (LTV)
- Panier moyen
- Articles achetes

**Historique des Commandes**
- 10 dernieres commandes
- Acces direct aux details

**Notes Client**
- Notes privees ou partagees
- Auteur et date

**Envoi Rapide**
- WhatsApp / SMS / WhatsApp Cloud
- Historique des messages

**Adresses Enregistrees**
- Liste complete avec adresse par defaut

**Avis Clients**
- 5 derniers avis

**Actions**
- Modifier
- Nouvelle commande
- Nouvelle facture

### 3.4 Envoyer SMS/WhatsApp

**Fonctionnalites**
- Recherche client en temps reel
- Variables de personnalisation
- Historique d'envoi avec statuts
- Support de plusieurs canaux WhatsApp

---

## 4. GESTION DES RENDEZ-VOUS

### 4.1 Tableau de Bord Rendez-vous

**Statistiques**
- En attente
- Confirmes
- Termines aujourd'hui
- Total cette semaine

**Rendez-vous Recents**
- 10 derniers rendez-vous
- Acces direct aux details

### 4.2 Liste des Rendez-vous

**Colonnes Affichees**
- Client (avec avatar)
- Service (type et duree)
- Date & Heure
- Statut
- Paiement
- Prix

**Filtres**
- Onglets par statut (Tous, En attente, Confirmes, Termines, Annules)
- Recherche (nom, telephone, reference)
- Statut paiement

**Actions Rapides**
- WhatsApp direct
- Appel telephonique
- Voir details

### 4.3 Details Rendez-vous

**Informations Client**
- Avatar, nom, telephone, email
- Notes du client
- Boutons WhatsApp/Appel

**Details**
- Service (nom et couleur)
- Date, heure, duree
- Prix ou "Sur devis"
- Montant paye
- Chronologie (cree, confirme, termine, annule)

**Notes Admin**
- Edition inline

**Actions**
- Changer statut (Confirmer, Terminer, Client absent, Annuler)
- Paiement (Marquer paye, Rembourser)
- Notifications (Confirmation, Rappel, Annulation, Message personnalise)

### 4.4 Gestion des Disponibilites

**Configuration par Jour**
- Jour de la semaine
- Horaires (ouverture - fermeture)
- Duree creneau (minutes)
- Pause entre RDV
- Statut (Ouvert/Ferme)

**Statistiques**
- Jours ouverts
- Duree creneau moyenne
- Creneaux par semaine

### 4.5 Types de Consultation (Services)

**Parametres par Service**
- Nom
- Description
- Prix (ou "Sur devis")
- Duree (minutes)
- Icone (4 options)
- Couleur (8 options)
- Caracteristiques
- Paiement requis
- Statut actif/inactif

---

## 5. GESTION DES COMMANDES

### 5.1 Liste des Commandes

**Colonnes**
- Numero de commande
- Client
- Date de creation
- Statut commande
- Statut paiement
- Total
- Nombre d'articles

**Statuts Commande**
- PENDING (En attente) - Jaune
- PROCESSING (En traitement) - Bleu
- SHIPPED (Expedie) - Violet
- DELIVERED (Livre) - Vert
- CANCELLED (Annule) - Rouge
- REFUNDED (Rembourse) - Gris

**Statuts Paiement**
- PENDING (En attente)
- COMPLETED (Paye)
- FAILED (Echoue)
- REFUNDED (Rembourse)

**Filtres**
- Recherche (numero, nom client)
- Statut commande
- Statut paiement
- Date

**Onglets**
- Toutes
- En attente
- Actives
- Livrees
- Annulees

**Actions Groupees**
- Mettre en traitement
- Marquer comme expedie
- Marquer comme livre

**Actions**
- Actualiser
- Exporter CSV
- Nouvelle commande

### 5.2 Details Commande

**Articles Commandes**
- Image, nom, SKU
- Quantite x Prix unitaire
- Total article
- Totaux (Sous-total, Taxes, Livraison, Reduction, Remboursement)

**Gestion du Statut**
- Dropdown statut commande
- Dropdown statut paiement
- Option envoyer notification
- Confetti pour SHIPPED et DELIVERED

**Informations**
- Client (lien vers fiche)
- Adresse de livraison
- Paiement (methode, statut, montant)
- Facture (lien PDF)
- Notes
- Remboursements

### 5.3 Creer une Commande

**Selection Client**
- Recherche en temps reel
- Pre-remplissage automatique

**Adresse de Livraison**
- Dropdown adresses existantes
- Detail complet

**Ajout de Produits**
- Recherche par nom/SKU
- Gestion panier (+/-, supprimer)

**Livraison et Paiement**
- Mode de livraison (liste dynamique)
- Mode de paiement (5 options)

**Options**
- Notes
- Date de commande (antidater)
- Code promo
- Remise manuelle

**Notifications**
- Envoyer SMS
- Envoyer WhatsApp

### 5.4 Gestion des Avis

**Statistiques**
- Total avis
- Publies
- En attente
- Note moyenne

**Filtres**
- Statut (Tous, Publies, En attente)
- Note (1-5 etoiles)

**Par Avis**
- Produit, note, achat verifie
- Auteur, date
- Contenu
- Reponse de l'equipe

**Actions**
- Approuver
- Rejeter
- Supprimer
- Repondre

---

## 6. FACTURATION ET PAIEMENTS

### 6.1 Liste des Factures

**Statuts**
- DRAFT (Brouillon)
- SENT (Envoyee)
- PAID (Payee)
- OVERDUE (En retard)
- CANCELLED (Annulee)
- REFUNDED (Remboursee)

**Colonnes**
- Numero
- Client
- Commande liee
- Date d'emission
- Date d'echeance
- Montant
- Statut
- Actions (voir, PDF, telecharger, supprimer)

**Statistiques**
- Total factures
- Payees, envoyees, en retard, brouillons
- Revenu total, montant en attente, en retard

### 6.2 Creer une Facture

**Client**
- Recherche existant
- Saisie manuelle

**Articles**
- Recherche produits
- Ajout manuel
- Calcul automatique

**Livraison et Paiement**
- Modes de livraison
- 5 methodes de paiement

**Montants**
- Sous-total, taxe, livraison, remise
- Total automatique

**Options**
- Notes/conditions
- Statut initial
- Antidatation
- Notifications SMS/WhatsApp

### 6.3 Details Facture

**Affichage**
- Articles avec images
- Totaux detailles
- Solde restant

**Gestion Statuts**
- Boutons rapides (Marquer payee, Envoyer)
- Mode edition

**Historique Paiements**
- Tableau des paiements recus
- Ajout de paiement (12 modes disponibles)
- Suppression

**Modes de Paiement (12 options)**
- Especes, Virement, Cheque
- Orange Money, MTN MoMo, Wave
- Carte bancaire, PayPal, PaiementPro
- Autre

**Actions**
- Actualiser, Modifier, PDF, Telecharger
- Renvoyer notification, Imprimer, Supprimer

### 6.4 Paiements Autonomes

**Description**
Paiements via /payer sans commande associee

**Colonnes**
- Reference
- Client
- Montant
- Canal (6 options)
- Statut
- Date

**Canaux**
- OMCIV2 (Orange Money)
- MOMOCI (MTN MoMo)
- FLOOZ (Moov Money)
- WAVECI (Wave)
- CARD, PAYPAL

### 6.5 Transactions

**Vue Unifiee**
Consolide: Commandes + Paiements Autonomes + Factures

**Types**
- Order (Commande)
- Standalone (Autonome)
- Invoice (Facture)

**Filtres**
- Recherche
- Type
- Statut

---

## 7. RAPPORTS DE VENTES

### 7.1 Vue Generale

**Periodes Disponibles**
- Aujourd'hui
- 7 jours (semaine)
- Ce mois
- Cette annee
- Personnalise

**KPIs**
- Revenus totaux
- Total commandes
- Panier moyen
- Clients uniques

**Graphiques**
- Evolution des revenus (ligne)
- Ventes par categorie (camembert)

**Tableaux**
- Top produits
- Modes de paiement
- Top clients

**Export CSV**

### 7.2 Ventes du Jour

- Graphique en barres des produits
- Top 10 produits du jour
- Tableau des commandes en temps reel

### 7.3 Ventes Semaine

- Graphique evolution quotidienne
- Top 10 produits (7 jours)
- Top 10 clients (7 jours)

### 7.4 Ventes Mois

- Evolution quotidienne du mois
- Ventes par categorie
- Top 15 produits
- Top 10 clients

### 7.5 Ventes Annee

- Evolution mensuelle (graphique aire)
- Distribution par categorie
- Revenus par mode de paiement
- Top 20 produits
- Top 15 clients avec medailles

---

## 8. GESTION DU BLOG

### 8.1 Dashboard Blog

**Statistiques**
- Articles totaux (publies vs brouillons)
- Categories
- Tags
- Vues totales

**Articles Recents**
- 5 derniers articles

### 8.2 Gestion des Articles

**Affichage**
- Image a la une
- Titre, categorie, date
- Vues, temps de lecture
- Tags (max 3)
- Statut (Publie/Brouillon)
- Badge "En vedette"

**Filtres**
- Recherche
- Categorie
- Statut
- En vedette

**Actions**
- Voir en direct
- Modifier
- Supprimer

### 8.3 Creer un Article

**Informations de Base**
- Titre (requis)
- Slug (auto-genere)
- Extrait/Resume

**Contenu**
- Editeur richtext complet

**Image a la Une**
- Upload ou URL
- Glisser-deposer

**SEO**
- Meta titre
- Meta description

**Publication**
- Publier l'article
- En vedette

**Organisation**
- Categorie
- Tags (selection multiple)

### 8.4 Categories et Tags

**Categories**
- Image/icone, nom, slug
- Nombre d'articles
- Actions (Modifier, Supprimer)

**Tags**
- Icone coloree, nom, slug
- Description
- Nombre d'articles
- Actions en grille

---

## 9. CATALOGUE PRODUITS

### 9.1 Liste des Produits

**Statistiques**
- Total produits
- Publies
- En vedette
- Ruptures de stock
- Stock faible
- Ajoutes aujourd'hui/semaine/mois

**Filtres**
- Recherche (nom, SKU)
- Categorie
- Statut publication
- Statut stock

**Tableau**
- Image
- Nom (badge Vedette)
- SKU
- Categorie
- Prix (avec promo)
- Stock (couleur)
- Statut
- Actions

**Actions Groupees**
- Publier
- Depublier
- Marquer en vedette

### 9.2 Creer/Modifier un Produit

**Informations de Base**
- Nom (requis)
- Slug
- Description courte
- Description detaillee (Rich Text)

**Prix et Stock**
- Prix (CFA)
- Prix promotionnel
- SKU (requis)
- Stock
- Seuil stock bas

**Marketing**
- Produits associes
- Produits upsell

**Caracteristiques Vetement**
- Type (Robe, Ensemble, Boubou...)
- Collection/Vintage
- Style
- Origine/Pays
- Tissu/Matiere
- Tailles disponibles

**Images**
- Upload ou URL
- Multi-images
- Premiere = principale

**SEO**
- Meta titre
- Meta description

**Publication**
- Publier
- En vedette

**Organisation**
- Categorie principale (requis)
- Categories additionnelles
- Classe fiscale
- Tags

**Livraison**
- Poids (kg)
- Dimensions (L×l×h)

### 9.3 Categories

**Affichage**
- Vue arbre hierarchique
- Image/logo
- Nom, slug
- Parent
- Nombre de produits

**Creation**
- Nom (requis)
- Slug
- Description
- Image
- Categorie parente

### 9.4 Tags

**Statistiques**
- Total tags
- Produits avec tags
- Moyenne par produit
- Tag le plus utilise

**Actions**
- Fusionner
- Renommer
- Supprimer

### 9.5 Inventaire

**Statistiques**
- Produits totaux
- En stock
- Stock faible
- Rupture
- Valeur totale
- Quantite totale

**Sections**
- Stock faible
- Rupture de stock
- Mouvements recents
- Stock par categorie

**Historique Mouvements**
- Type (Achat, Vente, Ajustement, Retour, Endommage)
- Quantite (+/-)
- Stock avant/apres
- Raison/Reference
- Utilisateur
- Date

### 9.6 Coupons

**Statistiques**
- Total coupons
- Actifs
- Expires
- Crees aujourd'hui/mois

**Tableau**
- Code
- Description
- Type (% ou montant)
- Minimum commande
- Utilisation (count/limit)
- Validite
- Statut

**Creation**
- Code (requis)
- Description
- Type de reduction
- Valeur
- Minimum commande
- Reduction maximale
- Limite utilisation totale
- Limite par utilisateur
- Periode de validite

### 9.7 Mediatheque

**Vue Grille/Liste**
- Apercu fichier
- Badge categorie
- Actions (Voir, Copier URL, Supprimer)

**Upload**
- Categories predefinies (marketing, products, categories, blog, banners, misc)
- Nouvelle categorie custom
- Drag-drop
- Formats: JPG, PNG, GIF, WEBP, PDF, DOC (max 50MB)

**Apercu**
- Metadonnees
- URL relative et complete
- Telecharger, Ouvrir, Supprimer

---

## 10. SYSTEME DE NOTIFICATIONS

### 10.1 Vue d'Ensemble

**Composants**
- 40 Templates disponibles
- 20 Triggers configures
- 3 Canaux actifs (SMS, WhatsApp, Email)

### 10.2 Templates

**Statistiques**
- Total templates
- Actives/Desactives
- SMS vs WhatsApp
- Par destinataire

**Par Template**
- Canal (SMS/WhatsApp)
- Type destinataire (Client/Admin)
- Statut
- Nom, description
- Trigger
- Contenu

**Variables (29 disponibles)**
- Client: {customer_name}, {billing_*}
- Commande: {order_*}
- Paiement: {payment_*}
- Produit: {product_*}
- Magasin: {store_*}

**Actions**
- Modifier
- Activer/Desactiver
- Tester

### 10.3 Logs

**Statistiques**
- Total envoyes
- Reussis
- Echoues
- En attente

**Tableau**
- Date
- Trigger
- Canal
- Destinataire
- Statut

**Details**
- Contenu du message
- Message d'erreur
- Reponse du fournisseur (JSON)

**Filtres**
- Recherche
- Statut
- Canal
- Trigger
- Date

**Actions**
- Export CSV
- Nettoyage logs anciens (30+ jours)

### 10.4 Parametres

**Destinataires Admin**
- Telephones admin
- Emails admin

**Canaux**
- SMS (SMSing): Toggle, API Key, Sender ID
- WhatsApp (SMSing): Toggle, API Key, Phone ID
- Email: Bientot

**Basculement Automatique (Failover)**
- Ordre: WhatsApp > SMS > WhatsApp Cloud

**Mode Test**
- Toggle
- Numero de test

### 10.5 Relances de Paiement

**Configuration**
- Activer relances automatiques

**Trois Niveaux**
- Premier rappel: 24h (configurable)
- Deuxieme rappel: 72h
- Dernier rappel: 120h

**Comportement**
- Planifies a la creation de commande
- Annules si paiement ou annulation

### 10.6 Notifications Push

**Templates**
- Titre (max 65 car)
- Corps (max 240 car)
- 9 variables disponibles
- Apercu iOS/Android

**Triggers (20+)**
- Commandes, paiements, livraisons
- Fidelite, panier abandonne
- Admin (nouvelles commandes, stock bas, etc.)

---

## 11. PARAMETRES ET CONFIGURATION

### 11.1 Parametres Boutique (6 onglets)

**Onglet General**
- Informations boutique (nom, URL, description, contact)
- Adresse complete
- Devise et taxes
- Reseaux sociaux

**Onglet Produits**
- Affichage (grille/liste, par page, tri)
- Format stock
- Avis clients
- Permaliens

**Onglet Panier & Paiement**
- Panier (actif, codes promo)
- Paiement (sans compte, telephone/email obligatoire)
- Livraison (par commande/article)

**Onglet Comptes**
- Inscription clients
- Creation compte au paiement
- Newsletter
- Pages legales

**Onglet Emails**
- Expediteur (nom, email)
- Notifications (confirmation, bienvenue, alertes stock)

**Onglet Avance**
- API REST
- Webhooks
- Mode maintenance

### 11.2 Livraison

**Methodes de Livraison**
- Nom, description
- Zone
- Type (Fixe, Gratuit, Variable-Yango, Poids, Prix)
- Cout
- Delai estime
- Statut

**Zones de Livraison**
- Nom
- Pays
- Methodes associees
- Statut

### 11.3 Equipe

**Statistiques**
- Total membres
- Administrateurs
- Managers
- Personnel

**Gestion**
- Nom, email, telephone
- Role (ADMIN, MANAGER, STAFF)
- Mot de passe
- Derniere connexion

### 11.4 Taxes

**Taux de Taxes**
- Pays, nom, taux %
- Appliquer a la livraison
- Taux par defaut
- Priorite

**Classes Fiscales**
- Nom, description
- Taux personnalise
- Produits associes

---

## 12. ANALYTICS ET RAPPORTS

### 12.1 Page Analytics

**Filtrage**
- Date de debut/fin
- Reinitialiser

**Export**
- Export Revenu (CSV)
- Export Commandes (CSV)
- Export Produits (CSV)

**KPIs**
- Revenu total
- Panier moyen
- Clients
- Produits

**Detail Revenu**
- Sous-total
- Taxes
- Livraison
- Reductions

**Tableaux**
- Top 10 produits
- Commandes par statut
- Commandes par mode de paiement

### 12.2 Analytics Revenu

**Filtres**
- Periode (Jour/Semaine/Mois/Annee)
- Date debut/fin

**KPIs avec Tendances**
- Revenu total (vs periode precedente)
- Commandes
- Panier moyen
- Reductions

**Composition du Revenu**
- Barres de progression par composant

**Tableaux**
- Revenu par periode
- Revenu par categorie (top 10)
- Revenu par mode de paiement

### 12.3 Analytics Produits

**KPIs**
- Total produits
- Unites vendues
- Revenu total
- Alertes stock

**Onglets (5 vues)**
- Top ventes (unites)
- Top ventes (revenu)
- Faible performance
- Jamais vendus
- Rupture (meilleures ventes)

### 12.4 Marketing

**Onglets**
- Vue d'ensemble
- Packs produits
- Fidelite
- Paniers abandonnes

**Fonctionnalites**
- Bundles avec reduction
- Programme de fidelite (Bronze/Silver/Gold/Platinum)
- Recovery emails pour paniers abandonnes

### 12.5 Rapports Personnalises

**Creation**
- Nom du rapport
- Type (Ventes, Clients, Produits, Inventaire)
- Colonnes a inclure

**Rapports Sauvegardes**
- Execution a la demande

**Rapports Planifies**
- Frequence
- Destinataires
- Format (CSV/PDF)

---

## RESUME TECHNIQUE

### Architecture
- **Frontend**: Next.js 14 (App Router)
- **Backend**: API Routes Next.js
- **Database**: PostgreSQL avec Prisma ORM
- **Auth**: NextAuth.js
- **UI**: Tailwind CSS, Dark/Light mode
- **Charts**: Recharts

### Points d'Integration

**APIs Externes**
- SMSing (SMS et WhatsApp)
- PaiementPro (Paiement en ligne)
- WhatsApp Cloud API

**Methodes de Paiement (12)**
- Especes, Virement, Cheque
- Orange Money, MTN MoMo, Moov Money, Wave
- Carte bancaire, PayPal, PaiementPro, Autre

### Securite
- Authentification par email/mot de passe
- Roles: ADMIN, MANAGER, STAFF
- Sessions securisees

---

**Document genere automatiquement**
**CECHEMOI - Plateforme E-commerce Mode Africaine**
