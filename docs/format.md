# FlashCards quiz format — version 1

This document is the contract between the `quiz-generator` Claude skill (which
writes quizzes) and the FlashCards web app (which plays them). The reference
implementation of the parser and validator lives in `format/src/`.

## 1. Files and bundles

A quiz is written in **Markdown**, one file per language.

| Situation                         | What to ship                                              |
|-----------------------------------|-----------------------------------------------------------|
| One language, no media            | a single `.md` file                                       |
| Several languages, no media       | the `.md` files (or a `.zip` containing them)             |
| Media (images, PDFs…) referenced  | a `.zip` containing the `.md` file(s) and a `media/` folder |

Conventions:

- Name files `quiz.<language>.md` (`quiz.fr.md`, `quiz.en.md`). Any `.md` file
  starting with a front-matter block is accepted, the name is only a convention.
- Media are referenced with paths **relative to the Markdown file**
  (`media/handshake.svg`). Absolute URLs (`https://…`) are also allowed.
- Supported media in the app: images (`png`, `jpg`, `gif`, `svg`, `webp`, `avif`)
  and any file that can be linked (`pdf`, `txt`…).

## 2. Front-matter

Every file starts with a YAML front-matter block:

```markdown
---
format: 1
id: git-basics
title: Git basics
description: Essential commands and concepts.
language: en
generated_at: 2026-10-03
generator: quiz-generator
sources:
  - https://git-scm.com/book/en/v2
---
```

| Key            | Required | Meaning |
|----------------|----------|---------|
| `format`       | yes      | Always `1` for this version. |
| `id`           | yes      | Quiz identifier (`[A-Za-z0-9][A-Za-z0-9_.-]*`). **Files sharing the same `id` are translations of the same quiz.** Different ids are different quizzes, which the app can mix in one session. |
| `title`        | yes      | Title shown to the user, in the file's language. |
| `language`     | yes      | BCP 47 tag of the file's language: `fr`, `en`, `pt-BR`… |
| `description`  | no       | One or two sentences, in the file's language. |
| `generated_at` | no       | Date of generation (`YYYY-MM-DD`). |
| `generator`    | no       | Tool that produced the file. |
| `sources`      | no       | Global list of the material the quiz was built from (URLs, document names). |

Other keys are allowed and ignored.

## 3. Questions

Each question is a level-2 heading (`## `), immediately followed by a metadata
comment. Everything before the first `##` (an optional `# Title`, an
introduction) is ignored.

````markdown
## Which command creates a new branch without switching to it?
<!-- id: git-001 | level: 1 | tags: branches, commands -->

Optional extra statement: paragraphs, `code`, images, fenced code blocks…

- [x] `git branch <name>`
- [ ] `git checkout <name>`
- [ ] `git switch <name>`
- [ ] `git merge <name>`

> [!explanation]
> `git branch` only creates the pointer; HEAD stays on the current branch.

> [!source] link
> [Pro Git — Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
````

The parts always come **in this order**: heading, metadata, optional statement,
answers, then the `> [!…]` blocks.

### 3.1 Heading

The heading text is the question itself. Inline Markdown is allowed. Keep it
self-contained: questions are drawn at random, so never refer to another
question.

### 3.2 Metadata comment

A single-line HTML comment of `key: value` pairs separated by `|`:

| Key      | Required | Values |
|----------|----------|--------|
| `id`     | yes      | Unique within the quiz, stable across translations (`[A-Za-z0-9][A-Za-z0-9_.-]*`). |
| `level`  | yes      | `1`, `2` or `3` (see §4). |
| `type`   | no       | `mcq` (default) or `true-false`. |
| `answer` | true-false only | `true` or `false`. |
| `tags`   | no       | Comma-separated keywords. Tags are **identifiers**: keep them identical in every translation (lowercase, no spaces: `branches`, `http-headers`). |

### 3.3 Answers

**Multiple-choice (`mcq`)** — a task list. `[x]` marks a correct answer, `[ ]`
a wrong one:

```markdown
- [x] correct answer
- [ ] wrong answer
- [ ] wrong answer
```

- At least 2 answers, at least one `[x]`.
- Several `[x]` make a multiple-answer question: the user must select all the
  correct answers and only them.
- Answers are shuffled by the app. Never write "all of the above",
  "none of these", "both A and B".
- An answer may span several lines: indent continuation lines by at least two
  spaces.

**True/false (`true-false`)** — no answer list; the statement is the heading and
the expected value is in the metadata. The app shows localized True/False
buttons.

```markdown
## Git stores each version as a set of differences from the previous one.
<!-- id: git-010 | level: 2 | type: true-false | answer: false -->
```

### 3.4 Explanation (optional)

```markdown
> [!explanation]
> Why the right answer is right, and why tempting wrong answers are wrong.
```

At most one per question. Every line starts with `>`.

### 3.5 Sources (at least one)

Each source is a `> [!source] <type>` block. A question may have several (for
instance an excerpt plus the link to the page it comes from).

| Type      | Content | Rule |
|-----------|---------|------|
| `link`    | A URL or Markdown link, ideally to the precise section (anchor, page number). | Must contain a URL. |
| `excerpt` | A **verbatim** quotation followed by an attribution line starting with `—`. | Must be quoted word for word from the source. |
| `image`   | `![caption](media/file.png)` plus optional text. | Must contain a Markdown image. |
| `code`    | A fenced code block, preceded by `path:lines` and ideally a permalink. | Must contain a fenced code block. |

````markdown
> [!source] excerpt
> "The git branch command only created a new branch — it didn't switch to that branch."
> — [Pro Git, §3.1](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)

> [!source] image
> ![TCP three-way handshake](media/handshake.svg)

> [!source] code
> [`src/router.ts:12-18`](https://github.com/owner/repo/blob/<commit>/src/router.ts#L12-L18)
> ```ts
> export function route(path: string) {
>   ...
> }
> ```
````

## 4. Levels

| Level | Name          | What it tests |
|-------|---------------|---------------|
| 1     | Discovery     | Definitions, vocabulary, direct facts stated in the source. |
| 2     | Understanding | Relations between concepts, the "why", comparing, predicting a simple outcome. |
| 3     | Mastery       | Applying to a new situation, edge cases and pitfalls, combining several notions. |

## 5. Translations

To offer a quiz in several languages, write one file per language with the same
quiz `id`. For each question id, the translations must have:

- the same `type`, `level` and `tags`;
- for `mcq`: the same number of answers, **in the same order**, with `[x]` at
  the same positions (the app keeps the answer order when the user switches
  language in the middle of a question);
- for `true-false`: the same `answer`.

Explanations and sources are translated too; a source may point to a page in the
translated language when one exists.

A question missing in one language is shown in the quiz's other languages
(warning, not an error).

## 6. Validation

```bash
node skill/quiz-generator/scripts/validate.mjs <file.md | folder | bundle.zip>...
```

Errors make a question (or the whole file) unusable; warnings are advice. The
app runs the same checks when loading a file and skips invalid questions.
