# White-Label Action Plan

**Purpose**: Transform Cave Express into a reusable white-label e-commerce platform
**Target Customer**: cechemoi.com (Clothes Store)
**Created**: 2025-12-08

---

## Quick Summary

| Category | Items to Change | Priority |
|----------|-----------------|----------|
| Environment Variables | 25+ | CRITICAL |
| Brand Names/Text | 50+ occurrences | CRITICAL |
| Logo/Images | 15+ files | CRITICAL |
| Colors | 5 color values | HIGH |
| Contact Info | 10+ locations | HIGH |
| Legal Pages | 7 pages | HIGH |
| Mobile App Config | 20+ values | HIGH |
| Database Seeds | 3 files | MEDIUM |
| Product Categories | 5 wine categories | MEDIUM |

---

## PHASE 1: CRITICAL - Environment & Credentials

### 1.1 Create New `.env` File

```env
# =============================================================================
# DATABASE
# =============================================================================
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# =============================================================================
# AUTHENTICATION
# =============================================================================
NEXTAUTH_URL="https://cechemoi.com"
NEXTAUTH_SECRET="GENERATE_NEW_32_CHAR_SECRET"

# =============================================================================
# SITE URLs
# =============================================================================
NEXT_PUBLIC_SITE_URL="https://cechemoi.com"
NEXT_PUBLIC_APP_URL="https://cechemoi.com"

# =============================================================================
# EMAIL (SMTP)
# =============================================================================
SMTPHOST="mail.cechemoi.com"
SMTPPORT=465
SMTPUSERNAME="contact@cechemoi.com"
SMTPPASSWORD="YOUR_EMAIL_PASSWORD"
SMTPREPLYTO="serviceclient@cechemoi.com"

# =============================================================================
# SMS/WHATSAPP (SMSING)
# =============================================================================
SMSING_API_KEY="YOUR_API_KEY"
SMSING_API_TOKEN="YOUR_API_TOKEN"
SMSING_FROM="CECHEMOI"                    # <-- CHANGE THIS (11 chars max)
SMSING_WHATSAPP_API_KEY="YOUR_WA_KEY"
SMSING_WHATSAPP_API_TOKEN="YOUR_WA_TOKEN"

# =============================================================================
# PAYMENT (PAIEMENTPRO)
# =============================================================================
PAIEMENTPRO_MERCHANT_ID="YOUR_MERCHANT_ID"
PAIEMENTPRO_API_KEY="YOUR_API_KEY"
# Webhook: https://cechemoi.com/api/payments/paiementpro/webhook

# =============================================================================
# REDIS
# =============================================================================
REDIS_HOST="YOUR_REDIS_HOST"
REDIS_PORT=6379
REDIS_PASSWORD="YOUR_REDIS_PASSWORD"
REDIS_PREFIX="cechemoi"                   # <-- CHANGE THIS

# =============================================================================
# FIREBASE (For Mobile Push Notifications)
# =============================================================================
FIREBASE_PROJECT_ID="cechemoi-app"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@cechemoi-app.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="YOUR_FIREBASE_KEY"

# =============================================================================
# CRON
# =============================================================================
CRON_SECRET="GENERATE_NEW_SECRET"
```

### 1.2 Files to Update

| File | Changes |
|------|---------|
| `.env` | Create new with all credentials |
| `.env.production` | Create new for production |
| `.env.example` | Update template |

---

## PHASE 2: CRITICAL - Brand Identity

### 2.1 Package.json

**File**: `package.json`

```json
{
  "name": "cechemoi",                              // Line 2
  "description": "CeChezMoi - Boutique Mode en Ligne"  // Line 4
}
```

### 2.2 Main Layout & SEO

**File**: `src/app/layout.tsx`

| Line | Current | New |
|------|---------|-----|
| 19 | `Cave Express - Vins de Qualité à Abidjan` | `CeChezMoi - Mode et Vêtements à Abidjan` |
| 20 | Wine description | Clothes description |
| 21 | `cave, vin, abidjan...` | `mode, vetements, abidjan...` |
| 22 | `Cave Express` | `CeChezMoi` |
| 31 | `https://cave-express.ci` | `https://cechemoi.com` |
| 32 | `Cave Express` | `CeChezMoi` |
| 40 | `Cave Express` | `CeChezMoi` |
| 66 | `cave-express-theme` | `cechemoi-theme` |

### 2.3 Manifest.json

**File**: `public/manifest.json`

```json
{
  "name": "CeChezMoi - Boutique Mode en Ligne",
  "short_name": "CeChezMoi",
  "description": "Votre boutique de mode en ligne à Abidjan",
  "theme_color": "#YOUR_BRAND_COLOR",
  "background_color": "#ffffff"
}
```

### 2.4 Cart Store

**File**: `src/store/cart.ts`

| Line | Current | New |
|------|---------|-----|
| 136 | `cave-express-cart` | `cechemoi-cart` |

---

## PHASE 3: CRITICAL - Logo & Images

### 3.1 Logo Files to Replace

Create new logos and replace these files:

```
public/
├── favicon.ico                                    # Main favicon
├── apple-touch-icon.png                          # iOS icon
├── logo/
│   ├── home-page-horizontal-logo-*.png           # Main header logo
│   ├── logo-dark-rect.png                        # Dark rectangle logo
│   └── web/
│       ├── favicon.ico
│       ├── apple-touch-icon.png
│       ├── icon-192.png
│       ├── icon-192-maskable.png
│       ├── icon-512.png
│       └── icon-512-maskable.png
└── images/
    ├── cave-express-lady-min.png                 # Rename to brand image
    ├── play-store-180x60.png                     # Keep or update
    ├── app-store-180x60.png                      # Keep or update
    └── huawei-app-gallery-180x60.png             # Keep or update
```

### 3.2 Logo References in Code

| File | Line | Current | Action |
|------|------|---------|--------|
| `src/components/customer-header.tsx` | 70 | `home-page-horizontal-logo-*` | Update path |
| `src/components/admin-header.tsx` | 284 | `home-page-horizontal-logo-*` | Update path |
| `src/components/manager-header.tsx` | 61 | `home-page-horizontal-logo-*` | Update path |
| `src/components/staff-header.tsx` | 51 | `home-page-horizontal-logo-*` | Update path |
| `src/app/auth/login-phone/page.tsx` | 200 | `home-page-horizontal-logo-*` | Update path |
| `src/app/auth/verify-2fa/page.tsx` | 206 | `home-page-horizontal-logo-*` | Update path |
| `src/app/auth/register-phone/page.tsx` | 224 | `home-page-horizontal-logo-*` | Update path |
| `src/app/auth/reset-password/page.tsx` | 228 | `home-page-horizontal-logo-*` | Update path |
| `src/app/payer/page.tsx` | 42 | `/logo-dark-rect.png` | Update path |
| `src/components/app-coming-soon-modal.tsx` | 67 | `cave-express-lady-min.png` | Update path |
| `src/lib/smsing-service.ts` | 47 | Logo URL | Update URL |

---

## PHASE 4: HIGH - Brand Colors

### 4.1 Tailwind Config

**File**: `tailwind.config.ts`

Current Cave Express Colors (Copper/Bronze):
- Primary: `#C27B43`
- Darker: `#a86638`, `#8e542e`
- Lighter: `#d18b59`, `#e0a06f`

**Change to your brand colors** (Lines 44-100):

```typescript
primary: {
  50: '#YOUR_LIGHTEST',
  100: '#YOUR_LIGHTER',
  200: '#YOUR_LIGHT',
  300: '#YOUR_MEDIUM_LIGHT',
  400: '#YOUR_MEDIUM',
  500: '#YOUR_PRIMARY',      // Main brand color
  600: '#YOUR_DARKER',
  700: '#YOUR_DARK',
  800: '#YOUR_DARKER',
  900: '#YOUR_DARKEST',
},
```

### 4.2 CSS Variables

**File**: `src/app/globals.css`

Update CSS custom properties (Lines 32-35, 82-86):

```css
:root {
  --accent-primary: #YOUR_PRIMARY;
  --accent-primary-hover: #YOUR_HOVER;
  --accent-primary-light: #YOUR_LIGHT;
}
```

### 4.3 Other Color Locations

| File | Line | Current | Action |
|------|------|---------|--------|
| `public/manifest.json` | 8 | `#722f37` | Update theme_color |
| `src/components/header-legacy.tsx` | 68, 76, 92 | `#C27B43` | Update inline colors |

---

## PHASE 5: HIGH - Contact Information

### 5.1 Footer Component

**File**: `src/components/footer.tsx`

| Line | Type | Current | New |
|------|------|---------|-----|
| 36 | Phone | `+225 0556791431` | Your phone |
| 41 | Email | `contact@cave-express.ci` | `contact@cechemoi.com` |
| 47-48 | Address | `Faya Cité Genie 2000, Abidjan` | Your address |
| 58 | Facebook | `Cave.Express.Abidjan.Vin...` | Your Facebook |
| 67 | WhatsApp | `wa.me/2250556791431` | Your WhatsApp |
| 76 | Pinterest | `caveexpress` | Your Pinterest |
| 88 | Instagram | `caveexpress` | Your Instagram |
| 97 | YouTube | `caveexpress` | Your YouTube |

### 5.2 WhatsApp Widget

**File**: `src/components/whatsapp-widget.tsx`

| Line | Current | New |
|------|---------|-----|
| 6 | `2250556791431` | Your WhatsApp number |

### 5.3 Notification Service

**File**: `src/lib/notification-service.ts`

| Line | Variable | Current | New |
|------|----------|---------|-----|
| 251 | store_name | `Cave Express` | `CeChezMoi` |
| 252 | store_url | `www.cave-express.ci` | `www.cechemoi.com` |
| 253 | store_phone | `+225 0556791431` | Your phone |
| 254 | store_whatsapp | `wa.me/2250556791431` | Your WhatsApp |
| 255 | store_address | `Faya Cité Genie 2000, Abidjan` | Your address |

### 5.4 PDF Generator (Invoices)

**File**: `src/lib/pdf-generator.ts`

| Line | Field | Current | New |
|------|-------|---------|-----|
| 6 | Base URL | `https://cave-express.ci` | `https://cechemoi.com` |
| 51 | Author | `Cave Express` | `CeChezMoi` |
| 69 | Company | `Cave Express` | `CeChezMoi` |
| 71 | Address | `Faya Cité Génie 2000` | Your address |
| 72 | City | `Abidjan, Côte d'Ivoire` | Your city |
| 73 | Phone | `+225 0556791431` | Your phone |
| 74 | Email | `contact@cave-express.ci` | Your email |

### 5.5 Email Service

**File**: `src/lib/email-service.ts`

| Line | Current | New |
|------|---------|-----|
| 52 | `CAVE EXPRESS` | `CECHEMOI` |

### 5.6 SMS Service

**File**: `src/lib/smsing-service.ts`

| Line | Current | New |
|------|---------|-----|
| 45 | `CaveExpress` | `CECHEMOI` |
| 47 | Logo URL `cave-express.ci` | Your logo URL |

---

## PHASE 6: HIGH - Legal Pages

### 6.1 Pages to Update

All legal pages need company-specific text updates:

| Page | File | Key Changes |
|------|------|-------------|
| About Us | `src/app/(legal)/qui-sommes-nous/page.tsx` | Company story, mission, meta |
| Contact | `src/app/(legal)/contact/page.tsx` | Address, phone, email, map |
| Terms | `src/app/(legal)/conditions-generales/page.tsx` | Company name, contact |
| Privacy | `src/app/(legal)/politique-confidentialite/page.tsx` | Company name, email |
| Returns | `src/app/(legal)/politique-retour/page.tsx` | Policy details, address |
| Delivery | `src/app/(legal)/politique-livraison/page.tsx` | Delivery zones, times |
| Cookies | `src/app/(legal)/politique-cookies/page.tsx` | Company name, contact |

### 6.2 Contact Page Details

**File**: `src/app/(legal)/contact/page.tsx`

| Line | Field | Action |
|------|-------|--------|
| 98, 326 | Address | Update |
| 154 | Instagram | Update |
| Meta | Title/Description | Update |

---

## PHASE 7: HIGH - Mobile App (If Using)

### 7.1 App Configuration

**File**: `mobile-app/app.json`

| Line | Field | Current | New |
|------|-------|---------|-----|
| 3 | name | `Cave Express` | `CeChezMoi` |
| 4 | slug | `cave-express` | `cechemoi` |
| 8 | scheme | `caveexpress` | `cechemoi` |
| 14 | backgroundColor | `#C27B43` | Your color |
| 18 | bundleIdentifier | `com.cave.express...` | `com.cechemoi.app` |
| 33 | backgroundColor | `#C27B43` | Your color |
| 35 | package | `com.cave.express...` | `com.cechemoi.app` |
| 64 | color | `#C4A962` | Your color |

### 7.2 API URL

**File**: `mobile-app/lib/utils.ts`

| Line | Current | New |
|------|---------|-----|
| 50 | `https://api.cave-express.ci` | `https://cechemoi.com` or `https://api.cechemoi.com` |

### 7.3 Storage Keys

**Files in `mobile-app/store/`**:

| File | Current Key | New Key |
|------|-------------|---------|
| `cart.ts` | `cave-express-cart` | `cechemoi-cart` |
| `offline-cache.ts` | `cave-express-offline-cache` | `cechemoi-offline-cache` |
| `currency.ts` | `cave-express-currency` | `cechemoi-currency` |
| `notifications.ts` | `cave-express-notifications` | `cechemoi-notifications` |
| `location.ts` | `cave-express-location` | `cechemoi-location` |
| `wishlist.ts` | `cave-express-wishlist` | `cechemoi-wishlist` |
| `onboarding.ts` | `cave-express-onboarding` | `cechemoi-onboarding` |

### 7.4 Firebase Files (Replace)

- `mobile-app/google-services.json` - New Firebase project
- `mobile-app/GoogleService-Info.plist` - New Firebase project
- `mobile-app/cave-express-firebase-adminsdk-*.json` - Delete, use new

### 7.5 Mobile Colors

**File**: `mobile-app/tailwind.config.js`

| Line | Current | New |
|------|---------|-----|
| 21 | `#C27B43` | Your primary color |

---

## PHASE 8: MEDIUM - Product Categories

### 8.1 Wine Categories to Replace

Current wine categories need to become clothing categories:

| Current (Wine) | New (Clothes) Example |
|----------------|----------------------|
| `vin-rouge` | `homme` |
| `vin-blanc` | `femme` |
| `vin-rose` | `enfant` |
| `vin-effervescent` | `accessoires` |
| `grands-vins` | `nouveautes` |

### 8.2 Files with Hardcoded Categories

| File | Lines | Action |
|------|-------|--------|
| `src/components/header-legacy.tsx` | 15-19 | Update category slugs |
| `src/components/home/featured-products.tsx` | 27-30 | Update categories |
| `src/components/home/wine-categories-legacy.tsx` | 8 | Update or remove |
| `src/components/home/wine-types-sections.tsx` | 34, 40 | Update or remove |
| `src/components/footer.tsx` | 121-157 | Update store links |
| `mobile-app/components/home/CategoryBubbles.tsx` | 24-45 | Update categories |

### 8.3 Category Images

Replace wine category images in `public/images/`:
- `vin-rouge.png` → `homme.png`
- `vin-blanc.png` → `femme.png`
- `vin-rose.png` → `enfant.png`
- `vin-effervescent.jpg` → `accessoires.jpg`

### 8.4 Database Categories

After deployment, create new categories via Admin panel:
- `/admin/categories` - Create your product categories
- Delete wine categories if not needed

---

## PHASE 9: MEDIUM - Database Seeds

### 9.1 Admin Seed

**File**: `prisma/seed-admin.ts`

| Line | Field | Current | New |
|------|-------|---------|-----|
| 9 | email | `dg@just.ci` | Your admin email |
| 10 | phone | `+2250151092627` | Your admin phone |
| 25 | password | `LM345FCX3xsThales` | New secure password |
| 30 | name | `Thales` | Admin name |
| 35 | whatsappNumber | `+2250709757296` | Admin WhatsApp |

### 9.2 Payment Follow-up Seed

**File**: `prisma/seed-payment-follow-up.ts`

Update payment numbers in default templates:
- Orange Money number
- MTN MoMo number
- Wave number

### 9.3 Notification Templates

After deployment, update all notification templates via Admin:
- `/admin/notifications/templates`
- Update store name, phone, address in templates

---

## PHASE 10: Search & Replace Commands

### 10.1 Global Search & Replace

Run these searches in your IDE to find all occurrences:

```bash
# Brand name variations
grep -r "Cave Express" --include="*.tsx" --include="*.ts" --include="*.json"
grep -r "cave-express" --include="*.tsx" --include="*.ts" --include="*.json" --include="*.css"
grep -r "caveexpress" --include="*.tsx" --include="*.ts" --include="*.json"
grep -r "CaveExpress" --include="*.tsx" --include="*.ts" --include="*.json"

# Domain
grep -r "cave-express.ci" --include="*.tsx" --include="*.ts" --include="*.json" --include="*.env*"

# Phone numbers
grep -r "0556791431" --include="*.tsx" --include="*.ts"
grep -r "07 0346 0426" --include="*.tsx" --include="*.ts"
grep -r "05 5679 1431" --include="*.tsx" --include="*.ts"

# Email
grep -r "@cave-express.ci" --include="*.tsx" --include="*.ts"

# Wine terms (to review/update)
grep -r "vin" --include="*.tsx" --include="*.ts" | grep -v "node_modules"
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All environment variables set
- [ ] New database created and migrated
- [ ] Logo files replaced
- [ ] Colors updated in Tailwind & CSS
- [ ] Contact info updated everywhere
- [ ] Legal pages customized
- [ ] Categories created in database
- [ ] Admin user seed updated and run
- [ ] Notification templates updated
- [ ] Mobile app config updated (if applicable)
- [ ] Firebase project created (if using mobile)

### Post-Deployment

- [ ] Test all authentication flows
- [ ] Test checkout and payment
- [ ] Test notification sending (SMS + WhatsApp)
- [ ] Test email sending
- [ ] Verify all logos display correctly
- [ ] Verify colors are consistent
- [ ] Test mobile app (if applicable)
- [ ] Update DNS records
- [ ] Set up SSL certificate
- [ ] Configure cPanel cron job for notifications
- [ ] Register webhook with PaiementPro

---

## RECOMMENDED: Create Config File

For easier white-labeling in future, consider creating a central config:

**File**: `src/config/brand.ts`

```typescript
export const BRAND = {
  name: 'CeChezMoi',
  tagline: 'Votre boutique de mode en ligne',
  domain: 'cechemoi.com',
  url: 'https://cechemoi.com',

  contact: {
    phone: '+225 XX XX XX XX',
    email: 'contact@cechemoi.com',
    whatsapp: '225XXXXXXXXXX',
    address: 'Your Address, Abidjan',
  },

  social: {
    facebook: 'https://facebook.com/cechemoi',
    instagram: 'https://instagram.com/cechemoi',
    whatsapp: 'https://wa.me/225XXXXXXXXXX',
  },

  colors: {
    primary: '#YOUR_COLOR',
    primaryHover: '#YOUR_HOVER',
  },

  sms: {
    senderId: 'CECHEMOI',
  },
}
```

Then import and use throughout the app instead of hardcoded values.

---

## TIME ESTIMATE

| Phase | Effort |
|-------|--------|
| Phase 1: Environment | 30 min |
| Phase 2: Brand Identity | 30 min |
| Phase 3: Logos | 1-2 hours (design time) |
| Phase 4: Colors | 30 min |
| Phase 5: Contact Info | 1 hour |
| Phase 6: Legal Pages | 2-3 hours |
| Phase 7: Mobile App | 1 hour |
| Phase 8: Categories | 1 hour |
| Phase 9: Seeds | 30 min |
| Phase 10: Testing | 2 hours |
| **Total** | **~10-12 hours** |

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-08 | Initial white-label plan |
