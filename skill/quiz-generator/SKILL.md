---
name: quiz-generator
description: Generates revision quizzes (multiple-choice and true/false questions with levels and verifiable sources) in the FlashCards Markdown format, from documents, web pages, a code repository, or just a topic to research. Use when the user asks to make a quiz, flashcards, revision questions, a QCM or a test from some material or about a subject, or to translate or extend an existing FlashCards quiz.
---

# Quiz generator

You turn source material into a quiz the user will play in the FlashCards web
app. The app draws questions at random, shuffles the answers, lets the user pick
levels and a number of questions, and shows the **source** of each answer after
it is checked. Your job is to produce questions that are correct, unambiguous,
useful for learning, and verifiable through their source.

The file format is specified in [references/format.md](references/format.md).
Read it before writing the first file. Also read
[references/question-writing.md](references/question-writing.md) and
[references/sources.md](references/sources.md).

## Workflow

### 1. Frame the request

Determine, from the request and context (ask only about what you cannot infer):

- **Material**: documents (paths or attachments), URLs, a code repository, or
  only a topic.
- **Languages**: default to the language the user writes in. If they want
  several, write the main language first, then translate (step 7).
- **Size**: default 20 questions for one document or topic; scale with the
  material (roughly one question per distinct notion, 10 minimum). Generate
  more than the user will play in one session: the app draws a subset.
- **Level mix**: default ~40 % level 1, ~40 % level 2, ~20 % level 3.
- **Audience / focus** if given (exam prep, onboarding on a codebase…).

State the plan in one or two lines (material, languages, count, level mix,
output path) and proceed. Don't ask for confirmation unless something essential
is ambiguous.

### 2. Collect the material

| Input | How |
|-------|-----|
| Documents | Read them fully (md, txt, pdf, docx, slides…). Note page/section numbers for citations. Copy figures you will use as image sources into `media/`. |
| Web pages | Fetch the page(s). Follow links only when they are clearly part of the same material (same doc site/chapter), at most ~10 pages unless asked. Keep the exact URL of every page you quote, with an anchor when the page has one. |
| Code repository | Read the README, docs, entry points, public API, configuration and tests. Prefer questions on architecture, responsibilities, conventions, behavior and pitfalls over trivia (line counts, variable names). Record `path:start-end` for every snippet; if the repo is on GitHub, build permalinks with the current commit SHA (`git rev-parse HEAD`). |
| Topic only | Research it yourself with web search. Prefer primary and reputable sources: official documentation, standards, textbooks, university courses, encyclopedias. Cross-check facts across two sources when they are not from an authoritative reference. Never invent a URL: only cite pages you actually opened. |

If you cannot access some material (blocked site, unreadable file), say so and
work with the rest. Never write questions about content you have not read.

### 3. List the notions

Before writing questions, list the testable notions (facts, definitions,
mechanisms, relations, procedures, pitfalls), each with the precise location
that supports it. Cover the whole material, not only the beginning. Merge
duplicates. This list drives the coverage and the level mix.

### 4. Write the questions

For each notion, choose the level (see the table in format.md §4) and the type:

- **mcq** for most questions: one correct answer and 3 plausible distractors,
  or several correct answers when the notion is naturally a set ("which of
  these…").
- **true-false** for crisp statements, common misconceptions, or when good
  distractors are impossible. Keep them under ~25 % of the quiz. Make about
  half of them false.

Follow every rule in question-writing.md: self-contained questions, one
indisputable answer, plausible distractors of similar length and style, no
"all/none of the above", no clues in the wording.

Add an explanation whenever it helps learning: why the answer is right and why
the tempting distractors are wrong.

### 5. Attach sources

Every question has at least one source that lets the user **verify the answer by
themselves**. Pick the most direct one (see sources.md):

- `excerpt` — a verbatim quotation, followed by `— reference`. Copy it exactly;
  if you need to shorten, use `[…]`.
- `link` — a URL to the precise page/section.
- `image` — a figure from the document, saved under `media/`.
- `code` — a snippet with `path:lines` and a permalink when available.

Combine an excerpt with a link when the excerpt comes from a web page.

### 6. Review against the sources

Re-read every question next to its source and check:

1. The source really supports the expected answer (not just the topic).
2. No distractor is also correct (including under a reasonable alternate
   reading, or in a newer version of the material).
3. Excerpts are verbatim.
4. The level matches the cognitive demand.

Fix or drop failing questions. Accuracy matters more than count.

### 7. Translate (if several languages)

Write one file per language with the same quiz `id` and the same question ids.
Keep, for each question: the same type, level and tags; the answers **in the
same order** with `[x]` at the same positions; the same true/false value.
Translate the title, description, statement, answers and explanation. For
sources, keep excerpts in their original language (add a translation in the
explanation if useful) and prefer a translated version of a linked page when
one exists.

### 8. Validate

Run the validator on the output folder. Whenever the material is available as
text, pass it with `--sources` so that every `excerpt` is checked word for word:

```bash
node <skill-dir>/scripts/validate.mjs <output-folder> --sources <material>...
```

- `<skill-dir>` is the folder containing this SKILL.md. The script needs
  Node.js 18+ and nothing else.
- `--sources` accepts files and folders (Markdown, text, HTML, code, JSON,
  YAML…), and can be repeated. Convert other formats to text first and pass
  the converted files: `pdftotext doc.pdf /tmp/quiz-src/doc.txt`, a DOCX
  saved as text, or the web pages you fetched saved as `.md`/`.html` in a
  scratch folder. For a repository, pass the repository folder itself.
- Add `--json` for a machine-readable report: `issues` (each with file, line,
  question id and message), and per quiz `stats` (questions per level, type,
  source type, tag) and `advice`.

Then:

1. Fix every **ERROR**: the question is unusable (the app skips it).
2. Fix every **WARNING**, in particular "Excerpt not found verbatim" (re-copy
   the exact words from the material), "correct answer is much longer"
   (rebalance) and "not self-contained". Keep a warning only with a good
   reason, and say so in your final summary.
3. Read the **ADVICE** lines (level mix, share of true/false, balance of
   true/false answers, explanations) and compare the stats with the plan from
   step 1; add or rework questions if the quiz is unbalanced.
4. Re-run until there are no errors.

### 9. Deliver

- Folder layout:
  ```
  <quiz-id>/
  ├── quiz.<lang>.md     (one per language)
  └── media/             (only if needed)
  ```
- If there is a `media/` folder, also build a zip that the app loads in one go:
  ```bash
  node <skill-dir>/scripts/package.mjs -o <quiz-id>.zip <quiz-id>/
  ```
  Without media, the `.md` files can be loaded directly (several at once).
- Write the files where the user asked, otherwise in the current working
  directory (or the outputs folder of the environment).
- Finish with a short summary: number of questions per level and type,
  languages, the material covered and anything you could not cover, and how to
  play it: open the FlashCards app and drop the `.md` files or the `.zip`.

## Updating an existing quiz

When asked to extend, fix or translate a quiz, keep existing question ids
stable (users may be familiar with them), give new questions new ids following
the same pattern, and re-run the validator.
