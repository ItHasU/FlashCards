# Writing good quiz questions

The app draws questions at random and shuffles answers. Every rule below follows
from that, or from the goal: helping someone learn and check their knowledge.

## The statement

- **Self-contained.** Never refer to another question, to "the text", "the
  document above" or "the previous example". Name the subject explicitly:
  "In Git, …", "According to RFC 9293, …", "In the `billing` service, …".
- **One idea per question.** Split compound questions.
- **Positive wording.** Avoid negations; if one is necessary
  ("Which is NOT…"), write the negation in capitals.
- **Precise.** Remove anything that could make two answers defensible: specify
  the version, the context, the unit, the conditions.
- **Short.** Put context in the optional statement body (code, figure, data),
  keep the heading as the actual question.
- Statement and answers are Markdown: use `inline code`, fenced code blocks
  with a language, images from `media/`.

## The correct answer

- Indisputable, and supported by the attached source.
- Not a verbatim copy of a sentence when the distractors are paraphrases: the
  learner would recognize the wording instead of the idea.

## Distractors (wrong answers)

Good distractors make the question informative: someone who has not understood
picks one.

- **Plausible**: common confusions, neighbouring concepts, typical mistakes,
  inverted cause/effect, off-by-one values, the answer to a slightly different
  question, a true statement that does not answer this question.
- **Clearly wrong** for someone who knows: no trick based on wording.
- **Homogeneous**: same grammatical form, similar length and level of detail as
  the correct answer. The correct answer must not be the longest, the most
  precise or the only one with a qualifier.
- **Independent of position**: never "all of the above", "none of these",
  "both A and B", "A and C".
- **No absurd fillers**: 3 good distractors are the norm; 2 good ones beat 3
  with a silly one.
- For numbers, spread values around the correct one; for terms, use terms from
  the same domain.

## Multiple correct answers

Use them when the notion is a set ("Which of these are HTTP safe methods?").
The app tells the user that several answers are expected and requires the exact
set. Keep at least one wrong answer.

## True/false

- A single, unambiguous statement. Avoid "always", "never", "only" unless the
  source states it; avoid double negations.
- False statements should be **plausible misconceptions**, not random
  alterations.
- Balance true and false.

## Levels

| Level | Typical stems |
|-------|---------------|
| 1 — Discovery | "What is…", "Which command…", "What does X stand for…", "In which year…" |
| 2 — Understanding | "Why…", "What is the difference between…", "What happens when…", "Which statement best describes…" |
| 3 — Mastery | Scenario + "What should you do…", "What does this code print…", edge cases, combining two notions, diagnosing a bug |

Level is about the cognitive demand, not about how obscure the fact is. An
obscure detail is not a level 3 question; often it is not a good question at
all.

## What to avoid

- Trivia with no learning value (page numbers, an author's middle name, a
  variable name), unless the user asks for it.
- Questions whose answer changes often (prices, versions, "latest") unless the
  date or version is in the statement.
- Opinions presented as facts.
- Two questions testing the exact same fact with the same wording (variants at
  different levels are fine).

## Explanations

One to three sentences: why the answer is right, and, when useful, why the most
tempting distractor is wrong. Do not just repeat the answer.
