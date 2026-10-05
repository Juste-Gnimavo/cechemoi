# Guides utilisateurs (Word + PDF)

Deux guides illustrés destinés aux employés (rôle STAFF), générés en session 33 :

- `content-boutique.js` → **Gérer la boutique en ligne** (gestionnaire du site).
- `content-crm.js` → **Gérer la relation client** (assistante de gestion, 7 tuiles de l'accueil).

Livrables remis au CEO : `~/Desktop/GUIDES-CECHEMOI/` (.docx et .pdf, 26 pages chacun).

## Régénérer

1. Placer les captures dans `shotsj/` (JPEG, 1400 px de large max), mêmes noms que dans les fichiers `content-*.js` (`B03-produit-nouveau-haut.jpg`, `C15-atelier-fiche.jpg`…). Les captures ne sont pas versionnées : elles montrent des données réelles, même anonymisées à l'écran.
2. `npm install docx` dans ce dossier, puis `node build.js boutique` et `node build.js crm` → `out/*.docx`.
3. PDF : ouvrir le .docx dans Microsoft Word et l'exporter en PDF (ou AppleScript `save as … file format format PDF`).

## Règles suivies pour les captures

- Compte en rôle **STAFF** : les captures montrent exactement l'écran des employés.
- Noms, téléphones et emails des clientes remplacés **dans le DOM** avant chaque capture (aucune donnée modifiée en base).
- Cumuls financiers (encaissements annuels) masqués.
- Aucun formulaire validé pendant les captures.
