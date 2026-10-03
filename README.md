# FlashCards

Réviser avec des quiz générés par Claude à partir de vos documents, de sites
web, d'un dépôt de code ou d'un simple sujet. Chaque question a un niveau et une
**source** qui permet de vérifier la réponse.

Le projet a deux parties :

- **`skill/quiz-generator/`** : une skill Claude qui écrit les quiz au format
  FlashCards (Markdown, un fichier par langue, `.zip` s'il y a des images).
- **`app/`** : une application web statique pour réviser. Elle tire des
  questions au hasard, mélange les réponses, filtre par niveau, type et thème,
  et affiche la source après chaque réponse. L'interface et les quiz sont
  multilingues, et on peut changer de langue même au milieu d'une question.

Le format est décrit dans [`docs/format.md`](docs/format.md), et la feuille de
route dans [`docs/PLAN.md`](docs/PLAN.md).

## Utiliser l'application

En ligne, si GitHub Pages est activé : `https://<owner>.github.io/FlashCards/`.

Pour charger des quiz :

- glisser-déposer un ou plusieurs fichiers `.md` ou `.zip`. Les traductions
  d'un même quiz et plusieurs quiz différents peuvent être chargés en même
  temps ;
- ou passer une URL : `…/?quiz=https://exemple.org/quiz.fr.md&quiz=https://exemple.org/quiz.en.md` ;
- ou essayer les exemples de [`examples/`](examples/).

Les fichiers restent dans le navigateur : rien n'est envoyé à un serveur.

## Générer un quiz avec la skill

Dans ce dépôt, la skill est disponible automatiquement dans Claude Code (lien
`.claude/skills/quiz-generator`). Ailleurs, copiez le dossier
`skill/quiz-generator/` dans `~/.claude/skills/`, ou installez le zip de la
dernière release comme skill.

Exemples de demandes :

- « Fais-moi un quiz de révision à partir de `cours-reseau.pdf` »
- « Un quiz de 30 questions en français et en anglais sur la photosynthèse »
- « Génère un quiz d'onboarding sur ce dépôt »
- « Un quiz sur https://developer.mozilla.org/fr/docs/Web/HTTP/Caching »

La skill vérifie ses fichiers avec `scripts/validate.mjs` (Node.js 18 ou plus)
et produit un `.zip` avec `scripts/package.mjs` quand le quiz contient des
images.

## Développement

```bash
npm install
npm run dev          # application en mode développement
npm test             # tests du format et de la logique de session
npm run validate -- examples      # valide des quiz (fichiers, dossiers, zip)
npm run build:skill  # régénère les scripts de la skill depuis format/
npm run check        # tout : types, tests, scripts de la skill, exemples, build
```

| Dossier | Contenu |
|---------|---------|
| `format/src` | Parseur et validateur du format, partagés par l'application et la skill |
| `format/cli` | Sources des scripts `validate.mjs` et `package.mjs` de la skill |
| `app/` | Application web (Vite + TypeScript, sans framework) |
| `skill/quiz-generator/` | La skill. Ses `scripts/*.mjs` sont générés : ne pas les modifier à la main |
| `examples/` | Quiz d'exemple, servis aussi par l'application |

## Publication

- **Release** : pousser un tag `vX.Y.Z`. La CI crée une release GitHub avec
  `flashcards-web-vX.Y.Z.zip`, l'application prête à déposer sur n'importe quel
  serveur web statique (elle fonctionne dans un sous-dossier), et
  `quiz-generator-skill-vX.Y.Z.zip`.
- **GitHub Pages** : activer une fois *Settings → Pages → Source : GitHub
  Actions*. L'application est ensuite déployée à chaque release, ou à la
  demande avec le workflow « Deploy to GitHub Pages ». Chaque dépôt peut avoir
  son site Pages (`https://<owner>.github.io/<repo>/`), en plus du site
  personnel `https://<owner>.github.io/`.

## Licence

GPL-3.0, voir [LICENSE](LICENSE).
