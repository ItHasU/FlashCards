# Citing sources

Each question needs at least one `> [!source] <type>` block that lets the learner
**check the answer by themselves**. The source must support the expected answer
itself, not just the topic of the question.

Every line of a source block starts with `>`.

## `excerpt` — a quotation

Use it when a sentence or two of the material states the answer.

```markdown
> [!source] excerpt
> "The git branch command only created a new branch — it didn't switch to that branch."
> — [Pro Git, §3.1](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
```

- **Verbatim**: copy the exact words. Shorten with `[…]` only; never paraphrase
  inside quotation marks.
- End with an attribution line starting with `—`: document title + section/page,
  or a link.
- Keep the quotation in the original language, even in a translated quiz.
- For a local document: `— Course notes.pdf, p. 12` or `— report.docx, §2.3`.

## `link` — a web page

```markdown
> [!source] link
> [RFC 9293, §3.5 — Establishing a Connection](https://www.rfc-editor.org/rfc/rfc9293#section-3.5)
```

- Link to the most precise location: an anchor (`#section`), a page of a PDF
  (`file.pdf#page=12`), a specific doc page rather than a home page.
- Only cite URLs you actually opened. Never guess an URL.
- Use a descriptive link text (site — page title — section).

## `image` — a figure

```markdown
> [!source] image
> ![TCP three-way handshake](media/three-way-handshake.svg)
> Figure 3, *Networking course*, p. 8
```

- Save the file under `media/` next to the quiz files and reference it with a
  relative path. Supported: png, jpg, gif, svg, webp, avif.
- Use images that come from the material (a figure, a screenshot of a slide or
  diagram). You may draw a simple SVG diagram when it faithfully represents what
  the source says; then add a second source (excerpt or link) to the material.
- Write a meaningful alt text; add the figure reference on the next line.
- Keep files small (resize screenshots to ~1200 px wide max).

## `code` — a snippet

````markdown
> [!source] code
> [`src/billing/invoice.ts:42-51`](https://github.com/acme/shop/blob/3f2c1e9/src/billing/invoice.ts#L42-L51)
> ```ts
> export function total(lines: Line[]): number {
>   return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
> }
> ```
````

- First line: `path:start-end`, linked to a permalink (commit SHA, not a branch
  name) when the repository is on GitHub/GitLab.
- Copy the code exactly; elide unrelated lines with a comment such as `// …`.
- Keep snippets short (≤ 20 lines): just what proves the answer.
- Give the fence a language for syntax highlighting.

## Several sources

Combine when it helps: an excerpt plus a link to the page it comes from, a code
snippet plus the documentation of the API it uses, an image plus the text that
describes it.

## When no source supports a fact

Drop the question, or find a source. A question without a verifiable source is
not allowed, even for "common knowledge".
