import './style.css';
import { LEVELS, QUESTION_TYPES, type Issue, type Level, type Question, type QuestionType, type Source } from '../../format/src';
import { h, rich } from './dom';
import { getLanguage, languageName, setLanguage, t, UI_LANGUAGES, type MessageKey } from './i18n';
import { Library, type MediaResolver } from './library';
import { fetchExamples, loadFiles, loadUrl, type ExampleEntry, type LoadSummary } from './loader';
import { renderBlock, renderInline } from './markdown';
import {
  candidates,
  expectedAnswers,
  isCorrect,
  newSession,
  retrySession,
  score,
  type Config,
  type Item,
  type Session,
} from './session';

type Screen = 'home' | 'config' | 'question' | 'results';

const state = {
  screen: 'home' as Screen,
  library: new Library(),
  config: undefined as Config | undefined,
  session: undefined as Session | undefined,
  examples: [] as ExampleEntry[],
  loading: false,
  failures: [] as string[],
};

const app = document.getElementById('app')!;

// ---------------------------------------------------------------------------
// Rendering

function render(): void {
  document.documentElement.lang = getLanguage();
  const view = {
    home: homeView,
    config: configView,
    question: questionView,
    results: resultsView,
  }[state.screen]();
  app.replaceChildren(headerView(), h('main', { class: `screen screen-${state.screen}` }, view));
}

function go(screen: Screen): void {
  state.screen = screen;
  render();
  window.scrollTo({ top: 0 });
}

function headerView(): HTMLElement {
  const langs = [...new Set([...UI_LANGUAGES, ...state.library.languages()])].sort();
  const select = h(
    'select',
    {
      'aria-label': t('lang.label'),
      onchange: (e: Event) => {
        setLanguage((e.target as HTMLSelectElement).value);
        render();
      },
    },
    langs.map((l) => h('option', { value: l, selected: l === getLanguage() }, languageName(l))),
  );
  const home = () => go(state.library.bundles.size && state.screen !== 'config' ? 'config' : 'home');
  return h(
    'header',
    { class: 'topbar' },
    h('button', { class: 'brand', onclick: home, title: t('nav.home') }, h('span', { class: 'logo', 'aria-hidden': 'true' }, '?'), 'FlashCards'),
    h('label', { class: 'lang' }, h('span', { class: 'sr-only' }, t('lang.label')), '🌐 ', select),
  );
}

function issuesView(issues: Issue[]): HTMLElement | null {
  if (!issues.length) return null;
  const errors = issues.filter((i) => i.severity === 'error').length;
  return h(
    'details',
    { class: `issues ${errors ? 'has-errors' : ''}` },
    h('summary', {}, t('issues.title', { n: issues.length })),
    h(
      'ul',
      {},
      issues.map((i) =>
        h(
          'li',
          { class: i.severity },
          h('strong', {}, t(i.severity === 'error' ? 'issues.error' : 'issues.warning')),
          ' ',
          [i.file, i.line !== undefined ? t('issues.line', { n: i.line }) : null].filter(Boolean).join(', '),
          i.questionId ? ` [${i.questionId}]` : '',
          ' — ',
          i.message,
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Home: loading quizzes

async function runLoad(task: () => Promise<LoadSummary[]>): Promise<void> {
  state.loading = true;
  state.failures = [];
  render();
  const summaries = await task();
  state.loading = false;
  state.failures = summaries.flatMap((s) => s.failures);
  const loaded = summaries.reduce((n, s) => n + s.quizzes, 0);
  if (loaded > 0) {
    syncConfig();
    go('config');
  } else {
    if (!state.failures.length) state.failures.push(t('load.nothing'));
    render();
  }
}

function homeView(): HTMLElement[] {
  const input = h('input', {
    type: 'file',
    multiple: true,
    accept: '.md,.zip,.markdown,image/*,application/pdf',
    class: 'sr-only',
    onchange: (e: Event) => {
      const files = [...((e.target as HTMLInputElement).files ?? [])];
      if (files.length) void runLoad(async () => [await loadFiles(state.library, files)]);
    },
  });
  const drop = h(
    'label',
    {
      class: 'dropzone',
      ondragover: (e: Event) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.add('over');
      },
      ondragleave: (e: Event) => (e.currentTarget as HTMLElement).classList.remove('over'),
      ondrop: (e: Event) => {
        e.preventDefault();
        const files = [...((e as DragEvent).dataTransfer?.files ?? [])];
        if (files.length) void runLoad(async () => [await loadFiles(state.library, files)]);
      },
    },
    input,
    h('span', { class: 'dropzone-icon', 'aria-hidden': 'true' }, '⇪'),
    h('strong', {}, t('load.drop')),
    h('span', { class: 'muted' }, t('load.or')),
    h('span', { class: 'button primary' }, t('load.choose')),
  );

  const urlInput = h('input', { type: 'url', placeholder: t('load.urlPlaceholder'), required: true, 'aria-label': t('load.url') });
  const urlForm = h(
    'form',
    {
      class: 'url-form',
      onsubmit: (e: Event) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        if (url) void runLoad(async () => [await loadUrl(state.library, url)]);
      },
    },
    urlInput,
    h('button', { type: 'submit', class: 'button' }, t('load.urlButton')),
  );

  const lang = getLanguage();
  const examples = state.examples.length
    ? h(
        'section',
        { class: 'card' },
        h('h2', {}, t('load.examples')),
        h(
          'div',
          { class: 'examples' },
          state.examples.map((ex) =>
            h(
              'button',
              {
                class: 'button example',
                onclick: () => void runLoad(() => Promise.all(ex.files.map((f) => loadUrl(state.library, f)))),
              },
              ex.titles[lang] ?? ex.titles[lang.split('-')[0]] ?? Object.values(ex.titles)[0],
              h('span', { class: 'muted' }, ` · ${Object.keys(ex.titles).map((l) => l.toUpperCase()).join(' / ')}`),
            ),
          ),
        ),
      )
    : null;

  return [
    h('p', { class: 'tagline' }, t('app.tagline')),
    h(
      'section',
      { class: 'card' },
      h('h2', {}, t('load.title')),
      state.loading ? h('p', { class: 'loading' }, t('load.loading')) : drop,
      h('h3', {}, t('load.url')),
      urlForm,
      h('p', { class: 'muted small' }, t('load.privacy')),
      state.failures.length ? h('ul', { class: 'failures' }, state.failures.map((f) => h('li', {}, f))) : null,
      issuesView(state.library.issues),
    ),
    examples ?? h('span'),
  ].filter(Boolean) as HTMLElement[];
}

// ---------------------------------------------------------------------------
// Config

function allTags(quizIds: string[]): string[] {
  const tags = new Set<string>();
  for (const c of candidates(state.library, { quizIds, levels: [...LEVELS], types: [...QUESTION_TYPES], tags: [] }))
    c.question.tags.forEach((tag) => tags.add(tag));
  return [...tags].sort();
}

/** Keeps the config consistent with the loaded quizzes (new quizzes are selected by default). */
function syncConfig(): void {
  const ids = [...state.library.bundles.keys()];
  if (!state.config) {
    state.config = { quizIds: ids, levels: [...LEVELS], types: [...QUESTION_TYPES], tags: [], count: 10 };
    return;
  }
  const known = new Set(state.config.quizIds);
  state.config.quizIds = [...state.config.quizIds.filter((id) => state.library.bundles.has(id)), ...ids.filter((id) => !known.has(id))];
}

function configView(): HTMLElement[] {
  const config = state.config!;
  const lang = getLanguage();

  const availableEl = h('p', { class: 'available' });
  const countInput = h('input', { type: 'number', min: 1, value: config.count, class: 'count-input', 'aria-label': t('config.count') });
  const countRange = h('input', { type: 'range', min: 1, value: config.count, 'aria-label': t('config.count') });
  const startBtn = h('button', { class: 'button primary big', onclick: start }, t('config.start'));

  function update(): void {
    const n = candidates(state.library, config).length;
    availableEl.textContent = n ? t('config.available', { n }) : t('config.none');
    availableEl.classList.toggle('warning', n === 0);
    const max = Math.max(1, n);
    countRange.max = countInput.max = String(max);
    const shown = Math.min(config.count, max);
    countRange.value = countInput.value = String(shown);
    startBtn.disabled = n === 0;
  }
  function setCount(value: number): void {
    if (Number.isFinite(value) && value >= 1) config.count = Math.round(value);
    update();
  }
  countInput.addEventListener('change', () => setCount(Number(countInput.value)));
  countRange.addEventListener('input', () => setCount(Number(countRange.value)));

  function start(): void {
    const n = candidates(state.library, config).length;
    state.session = newSession(state.library, { ...config, count: Math.min(config.count, n) });
    go('question');
  }

  function toggle<T>(list: T[], value: T, on: boolean): T[] {
    return on ? [...list, value] : list.filter((v) => v !== value);
  }

  const quizzes = h(
    'fieldset',
    {},
    h('legend', {}, t('config.quizzes')),
    [...state.library.bundles.values()].map((bundle) => {
      const meta = state.library.meta(bundle.id, lang);
      return h(
        'label',
        { class: 'check quiz-choice' },
        h('input', {
          type: 'checkbox',
          checked: config.quizIds.includes(bundle.id),
          onchange: (e: Event) => {
            config.quizIds = toggle(config.quizIds, bundle.id, (e.target as HTMLInputElement).checked);
            config.tags = config.tags.filter((tag) => allTags(config.quizIds).includes(tag));
            render();
          },
        }),
        h(
          'span',
          {},
          h('strong', {}, meta.title),
          meta.description ? h('span', { class: 'muted' }, meta.description) : null,
          h(
            'span',
            { class: 'muted small' },
            `${t('config.questionsCount', { n: bundle.questionIds.length })} · ${t('config.languages', {
              list: [...bundle.translations.keys()].map((l) => languageName(l, lang)).join(', '),
            })}`,
          ),
        ),
      );
    }),
  );

  const chips = <T extends string | number>(legend: string, values: readonly T[], selected: T[], label: (v: T) => string, set: (v: T[]) => void, hint?: string) =>
    h(
      'fieldset',
      {},
      h('legend', {}, legend),
      hint ? h('p', { class: 'muted small' }, hint) : null,
      h(
        'div',
        { class: 'chips' },
        values.map((v) =>
          h(
            'label',
            { class: 'chip' },
            h('input', {
              type: 'checkbox',
              checked: selected.includes(v),
              onchange: (e: Event) => {
                set(toggle(selected, v, (e.target as HTMLInputElement).checked));
                update();
              },
            }),
            h('span', {}, label(v)),
          ),
        ),
      ),
    );

  const tags = allTags(config.quizIds);
  const view = [
    h('h1', {}, t('config.title')),
    h(
      'section',
      { class: 'card' },
      quizzes,
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'button', onclick: () => go('home') }, '+ ', t('config.add')),
        h(
          'button',
          {
            class: 'button ghost',
            onclick: () => {
              state.library.clear();
              state.config = undefined;
              go('home');
            },
          },
          t('config.clear'),
        ),
      ),
      issuesView(state.library.issues),
    ),
    h(
      'section',
      { class: 'card' },
      chips(t('config.levels'), LEVELS, config.levels, (l) => `${l} · ${t(`level.${l}` as MessageKey)}`, (v) => (config.levels = v as Level[])),
      chips(t('config.types'), QUESTION_TYPES, config.types, (ty) => t(`type.${ty}` as MessageKey), (v) => (config.types = v as QuestionType[])),
      tags.length ? chips(t('config.tags'), tags, config.tags, (tag) => tag, (v) => (config.tags = v), t('config.tagsHint')) : null,
      h('fieldset', {}, h('legend', {}, t('config.count')), h('div', { class: 'count' }, countRange, countInput)),
      availableEl,
      startBtn,
    ),
  ];
  update();
  return view as HTMLElement[];
}

// ---------------------------------------------------------------------------
// Question

function currentItem(): Item {
  return state.session!.items[state.session!.index];
}

/** Shows an excerpt as a quotation, with its "— reference" attribution on its own line. */
function sourceMarkdown(s: Source): string {
  if (s.type !== 'excerpt') return s.body;
  const lines = s.body.split('\n');
  const at = lines.findIndex((l) => /^\s*(—|--)\s+\S/.test(l));
  if (at <= 0) return s.body;
  return [...lines.slice(0, at).map((l) => `> ${l}`), '', ...lines.slice(at)].join('\n');
}

function sourcesView(sources: Source[], resolve: MediaResolver): HTMLElement {
  return h(
    'div',
    { class: 'sources' },
    h('h3', {}, t('q.sources')),
    sources.map((s) =>
      h('div', { class: `source source-${s.type}` }, h('span', { class: 'badge' }, t(`source.${s.type}` as MessageKey)), rich('div', renderBlock(sourceMarkdown(s), resolve))),
    ),
  );
}

function answerLabels(question: Question, resolve: MediaResolver, order: number[]): { index: number; html: string }[] {
  if (question.type === 'true-false') {
    return [
      { index: 1, html: t('tf.true') },
      { index: 0, html: t('tf.false') },
    ];
  }
  return order.map((i) => ({ index: i, html: renderBlock(question.answers[i].text, resolve) }));
}

function select(index: number): void {
  const item = currentItem();
  if (item.result) return;
  const resolved = resolveItem(item);
  if (!resolved) return;
  const multi = resolved.question.type === 'mcq' && resolved.question.answers.filter((a) => a.correct).length > 1;
  if (multi) item.selected = item.selected.includes(index) ? item.selected.filter((i) => i !== index) : [...item.selected, index];
  else item.selected = [index];
  render();
}

function validate(): void {
  const item = currentItem();
  const resolved = resolveItem(item);
  if (!resolved || item.result || !item.selected.length) return;
  item.result = isCorrect(resolved.question, item.selected) ? 'correct' : 'wrong';
  render();
  document.querySelector('.feedback')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function next(): void {
  const session = state.session!;
  if (session.index < session.items.length - 1) {
    session.index++;
    go('question');
  } else go('results');
}

function resolveItem(item: Item) {
  return state.library.question(item.quizId, item.questionId, getLanguage());
}

function questionView(): HTMLElement[] {
  const session = state.session!;
  const item = currentItem();
  const resolved = resolveItem(item);
  if (!resolved) {
    next();
    return [];
  }
  const { question, translation, lang } = resolved;
  const resolve = translation.resolve;
  const answered = item.result !== undefined;
  const expected = expectedAnswers(question);
  const multi = question.type === 'mcq' && expected.length > 1;
  const quizCount = new Set(session.items.map((i) => i.quizId)).size;
  const ui = getLanguage();

  const answers = answerLabels(question, resolve, item.order).map(({ index, html }, k) => {
    const selected = item.selected.includes(index);
    const classes = ['answer'];
    if (selected) classes.push('selected');
    if (answered && expected.includes(index)) classes.push(selected ? 'correct' : 'missed');
    if (answered && selected && !expected.includes(index)) classes.push('wrong');
    return h(
      'button',
      {
        class: classes.join(' '),
        role: multi ? 'checkbox' : 'radio',
        'aria-checked': String(selected),
        disabled: answered,
        onclick: () => select(index),
      },
      h('span', { class: 'key', 'aria-hidden': 'true' }, String(k + 1)),
      rich('span', html, { class: 'answer-text' }),
    );
  });

  const progress = ((session.index + (answered ? 1 : 0)) / session.items.length) * 100;
  const isLast = session.index === session.items.length - 1;

  return [
    h(
      'div',
      { class: 'question-top' },
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': Math.round(progress), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('span', { style: `width:${progress}%` })),
      h(
        'div',
        { class: 'row spread' },
        h('span', { class: 'muted' }, t('q.progress', { i: session.index + 1, n: session.items.length })),
        h('button', { class: 'button ghost small', onclick: () => go('results') }, t('q.quit')),
      ),
    ),
    h(
      'article',
      { class: 'card question' },
      h(
        'div',
        { class: 'meta' },
        h('span', { class: `badge level level-${question.level}` }, `${question.level} · ${t(`level.${question.level}` as MessageKey)}`),
        quizCount > 1 ? h('span', { class: 'badge' }, state.library.meta(item.quizId, ui).title) : null,
        ...question.tags.map((tag) => h('span', { class: 'tag' }, `#${tag}`)),
      ),
      lang !== ui && lang.split('-')[0] !== ui.split('-')[0]
        ? h('p', { class: 'fallback muted small' }, t('q.fallback', { lang: languageName(ui, ui), other: languageName(lang, ui) }))
        : null,
      rich('h2', renderInline(question.title, resolve), { class: 'question-title', lang }),
      question.body ? rich('div', renderBlock(question.body, resolve), { class: 'question-body', lang }) : null,
      h('p', { class: 'hint muted small' }, t(question.type === 'true-false' ? 'q.tf' : multi ? 'q.multi' : 'q.single')),
      h('div', { class: `answers ${question.type === 'true-false' ? 'tf' : ''}`, role: multi ? 'group' : 'radiogroup', lang }, answers),
      answered
        ? h(
            'div',
            { class: `feedback ${item.result}`, lang },
            h('p', { class: 'verdict' }, t(item.result === 'correct' ? 'q.correct' : 'q.wrong')),
            question.explanation ? h('div', { class: 'explanation' }, h('h3', {}, t('q.explanation')), rich('div', renderBlock(question.explanation, resolve))) : null,
            sourcesView(question.sources, resolve),
          )
        : null,
      h(
        'div',
        { class: 'row actions' },
        answered
          ? h('button', { class: 'button primary', onclick: next, autofocus: true }, t(isLast ? 'q.finish' : 'q.next'))
          : h('button', { class: 'button primary', onclick: validate, disabled: item.selected.length === 0 }, t('q.validate')),
        h('span', { class: 'muted small keys' }, t('q.keys')),
      ),
    ),
  ];
}

document.addEventListener('keydown', (e) => {
  if (state.screen !== 'question' || e.ctrlKey || e.metaKey || e.altKey) return;
  if ((e.target as HTMLElement).closest('input, select, textarea')) return;
  const item = currentItem();
  const resolved = resolveItem(item);
  if (!resolved) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (item.result) next();
    else validate();
    return;
  }
  const n = Number(e.key);
  if (Number.isInteger(n) && n >= 1) {
    const labels = answerLabels(resolved.question, resolved.translation.resolve, item.order);
    if (n <= labels.length) select(labels[n - 1].index);
  }
});

// ---------------------------------------------------------------------------
// Results

function answerText(question: Question, indices: number[], resolve: MediaResolver): string {
  if (!indices.length) return '<em>—</em>';
  if (question.type === 'true-false') return t(indices[0] === 1 ? 'tf.true' : 'tf.false');
  return indices.map((i) => renderInline(question.answers[i].text, resolve)).join('<br>');
}

function resultsView(): HTMLElement[] {
  const session = state.session!;
  const s = score(state.library, session);
  const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
  const mistakes = session.items.filter((i) => i.result !== 'correct');

  return [
    h('h1', {}, t('results.title')),
    h(
      'section',
      { class: 'card score' },
      h('div', { class: 'score-ring', style: `--pct:${pct}` }, h('span', {}, `${pct}%`)),
      h(
        'div',
        {},
        h('p', { class: 'score-text' }, t('results.score', { c: s.correct, n: s.total })),
        h('h3', {}, t('results.byLevel')),
        h(
          'ul',
          { class: 'levels' },
          LEVELS.filter((l) => s.byLevel.has(l)).map((l) => {
            const e = s.byLevel.get(l)!;
            return h(
              'li',
              {},
              h('span', { class: `badge level level-${l}` }, `${l} · ${t(`level.${l}` as MessageKey)}`),
              h('span', { class: 'bar' }, h('span', { style: `width:${(e.correct / e.total) * 100}%` })),
              h('span', {}, `${e.correct} / ${e.total}`),
            );
          }),
        ),
      ),
    ),
    h(
      'div',
      { class: 'row actions' },
      mistakes.length
        ? h(
            'button',
            {
              class: 'button primary',
              onclick: () => {
                state.session = retrySession(state.library, session.config, mistakes);
                go('question');
              },
            },
            t('results.reviewMistakes'),
          )
        : null,
      h(
        'button',
        {
          class: 'button',
          onclick: () => {
            state.session = newSession(state.library, session.config);
            go('question');
          },
        },
        t('results.again'),
      ),
      h('button', { class: 'button ghost', onclick: () => go('config') }, t('results.settings')),
    ),
    mistakes.length
      ? h(
          'section',
          { class: 'card' },
          h('h2', {}, t('results.mistakes')),
          mistakes.map((item) => {
            const r = resolveItem(item);
            if (!r) return null;
            const { question, translation } = r;
            return h(
              'details',
              { class: 'mistake', lang: r.lang },
              h('summary', { html: renderInline(question.title, translation.resolve) }),
              question.body ? rich('div', renderBlock(question.body, translation.resolve), { class: 'question-body' }) : null,
              h(
                'dl',
                {},
                h('dt', {}, t('results.yourAnswer')),
                rich('dd', answerText(question, item.selected, translation.resolve), { class: 'wrong' }),
                h('dt', {}, t('results.expected')),
                rich('dd', answerText(question, expectedAnswers(question), translation.resolve), { class: 'correct' }),
              ),
              question.explanation ? h('div', { class: 'explanation' }, h('h3', {}, t('q.explanation')), rich('div', renderBlock(question.explanation, translation.resolve))) : null,
              sourcesView(question.sources, translation.resolve),
            );
          }),
        )
      : h('p', { class: 'card perfect' }, t('results.perfect')),
  ].filter(Boolean) as HTMLElement[];
}

// ---------------------------------------------------------------------------
// Startup

async function init(): Promise<void> {
  setLanguage(getLanguage());
  const urls = new URLSearchParams(location.search).getAll('quiz');
  render();
  if (urls.length) await runLoad(() => Promise.all(urls.map((u) => loadUrl(state.library, u))));
  state.examples = await fetchExamples();
  if (state.screen === 'home') render();
}

void init();
