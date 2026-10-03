import './style.css';
import { LEVELS, QUESTION_TYPES, type Issue, type Level, type Question, type QuestionType, type Source } from '../../format/src';
import { h, rich } from './dom';
import { getLanguage, languageName, setLanguage, t, UI_LANGUAGES, type MessageKey } from './i18n';
import { Library, type MediaResolver } from './library';
import { loadFiles, loadUrl, loadUrls, type LoadSummary } from './loader';
import { renderBlock, renderInline } from './markdown';
import {
  candidates,
  expectedAnswers,
  isCorrect,
  MODES,
  newSession,
  outcome,
  POINTS,
  QUIZ_SIZE,
  retrySession,
  scheduleComeback,
  score,
  trainingProgress,
  type Candidate,
  type Config,
  type Item,
  type Mode,
  type Outcome,
  type Session,
} from './session';

type Screen = 'home' | 'config' | 'reading' | 'question' | 'results';

const state = {
  screen: 'home' as Screen,
  library: new Library(),
  config: undefined as Config | undefined,
  session: undefined as Session | undefined,
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
    reading: readingView,
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
    state.config = { quizIds: ids, levels: [...LEVELS], types: [...QUESTION_TYPES], tags: [], mode: 'quiz' };
    return;
  }
  const known = new Set(state.config.quizIds);
  state.config.quizIds = [...state.config.quizIds.filter((id) => state.library.bundles.has(id)), ...ids.filter((id) => !known.has(id))];
}

function configView(): HTMLElement[] {
  const config = state.config!;
  const lang = getLanguage();

  const availableEl = h('p', { class: 'available' });
  const startBtn = h('button', { class: 'button primary big', onclick: start }, t('config.start'));

  function update(): void {
    const n = candidates(state.library, config).length;
    availableEl.textContent = n ? t('config.available', { n }) : t('config.none');
    availableEl.classList.toggle('warning', n === 0);
    startBtn.disabled = n === 0;
  }

  function start(): void {
    if (config.mode === 'read') {
      go('reading');
      return;
    }
    state.session = newSession(state.library, { ...config });
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

  const chips = <T extends string | number>(legend: string, values: readonly T[], get: () => T[], label: (v: T) => string, set: (v: T[]) => void, hint?: string) =>
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
              checked: get().includes(v),
              onchange: (e: Event) => {
                set(toggle(get(), v, (e.target as HTMLInputElement).checked));
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
      h(
        'fieldset',
        {},
        h('legend', {}, t('config.mode')),
        h(
          'div',
          { class: 'modes', role: 'radiogroup' },
          MODES.map((mode) =>
            h(
              'label',
              { class: 'mode-choice' },
              h('input', {
                type: 'radio',
                name: 'mode',
                value: mode,
                checked: config.mode === mode,
                onchange: () => {
                  config.mode = mode;
                  render();
                },
              }),
              h('span', {}, h('strong', {}, t(`mode.${mode}` as MessageKey)), h('span', { class: 'muted small' }, t(`mode.${mode}.help` as MessageKey, { n: QUIZ_SIZE }))),
            ),
          ),
        ),
        config.mode === 'quiz' ? h('p', { class: 'muted small' }, t('config.scoring')) : null,
      ),
      chips(t('config.levels'), LEVELS, () => config.levels, (l) => `${l} · ${t(`level.${l}` as MessageKey)}`, (v) => (config.levels = v as Level[])),
      chips(t('config.types'), QUESTION_TYPES, () => config.types, (ty) => t(`type.${ty}` as MessageKey), (v) => (config.types = v as QuestionType[])),
      tags.length ? chips(t('config.tags'), tags, () => config.tags, (tag) => tag, (v) => (config.tags = v), t('config.tagsHint')) : null,
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

function sourcesView(sources: Source[], resolve: MediaResolver, title = t('q.sources')): HTMLElement {
  return h(
    'div',
    { class: 'sources' },
    h('h3', {}, title),
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
  if (item.result || item.skipped) return;
  const resolved = resolveItem(item);
  if (!resolved) return;
  const multi = resolved.question.type === 'mcq' && resolved.question.answers.filter((a) => a.correct).length > 1;
  if (multi) item.selected = item.selected.includes(index) ? item.selected.filter((i) => i !== index) : [...item.selected, index];
  else item.selected = [index];
  render();
}

function mode(): Mode {
  return state.session!.config.mode;
}

/** Records the answer. In a quiz the correction stays hidden until the end and the session moves on. */
function submit(): void {
  const item = currentItem();
  const resolved = resolveItem(item);
  if (!resolved || item.result || item.skipped || !item.selected.length) return;
  item.result = isCorrect(resolved.question, item.selected) ? 'correct' : 'wrong';
  if (mode() === 'quiz') {
    next();
    return;
  }
  render();
  document.querySelector('.feedback')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Quiz: shows the sources of the question as a hint. The user still has to answer, for fewer points. */
function showHint(): void {
  const item = currentItem();
  if (item.result || item.hinted) return;
  item.hinted = true;
  render();
  document.querySelector('.hint-box')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Training: skips the question and shows its answer; it will come back later. */
function skip(): void {
  const item = currentItem();
  if (item.result || item.skipped) return;
  item.skipped = true;
  render();
  document.querySelector('.feedback')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Whether the correction of the current question is on screen (training only). */
function correctionShown(item: Item): boolean {
  return mode() === 'training' && (item.result !== undefined || item.skipped === true);
}

function next(): void {
  const session = state.session!;
  if (mode() === 'training') scheduleComeback(state.library, session);
  if (session.index < session.items.length - 1) {
    session.index++;
    go('question');
  } else go('results');
}

function resolveItem(item: Item) {
  return state.library.question(item.quizId, item.questionId, getLanguage());
}

function signed(points: number): string {
  return points > 0 ? `+${points}` : points < 0 ? `−${-points}` : '0';
}

/** Verdict of a question: with points in a quiz, without in training. */
function outcomeView(item: Item, withPoints: boolean): HTMLElement {
  const o = outcome(item);
  const label = item.skipped ? t('q.skipped') : o === 'unanswered' ? t('outcome.unanswered') : t(item.result === 'correct' ? 'q.correct' : 'q.wrong');
  return h(
    'p',
    { class: 'verdict' },
    label,
    item.hinted ? ` ${t('q.withHint')}` : '',
    withPoints ? [' ', h('span', { class: 'points' }, t('q.points', { p: signed(POINTS[o]) }))] : null,
  );
}

function correctionView(question: Question, resolve: MediaResolver): HTMLElement[] {
  return [
    question.explanation ? h('div', { class: 'explanation' }, h('h3', {}, t('q.explanation')), rich('div', renderBlock(question.explanation, resolve))) : null,
    sourcesView(question.sources, resolve),
  ].filter(Boolean) as HTMLElement[];
}

function metaView(question: Question, quizId: string, showQuiz: boolean): HTMLElement {
  return h(
    'div',
    { class: 'meta' },
    h('span', { class: `badge level level-${question.level}` }, `${question.level} · ${t(`level.${question.level}` as MessageKey)}`),
    showQuiz ? h('span', { class: 'badge' }, state.library.meta(quizId, getLanguage()).title) : null,
    ...question.tags.map((tag) => h('span', { class: 'tag' }, `#${tag}`)),
  );
}

function fallbackView(lang: string): HTMLElement | null {
  const ui = getLanguage();
  return lang !== ui && lang.split('-')[0] !== ui.split('-')[0]
    ? h('p', { class: 'fallback muted small' }, t('q.fallback', { lang: languageName(ui, ui), other: languageName(lang, ui) }))
    : null;
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
  const training = session.config.mode === 'training';
  const shown = correctionShown(item);
  const done = item.result !== undefined || item.skipped === true;
  const expected = expectedAnswers(question);
  const multi = question.type === 'mcq' && expected.length > 1;
  const quizCount = new Set(session.items.map((i) => i.quizId)).size;

  const answers = answerLabels(question, resolve, item.order).map(({ index, html }, k) => {
    const selected = item.selected.includes(index);
    const classes = ['answer'];
    if (selected) classes.push('selected');
    if (shown && expected.includes(index)) classes.push(selected && !item.skipped ? 'correct' : 'missed');
    if (shown && selected && !item.skipped && !expected.includes(index)) classes.push('wrong');
    return h(
      'button',
      {
        class: classes.join(' '),
        role: multi ? 'checkbox' : 'radio',
        'aria-checked': String(selected),
        disabled: done,
        onclick: () => select(index),
      },
      h('span', { class: 'key', 'aria-hidden': 'true' }, String(k + 1)),
      rich('span', html, { class: 'answer-text' }),
    );
  });

  // Training ends when the last scheduled question is answered correctly (a miss schedules a comeback).
  const isLast = session.index === session.items.length - 1 && (!training || item.result === 'correct');
  const nextLabel = t(isLast ? 'q.finish' : 'q.next');
  let progressLabel: string;
  let progress: number;
  if (training) {
    const p = trainingProgress(session);
    progressLabel = t('q.mastered', { m: p.mastered, n: p.total });
    progress = (p.mastered / p.total) * 100;
  } else {
    progressLabel = t('q.progress', { i: session.index + 1, n: session.items.length });
    progress = ((session.index + (done ? 1 : 0)) / session.items.length) * 100;
  }

  let actions: (HTMLElement | null)[];
  if (shown) actions = [h('button', { class: 'button primary', onclick: next, autofocus: true }, nextLabel)];
  else if (training)
    actions = [
      h('button', { class: 'button primary', onclick: submit, disabled: item.selected.length === 0 }, t('q.validate')),
      h('button', { class: 'button ghost skip-button', onclick: skip }, t('q.skip')),
    ];
  else
    actions = [
      h('button', { class: 'button primary', onclick: submit, disabled: item.selected.length === 0 }, nextLabel),
      item.hinted ? null : h('button', { class: 'button ghost hint-button', onclick: showHint }, t('q.hint')),
    ];

  return [
    h(
      'div',
      { class: 'question-top' },
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': Math.round(progress), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('span', { style: `width:${progress}%` })),
      h(
        'div',
        { class: 'row spread' },
        h('span', { class: 'muted progress-label' }, progressLabel),
        training && item.attempt > 1 ? h('span', { class: 'badge comeback' }, t('q.comeback')) : null,
        h('button', { class: 'button ghost small', onclick: () => go('results') }, t(training ? 'q.stop' : 'q.quit')),
      ),
    ),
    h(
      'article',
      { class: 'card question' },
      metaView(question, item.quizId, quizCount > 1),
      fallbackView(lang),
      rich('h2', renderInline(question.title, resolve), { class: 'question-title', lang }),
      question.body ? rich('div', renderBlock(question.body, resolve), { class: 'question-body', lang }) : null,
      h('p', { class: 'hint muted small' }, t(question.type === 'true-false' ? 'q.tf' : multi ? 'q.multi' : 'q.single')),
      h('div', { class: `answers ${question.type === 'true-false' ? 'tf' : ''}`, role: multi ? 'group' : 'radiogroup', lang }, answers),
      item.hinted && !done
        ? h('div', { class: 'hint-box', lang }, h('p', { class: 'hint-used small' }, t('q.hintUsed')), sourcesView(question.sources, resolve, t('q.hintTitle')))
        : null,
      shown ? h('div', { class: `feedback ${item.skipped ? 'skipped' : item.result}`, lang }, outcomeView(item, false), correctionView(question, resolve)) : null,
      h('div', { class: 'row actions' }, actions, h('span', { class: 'muted small keys' }, t('q.keys'))),
    ),
  ];
}

document.addEventListener('keydown', (e) => {
  if (state.screen !== 'question' || e.ctrlKey || e.metaKey || e.altKey) return;
  if ((e.target as HTMLElement).closest('input, select, textarea, button.hint-button, button.skip-button')) return;
  const item = currentItem();
  const resolved = resolveItem(item);
  if (!resolved) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (correctionShown(item)) next();
    else submit();
    return;
  }
  const n = Number(e.key);
  if (Number.isInteger(n) && n >= 1) {
    const labels = answerLabels(resolved.question, resolved.translation.resolve, item.order);
    if (n <= labels.length) select(labels[n - 1].index);
  }
});

// ---------------------------------------------------------------------------
// Reading

function readingAnswers(question: Question, resolve: MediaResolver): HTMLElement {
  if (question.type === 'true-false')
    return h('p', { class: 'reading-tf' }, h('span', { class: 'muted' }, `${t('results.expected')} : `), h('strong', { class: 'correct' }, t(question.answer ? 'tf.true' : 'tf.false')));
  return h(
    'ul',
    { class: 'reading-answers' },
    question.answers.map((a) =>
      h('li', { class: a.correct ? 'correct' : 'wrong' }, h('span', { class: 'mark', 'aria-label': t(a.correct ? 'read.correct' : 'read.wrong') }, a.correct ? '✓' : '✗'), rich('span', renderBlock(a.text, resolve), { class: 'answer-text' })),
    ),
  );
}

function readingView(): HTMLElement[] {
  const config = state.config!;
  const list: Candidate[] = candidates(state.library, config);
  const quizCount = new Set(list.map((c) => c.quizId)).size;
  return [
    h('div', { class: 'row spread reading-top' }, h('h1', {}, t('read.title', { n: list.length })), h('button', { class: 'button ghost', onclick: () => go('config') }, t('results.settings'))),
    ...list.map((c) => {
      const r = state.library.question(c.quizId, c.question.id, getLanguage());
      if (!r) return h('span');
      const { question, translation, lang } = r;
      return h(
        'article',
        { class: 'card question reading', lang },
        metaView(question, c.quizId, quizCount > 1),
        fallbackView(lang),
        rich('h2', renderInline(question.title, translation.resolve), { class: 'question-title' }),
        question.body ? rich('div', renderBlock(question.body, translation.resolve), { class: 'question-body' }) : null,
        readingAnswers(question, translation.resolve),
        correctionView(question, translation.resolve),
      );
    }),
  ];
}

// ---------------------------------------------------------------------------
// Results

function answerText(question: Question, indices: number[], resolve: MediaResolver): string {
  if (!indices.length) return '<em>—</em>';
  if (question.type === 'true-false') return t(indices[0] === 1 ? 'tf.true' : 'tf.false');
  return indices.map((i) => renderInline(question.answers[i].text, resolve)).join('<br>');
}

function resultsView(): HTMLElement[] {
  return state.session!.config.mode === 'training' ? trainingResultsView() : quizResultsView();
}

function reviewItem(item: Item, withPoints: boolean): HTMLElement | null {
  const r = resolveItem(item);
  if (!r) return null;
  const { question, translation } = r;
  return h(
    'details',
    { class: `mistake outcome-${outcome(item)}`, lang: r.lang },
    h(
      'summary',
      {},
      h('span', { class: 'summary-title', html: renderInline(question.title, translation.resolve) }),
      withPoints ? h('span', { class: 'points' }, signed(POINTS[outcome(item)])) : null,
    ),
    question.body ? rich('div', renderBlock(question.body, translation.resolve), { class: 'question-body' }) : null,
    h(
      'dl',
      {},
      withPoints
        ? [
            h('dt', {}, t('results.yourAnswer')),
            rich('dd', answerText(question, item.selected, translation.resolve) + (item.hinted ? ` <em class="muted">${t('q.withHint')}</em>` : ''), {
              class: item.result === 'correct' ? 'correct' : 'wrong',
            }),
          ]
        : null,
      h('dt', {}, t('results.expected')),
      rich('dd', answerText(question, expectedAnswers(question), translation.resolve), { class: 'correct' }),
    ),
    correctionView(question, translation.resolve),
  );
}

function trainingResultsView(): HTMLElement[] {
  const session = state.session!;
  const p = trainingProgress(session);
  const finished = p.mastered === p.total;
  const seen = new Set<string>();
  const retried = session.items.filter((i) => {
    const key = `${i.quizId}/${i.questionId}`;
    if (i.attempt < 2 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [
    h('h1', {}, t(finished ? 'train.done' : 'train.stopped')),
    h(
      'section',
      { class: 'card score' },
      h('div', { class: 'score-ring', style: `--pct:${Math.round((p.mastered / p.total) * 100)}` }, h('span', {}, `${p.mastered}/${p.total}`)),
      h(
        'ul',
        { class: 'outcomes' },
        h('li', { class: 'outcome-correct' }, h('span', {}, t('train.mastered')), h('strong', {}, String(p.mastered)), h('span')),
        h('li', {}, h('span', {}, t('train.firstTry')), h('strong', {}, String(p.firstTry)), h('span')),
        h('li', { class: 'outcome-wrong' }, h('span', {}, t('train.retried')), h('strong', {}, String(p.retried)), h('span')),
      ),
    ),
    h(
      'div',
      { class: 'row actions' },
      h(
        'button',
        {
          class: 'button primary',
          onclick: () => {
            state.session = newSession(state.library, session.config);
            go('question');
          },
        },
        t('train.again'),
      ),
      h('button', { class: 'button ghost', onclick: () => go('config') }, t('results.settings')),
    ),
    retried.length ? h('section', { class: 'card' }, h('h2', {}, t('train.review')), retried.map((item) => reviewItem(item, false))) : null,
  ].filter(Boolean) as HTMLElement[];
}

function quizResultsView(): HTMLElement[] {
  const session = state.session!;
  const s = score(state.library, session);
  const pct = s.maxPoints ? Math.round((Math.max(0, s.points) / s.maxPoints) * 100) : 0;
  const toRetry = session.items.filter((i) => outcome(i) !== 'correct');
  const outcomes: Outcome[] = ['correct', 'correctWithHint', 'wrong', 'wrongWithHint', 'unanswered'];

  return [
    h('h1', {}, t('results.title')),
    h(
      'section',
      { class: 'card score' },
      h('div', { class: 'score-ring', style: `--pct:${pct}` }, h('span', {}, String(s.points))),
      h(
        'div',
        {},
        h('p', { class: 'score-text' }, t('results.points', { p: s.points, max: s.maxPoints })),
        h(
          'ul',
          { class: 'outcomes' },
          outcomes
            .filter((o) => s.counts[o] > 0 || o === 'correct' || o === 'wrong')
            .map((o) =>
              h('li', { class: `outcome-${o}` }, h('span', {}, t(`outcome.${o}` as MessageKey)), h('strong', {}, String(s.counts[o])), h('span', { class: 'muted' }, t('q.points', { p: signed(s.counts[o] * POINTS[o]) }))),
            ),
        ),
        h('p', { class: 'muted small' }, t('config.scoring')),
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
              h('span', { class: 'bar' }, h('span', { style: `width:${(Math.max(0, e.points) / e.maxPoints) * 100}%` })),
              h('span', {}, `${e.points} / ${e.maxPoints}`),
            );
          }),
        ),
      ),
    ),
    h(
      'div',
      { class: 'row actions' },
      toRetry.length
        ? h(
            'button',
            {
              class: 'button primary',
              onclick: () => {
                state.session = retrySession(state.library, session.config, toRetry);
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
    s.points === s.maxPoints ? h('p', { class: 'card perfect' }, t('results.perfect')) : null,
    session.items.length
      ? h(
          'section',
          { class: 'card' },
          h('h2', {}, t('results.correction')),
          session.items.map((item) => reviewItem(item, true)),
        )
      : null,
  ].filter(Boolean) as HTMLElement[];
}

// ---------------------------------------------------------------------------
// Startup

async function init(): Promise<void> {
  setLanguage(getLanguage());
  const urls = new URLSearchParams(location.search).getAll('quiz');
  render();
  if (urls.length) await runLoad(() => loadUrls(state.library, urls));
}

void init();
