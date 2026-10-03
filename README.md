# FlashCards

Réviser avec des quiz générés par Claude à partir de vos documents, de sites
web, d'un dépôt de code ou d'un simple sujet. Chaque question a un niveau et une
**source** qui permet de vérifier la réponse.

Le projet a deux parties :

- **`skill/quiz-generator/`** : une skill Claude qui écrit les quiz au format
  FlashCards (Markdown, un fichier par langue, `.zip` s'il y a des images).
- **`app/`** : une application web statique pour réviser. Elle tire des
  questions au hasard, mélange les réponses, filtre par niveau, type et thème,
  et propose trois modes : quiz noté, entraînement et lecture. L'interface et les quiz sont multilingues, et on peut changer de
  langue même au milieu d'une question.

Le format est décrit dans [`docs/format.md`](docs/format.md), et la feuille de
route dans [`docs/PLAN.md`](docs/PLAN.md).

## Utiliser l'application

En ligne : https://ithasu.github.io/FlashCards/

Pour charger des quiz :

- glisser-déposer un ou plusieurs fichiers `.md` ou `.zip`. Les traductions
  d'un même quiz et plusieurs quiz différents peuvent être chargés en même
  temps ;
- ou passer une URL : `…/?quiz=https://exemple.org/quiz.fr.md&quiz=https://exemple.org/quiz.en.md`.

Les fichiers restent dans le navigateur : rien n'est envoyé à un serveur.

Trois modes, au choix avant de commencer (les filtres par quiz, niveau, type
et thème s'appliquent à tous) :

- **Quiz** (par défaut) : 10 questions tirées au hasard, notées, corrigées à la
  fin. On ne peut pas passer une question, mais le bouton « Indice : voir la
  source » affiche la source de la question (sans la réponse ni
  l'explication). Barème :

  | | Sans indice | Avec indice |
  |---|---|---|
  | Bonne réponse | **+2** | **+1** |
  | Mauvaise réponse | **0** | **−1** |

  Une question laissée sans réponse (quiz terminé en avance) vaut 0.
- **Entraînement** : une question à la fois, corrigée tout de suite, sans
  points. Une question ratée, ou passée (« Passer et voir la réponse »),
  revient quelques questions plus tard. L'entraînement se termine quand toutes
  les questions ont été réussies, ou quand on clique sur « Arrêter ».
- **Lecture** : toutes les questions avec leur réponse, leur explication et
  leurs sources, dans l'ordre du fichier.

## Exemples

Ouvrez directement un quiz d'exemple dans l'application :

| Quiz | Langues | Questions |
|------|---------|-----------|
| [La programmation asynchrone en TypeScript](https://ithasu.github.io/FlashCards/?quiz=examples/ts-async/quiz.fr.md) | FR | 117 |
| [La poignée de main TCP en trois temps](https://ithasu.github.io/FlashCards/?quiz=examples/tcp-handshake/quiz.fr.md&quiz=examples/tcp-handshake/quiz.en.md) | FR, EN | 6 |
| [Le format de quiz FlashCards](https://ithasu.github.io/FlashCards/?quiz=examples/flashcards-format/quiz.fr.md&quiz=examples/flashcards-format/quiz.en.md) | FR, EN | 7 |
| [JavaScript closures](https://ithasu.github.io/FlashCards/?quiz=examples/js-closures/quiz.en.md) | EN | 4 |

Les fichiers sources sont dans [`examples/`](examples/) ; ils servent aussi de
jeux de test.

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
npm test             # tests du format, du validateur et de la logique de session
npm run test:e2e     # tests de bout en bout de l'application (Playwright)
npm run validate -- examples      # valide des quiz (fichiers, dossiers, zip)
npm run validate -- quiz/ --sources doc.md   # + vérifie les citations mot pour mot
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
- **GitHub Pages** : l'application est déployée sur
  https://ithasu.github.io/FlashCards/ à chaque push sur `main`, après chaque
  release, ou à la demande avec le workflow « Deploy to GitHub Pages ».

## Licence

GPL-3.0, voir [LICENSE](LICENSE).
