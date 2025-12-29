# Session 10: Systeme de Commandes Sur-Mesure

**Date**: 2025-12-29
**Status**: COMPLETE (Phase 1 & 2 + Navigation + Gestion Couturiers)

## Contexte

CECHEMOI est un atelier de couture ou 70% des commandes sont sur mesure (apres consultation). Le systeme actuel gerait uniquement les commandes e-commerce standard. Cette session implemente un systeme complet de gestion des commandes sur-mesure.

## Objectifs Realises

### Phase 1: Fondation (100%)
- [x] Ajouter les nouveaux modeles Prisma (CustomOrder, CustomOrderItem, CustomOrderPayment, CustomOrderTimeline)
- [x] Ajouter le role TAILOR a l'enum UserRole
- [x] Creer les APIs CRUD pour CustomOrder
- [x] Page liste des commandes sur-mesure (`/admin/custom-orders`)
- [x] Page creation de commande sur-mesure (`/admin/custom-orders/new`)

### Phase 2: Production (100%)
- [x] Page detail commande avec timeline (`/admin/custom-orders/[id]`)
- [x] Tableau Kanban de production (`/admin/production`)

## Fichiers Crees/Modifies

### Modeles Prisma (schema.prisma)
- `CustomOrder` - Commande sur-mesure avec client, dates, priorite, statut
- `CustomOrderItem` - Article individuel avec type de tenue, couturier assigne, statut production
- `CustomOrderPayment` - Paiements echelonnes (avance, acompte, solde)
- `CustomOrderTimeline` - Historique des evenements
- Enums: `CustomOrderStatus`, `CustomOrderPriority`, `ItemProductionStatus`, `CustomPaymentType`
- Role `TAILOR` ajoute a `UserRole`

### APIs Creees

#### Custom Orders
- `POST /api/admin/custom-orders` - Creer une commande
- `GET /api/admin/custom-orders` - Liste avec filtres et pagination
- `GET /api/admin/custom-orders/[id]` - Detail d'une commande
- `PUT /api/admin/custom-orders/[id]` - Modifier une commande
- `DELETE /api/admin/custom-orders/[id]` - Supprimer une commande

#### Items
- `POST /api/admin/custom-orders/[id]/items` - Ajouter un article
- `PUT /api/admin/custom-orders/[id]/items` - Modifier un article (statut, couturier)
- `DELETE /api/admin/custom-orders/[id]/items` - Supprimer un article

#### Payments
- `GET /api/admin/custom-orders/[id]/payments` - Liste des paiements
- `POST /api/admin/custom-orders/[id]/payments` - Ajouter un paiement
- `DELETE /api/admin/custom-orders/[id]/payments` - Supprimer un paiement

#### Timeline
- `GET /api/admin/custom-orders/[id]/timeline` - Historique
- `POST /api/admin/custom-orders/[id]/timeline` - Ajouter un evenement

#### Tailors
- `GET /api/admin/tailors` - Liste des couturiers
- `POST /api/admin/tailors` - Creer un couturier

#### Production
- `GET /api/admin/production` - Articles pour le Kanban

### Pages Admin

1. **Liste des commandes** (`/admin/custom-orders`)
   - Vue tableau style Excel
   - Filtres par statut (cartes avec compteurs)
   - Recherche par numero/client
   - Pagination
   - Badges priorite et statut

2. **Nouvelle commande** (`/admin/custom-orders/new`)
   - Selection client (recherche existant)
   - Selection mensurations existantes
   - Ajout articles avec types predefinis + "Autre"
   - Assignation couturier par article
   - Prix et avance
   - Dates de retrait

3. **Detail commande** (`/admin/custom-orders/[id]`)
   - Vue complete avec timeline
   - Gestion des paiements
   - Changement de statut par article
   - Assignation couturier
   - Modals pour ajout paiement/evenement

4. **Kanban Production** (`/admin/production`)
   - Colonnes: En attente, Coupe, Couture, Essayage, Retouches, Finitions, Termine
   - Drag & drop pour changer le statut
   - Filtre par couturier
   - Indicateurs priorite et delais

## Types de Tenues Predefinis
```typescript
const GARMENT_TYPES = [
  'Boubou',
  'Robe de soiree',
  'Robe simple',
  'Ensemble tunique',
  'Tunique',
  'Veste',
  'Pantalon',
  'Jupe',
  'Combinaison',
  'Ensemble pagne',
  'Chemise',
  'Tailleur',
  'Caftan',
  'Autre' // Permet saisie libre
]
```

## Format Numero de Commande
`SM-2025-001` (SM = Sur-Mesure, annee, sequence)

## Statuts

### Commande (CustomOrderStatus)
- PENDING - En attente
- IN_PRODUCTION - En production
- FITTING - Essayage
- ALTERATIONS - Retouches
- READY - Pret
- DELIVERED - Livre
- CANCELLED - Annule

### Article (ItemProductionStatus)
- PENDING - En attente
- CUTTING - Coupe
- SEWING - Couture
- FITTING - Essayage
- ALTERATIONS - Retouches
- FINISHING - Finitions
- COMPLETED - Termine
- DELIVERED - Livre

### Priorite
- NORMAL - Standard (14 jours)
- URGENT - Urgent (+50% prix)
- VIP - Rush (+100% prix)

## Navigation Admin
Ajoute au header admin:
- Commandes Sur-Mesure
  - Toutes les commandes
  - Nouvelle commande (badge NEW)
  - Production (Kanban)

## Prochaines Etapes (Phases 3-5)

### Phase 3: Paiements (A faire)
- [ ] Vue "Fiche Excel" par client
- [ ] Rapports financiers
- [ ] Export PDF/Excel

### Phase 4: Interface Couturier (A faire)
- [ ] Dashboard couturier (`/tailor`)
- [ ] Mise a jour statut depuis mobile
- [ ] Notifications d'assignation

### Phase 5: Avance (Optionnel)
- [ ] Photos de progression
- [ ] Timer de travail
- [ ] Rapports et analytics avances

## Tests Recommandes

1. Creer un couturier (role TAILOR)
2. Creer une nouvelle commande sur-mesure
3. Ajouter des articles avec assignation couturier
4. Tester le Kanban avec drag & drop
5. Ajouter des paiements
6. Verifier la timeline

## Notes Techniques

- Les dates de retrait par defaut sont +14 jours
- Le calcul du reliquat est automatique
- Les paiements sont automatiquement types (DEPOSIT -> INSTALLMENT -> FINAL)
- Le Kanban exclut les commandes DELIVERED et CANCELLED
