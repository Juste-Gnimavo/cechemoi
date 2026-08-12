# Session 26 — Documents imprimables (annuaires CRM, boutique, guide ⌘K)

## Objectif

Produire un jeu de documents PDF imprimables à destination de la DG, présentant :
1. L'intégralité des pages de l'admin dashboard avec leur URL et leur rôle d'accès — pour servir de référence papier sur le bureau.
2. Le moteur de recherche `⌘K` livré en session 25 — pour qu'elle prenne le réflexe d'ouvrir la palette plutôt que de chercher dans le menu (ou de demander où est telle page).
3. L'inventaire des pages côté visiteurs et clients (boutique en ligne + espace client) — pour qu'elle ait une vue d'ensemble de ce que l'utilisateur final voit.

Le workflow devait être **reproductible** : ajouter un nouveau doc Markdown dans `doc-web/` doit suffire pour générer un PDF de marque cohérent.

---

## Décisions stratégiques (validées avant code)

1. **Markdown source de vérité → HTML stylé → "Imprimer en PDF" navigateur.** Pas de Pandoc/LaTeX, pas de WeasyPrint, pas de Puppeteer. Le couple HTML+CSS print + Safari/Chrome donne le meilleur rendu pour le moindre nombre de dépendances.
2. **Style sobre corporate, accents brand discrets.** Serif (EB Garamond), palette noir/ardoise, filets fins. Les deux couleurs du logo (orange Côte d'Ivoire, vert aiguille) sont utilisées uniquement en accents : filet orange sous le titre de couverture + soulignement de liens + bordure de blockquote ; filet vert : bordure gauche des H2.
3. **HTML auto-contenu.** Le logo est inliné en base64 dans le HTML, le CSS est embarqué dans `<style>`. Un fichier `.html` = un document portable, transférable sans dépendances de fichiers.
4. **Métadonnées extraites depuis le Markdown, pas de frontmatter YAML.** Le script lit le premier `# H1`, le premier `## H2` optionnel, et les lignes `**Version du document**`, `**Dernière mise à jour**`, `**Destiné à**` du pied. Avantage : les `.md` restent lisibles tels quels sur GitHub et dans VSCode.
5. **Ton du guide moteur de recherche (doc 05) volontairement bienveillant.** Première version trop frontale ("Avant d'appeler, avant d'envoyer un message" / "Ce n'est jamais une raison pour appeler") corrigée à mi-session après feedback CEO. Cadrage final : *outil offert pour gagner du temps*, pas *règle à suivre*. Le moteur est positionné comme un complément, pas comme un substitut à la disponibilité du CTO.

---

## Livrables

### Fichiers créés — Documents (Markdown source)

| Fichier | Contenu | Lignes |
|---|---|---|
| `doc-web/04-ANNUAIRE-LIENS-ADMIN-DASHBOARD.md` | Annuaire complet de l'admin : 89 pages (75 issues du MENU + 14 EXTRA_ENTRIES), classées en 12 sections, avec URL `cechemoi.com/admin/...`, description, rôles. | ~470 |
| `doc-web/05-GUIDE-MOTEUR-RECHERCHE-CRM.md` | Guide d'usage de la palette ⌘K : 3 manières d'ouvrir, 24 exemples de requêtes courantes, super-pouvoirs (synonymes, accents, filtrage par rôle), réflexe à prendre. | ~170 |
| `doc-web/06-ANNUAIRE-BOUTIQUE-ESPACE-CLIENT.md` | Annuaire du site public et de `/account` : ~35 pages classées en 10 sections (accueil, catalogue, sur-mesure, panier/checkout, paiements, suivi, auth, espace client, légal). | ~270 |

### Fichiers créés — Workflow d'impression

| Fichier | Rôle | Lignes |
|---|---|---|
| `doc-web/print-template/style.css` | Stylesheet print A4 : variables brand, page de couverture, en-têtes/pieds de page via `@page`, sauts de page intelligents (`page-break-inside: avoid` sur tableaux, blockquotes, code). | ~290 |
| `doc-web/print-template/template.html` | Squelette HTML avec placeholders `{{TITLE}}`, `{{SUBTITLE_BLOCK}}`, `{{RECIPIENT_BLOCK}}`, `{{DATE}}`, `{{VERSION}}`, `{{LOGO_DATA_URI}}`, `{{CSS}}`, `{{CONTENT}}`. Polices Google Fonts en CDN (EB Garamond, Inter, JetBrains Mono). | ~30 |
| `doc-web/print-template/README.md` | Mode d'emploi du workflow : commande de génération, recommandation Chrome > Safari, personnalisation, convention des métadonnées. | ~50 |
| `scripts/md-to-html.mjs` | Convertisseur Node : lit le `.md`, extrait les métadonnées, supprime H1/sous-titre/footer du corps (ils vont sur la couverture), parse avec `marked`, inline logo base64 et CSS, écrit `.html` dans `doc-web/print-output/`. | ~175 |

### Fichiers générés — HTML imprimables

- `doc-web/print-output/04-ANNUAIRE-LIENS-ADMIN-DASHBOARD.html`
- `doc-web/print-output/05-GUIDE-MOTEUR-RECHERCHE-CRM.html`
- `doc-web/print-output/06-ANNUAIRE-BOUTIQUE-ESPACE-CLIENT.html`

### Dépendances ajoutées

- `marked` (devDep, ~50 Ko). Installation `--legacy-peer-deps` à cause d'un conflit `next-auth` sans rapport avec marked.

---

## Workflow d'impression (pour mémoire)

```bash
# 1. Générer le HTML depuis le Markdown
node scripts/md-to-html.mjs doc-web/06-ANNUAIRE-BOUTIQUE-ESPACE-CLIENT.md

# 2. Ouvrir le HTML
open doc-web/print-output/06-ANNUAIRE-BOUTIQUE-ESPACE-CLIENT.html

# 3. Chrome → Cmd+P → Destination : "Enregistrer au format PDF"
#    - Décocher "En-têtes et pieds de page" (ce sont ceux du navigateur, on a les nôtres en CSS)
#    - Cocher "Graphiques d'arrière-plan"
```

**Chrome > Safari** : Safari ignore les `@page { @top-left { ... } }`, donc pas d'en-tête/pied courant CÈCHÉMOI + numéro de page. Sur Chrome tout est rendu fidèlement.

---

## Couverture des documents

### Doc 04 — Annuaire admin

89 pages couvertes, classées en 12 sections suivant l'ordre exact du menu admin (`MENU` dans `src/lib/admin-search/registry.ts`). Source unique : si une page est ajoutée dans le registre, ce document doit être régénéré pour rester à jour. Dette acceptée (cf. session 25, point "Mise à jour du registre quand le menu change").

Rôles traduits en business pour lisibilité : ADMIN → DG, MANAGER → Manager, STAFF → Staff, TAILOR → Couturier.

Pages détail dynamiques (`/admin/orders/[id]`, `/admin/customers/[id]`) volontairement hors scope — elles seront adressées par la recherche données de la session 27 (cf. NEXT-STEP archivé, ancienne Phase 2 — désormais reportée).

### Doc 05 — Guide ⌘K

Réécrit après feedback CEO : le ton initial était trop directif. Sections corrigées :
- "Le constat" (les 7 "Oui" répétés) → remplacé par "Pourquoi ce guide" qui reconnaît la richesse du menu et positionne le moteur comme un gain de temps
- "La règle d'or" → renommée "Le réflexe à prendre", suppression de "Avant d'appeler"
- "Si le moteur ne trouve pas" → suppression de "Ce n'est jamais une raison pour appeler", ajout explicite : *"je reste à votre disposition chaque fois que vous en avez besoin — ce moteur est là pour vous faire gagner du temps sur les questions de navigation, pas pour remplacer nos échanges"*

Le contenu opérationnel (tableau de 24 requêtes types, raccourcis clavier, atouts du moteur) est inchangé.

### Doc 06 — Boutique et espace client

37 pages couvertes. Particularités :
- `/vins` exclu (redirige vers `/catalogue`)
- `/auth/login` et `/auth/register` documentés comme redirections vers les variantes `-phone` (CÈCHÉMOI utilise OTP-only pour les clients)
- Slugs dynamiques explicités en langage compréhensible : `/produit/[nom-du-produit]`, `/payer/[montant]`, `/order-confirmation/[numero-de-commande]`
- Distinction Public / Client connecté systématique
- Pages légales regroupées et positionnées comme accessibles via le footer

---

## Choix techniques notables

### Inlining du logo en base64

Au lieu d'un `<img src="../public/logo/...">` qui casserait dès que le HTML est déplacé, le script lit `public/logo/web/icon-512.png` et l'encode en data URI. Le HTML résultant est un fichier unique transportable.

### Extraction des métadonnées sans YAML frontmatter

Évite de polluer les `.md` (qui doivent rester lisibles tels quels). Convention : la dernière section du doc se termine par :
```markdown
**Version du document** : X.Y
**Dernière mise à jour** : YYYY-MM-DD
**Destiné à** : ...
```

Le script repère ce bloc, capture les valeurs, et retire le bloc + le `---` qui le précède du corps avant l'injection — ainsi ces infos n'apparaissent qu'une fois (sur la couverture).

Le titre de la couverture est dérivé du premier `# H1` après strip du préfixe "CÈCHÉMOI — ". Le sous-titre = premier `## H2` immédiatement après le H1 (optionnel — masqué si absent).

### Sauts de page contrôlés

- `page-break-after: avoid` sur les `h1`, `h2`, `h3` → un titre n'apparaît jamais comme dernière ligne d'une page
- `page-break-inside: avoid` sur `tr`, `blockquote`, `pre` → un tableau ou un encart ne se coupe pas au milieu
- `string-set: doc-title content()` sur `h1` → permet (dans Chrome) d'afficher le titre du document dans l'en-tête courant

### Date formatée FR

`2026-06-04` → `4 juin 2026` automatiquement dans la couverture. Mois en français codé en dur dans le script (pas de dépendance Intl pour ça).

---

## Risques / dette restante

1. **Synchronisation registre ↔ docs** : si une page admin est ajoutée dans `src/lib/admin-search/registry.ts` après cette session, le doc 04 est obsolète. Idem pour le doc 06 si une route publique change. Aucun mécanisme automatique — il faut régénérer à la main. Acceptable tant que le rythme d'ajout reste lent.
2. **Safari headers** : si la DG utilise Safari pour exporter le PDF, les en-têtes courants et numéros de page seront absents. Chrome recommandé en première intention.
3. **Polices Google Fonts en CDN** : le rendu nécessite une connexion lors de la conversion PDF (les glyphes sont embarqués dans le PDF une fois rendus). Hors-ligne, fallback sur Garamond système.

---

## Vérification end-to-end

- Doc 04 : généré, métadonnées extraites (titre OK, pas de sous-titre — c'est normal, doc 04 n'en a pas).
- Doc 05 : généré, métadonnées complètes (titre + sous-titre + destinataire + date + version).
- Doc 06 : généré, métadonnées complètes.
- Workflow validé visuellement par le CEO sur doc 05 ouvert dans le navigateur.
- Pas de typecheck/build lancés en session (per memory `feedback_no_intermediate_builds`). Le code touché est isolé (`scripts/md-to-html.mjs`, fichiers de template) — aucun risque pour le bundle Next.

---

## État du repo en fin de session

Nouveaux fichiers :
```
doc-web/
├── 04-ANNUAIRE-LIENS-ADMIN-DASHBOARD.md
├── 05-GUIDE-MOTEUR-RECHERCHE-CRM.md
├── 06-ANNUAIRE-BOUTIQUE-ESPACE-CLIENT.md
├── print-template/
│   ├── README.md
│   ├── style.css
│   └── template.html
└── print-output/
    ├── 04-ANNUAIRE-LIENS-ADMIN-DASHBOARD.html
    ├── 05-GUIDE-MOTEUR-RECHERCHE-CRM.html
    └── 06-ANNUAIRE-BOUTIQUE-ESPACE-CLIENT.html

scripts/
└── md-to-html.mjs
```

Modifié : `package.json` + `package-lock.json` (ajout de `marked` en devDep).

Aucun fichier de l'application (`src/`) modifié — session 100 % documentation et outillage.
