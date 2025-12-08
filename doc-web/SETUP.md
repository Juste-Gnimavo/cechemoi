# Cave Express - Guide d'Installation et de Déploiement

## Table des Matières
1. [Prérequis](#prérequis)
2. [Installation Locale](#installation-locale)
3. [Configuration de la Base de Données](#configuration-de-la-base-de-données)
4. [Variables d'Environnement](#variables-denvironnement)
5. [Démarrage du Projet](#démarrage-du-projet)
6. [Déploiement en Production](#déploiement-en-production)
7. [Création du Premier Administrateur](#création-du-premier-administrateur)

## Prérequis

Avant de commencer, assurez-vous d'avoir installé:

- **Node.js** 18.x ou supérieur
- **npm** ou **yarn** ou **pnpm**
- **PostgreSQL** 14.x ou supérieur
- **Git**

## Installation Locale

### 1. Cloner le Repository

```bash
git clone https://github.com/votre-org/cave-express.ci.git
cd cave-express.ci
```

### 2. Installer les Dépendances

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

## Configuration de la Base de Données

### 1. Créer une Base de Données PostgreSQL

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE postgres;

```

### 2. Configurer l'URL de la Base de Données

Copiez le fichier `.env.example` vers `.env`:

```bash
cp .env.example .env
```

Modifiez le fichier `.env` et configurez `DATABASE_URL`:

```env
DATABASE_URL="postgresql://cave_express_user:votre_mot_de_passe@localhost:5432/cave_express"
```

### 3. Exécuter les Migrations Prisma

```bash
npx prisma generate
npx prisma db push
```

## Variables d'Environnement

Configurez toutes les variables dans le fichier `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cave_express"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="générez-une-clé-secrète-sécurisée-ici"

# PAYMENTPRO (Paiements par carte)
NEXT_PUBLIC_PAYMENTPRO_PUBLISHABLE_KEY="pk_test_..."
PAYMENTPRO_SECRET_KEY="sk_test_..."
PAYMENTPRO_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="contact@cave-express.ci"

# Cloudinary (Upload d'images)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"

# Payment Gateways Côte d'Ivoire
WAVE_API_KEY="wave_..."
ORANGE_MONEY_API_KEY="orange_..."
MTN_MOBILE_MONEY_API_KEY="mtn_..."

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### Générer NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Démarrage du Projet

### Mode Développement

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build de Production

```bash
npm run build
npm run start
```

## Déploiement en Production

### Option 1: Vercel (Recommandé)

1. **Créer un compte sur Vercel**: https://vercel.com

2. **Installer Vercel CLI**:
```bash
npm install -g vercel
```

3. **Déployer**:
```bash
vercel
```

4. **Configurer les variables d'environnement** dans le dashboard Vercel

5. **Configurer PostgreSQL**:
   - Utiliser Vercel Postgres
   - Ou Neon (https://neon.tech)
   - Ou Supabase (https://supabase.com)

### Option 2: VPS (Ubuntu/Debian)

#### 1. Préparer le Serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installer Nginx
sudo apt install -y nginx

# Installer PM2
sudo npm install -g pm2
```

#### 2. Configurer PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE cave_express;
CREATE USER cave_express_user WITH PASSWORD 'mot_de_passe_sécurisé';
GRANT ALL PRIVILEGES ON DATABASE cave_express TO cave_express_user;
\q
```

#### 3. Cloner et Configurer l'Application

```bash
cd /var/www
sudo git clone https://github.com/votre-org/cave-express.ci.git
cd cave-express.ci
sudo npm install
sudo npm run build
```

#### 4. Configurer PM2

```bash
# Démarrer l'application
pm2 start npm --name "cave-express" -- start

# Sauvegarder la configuration
pm2 save
pm2 startup
```

#### 5. Configurer Nginx

Créer `/etc/nginx/sites-available/cave-express`:

```nginx
server {
    listen 80;
    server_name cave-express.ci www.cave-express.ci;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer le site:

```bash
sudo ln -s /etc/nginx/sites-available/cave-express /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Configurer SSL avec Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d cave-express.ci -d www.cave-express.ci
```

## Création du Premier Administrateur

### Méthode 1: Via Prisma Studio

```bash
npx prisma studio
```

1. Ouvrir la table `User`
2. Créer un nouvel utilisateur
3. Définir le `role` à `ADMIN`
4. Hasher le mot de passe avec bcrypt

### Méthode 2: Via Script Node

Créer `scripts/create-admin.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.create({
    data: {
      name: 'Administrateur',
      email: 'admin@cave-express.ci',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Admin créé:', admin)
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Exécuter:

```bash
npx ts-node scripts/create-admin.ts
```

## Structure des Rôles Utilisateurs

- **CUSTOMER**: Client standard (peut passer des commandes)
- **STAFF**: Personnel (peut voir les commandes et produits)
- **MANAGER**: Gestionnaire (peut gérer produits, commandes, clients)
- **ADMIN**: Administrateur (accès complet à toutes les fonctionnalités)

## Support et Aide

Pour toute question ou problème:

- **Email**: contact@cave-express.ci
- **Téléphone**: +225 0556791431
- **Issues GitHub**: https://github.com/votre-org/cave-express.ci/issues

## Licence

© 2024 Cave Express. Tous droits réservés.
