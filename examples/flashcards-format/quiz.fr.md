---
format: 1
id: flashcards-format
title: Le format de quiz FlashCards
description: Testez vos connaissances sur le format utilisé par cette application.
language: fr
generated_at: 2026-10-03
generator: exemple écrit à la main
sources:
  - docs/format.md
---

# Le format de quiz FlashCards

## Quelle syntaxe indique une bonne réponse dans un QCM ?
<!-- id: fmt-001 | level: 1 | tags: answers -->

- [x] `- [x] réponse`
- [ ] `- [*] réponse`
- [ ] `- (x) réponse`
- [ ] `+ réponse`

> [!explanation]
> Les réponses forment une liste de tâches Markdown : `[x]` pour une bonne réponse, `[ ]` pour une mauvaise.

> [!source] excerpt
> "**Multiple-choice (`mcq`)** — a task list. `[x]` marks a correct answer, `[ ]`
> a wrong one"
> — docs/format.md, §3.3 (spécification en anglais)

## Chaque question doit avoir au moins une source.
<!-- id: fmt-002 | level: 1 | type: true-false | answer: true | tags: sources -->

> [!source] excerpt
> "### 3.5 Sources (at least one)"
> — docs/format.md, §3.5

> [!source] code
> `format/src/validate.ts:69`
> ```ts
> if (q.sources.length === 0) err('Every question needs at least one "> [!source] <type>" block.');
> ```

## Comment l'application sait-elle que deux fichiers sont des traductions du même quiz ?
<!-- id: fmt-003 | level: 2 | tags: translations, front-matter -->

- [x] Ils ont le même `id` dans leur front-matter
- [ ] Ils ont le même `title` dans leur front-matter
- [ ] Ils sont dans le même dossier
- [ ] Leurs noms de fichier ne diffèrent que par le suffixe de langue

> [!explanation]
> Le nom de fichier n'est qu'une convention, et les titres sont traduits. Seul l'`id` du quiz sert à regrouper les traductions.

> [!source] excerpt
> "**Files sharing the same `id` are translations of the same quiz.**"
> — docs/format.md, §2

## Quelles réponses sont déconseillées parce que les réponses sont mélangées ?
<!-- id: fmt-004 | level: 2 | tags: answers -->

Sélectionnez toutes les bonnes options.

- [x] « Toutes les réponses ci-dessus »
- [x] « Aucune de ces réponses »
- [ ] Une réponse contenant du code
- [ ] Une réponse sur plusieurs lignes

> [!source] excerpt
> "Answers are shuffled by the app. Never write "all of the above",
> "none of these", "both A and B"."
> — docs/format.md, §3.3

> [!source] code
> `format/src/validate.ts:12-14`
> ```ts
> // Options that lose their meaning once answers are shuffled.
> const POSITIONAL_ANSWER_RE =
>   /^(all|none|both) of (the )?(above|these|them)|^(toutes|aucune|tous|aucun) (les réponses |des réponses )?(ci-dessus|précédentes)|^les deux/i;
> ```

## Un quiz existe en anglais et en français. Dans le fichier français, la bonne réponse de la question `q-7` est en deuxième position, alors qu'elle est en première dans le fichier anglais. Que se passe-t-il ?
<!-- id: fmt-005 | level: 3 | tags: translations, validation -->

- [x] Le validateur signale une erreur : les réponses doivent être dans le même ordre dans toutes les traductions
- [ ] Rien : l'application associe les réponses par leur texte
- [ ] L'application n'affiche que la version anglaise de cette question
- [ ] Le validateur émet un avertissement et le fichier français l'emporte

> [!explanation]
> Quand l'utilisateur change de langue au milieu d'une question, l'application conserve l'ordre des réponses à l'écran. Cela ne fonctionne que si la réponse *n* a le même sens dans toutes les langues.

> [!source] excerpt
> "for `mcq`: the same number of answers, **in the same order**, with `[x]` at
>   the same positions"
> — docs/format.md, §5

## Quel niveau convient à une question qui demande d'appliquer une notion à une situation nouvelle ou à un cas limite ?
<!-- id: fmt-006 | level: 1 | tags: levels -->

- [x] 3 — Maîtrise
- [ ] 2 — Compréhension
- [ ] 1 — Découverte
- [ ] Le niveau dépend seulement de la longueur de la question

> [!source] excerpt
> "| 3     | Mastery       | Applying to a new situation, edge cases and pitfalls, combining several notions. |"
> — docs/format.md, §4

## Une question vrai/faux doit lister ses deux réponses sous forme de liste de tâches.
<!-- id: fmt-007 | level: 2 | type: true-false | answer: false | tags: answers -->

> [!explanation]
> Une question vrai/faux n'a pas de liste de réponses : la valeur attendue est dans les métadonnées (`answer: true` ou `answer: false`) et l'application affiche des boutons traduits.

> [!source] excerpt
> "**True/false (`true-false`)** — no answer list; the statement is the heading and
> the expected value is in the metadata."
> — docs/format.md, §3.3
