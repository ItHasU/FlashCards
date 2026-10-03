import { validateTranslations, type Issue, type Question, type QuizFile } from '../../format/src';

/** Turns a link or image target found in a quiz file into a URL the browser can load. */
export type MediaResolver = (target: string) => string | undefined;

export interface Translation {
  quiz: QuizFile;
  resolve: MediaResolver;
  /** Question ids whose translation is inconsistent with the reference language. */
  excluded: Set<string>;
}

export interface QuizBundle {
  id: string;
  /** Keyed by language. */
  translations: Map<string, Translation>;
  /** Language of the first loaded file; used when a question is missing in the requested one. */
  defaultLang: string;
  /** Union of question ids across translations, in authoring order. */
  questionIds: string[];
}

export interface ResolvedQuestion {
  question: Question;
  translation: Translation;
  lang: string;
}

export class Library {
  readonly bundles = new Map<string, QuizBundle>();
  issues: Issue[] = [];
  private loadIssues: Issue[] = [];

  add(quiz: QuizFile, resolve: MediaResolver, issues: Issue[] = []): void {
    this.loadIssues.push(...issues);
    const lang = quiz.meta.language;
    let bundle = this.bundles.get(quiz.meta.id);
    if (!bundle) {
      bundle = { id: quiz.meta.id, translations: new Map(), defaultLang: lang, questionIds: [] };
      this.bundles.set(bundle.id, bundle);
    }
    // Loading the same quiz/language again replaces the previous file.
    bundle.translations.set(lang, { quiz, resolve, excluded: new Set() });
    this.refresh(bundle);
  }

  addIssues(issues: Issue[]): void {
    this.loadIssues.push(...issues);
    this.issues = [...this.loadIssues, ...this.translationIssues()];
  }

  clear(): void {
    this.bundles.clear();
    this.loadIssues = [];
    this.issues = [];
  }

  private translationIssueMap = new Map<string, Issue[]>();

  private translationIssues(): Issue[] {
    return [...this.translationIssueMap.values()].flat();
  }

  private refresh(bundle: QuizBundle): void {
    const translations = [...bundle.translations.values()];
    const ordered = [bundle.translations.get(bundle.defaultLang)!, ...translations.filter((t) => t.quiz.meta.language !== bundle.defaultLang)];
    const issues = validateTranslations(ordered.map((t) => t.quiz));
    for (const tr of translations) {
      tr.excluded = new Set(
        issues.filter((i) => i.severity === 'error' && i.questionId && i.file === tr.quiz.path).map((i) => i.questionId!),
      );
    }
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const tr of ordered)
      for (const q of tr.quiz.questions)
        if (!seen.has(q.id)) {
          seen.add(q.id);
          ids.push(q.id);
        }
    bundle.questionIds = ids;
    this.translationIssueMap.set(bundle.id, issues);
    this.issues = [...this.loadIssues, ...this.translationIssues()];
  }

  /** Finds a question in the requested language, falling back to the quiz's default language. */
  question(quizId: string, questionId: string, lang: string): ResolvedQuestion | undefined {
    const bundle = this.bundles.get(quizId);
    if (!bundle) return undefined;
    const candidates = [
      lang,
      ...[...bundle.translations.keys()].filter((l) => l !== lang && l.split('-')[0] === lang.split('-')[0]),
      bundle.defaultLang,
      ...bundle.translations.keys(),
    ];
    for (const l of candidates) {
      const tr = bundle.translations.get(l);
      if (!tr || tr.excluded.has(questionId)) continue;
      const question = tr.quiz.questions.find((q) => q.id === questionId);
      if (question) return { question, translation: tr, lang: l };
    }
    return undefined;
  }

  /** Quiz title and description in the requested language (or the closest available). */
  meta(quizId: string, lang: string): QuizFile['meta'] {
    const bundle = this.bundles.get(quizId)!;
    const tr =
      bundle.translations.get(lang) ??
      [...bundle.translations.values()].find((t) => t.quiz.meta.language.split('-')[0] === lang.split('-')[0]) ??
      bundle.translations.get(bundle.defaultLang)!;
    return tr.quiz.meta;
  }

  /** All content languages available across loaded quizzes. */
  languages(): string[] {
    return [...new Set([...this.bundles.values()].flatMap((b) => [...b.translations.keys()]))];
  }
}
