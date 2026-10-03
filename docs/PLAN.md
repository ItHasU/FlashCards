# FlashCards : plan du projet

Deux briques, reliées par un **format de fichier commun** :

```
 Sources (document, site web, dépôt de code, simple sujet)
        │
        ▼
 ┌──────────────────────┐      quiz.md  (ou quiz.zip = quiz.md + media/)
 │ Skill Claude         │ ───────────────────────────────┐
 │ "quiz-generator"     │                                ▼
 └──────────────────────┘                     ┌──────────────────────┐
                                              │ Application web      │
                                              │ statique (révision)  │
                                              └──────────────────────┘
```

Le format est le contrat entre les deux. On le fige en premier : la skill et
l'application peuvent ensuite avancer chacune de leur côté.


## Décisions (validées le 2026-10-03)

| Sujet | Décision |
|-------|----------|
| Niveaux | 3 : Découverte, Compréhension, Maîtrise |
| Stack de l'app | Vite + TypeScript, **sans framework** |
| Types de questions | QCM (une ou plusieurs bonnes réponses) et **vrai/faux**. Pas de réponse libre : trop difficile à interpréter et à corriger |
| Langues | Multilingue : interface **et** contenu des quiz. L'utilisateur peut changer de langue à tout moment, même au milieu d'une question. Un fichier par langue, regroupés par l'`id` du quiz |
| Hébergement | Release GitHub avec un zip de l'app statique, et workflow GitHub Pages (à activer une fois dans les réglages du dépôt) |
| Plusieurs quiz | Possibilité de charger et mélanger plusieurs quiz dans une même session |

Le format final est spécifié dans [`format.md`](format.md). Il remplace
l'ébauche du §1 ci-dessous, en particulier pour le vrai/faux (`type: true-false
| answer: true|false`) et les traductions (§5 de la spec).

## Avancement

| # | Étape | État |
|---|-------|------|
| 0 | Format : spec, parseur, validateur, exemples, tests | ✅ fait |
| 1 | App MVP : chargement md/zip/URL, réglages, session, résultats, i18n, multi-quiz | ✅ fait |
| 2 | Skill MVP : `SKILL.md`, guides de rédaction et de sourçage, scripts | ✅ première version, à éprouver sur de vrais documents |
| 3 | Médias : zip, sources image et code | ✅ fait (app, validateur et `package.mjs`) |
| 4 | Sites et dépôts | 🟡 couvert par les instructions de la skill, à tester |
| 5 | Finitions : Pages, `?quiz=URL`, revoir mes erreurs | ✅ fait, sauf le mode hors-ligne (PWA) |
| 6 | Bonus : historique, répétition espacée, export Anki | ⏳ plus tard |

---

## 1. Le format de quiz (le contrat)

### 1.1 Conteneur

| Cas                        | Fichier                                                   |
|----------------------------|-----------------------------------------------------------|
| Texte seul                 | `mon-quiz.md`                                             |
| Avec des médias (images…)  | `mon-quiz.zip` contenant `quiz.md` et un dossier `media/` |

Dans le markdown, les médias sont référencés par chemin relatif
(`media/schema-tcp.png`).

### 1.2 Structure du markdown

Le fichier reste lisible tel quel par un humain, et se parse sans ambiguïté.

````markdown
---
title: Les bases de Git
description: Révision des commandes et concepts essentiels
language: fr
generated_at: 2026-10-03
generator: quiz-generator v1
sources:
  - https://git-scm.com/book/fr/v2
---

## Quelle commande crée une nouvelle branche sans basculer dessus ?
<!-- id: git-001 | level: 1 | tags: branches, commandes -->

- [x] `git branch <nom>`
- [ ] `git checkout <nom>`
- [ ] `git switch <nom>`
- [ ] `git merge <nom>`

> [!explanation]
> `git branch` crée la référence, mais HEAD reste sur la branche courante.

> [!source] excerpt
> « La commande git branch crée seulement une nouvelle branche — elle ne
> bascule pas sur cette branche. »
> — [Pro Git, §3.1](https://git-scm.com/book/fr/v2/Les-branches-avec-Git-Les-branches-en-bref)
````

Règles :

- **Une question = un titre `##`**. L'énoncé peut contenir du markdown (code,
  image, formule).
- **Métadonnées** dans un commentaire HTML juste sous le titre : `id`
  (unique et stable), `level`, `tags`.
- **Réponses** = liste à cocher. `[x]` pour une bonne réponse, `[ ]` pour une
  mauvaise. Plusieurs `[x]` donnent une question à choix multiples.
- **Explication** (facultative) : bloc `> [!explanation]`.
- **Source** (obligatoire) : un ou plusieurs blocs `> [!source] <type>`.

### 1.3 Types de source

| Type      | Contenu                                    | Exemple d'usage               |
|-----------|--------------------------------------------|-------------------------------|
| `link`    | URL (+ ancre ou page si possible)          | Page de doc, article          |
| `excerpt` | Citation **verbatim** + référence d'origine | Passage d'un PDF ou d'un cours |
| `image`   | `![légende](media/xxx.png)`                | Schéma, capture, figure       |
| `code`    | Bloc de code + `fichier:lignes` (+ lien)   | Extrait d'un dépôt            |

Une question peut combiner plusieurs sources, par exemple un extrait de texte
et le lien vers la page d'où il vient.

### 1.4 Niveaux

Échelle proposée, sur 3 niveaux (à valider) :

| Niveau | Nom           | Ce qu'on teste                                     |
|--------|---------------|----------------------------------------------------|
| 1      | Découverte    | Définitions, vocabulaire, faits directs            |
| 2      | Compréhension | Relations entre concepts, « pourquoi », comparer   |
| 3      | Maîtrise      | Cas pratiques, pièges, situations inhabituelles, synthèse |

### 1.5 Livrables de cette étape

- `docs/format.md` : la spécification complète, versionnée (`format: 1`).
- `examples/` : 2 ou 3 quiz d'exemple (un en `.md` seul, un en `.zip` avec
  images, un avec du code).
- Un **parseur + validateur** unique en TypeScript/JS, utilisé à la fois par
  l'application et par la skill (voir §3.4).

---

## 2. L'application web de révision

### 2.1 Contraintes

- **100 % statique**, sans serveur : hébergeable sur GitHub Pages.
- Tout se passe dans le navigateur. Les fichiers chargés ne sont envoyés nulle
  part.

### 2.2 Stack proposée

- **Vite + TypeScript**, sans framework lourd (ou Preact si l'interface grossit).
- `markdown-it` pour le rendu, `highlight.js` pour le code, `JSZip` pour les zip.
- Déploiement par GitHub Actions vers GitHub Pages.

### 2.3 Parcours utilisateur

1. **Chargement** : glisser-déposer ou sélection d'un `.md` ou `.zip`, ou
   paramètre d'URL `?quiz=https://…` pour partager un quiz hébergé.
2. **Configuration** : nombre de questions (curseur, plafonné au nombre
   disponible), niveaux à inclure (cases 1/2/3), tags (facultatif). Le nombre
   de questions qui correspondent aux filtres s'affiche en direct.
3. **Session** :
   - tirage aléatoire des questions parmi celles qui passent les filtres ;
   - mélange des réponses à chaque affichage ;
   - l'utilisateur répond puis clique sur « Valider » : correction visuelle,
     explication, **source dépliée** (lien cliquable, extrait, image, code) ;
   - progression affichée (« 7 / 20 »).
4. **Résultats** : score global et score par niveau, liste des questions
   ratées avec leur source, boutons « Recommencer » et « Revoir mes erreurs ».

### 2.4 Points techniques

- Mélange : Fisher–Yates.
- Médias du zip : extraits en `Blob`, servis par `URL.createObjectURL`, et les
  chemins `media/…` réécrits au rendu.
- Erreurs de format : message clair avec le numéro de la question fautive (le
  validateur partagé fournit ces informations).
- Le markdown chargé est rendu de façon sûre (HTML brut désactivé ou assaini),
  puisqu'un fichier chargé peut venir de n'importe où.

---

## 3. La skill Claude `quiz-generator`

### 3.1 Emplacement

```
skill/quiz-generator/
├── SKILL.md              # déclencheurs + workflow + règles de qualité
├── references/
│   ├── format.md         # copie de la spec (§1)
│   ├── question-writing.md  # comment écrire de bonnes questions et de bons distracteurs
│   └── sources.md        # comment citer chaque type de source
└── scripts/
    ├── validate.mjs      # valide un quiz (parseur partagé, bundlé)
    └── package.mjs       # assemble quiz.md + media/ en .zip
```

Un lien symbolique `.claude/skills/quiz-generator` permet d'utiliser la skill
directement dans ce dépôt.

### 3.2 Entrées gérées

| Entrée             | Comment l'agent collecte la matière                                      |
|--------------------|--------------------------------------------------------------------------|
| Document(s)        | Lecture directe (md, txt, pdf, docx…). Les images utiles sont extraites vers `media/`. |
| Site web           | Récupération de la page et des pages liées pertinentes (profondeur limitée). |
| Dépôt de code      | Exploration : README, architecture, API publiques, fichiers clés. Les sources sont `code` avec `fichier:lignes` et un permalien si le dépôt est sur GitHub. |
| Simple sujet       | Recherche web autonome, en privilégiant les sources fiables (doc officielle, ouvrages, Wikipédia). Chaque question cite l'URL consultée. |

### 3.3 Workflow de la skill

1. **Cadrage** : sujet, langue, nombre de questions visé, répartition par
   niveau (par défaut 40 % / 40 % / 20 %), public cible. Des valeurs par défaut
   raisonnables s'appliquent si l'utilisateur ne précise rien.
2. **Collecte** : rassembler la matière selon le type d'entrée (§3.2) et
   garder la trace de chaque source.
3. **Extraction des notions** : liste des faits et concepts testables, chacun
   rattaché à sa source.
4. **Rédaction** : questions, bonne(s) réponse(s), 3 distracteurs plausibles,
   explication, niveau, tags.
5. **Sourçage** : attacher à chaque question la source la plus directe. Une
   citation de type `excerpt` doit être **verbatim**.
6. **Auto-relecture** : relire chaque question contre sa source (la réponse
   est-elle bien justifiée par la source ?) et corriger ou supprimer.
7. **Validation** : `scripts/validate.mjs`, puis correction jusqu'à ce que le
   quiz passe.
8. **Livraison** : `.md` seul s'il n'y a pas de média, sinon `.zip` via
   `scripts/package.mjs`.

### 3.4 Règles de qualité (dans `question-writing.md`)

- Une seule interprétation possible de l'énoncé, et une bonne réponse
  incontestable.
- Distracteurs plausibles, issus de confusions fréquentes, de longueur et de
  style proches de la bonne réponse.
- Pas de « toutes les réponses ci-dessus » ni de « aucune » : ces options
  perdent leur sens une fois les réponses mélangées.
- Pas d'indice dans la formulation (accord grammatical, réponse plus longue,
  terme repris de l'énoncé).
- Questions autonomes : jamais de « comme vu à la question précédente »,
  puisque le tirage est aléatoire.
- Couvrir l'ensemble de la matière, pas seulement le début du document.

### 3.5 Validateur partagé

Le parseur est écrit une seule fois (`packages/quiz-format/` en TS). Il est :

- importé par l'application web ;
- bundlé en un fichier `validate.mjs` autonome copié dans la skill, pour
  qu'elle fonctionne aussi une fois installée hors du dépôt.

Vérifications : front-matter présent, ids uniques, au moins 2 réponses, au
moins une `[x]`, niveau compris entre 1 et 3, au moins une source par
question, médias référencés présents dans le zip.

---

## 4. Arborescence cible du dépôt

```
FlashCards/
├── docs/
│   ├── PLAN.md
│   └── format.md
├── examples/                 # quiz d'exemple (servent aussi de jeux de test)
├── packages/quiz-format/     # parseur + validateur partagés
├── app/                      # application web (Vite)
├── skill/quiz-generator/     # la skill Claude
├── .claude/skills/           # lien vers skill/ pour l'usage local
└── .github/workflows/        # tests + déploiement GitHub Pages
```

---

## 5. Découpage en étapes

| # | Étape | Contenu | Résultat vérifiable |
|---|-------|---------|---------------------|
| 0 | **Format** | `docs/format.md`, exemples, parseur + validateur avec tests | Les exemples passent le validateur |
| 1 | **App MVP** | Chargement `.md`, configuration (nombre, niveaux), session aléatoire, résultats | On révise un quiz d'exemple de bout en bout |
| 2 | **Skill MVP** | Entrées document et sujet, sources `link` et `excerpt`, validation | « Fais-moi un quiz sur X » produit un `.md` valide qui s'ouvre dans l'app |
| 3 | **Médias** | Support `.zip`, sources `image` et `code`, `package.mjs` | Un quiz tiré d'un PDF illustré s'affiche avec ses images |
| 4 | **Sites et dépôts** | Entrées site web et dépôt de code, permaliens GitHub | Un quiz tiré d'un dépôt cite `fichier:lignes` |
| 5 | **Finitions** | Déploiement GitHub Pages, `?quiz=URL`, « revoir mes erreurs », mode hors-ligne (PWA) | App publique, partage par lien |
| 6 | **Bonus** (plus tard) | Historique local, répétition espacée, autres types de questions (vrai/faux, réponse libre), export Anki | — |

---

## 6. Questions ouvertes

Toutes tranchées : voir « Décisions » en tête de document.
