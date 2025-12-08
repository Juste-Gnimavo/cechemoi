# Cave Express - Architecture Technique

## Vue d'Ensemble

Cave Express est une plateforme e-commerce moderne construite avec Next.js 14, offrant une expérience d'achat complète pour les vins et spiritueux. L'architecture suit les meilleures pratiques modernes avec un focus sur la performance, la scalabilité et la maintenabilité.

## Stack Technique

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom components with Lucide React icons
- **Animations**: Framer Motion

### Backend
- **API**: Next.js API Routes (Route Handlers)
- **Authentication**: NextAuth.js (Credentials Provider)
- **Database ORM**: Prisma
- **Database**: PostgreSQL

### Services Tiers
- **Paiements**:
  - Stripe (cartes bancaires internationales)
  - Wave (mobile money local)
  - Orange Money (Côte d'Ivoire)
  - MTN Mobile Money (Côte d'Ivoire)
- **Email**: Resend
- **Stockage Images**: Cloudinary
- **Hosting**: Vercel (recommandé) ou VPS

## Architecture de l'Application

```
cave-express.ci/
├── prisma/
│   └── schema.prisma              # Schéma de base de données
├── public/                        # Assets statiques
├── src/
│   ├── app/                       # App Router (Next.js 14)
│   │   ├── (main)/               # Groupe de routes publiques
│   │   │   ├── page.tsx          # Page d'accueil
│   │   │   ├── cart/             # Panier
│   │   │   ├── checkout/         # Processus de commande
│   │   │   ├── produit/          # Pages produits
│   │   │   └── vins/             # Catalogue vins
│   │   ├── admin/                # Dashboard administrateur
│   │   │   ├── layout.tsx        # Layout admin
│   │   │   ├── page.tsx          # Dashboard principal
│   │   │   ├── products/         # Gestion produits
│   │   │   ├── orders/           # Gestion commandes
│   │   │   ├── customers/        # Gestion clients
│   │   │   └── analytics/        # Analytiques
│   │   ├── auth/                 # Pages authentification
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/             # Routes authentification
│   │   │   ├── orders/           # Routes commandes
│   │   │   ├── products/         # Routes produits
│   │   │   └── webhooks/         # Webhooks paiements
│   │   ├── globals.css           # Styles globaux
│   │   └── layout.tsx            # Layout racine
│   ├── components/               # Composants réutilisables
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── product-card.tsx
│   │   └── home/                 # Composants page d'accueil
│   ├── lib/                      # Utilitaires et configuration
│   │   ├── prisma.ts             # Client Prisma
│   │   ├── auth.ts               # Configuration NextAuth
│   │   └── utils.ts              # Fonctions utilitaires
│   └── store/                    # State management (Zustand)
│       └── cart.ts               # Store panier
├── .env.example                  # Template variables d'environnement
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Modèle de Données

### Entités Principales

#### User
- Gère l'authentification et l'autorisation
- Rôles: CUSTOMER, STAFF, MANAGER, ADMIN
- Relations: Orders, Addresses, Cart, Reviews, Wishlist

#### Product
- Informations produit complètes
- Champs spécifiques vin: vintage, region, grapeVariety, etc.
- Relations: Category, OrderItems, CartItems, Reviews

#### Category
- Structure hiérarchique (parent-child)
- Organisation des produits

#### Order
- Gestion complète des commandes
- Statuts: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- Statuts paiement: PENDING, COMPLETED, FAILED, REFUNDED
- Relations: User, OrderItems, Address

#### Cart
- Panier persistant par utilisateur
- Relations: User, CartItems

### Schéma de Relations

```
User (1) ──── (N) Order
User (1) ──── (N) Address
User (1) ──── (1) Cart
User (1) ──── (N) Review
User (1) ──── (N) WishlistItem

Category (1) ──── (N) Product
Category (1) ──── (N) Category (self-relation)

Product (1) ──── (N) OrderItem
Product (1) ──── (N) CartItem
Product (1) ──── (N) Review
Product (1) ──── (N) WishlistItem

Order (1) ──── (N) OrderItem
Order (1) ──── (1) Address

Cart (1) ──── (N) CartItem
```

## Flux de Données

### Processus de Commande

1. **Ajout au panier**
   - Client ajoute des produits
   - État géré par Zustand (local storage)

2. **Checkout**
   - Vérification authentification
   - Saisie adresse livraison
   - Sélection mode de paiement

3. **Création de commande**
   ```
   POST /api/orders
   ├── Création adresse
   ├── Création commande (status: PENDING)
   ├── Création order items
   ├── Mise à jour stock produits
   └── Retour ID commande
   ```

4. **Traitement paiement**
   ```
   Selon le mode de paiement:
   ├── Stripe → Redirection checkout Stripe
   ├── Mobile Money → API locale
   └── Cash on Delivery → Validation directe
   ```

5. **Webhook paiement**
   ```
   POST /api/webhooks/[provider]
   ├── Vérification signature
   ├── Mise à jour status paiement
   ├── Envoi email confirmation
   └── Notification client
   ```

### Authentification

```
NextAuth.js (Credentials Provider)
├── Login: POST /api/auth/signin
│   ├── Vérification email/password
│   ├── Comparaison bcrypt
│   └── Création JWT session
├── Register: POST /api/auth/register
│   ├── Validation données
│   ├── Hash password (bcrypt)
│   ├── Création user
│   └── Création cart associé
└── Session: GET /api/auth/session
    └── Retour user + role
```

## Sécurité

### Authentification et Autorisation
- Mots de passe hashés avec bcrypt (salt rounds: 12)
- Sessions JWT via NextAuth
- Protection CSRF intégrée
- Middleware de vérification de rôle pour routes admin

### Protection des Routes API
```typescript
// Exemple de protection
const session = await getServerSession(authOptions)
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Vérification role admin
if ((session.user as any).role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Validation des Données
- Validation côté client: React Hook Form + Zod
- Validation côté serveur: Zod schemas
- Sanitisation des inputs
- Protection XSS via Next.js (auto-escape)

### Paiements Sécurisés
- PCI DSS compliance via Stripe
- Webhooks sécurisés (vérification signature)
- Pas de stockage de données de carte

## Performance

### Optimisations Frontend
- **Server Components** (Next.js 14) par défaut
- **Client Components** uniquement quand nécessaire
- **Image Optimization** via next/image
- **Code Splitting** automatique par route
- **Static Generation** pour pages produits populaires
- **Lazy Loading** des composants lourds

### Optimisations Backend
- **Prisma** pour requêtes optimisées
- **Connection Pooling** PostgreSQL
- **Indexation** des champs fréquemment recherchés
- **Pagination** des listes longues
- **Caching** avec Vercel Edge Cache

### Monitoring
- **Vercel Analytics** pour métriques web vitals
- **Prisma Studio** pour monitoring base de données
- **Error Tracking** via console logs et Vercel logs

## Intégrations Paiement

### Stripe (International)
```typescript
// Client
import { loadStripe } from '@stripe/stripe-js'
const stripe = await loadStripe(publishableKey)

// Serveur
import Stripe from 'stripe'
const stripe = new Stripe(secretKey)
```

### Mobile Money Local
```typescript
// Wave API
POST https://api.wave.com/v1/checkout/sessions

// Orange Money API
POST https://api.orange.com/orange-money-webpay/ci/v1/webpayment

// MTN Mobile Money
POST https://api.mtn.com/collection/v1_0/requesttopay
```

## Scalabilité

### Horizontal Scaling
- **Vercel**: Scaling automatique
- **Database**: PostgreSQL avec read replicas
- **CDN**: Vercel Edge Network pour assets statiques

### Vertical Scaling
- **Database Indexes** pour requêtes rapides
- **Optimized Queries** avec Prisma
- **Caching Strategy** pour données fréquentes

## Testing (à implémenter)

### Tests Recommandés
```bash
# Unit Tests
- Fonctions utilitaires (formatPrice, generateOrderNumber)
- Composants isolés

# Integration Tests
- API Routes
- Authentication flow
- Order creation process

# E2E Tests
- User journey: parcours d'achat complet
- Admin: création produit, gestion commande
```

### Outils Recommandés
- **Jest**: Unit tests
- **React Testing Library**: Component tests
- **Playwright**: E2E tests
- **Prisma**: Database seeding pour tests

## Déploiement

### CI/CD avec Vercel
```yaml
# Auto-déploiement sur push
git push origin main
↓
Vercel Build
↓
Deploy to Production
↓
Run Prisma Migrations
↓
Live at cave-express.ci
```

### Variables d'Environnement
- **Development**: `.env.local`
- **Production**: Vercel Dashboard
- **Secrets**: Jamais commités dans Git

## Maintenance

### Tâches Régulières
- **Backup Base de Données**: Quotidien
- **Monitoring Logs**: Hebdomadaire
- **Security Updates**: Mensuel
- **Performance Audit**: Trimestriel

### Monitoring
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry recommandé)
- Analytics (Google Analytics, Vercel Analytics)

## Évolutions Futures

### Fonctionnalités Planifiées
- [ ] Progressive Web App (PWA)
- [ ] Application mobile (React Native)
- [ ] Programme de fidélité
- [ ] Système de recommandations IA
- [ ] Chat en direct (support client)
- [ ] Multi-langue (EN, FR)
- [ ] Dark/Light mode toggle
- [ ] Export factures PDF
- [ ] Intégration WhatsApp Business API

### Optimisations Techniques
- [ ] Redis pour caching
- [ ] ElasticSearch pour recherche avancée
- [ ] GraphQL API alternative
- [ ] Microservices pour paiements
- [ ] Kubernetes pour scaling avancé

## Contact Support Technique

Pour questions techniques:
- **GitHub Issues**: https://github.com/votre-org/cave-express.ci/issues
- **Email**: dev@cave-express.ci
- **Documentation**: https://docs.cave-express.ci

---

**Version**: 1.0.0
**Dernière mise à jour**: Mars 2024
**Mainteneur**: Équipe Cave Express
