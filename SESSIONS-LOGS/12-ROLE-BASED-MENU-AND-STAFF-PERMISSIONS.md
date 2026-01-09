# Session 12: Role-Based Menu and STAFF Permissions

**Date**: 2025-12-31
**Duration**: ~1 hour
**Status**: COMPLETED

---

## Objective

Implement role-based menu filtering for admin panel and configure STAFF role permissions.

---

## Completed Tasks

### 1. Role Permissions System
- Created `src/lib/role-permissions.ts` with permission definitions
- Defined permissions for all roles: ADMIN, MANAGER, STAFF, TAILOR
- Helper functions: `hasPermission()`, `getRoleBadgeLabel()`, `getRoleBadgeColor()`

### 2. Admin Header Menu Filtering
- Modified `src/components/admin-header.tsx`
- Added `allowedRoles` property to menu items and groups
- Created `filterMenuByRole()` function for recursive filtering
- Dynamic role badge display (Admin/Manager/Staff/Couturier)
- Marketing/Analytics quick links hidden for non-admin roles

### 3. Dashboard Role-Based Widgets
- Modified `src/app/admin/page.tsx`
- Revenue stats (Revenu Net, Aujourd'hui, Hier, Ce Mois) visible only to ADMIN/MANAGER
- Added stat cards for STAFF: Clients, Commandes, Produits, Rendez-vous, Sur-Mesure, Stock Atelier
- Quick action links with colored buttons: + Nouveau client, + Nouvelle commande sur-mesure, + Sortie de matériel

### 4. API Access Fixes
- Fixed `/api/admin/analytics/overview` - Allow STAFF and TAILOR
- Fixed `/api/admin/appointments` - Allow STAFF and TAILOR
- Fixed `/api/admin/profile` - Allow TAILOR

### 5. STAFF Full Operational Access
Updated STAFF permissions to include:
- Clients (full access)
- Rendez-vous (full access)
- Sur-Mesure + Production + Stock Atelier
- Caisse (Factures, Reçus, Ventes)
- Boutique (Commandes, Produits)
- Communication (Campagnes, Notifications, Blog)

### 6. UI Fixes
- Fixed team modal z-index (`z-[10001]`) to appear above header

---

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/role-permissions.ts` | Created - Permission definitions |
| `src/components/admin-header.tsx` | Menu filtering by role |
| `src/app/admin/page.tsx` | Dashboard widgets by role |
| `src/app/admin/team/page.tsx` | Modal z-index fix |
| `src/app/api/admin/analytics/overview/route.ts` | Allow STAFF/TAILOR |
| `src/app/api/admin/appointments/route.ts` | Allow STAFF/TAILOR |
| `src/app/api/admin/profile/route.ts` | Allow TAILOR |

---

## Role Access Summary

| Feature | ADMIN | MANAGER | STAFF | TAILOR |
|---------|-------|---------|-------|--------|
| Revenue Stats | ✅ | ✅ | ❌ | ❌ |
| Clients | ✅ | ✅ | ✅ | ❌ |
| Rendez-vous | ✅ | ✅ | ✅ | ✅ |
| Sur-Mesure | ✅ | ✅ | ✅ | ✅ |
| Stock Atelier | ✅ | ✅ | ✅ | ❌ |
| Caisse | ✅ | ✅ | ✅ | ❌ |
| Boutique | ✅ | ✅ | ✅ | ❌ |
| Communication | ✅ | ✅ | ✅ | ❌ |
| Équipe | ✅ | ✅ | ❌ | ❌ |
| Réglages | ✅ | ✅ | ❌ | ❌ |

---

## Git Commits

1. `59f9721` - feat: Add role-based menu filtering and revenue stats
2. `067e35d` - feat: Enhance STAFF role with full operational permissions
3. `d8737b1` - fix: Allow STAFF access to dashboard APIs and add stats cards
4. `380ef1e` - feat: Add Communication menu access for STAFF

---

## Notes

- STAFF user (naiky.dosso@cechemoi.com) now has full operational access
- Revenue/financial stats remain hidden from STAFF (admin-only)
- TAILOR role has minimal access focused on production tasks
- All changes pushed to main branch
