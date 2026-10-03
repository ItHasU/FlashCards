---
format: 1
id: flashcards-format
title: The FlashCards quiz format
description: Test your knowledge of the format used by this very app.
language: en
generated_at: 2026-10-03
generator: hand-written example
sources:
  - docs/format.md
---

# The FlashCards quiz format

## Which syntax marks a correct answer in a multiple-choice question?
<!-- id: fmt-001 | level: 1 | tags: answers -->

- [x] `- [x] answer`
- [ ] `- [*] answer`
- [ ] `- (x) answer`
- [ ] `+ answer`

> [!explanation]
> Answers are a Markdown task list: `[x]` for a correct answer, `[ ]` for a wrong one.

> [!source] excerpt
> "**Multiple-choice (`mcq`)** — a task list. `[x]` marks a correct answer, `[ ]`
> a wrong one"
> — docs/format.md, §3.3

## Every question must have at least one source.
<!-- id: fmt-002 | level: 1 | type: true-false | answer: true | tags: sources -->

> [!source] excerpt
> "### 3.5 Sources (at least one)"
> — docs/format.md, §3.5

> [!source] code
> `format/src/validate.ts:69`
> ```ts
> if (q.sources.length === 0) err('Every question needs at least one "> [!source] <type>" block.');
> ```

## How does the app recognize that two files are translations of the same quiz?
<!-- id: fmt-003 | level: 2 | tags: translations, front-matter -->

- [x] They share the same `id` in their front-matter
- [ ] They share the same `title` in their front-matter
- [ ] They are in the same folder
- [ ] Their file names only differ by the language suffix

> [!explanation]
> File names are only a convention, and titles are translated. The quiz `id` is the only key used to group translations.

> [!source] excerpt
> "**Files sharing the same `id` are translations of the same quiz.**"
> — docs/format.md, §2

## Which answers are discouraged because answers are shuffled?
<!-- id: fmt-004 | level: 2 | tags: answers -->

Select every correct option.

- [x] "All of the above"
- [x] "None of these"
- [ ] An answer containing inline code
- [ ] An answer spanning several lines

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

## A quiz exists in English and French. In the French file, the correct answer of question `q-7` is listed second, while it is listed first in the English file. What happens?
<!-- id: fmt-005 | level: 3 | tags: translations, validation -->

- [x] The validator reports an error: answers must be in the same order in every translation
- [ ] Nothing: the app matches answers by their text
- [ ] The app only shows the English version of this question
- [ ] The validator reports a warning, and the French file wins

> [!explanation]
> When the user switches language in the middle of a question, the app keeps the on-screen order of the answers. This only works if answer *n* means the same thing in every language.

> [!source] excerpt
> "for `mcq`: the same number of answers, **in the same order**, with `[x]` at
>   the same positions"
> — docs/format.md, §5

## Which level fits a question asking to apply a notion to a new situation or an edge case?
<!-- id: fmt-006 | level: 1 | tags: levels -->

- [x] 3 — Mastery
- [ ] 2 — Understanding
- [ ] 1 — Discovery
- [ ] Levels only depend on the length of the question

> [!source] excerpt
> "| 3     | Mastery       | Applying to a new situation, edge cases and pitfalls, combining several notions. |"
> — docs/format.md, §4

## A true/false question must list its two answers as a task list.
<!-- id: fmt-007 | level: 2 | type: true-false | answer: false | tags: answers -->

> [!explanation]
> A true/false question has no answer list: the expected value goes in the metadata (`answer: true` or `answer: false`) and the app shows localized buttons.

> [!source] excerpt
> "**True/false (`true-false`)** — no answer list; the statement is the heading and
> the expected value is in the metadata."
> — docs/format.md, §3.3
