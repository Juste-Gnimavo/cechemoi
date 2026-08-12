# Workflow d'impression — CÈCHÉMOI

Convertir un document Markdown du dossier `doc-web/` en PDF imprimable avec page de couverture, logo, branding sobre.

## Étapes

### 1. Générer le HTML

```bash
node scripts/md-to-html.mjs doc-web/05-GUIDE-MOTEUR-RECHERCHE-CRM.md
```

Le HTML auto-contenu est écrit dans `doc-web/print-output/`.

### 2. Ouvrir dans un navigateur

```bash
open doc-web/print-output/05-GUIDE-MOTEUR-RECHERCHE-CRM.html
```

**Chrome est recommandé** : il rend mieux les en-têtes et numéros de page que Safari (Safari ignore les `@page { @top-left { ... } }`).

### 3. Exporter en PDF

- **Chrome** : `Cmd+P` → Destination : *Enregistrer au format PDF* → décocher "En-têtes et pieds de page" (les en-têtes du navigateur, pas les nôtres) → Mise en page : *Par défaut* → vérifier que "Graphiques d'arrière-plan" est coché.
- **Safari** : `Cmd+P` → bouton *PDF* en bas à gauche → *Enregistrer au format PDF*.

## Structure des templates

```
doc-web/print-template/
├── style.css          # Tout le design (couleurs, typo, page A4, cover)
├── template.html      # Squelette HTML avec placeholders
└── README.md          # Ce fichier
```

## Personnaliser

- **Changer une couleur** : éditer les variables `--color-*` en haut de `style.css`.
- **Changer la typo** : modifier `--font-serif` / `--font-sans` + l'URL Google Fonts dans `template.html`.
- **Changer le logo** : remplacer `public/logo/web/icon-512.png` ou modifier `LOGO_PATH` dans `scripts/md-to-html.mjs`.

## Métadonnées extraites du Markdown

Le script lit automatiquement :

| Champ      | Source dans le `.md`                                          |
|------------|---------------------------------------------------------------|
| Titre      | Premier `# H1` (le préfixe "CÈCHÉMOI — " est retiré)         |
| Sous-titre | Premier `## H2` immédiatement après le H1 (optionnel)         |
| Destinataire | Ligne `**Destiné à** : X` dans le pied du doc (optionnel)   |
| Date       | Ligne `**Dernière mise à jour** : YYYY-MM-DD` (formatée en FR) |
| Version    | Ligne `**Version du document** : X.Y`                         |

Le bloc de métadonnées et le H1/H2 originaux sont retirés du corps : ils s'affichent uniquement sur la couverture.
