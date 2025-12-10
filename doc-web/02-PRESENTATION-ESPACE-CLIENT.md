# CECHEMOI - Espace Client

## Presentation Complete des Fonctionnalites

**Version**: 1.0
**Date**: Decembre 2025
**Stack**: Next.js 14, NextAuth (Phone OTP)

---

## SOMMAIRE

1. [Tableau de Bord](#1-tableau-de-bord)
2. [Mes Commandes](#2-mes-commandes)
3. [Mes Rendez-vous](#3-mes-rendez-vous)
4. [Mes Factures](#4-mes-factures)
5. [Mon Profil](#5-mon-profil)
6. [Mes Adresses](#6-mes-adresses)
7. [Ma Wishlist](#7-ma-wishlist)
8. [Historique des Paiements](#8-historique-des-paiements)
9. [Programme de Fidelite](#9-programme-de-fidelite)
10. [Notifications](#10-notifications)
11. [Mes Avis](#11-mes-avis)
12. [Parametres](#12-parametres)

---

## ACCES A L'ESPACE CLIENT

### Authentification
- **Methode**: Connexion par telephone uniquement (OTP)
- **Processus**: Entree du numero > Reception code 4 chiffres > Verification
- **Session**: 30 jours
- **Securite**: Code OTP via SMS/WhatsApp

### Navigation
L'espace client est accessible via le header apres connexion avec les sections suivantes:
- Tableau de bord
- Mes Commandes
- Mes Rendez-vous
- Mes Factures
- Mon Profil
- Adresses
- Ma Wishlist
- Paiements
- Points Fidelite
- Notifications
- Mes Avis
- Parametres

---

## 1. TABLEAU DE BORD

### Presentation
Page d'accueil de l'espace client offrant une vue d'ensemble de l'activite.

### Elements Affiches

**Carte de Profil**
- Photo de profil
- Nom complet
- Numero de telephone
- Lien vers le profil complet

**Statistiques Rapides**
- Nombre de commandes
- Articles en favoris (wishlist)
- Adresses enregistrees

**Points de Fidelite**
- Points disponibles
- Niveau actuel (Bronze, Silver, Gold, Platinum)
- Lien vers le programme

**Commandes Recentes**
- Liste des 5 dernieres commandes
- Numero, date, statut, total
- Acces direct aux details

### Actions Disponibles
- Voir le profil
- Se deconnecter
- Naviguer vers toutes les sections

---

## 2. MES COMMANDES

### 2.1 Liste des Commandes

**Informations Affichees**
- Numero de commande
- Date de creation
- Nombre d'articles
- Montant total
- Statut de commande
- Statut de paiement

**Statuts de Commande**
- PENDING (En attente) - Jaune
- PROCESSING (En traitement) - Bleu
- SHIPPED (Expediee) - Violet
- DELIVERED (Livree) - Vert
- CANCELLED (Annulee) - Rouge
- REFUNDED (Remboursee) - Gris

**Statuts de Paiement**
- PENDING (En attente)
- COMPLETED (Paye)
- FAILED (Echoue)
- REFUNDED (Rembourse)

**Filtres Disponibles**
- Toutes les commandes
- En attente
- En traitement
- Expediees
- Livrees
- Annulees

**Fonctionnalites**
- Pagination
- Acces aux details
- Acces a la facture

### 2.2 Details d'une Commande

**Informations Completes**
- Numero et date de commande
- Statut avec badge colore
- Numero de suivi (si disponible)

**Articles Commandes**
- Image du produit
- Nom du produit (lien vers la fiche)
- Quantite
- Prix unitaire
- Total par article

**Calcul du Total**
- Sous-total
- Reduction appliquee
- Frais de livraison
- Taxe
- Total final

**Adresse de Livraison**
- Nom complet
- Telephone
- Adresse complete
- Ville, code postal, pays

**Informations de Paiement**
- Methode de paiement
- Statut du paiement
- Reference de paiement

**Facture Associee**
- Numero de facture
- Lien pour voir/telecharger

**Historique des Notes**
- Notes du vendeur
- Mises a jour sur la commande

---

## 3. MES RENDEZ-VOUS

### Presentation
Gestion complete des consultations et rendez-vous pris en boutique.

### Liste des Rendez-vous

**Informations Affichees**
- Type de service
- Date et heure
- Reference
- Duree (minutes)
- Prix
- Statut de paiement

**Statuts de Rendez-vous**
- PENDING (En attente) - Jaune
- CONFIRMED (Confirme) - Bleu
- COMPLETED (Termine) - Vert
- CANCELLED (Annule) - Rouge
- NO_SHOW (Absent) - Gris

**Statuts de Paiement**
- UNPAID (Non paye) - Orange
- PAID (Paye) - Vert
- REFUNDED (Rembourse) - Gris

**Statistiques**
- En attente
- Confirmes
- Termines
- Annules

### Filtres
- Tous
- En attente
- Confirmes
- Termines
- Annules

### Actions Disponibles

**Reporter un Rendez-vous**
- Disponible pour: PENDING, CONFIRMED
- Calendrier interactif
- Selection parmi les creneaux disponibles
- Dimanches et dates passees desactives

**Annuler un Rendez-vous**
- Champ raison (optionnel)
- Confirmation requise

**Prendre un Nouveau Rendez-vous**
- Lien vers la page de consultation

---

## 4. MES FACTURES

### 4.1 Liste des Factures

**Informations Affichees**
- Numero de facture
- Date d'emission
- Montant total
- Statut
- Date d'echeance
- Date de paiement
- Commande associee

**Statuts de Facture**
- SENT (Envoyee) - Bleu
- PAID (Payee) - Vert
- OVERDUE (En retard) - Rouge
- CANCELLED (Annulee) - Gris
- REFUNDED (Remboursee) - Violet

**Filtres**
- Toutes
- Envoyees
- Payees
- En retard
- Annulees
- Remboursees

### 4.2 Details d'une Facture

**Informations Completes**
- Numero de facture
- Montant total
- Statut avec badge

**Articles Factures**
- Description
- Quantite
- Prix unitaire
- Total par ligne

**Calcul du Total**
- Sous-total
- Reduction
- Livraison
- Taxe
- Total

**Informations Client**
- Nom, email, telephone
- Adresse

**Dates**
- Emission
- Echeance
- Paiement (si paye)

**Commande Associee**
- Numero et lien

**Notes**
- Conditions de paiement

### Actions Disponibles

**Payer la Facture** (si statut SENT)
- Grille de 6 modes de paiement:
  - Orange Money
  - MTN MoMo
  - Moov Money
  - Wave
  - Carte bancaire
  - PayPal
- Selection visuelle
- Redirection vers le paiement

**Autres Actions**
- Telecharger PDF
- Voir PDF en ligne
- Imprimer
- Retourner a la liste

---

## 5. MON PROFIL

### Informations Affichees

**Profil**
- Photo de profil
- Nom complet
- Numero de telephone
- Email
- WhatsApp
- Ville et pays
- Date d'adhesion

**Securite**
- Statut d'authentification
- Information OTP

### Formulaire de Modification

**Champs Editables**
- Nom complet (requis)
- Email (optionnel)
- WhatsApp (optionnel)

**Champs Non Editables**
- Telephone (utilise pour l'authentification)

### Gestion de la Photo

**Upload**
- Formats acceptes: images
- Taille max: 5MB
- Apercu immediat

### Actions
- Modifier les informations
- Enregistrer les changements
- Annuler les modifications

---

## 6. MES ADRESSES

### Presentation
Gestion des adresses de livraison pour faciliter les commandes.

### Liste des Adresses

**Informations par Adresse**
- Nom complet
- Telephone
- Adresse complete (ligne 1, ligne 2)
- Ville, code postal, pays
- Coordonnees GPS (si capturees)
- Indicateur "Par defaut"

### Actions Disponibles

**Ajouter une Adresse**
- Formulaire complet
- Capture de geolocalisation

**Modifier une Adresse**
- Edition des champs

**Supprimer une Adresse**
- Confirmation requise

**Definir par Defaut**
- Une adresse comme adresse principale

### Formulaire d'Adresse

**Champs**
- Nom complet (requis)
- Telephone (requis)
- Adresse ligne 1 (requis)
- Adresse ligne 2
- Ville (requis)
- Pays (requis, liste predefinie)
- Code postal
- Geolocalisation (optionnel)
- Adresse par defaut (checkbox)

**Pays Disponibles**
- Cote d'Ivoire
- Senegal
- Mali
- Burkina Faso
- Benin
- Togo
- Niger
- Guinee

**Geolocalisation**
- Capture des coordonnees GPS
- Latitude, longitude, precision
- Composant specialise

---

## 7. MA WISHLIST

### Presentation
Liste des produits favoris sauvegardes pour achat ulterieur.

### Informations par Produit

**Affichage**
- Image du produit
- Nom
- Description
- Prix
- Categorie (badge)
- Date d'ajout
- Statut du stock

**Indicateurs**
- "En stock" - Vert
- "Rupture de stock" - Rouge

### Actions Disponibles

**Par Produit**
- Ajouter au panier
- Voir le produit (page detail)
- Retirer de la wishlist

### Affichage
- Grille 3 colonnes (responsive)
- Hover effects sur images
- Page vide avec CTA si aucun favori

---

## 8. HISTORIQUE DES PAIEMENTS

### Presentation
Historique complet de tous les paiements effectues.

### Informations par Paiement

**Donnees Affichees**
- Numero de commande associee
- Montant
- Devise
- Methode de paiement
- Statut
- Reference de paiement
- ID de transaction
- Date et heure

**Statuts de Paiement**
- COMPLETED (Complete) - Vert
- PENDING (En attente) - Jaune
- PROCESSING (En traitement) - Bleu
- FAILED (Echoue) - Rouge
- REFUNDED (Rembourse) - Gris

**Methodes de Paiement**
- Carte bancaire
- Mobile Money
- Wave
- Orange Money
- MTN Money
- Paiement a la livraison

### Filtres
- Tous
- Completes
- En attente
- En traitement
- Echoues
- Rembourses

### Actions
- Voir la commande associee
- Pagination

---

## 9. PROGRAMME DE FIDELITE

### Presentation
Programme de points recompensant la fidelite des clients.

### Informations Affichees

**Etat Actuel**
- Points disponibles
- Niveau actuel
- Points a vie (total cumule)

**Progression**
- Prochain niveau a debloquer
- Barre de progression
- Points necessaires

### Niveaux de Fidelite

| Niveau | Points Requis | Couleur |
|--------|---------------|---------|
| Bronze | 0 - 999 | Bronze |
| Silver | 1,000 - 2,499 | Argent |
| Gold | 2,500 - 4,999 | Or |
| Platinum | 5,000+ | Platine |

### Historique des Transactions

**Types de Transactions**
- EARNED (Gagne) - Fleche verte
- REDEEMED (Utilise) - Fleche rouge
- EXPIRED (Expire)
- BONUS (Bonus)
- REFUND (Remboursement)

**Informations**
- Date
- Type
- Description
- Points (+/-)
- Solde apres transaction

### Comment ca Marche

**Gain de Points**
- 1 point pour 100 FCFA depenses

**Utilisation**
- Points convertibles en reduction
- Applicable au checkout

**Avantages par Niveau**
- Offres exclusives
- Reductions supplementaires
- Acces prioritaire

### Animations
- Confetti lors du passage Gold/Platinum
- Celebration visuelle

---

## 10. NOTIFICATIONS

### Presentation
Historique de toutes les notifications recues.

### Informations par Notification

**Donnees Affichees**
- Type de notification
- Titre
- Message
- Canal d'envoi
- Date et heure
- Commande associee (si applicable)

**Types de Notifications (avec icones)**
- Commandes et factures (bleu)
- Paiements (vert)
- Fidelite et promotions (primaire)
- Annulation, echec, remboursement (rouge)
- Autre (gris)

**Canaux**
- SMS
- WhatsApp
- Email

### Actions
- Voir la commande associee
- Pagination

---

## 11. MES AVIS

### Presentation
Gestion des avis laisses sur les produits achetes.

### Informations par Avis

**Donnees Affichees**
- Image du produit
- Nom du produit
- Note en etoiles (1-5)
- Titre de l'avis
- Commentaire
- Date de creation
- Statut de moderation
- Badge "Achat verifie"

**Statuts d'Avis**
- APPROVED (Approuve) - Vert
- PENDING (En attente) - Jaune
- REJECTED (Rejete) - Rouge

### Filtres
- Tous
- Approuves
- En attente
- Rejetes

### Actions
- Voir le produit
- Voir l'avis sur le produit (si approuve)
- Pagination

---

## 12. PARAMETRES

### Presentation
Configuration des preferences du compte.

### Sections de Parametres

**1. Langue**
- Francais
- English

**2. Canaux de Notification**
- Notifications par email (toggle)
- Notifications par SMS (toggle)
- Notifications WhatsApp (toggle)

**3. Types de Notifications**
- Mises a jour de commandes (toggle)
- Promotions et nouveautes (toggle)
- Emails marketing (toggle)

**4. Actions du Compte**
- Telecharger mes donnees
- Supprimer mon compte (avec avertissement)

### Fonctionnalites
- Toggles avec sauvegarde automatique
- Feedback immediat (toast)
- Reversion en cas d'erreur

---

## RESUME DES FONCTIONNALITES

### Gestion des Commandes
- Suivi en temps reel
- Historique complet
- Details des articles
- Factures associees

### Gestion des Rendez-vous
- Reservation en ligne
- Report de rendez-vous
- Annulation
- Historique

### Gestion des Factures
- Consultation
- Paiement en ligne (6 methodes)
- Telechargement PDF
- Impression

### Gestion du Profil
- Modification des informations
- Photo de profil
- Multi-adresses

### Programme de Fidelite
- Accumulation de points
- 4 niveaux
- Historique des transactions
- Recompenses

### Communication
- Notifications multi-canal
- Preferences personnalisables
- Historique complet

---

## CARACTERISTIQUES TECHNIQUES

### Authentification
- **Methode**: Phone OTP uniquement
- **Provider**: NextAuth.js
- **Session**: 30 jours
- **Securite**: Code 4 chiffres SMS/WhatsApp

### Design
- Mode clair/sombre supporte
- Design responsive (mobile-first)
- Animations fluides
- Toast notifications

### APIs Utilisees
- `/api/account/dashboard`
- `/api/account/orders`
- `/api/account/appointments`
- `/api/account/invoices`
- `/api/account/profile`
- `/api/account/addresses`
- `/api/wishlist`
- `/api/account/payments`
- `/api/account/loyalty`
- `/api/account/notifications`
- `/api/account/reviews`
- `/api/account/settings`

### Etats de l'Interface
- Chargement (spinner)
- Vide (illustration + CTA)
- Erreur (toast)
- Succes (toast + confetti)

---

## PARCOURS UTILISATEUR TYPE

### Premiere Visite
1. Inscription par telephone
2. Verification OTP
3. Completion du profil
4. Ajout d'adresse

### Achat
1. Navigation boutique
2. Ajout au panier
3. Checkout
4. Paiement
5. Suivi de commande

### Fidelite
1. Achat = gain de points
2. Accumulation
3. Passage de niveau
4. Utilisation en reduction

### Support
1. Consultation historique
2. Suivi notifications
3. Contact via WhatsApp

---

**Document genere automatiquement**
**CECHEMOI - Plateforme E-commerce Mode Africaine**
