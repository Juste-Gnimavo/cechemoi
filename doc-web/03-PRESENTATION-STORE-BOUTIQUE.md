# CECHEMOI - Store / Boutique en Ligne

## Presentation Complete des Fonctionnalites

**Version**: 1.0
**Date**: Decembre 2025
**Stack**: Next.js 14, PaiementPro, NextAuth

---

## SOMMAIRE

1. [Page d'Accueil](#1-page-daccueil)
2. [Catalogue Produits](#2-catalogue-produits)
3. [Page Vins](#3-page-vins)
4. [Page Produit](#4-page-produit)
5. [Blog](#5-blog)
6. [Consultation / Rendez-vous](#6-consultation--rendez-vous)
7. [Showroom](#7-showroom)
8. [Sur-Mesure](#8-sur-mesure)
9. [Panier](#9-panier)
10. [Checkout](#10-checkout)
11. [Processus de Commande](#11-processus-de-commande)
12. [Paiement Direct](#12-paiement-direct)
13. [Authentification](#13-authentification)
14. [Pages Legales](#14-pages-legales)

---

## 1. PAGE D'ACCUEIL

### Presentation
Page vitrine principale de la boutique CECHEMOI.

### Sections Affichees

**Hero Section**
- Banniere principale attrayante
- Message de bienvenue
- Call-to-action vers le catalogue

**Categories**
- Affichage des categories principales
- Navigation rapide vers les collections

**Produits en Vedette**
- Selection de produits mis en avant
- Acces direct aux fiches produits

**Pourquoi Nous Choisir**
- Arguments de vente
- Valeurs de la marque

**Galerie**
- Showcase visuel des creations
- Inspiration mode

**Footer**
- Liens de navigation
- Informations de contact
- Reseaux sociaux

### Fonctionnalites
- Mode clair/sombre
- Navigation responsive
- Modal "App bientot disponible"

---

## 2. CATALOGUE PRODUITS

### Presentation
Vue d'ensemble de tous les produits disponibles organises par categories.

### Elements Affiches

**Hero**
- Titre "Notre Catalogue"
- Compteur total de produits

**Produits par Categorie**
- Grille groupee par categorie primaire
- Maximum 4 produits par categorie
- Lien "Voir tout" pour chaque categorie
- Tri alphabetique des categories

### Fonctionnalites
- Chargement asynchrone
- Mode dark/light
- Responsive (1-4 colonnes)
- Fallback si catalogue vide

### Actions
- Clic sur produit pour details
- "Voir tout" pour une categorie complete
- "Voir les X autres produits"

---

## 3. PAGE VINS

### Presentation
Section dediee a la collection de vins.

### Filtres par Categorie

**Categories Disponibles**
- Tous
- Grands Vins
- Vin Rouge
- Vin Blanc
- Vin Rose
- Effervescent
- Champagne

### Options de Tri
- Plus recents (defaut)
- Prix croissant
- Prix decroissant
- Nom A-Z

### Affichage
- Pills de categories (desktop)
- Dropdown (mobile)
- Compteur "X vins trouves"
- Grille responsive 1-4 colonnes

### Fonctionnalites
- Filtrage client-side
- Tri instantane
- Mode dark par defaut

---

## 4. PAGE PRODUIT

### Presentation
Fiche detaillee d'un produit avec toutes ses informations.

### Informations Affichees

**Images**
- Galerie d'images
- Zoom au survol
- Navigation entre images

**Details Produit**
- Nom
- Prix (et prix barre si promo)
- Description courte
- Description complete
- SKU
- Categorie
- Tags

**Caracteristiques Vetement** (si applicable)
- Type
- Style
- Tissu/Matiere
- Collection
- Origine
- Tailles disponibles

**Stock**
- Disponibilite
- Quantite restante

### Actions Disponibles
- Ajouter au panier
- Ajouter aux favoris (wishlist)
- Partager
- Selectionner quantite

### Sections Complementaires
- Produits associes
- Produits recommandes (upsell)
- Avis clients

---

## 5. BLOG

### Presentation
Section actualites et conseils de la boutique.

### Elements Affiches

**Hero**
- Titre "Actualites & Conseils"

**Barre de Recherche**
- Autocomplete
- Recherche temps reel

**Filtres**
- Par categorie
- Bouton "Tous"

### Contenu par Article

**Affichage**
- Image avec overlay degrade
- Badge categorie (couleur personnalisee)
- Temps de lecture + vues
- Titre (2 lignes max)
- Extrait (3 lignes max)
- Tags (max 3)
- Date + Auteur
- Lien "Lire l'article"

### Fonctionnalites
- Recherche API
- Filtrage par categorie
- Pagination (12 articles/page)
- Grille 1-3 colonnes
- Hover effects

---

## 6. CONSULTATION / RENDEZ-VOUS

### Presentation
Systeme de reservation de rendez-vous en 4 etapes.

### Etape 1: Selection du Service

**Affichage**
- Grille de services
- Nom, description, duree
- Prix
- Badge couleur

**Services Types**
- Consultation mode
- Creation sur-mesure
- Essayage
- Conseil personnalise

### Etape 2: Date et Heure

**Calendrier**
- Navigation par mois
- Dimanches desactives
- Dates passees desactivees

**Creneaux Horaires**
- Horaires disponibles
- Selection unique

### Etape 3: Informations Personnelles

**Formulaire**
- Nom complet (requis)
- Telephone WhatsApp (requis)
- Email
- Notes

**Fonctionnalites**
- Auto-fill si connecte
- Selection pays telephone
- Detection geolocalisation

**Resume**
- Recap de la reservation

### Etape 4: Confirmation

**Affichage**
- Reference de rendez-vous
- Details complets
- Contact WhatsApp

**Actions**
- Retour accueil
- Espace client
- Contacter via WhatsApp

### Fonctionnalites Techniques
- Progress stepper visuel
- API creneaux dynamique
- Confirmation SMS/WhatsApp

---

## 7. SHOWROOM

### Presentation
Galerie virtuelle des creations CECHEMOI.

### Modes d'Affichage

**Slideshow (Defaut)**
- 2 images cote a cote
- Navigation fleches
- Pagination dots
- Auto-play 5 secondes
- Bouton play/pause

**Grille**
- 2-5 colonnes responsive
- Hover effects
- Lightbox au clic

### Lightbox

**Fonctionnalites**
- Navigation gauche/droite
- Fermeture Echap
- Info detaillee
- Favoris
- Bouton "Commander sur-mesure"
- Compteur de page

### Raccourcis Clavier
- Fleches: Navigation
- Espace: Pause
- G: Mode grille
- S: Mode slideshow

### Contenu
- 20 photos de creations
- Categories: Sur-mesure, Robes, Ensembles, Pret-a-porter
- Descriptions

### Interactions
- Favoris (coeur)
- Fullscreen optimise
- Transitions fluides

---

## 8. SUR-MESURE

### Presentation
Page de presentation du service sur-mesure.

### Sections

**Hero**
- Image de fond
- Titre "Creations Sur-Mesure"
- Description
- Boutons: "Prendre rendez-vous" + WhatsApp

**Features (4 cartes)**
- Prise de mensurations
- Creation unique
- Confection artisanale
- Accompagnement

**Processus (4 etapes)**
1. Consultation
2. Creation du modele
3. Confection
4. Essayage & Livraison

**Why Us (6 points)**
- Consultation gratuite
- Tissus premium
- Delais respectes
- Ajustements inclus
- Accompagnement A-Z
- Prix transparent

**Call-to-Action**
- Section primaire
- Bouton "Prendre rendez-vous"

### Liens
- Vers /consultation
- WhatsApp direct

---

## 9. PANIER

### Presentation
Page du panier d'achat avec resume de commande.

### Liste des Articles

**Par Article**
- Image
- Nom (lien vers produit)
- Prix unitaire
- Quantite (+/-)
- Total article
- Bouton supprimer

**Actions**
- Modifier quantites
- Supprimer articles
- Vider le panier

### Resume de Commande (Sidebar)

**Calculs**
- Sous-total
- Livraison "Calculee a l'etape suivante"
- Total

**Code Promo**
- Input avec icone
- Bouton "Appliquer"
- Affichage coupon applique
- Details de reduction
- Option "Retirer coupon"

**Economies**
- Affichage si reduction

### Actions Principales
- "Passer la commande"
- "Continuer mes achats"

### Cas Speciaux
- Panier vide: Message + lien catalogue
- Non connecte: Modal d'authentification au checkout
- Validation coupon via API

### Fonctionnalites
- Mode dark/light
- Responsive
- Toast notifications
- Conversion devise

---

## 10. CHECKOUT

### Presentation
Processus de commande en 3 etapes.

### Etape 1: Adresse de Livraison

**Options**
- Dropdown adresses sauvegardees
- "Nouvelle adresse"

**Geolocalisation**
- Bouton "Ma position GPS"
- Affichage coordonnees

**Formulaire**
- Nom complet
- Telephone (requis)
- Commune/Quartier (requis)
- Cite/Zone
- Rue/Adresse
- Ville (Abidjan, fixe)
- Indications pour livreur

### Etape 2: Mode de Paiement

**Options**
- "Je paierai a la livraison" (Cash on Delivery)
- "Je paie en ligne" (PaiementPro)

**Canaux PaiementPro (6 options)**
- Orange Money
- MTN MoMo
- Moov Money
- Wave
- Carte bancaire (Visa)
- PayPal

**Affichage**
- Logos des providers
- Selection radio

### Etape 3: Mode de Livraison

**Options Dynamiques**
- Chargees via API
- Nom, description
- Cout (Gratuit / Montant / "A payer au livreur")
- Delai estime

### Sidebar Resume

**Contenu**
- Liste articles (scrollable)
- Coupon applique
- Sous-total
- Reduction
- Frais de livraison
- Total
- Delai estime

### Fonctionnalites
- Auto-fetch adresses
- Pre-remplissage defaut
- Geolocalisation browser
- Calcul shipping temps reel
- Validation formulaire

---

## 11. PROCESSUS DE COMMANDE

### Presentation
Animation du traitement de commande apres checkout.

### Pour Paiement a la Livraison (5 etapes)

1. **Creation commande** (400ms)
2. **Generation facture** (600ms)
3. **Envoi SMS** (500ms)
4. **Envoi WhatsApp** (600ms)
5. **Finalisation** (400ms)

**Resultat**
- Confetti
- Redirection vers confirmation

### Pour Paiement en Ligne (3 etapes)

1. **Creation commande** (400ms)
2. **Generation facture** (600ms)
3. **Preparation paiement** (500ms)

**Resultat**
- Redirection vers /payer/[amount]

### Interface

**Etats**
- Loading: Spinner + "Traitement en cours"
- Success: Checkmark + "Commande confirmee!"
- Error: Message + boutons retry

**Actions Success**
- "Voir ma commande"
- "Continuer mes achats"

**Actions Error**
- "Reessayer"
- "Retourner au panier"

---

## 12. PAIEMENT DIRECT

### Presentation
Systeme de paiement sans commande (pour factures, services, etc.)

### Page d'Entree (/payer)

**Formulaire**
- Input montant (FCFA)
- Range: 100 - 10,000,000
- Bouton "Continuer"

### Page de Paiement (/payer/[amount])

**Affichage**
- Montant en banniere

**Formulaire**
- Nom complet
- Telephone

**Selection Mode Paiement (6 boutons)**
- Orange Money
- MTN MoMo
- Moov Money
- Wave
- Carte bancaire
- PayPal

**Action**
- "Payer [montant] FCFA"

### Page de Succes (/payer/success)

**Etats**
- Loading: Verification en cours
- Success: Checkmark + details + confetti
- Pending: Spinner + "En traitement"
- Failed: X + "Reessayer"

**Affichage Success**
- Montant
- Mode de paiement
- Reference

---

## 13. AUTHENTIFICATION

### Connexion par Telephone

### Etape 1: Saisie du Numero

**Formulaire**
- Selecteur pays (auto-detection geolocation)
- Input telephone
- Bouton "Recevoir le code"

**API**
- POST /api/auth/otp/send
- Purpose: 'login'

### Etape 2: Verification OTP

**Formulaire**
- Affichage telephone complet
- OTPInput (4 chiffres)
- Bouton "Se connecter"
- Lien "Modifier le numero"

**Cas Speciaux**
- Numero non trouve: Modal "Creer un compte"
- Code expire/invalide: Message d'erreur
- Succes: Confetti + Redirection

### Inscription par Telephone

### Etape 1: Formulaire

**Champs**
- Prenom
- Telephone avec selecteur pays
- Bouton "Recevoir le code"

### Etape 2: Verification

**Formulaire**
- OTPInput (4 chiffres)
- Bouton "Creer mon compte"

**Donnees Passees**
- Phone, code, name
- WhatsApp number
- Geolocation (IP, city, country)

### Fonctionnalites
- Geolocation IP (ipapi.co)
- Auto-detection pays
- Modal messages
- Confetti welcome
- Support dark

---

## 14. PAGES LEGALES

### Pages Disponibles
- Mentions legales
- Politique de confidentialite
- Conditions generales de vente
- Politique de cookies
- Politique de retour

---

## INTEGRATIONS TECHNIQUES

### Paiement

**Provider**: PaiementPro

**Canaux Supportes**
- OMCIV2: Orange Money
- MOMOCI: MTN MoMo
- FLOOZ: Moov Money
- WAVECI: Wave
- CARD: Carte bancaire
- PAYPAL: PayPal

**Flow**
1. Checkout
2. Order Progress (3 etapes)
3. Redirect PaiementPro
4. Callback /payer/success

### Authentification

**Provider**: NextAuth.js

**Methode**: Phone OTP uniquement

**Strategies**
- phone-otp: Login
- phone-register: Registration

**Geolocation**: ipapi.co

**Session**: 30 jours

### APIs Principales

**Produits**
- GET /api/products

**Blog**
- GET /api/blog/posts
- GET /api/blog/categories

**Consultations**
- GET /api/consultations/services
- GET /api/consultations/slots
- POST /api/consultations/book

**Paiement**
- GET /api/shipping/calculate
- POST /api/coupons/validate
- POST /api/orders/stream
- POST /api/payer/initialize
- GET /api/payer/status/[ref]

**Compte**
- GET /api/account/addresses

### Stores (Zustand)

**Cart Store**
- Items
- Coupon applique
- Total
- Discount
- Persistence locale

**Currency Store**
- Taux de change dynamique

---

## CARACTERISTIQUES UX/UI

### Design
- Mode clair/sombre supporte partout
- Responsive (mobile-first)
- Animations fluides
- Confetti celebrations

### Composants Reutilises
- ProductCard
- AuthModal
- CountrySelector
- OTPInput
- AuthMessageModal

### Feedback Utilisateur
- Toast notifications
- Loading spinners
- Skeleton loaders
- Etats vides avec CTA

### Accessibilite
- Navigation clavier (Showroom)
- Labels et aria
- Contrastes adaptes

---

## PARCOURS UTILISATEUR TYPE

### Decouverte
1. Page d'accueil
2. Navigation catalogue/vins
3. Consultation fiches produits

### Achat Simple
1. Ajout au panier
2. Checkout (connexion si necessaire)
3. Selection adresse
4. Selection paiement
5. Selection livraison
6. Confirmation
7. Paiement
8. Suivi commande

### Rendez-vous
1. Page consultation
2. Selection service
3. Selection date/heure
4. Informations personnelles
5. Confirmation
6. Contact WhatsApp

### Sur-Mesure
1. Decouverte showroom
2. Page sur-mesure
3. Prise de rendez-vous
4. Consultation en boutique

---

## RESUME

### Pages Publiques: 16+
### Fonctionnalites Principales:
- E-commerce complet (catalogue, panier, checkout)
- Systeme de rendez-vous
- Blog integre
- Showroom virtuel
- Service sur-mesure
- Paiement multi-canal (6 options)
- Authentification OTP
- Programme fidelite

### Technologies:
- Next.js 14 (App Router)
- Tailwind CSS
- Zustand (state management)
- PaiementPro (paiement)
- NextAuth (authentification)
- ipapi.co (geolocation)

---

**Document genere automatiquement**
**CECHEMOI - Plateforme E-commerce Mode Africaine**
