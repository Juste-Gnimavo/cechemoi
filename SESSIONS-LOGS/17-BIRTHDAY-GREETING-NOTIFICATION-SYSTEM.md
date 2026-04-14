# Session 17 : Système de notifications d'anniversaire

**Date** : 2026-02-19
**Durée** : ~1h30
**Statut** : ✅ Terminé et testé en production

---

## Objectif

Mettre en place un système automatique de voeux d'anniversaire pour les clients CÈCHÉMOI, via SMS et WhatsApp, avec page admin de suivi.

---

## Travail réalisé

### 1. Schema Prisma
- Ajout de `BIRTHDAY_GREETING` à l'enum `NotificationTrigger`
- Création du modèle `BirthdayGreetingLog` avec contrainte unique `[userId, year]` pour prévenir les doublons
- Migration appliquée via `prisma db push`

### 2. Templates de notification (seed)
- **Fichier** : `prisma/seed-birthday-notifications.ts`
- **SMS** : Message court sous 160 caractères
- **WhatsApp** : Message formaté avec bold/italic et emojis (🎂🎉💫)
- Variables : `{customer_name}`, `{customer_first_name}`, `{store_name}`, `{store_phone}`
- Seed exécuté avec succès via `npx tsx`

### 3. Notification Service
- **Fichier** : `src/lib/notification-service.ts`
- Ajout du case `BIRTHDAY_GREETING` dans `extractVariables()` (charge `customer_name`, `customer_first_name`, `recipientPhone`)
- Ajout de la méthode `sendBirthdayGreeting(userId)` qui envoie SMS + WhatsApp simultanément

### 4. Cron quotidien
- **Fichier** : `src/app/api/cron/birthday-greetings/route.ts`
- Authentification via `CRON_SECRET`
- Compare mois+jour de naissance avec la date du jour (UTC)
- Gère le cas spécial du 29 février (envoi le 28 février les années non bissextiles)
- Prévention des doublons via `BirthdayGreetingLog`
- Log avec statut `sent` ou `failed`
- **URL** : `https://crm.cechemoi.com/api/cron/birthday-greetings?secret=CRON_SECRET`
- **Planification cPanel** : `0 8 * * *` (8h du matin UTC / heure d'Abidjan)

### 5. Admin header
- **Fichier** : `src/components/admin-header.tsx`
- Lien « Anniversaires » avec badge `NEW` dans Communication > Notifications

### 6. API admin
- **Fichier** : `src/app/api/admin/notifications/birthdays/route.ts`
- `GET ?tab=upcoming` : Anniversaires dans les 30 prochains jours avec statut d'envoi
- `GET ?tab=history&year=2026` : Historique des envois paginé
- `DELETE ?logId=xxx` : Suppression d'un log pour permettre le renvoi
- Statistiques : total avec date de naissance, envoyés/échoués cette année

### 7. Page admin
- **Fichier** : `src/app/admin/notifications/birthdays/page.tsx`
- **URL** : `/admin/notifications/birthdays`
- 3 stats cards (clients avec DOB, envoyés, échecs)
- Onglet « Prochains anniversaires » (table triée par proximité)
- Onglet « Historique des envois » (table avec pagination + sélecteur d'année)
- Suppression de logs échoués pour relancer l'envoi
- Bannière explicative du fonctionnement

### 8. Fix collatéral
- Ajout de `BIRTHDAY_GREETING` dans `prisma/seed-push-notifications.ts` (Record exhaustif sur `NotificationTrigger`)

---

## Bug résolu : WhatsApp et emojis

### Problème
Les messages WhatsApp contenant des emojis (🎂🎉💫) échouaient avec l'erreur :
```
Illegal mix of collations (utf8mb3_unicode_ci,COERCIBLE) and (utf8mb4_general_ci,IMPLICIT) for operation 'like'
```

### Cause
La plateforme SMSING.APP (SendroidUltimate, PHP/MySQL) utilisait `utf8` (= `utf8mb3`) comme charset de connexion dans `system/helpers/constant_helper.php` :
```php
$sett['char_set'] = 'utf8';           // utf8mb3 → pas d'emojis
$sett['dbcollat'] = 'utf8_general_ci';
```

### Solution
Modification sur le serveur cPanel de SMSING.APP :
```php
$sett['char_set'] = 'utf8mb4';
$sett['dbcollat'] = 'utf8mb4_general_ci';
```

### Résultat
SMS ✅ + WhatsApp ✅ — emojis supportés.

---

## Fichiers modifiés/créés

| Fichier | Action |
|---------|--------|
| `prisma/schema.prisma` | Modifié — enum + modèle `BirthdayGreetingLog` |
| `prisma/seed-birthday-notifications.ts` | Créé — seed 2 templates |
| `prisma/seed-push-notifications.ts` | Modifié — ajout `BIRTHDAY_GREETING` |
| `src/lib/notification-service.ts` | Modifié — `extractVariables` + `sendBirthdayGreeting()` |
| `src/app/api/cron/birthday-greetings/route.ts` | Créé — cron quotidien |
| `src/components/admin-header.tsx` | Modifié — lien Anniversaires |
| `src/app/api/admin/notifications/birthdays/route.ts` | Créé — API admin |
| `src/app/admin/notifications/birthdays/page.tsx` | Créé — page admin |

---

## Configuration cPanel (cron)

```
0 8 * * * curl -s "https://crm.cechemoi.com/api/cron/birthday-greetings?secret=CRON_SECRET" > /dev/null 2>&1
```

---

## Tests effectués en production

1. ✅ Date de naissance modifiée pour correspondre au jour J
2. ✅ Cron exécuté manuellement → SMS reçu
3. ✅ Fix collation SMSING.APP → WhatsApp reçu avec emojis
4. ✅ Deuxième exécution → client "skipped" (pas de doublon)
5. ✅ Page admin `/admin/notifications/birthdays` fonctionnelle
6. ✅ Historique des envois visible avec canaux et statut
