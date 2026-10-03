const en = {
  'app.tagline': 'Revise with quizzes generated from your documents.',
  'lang.label': 'Language',
  'nav.home': 'Home',

  'load.title': 'Load quizzes',
  'load.drop': 'Drop .md or .zip quiz files here',
  'load.or': 'or',
  'load.choose': 'Choose files',
  'load.url': 'Load from a URL',
  'load.urlPlaceholder': 'https://…/quiz.md or .zip',
  'load.urlButton': 'Load',
  'load.examples': 'Try an example',
  'load.loading': 'Loading…',
  'load.failed': 'Could not load {name}: {error}',
  'load.nothing': 'No usable quiz was found in these files.',
  'load.privacy': 'Files stay in your browser: nothing is uploaded.',

  'issues.title': '{n} problem(s) found while loading',
  'issues.error': 'Error',
  'issues.warning': 'Warning',
  'issues.line': 'line {n}',

  'config.title': 'Prepare your session',
  'config.quizzes': 'Quizzes',
  'config.questionsCount': '{n} questions',
  'config.languages': 'Languages: {list}',
  'config.levels': 'Levels',
  'config.types': 'Question types',
  'config.tags': 'Topics',
  'config.tagsHint': 'None selected = all topics',
  'config.count': 'Number of questions',
  'config.available': '{n} matching questions',
  'config.start': 'Start',
  'config.none': 'No question matches these filters.',
  'config.add': 'Add quizzes',
  'config.clear': 'Unload all',

  'level.1': 'Discovery',
  'level.2': 'Understanding',
  'level.3': 'Mastery',
  'type.mcq': 'Multiple choice',
  'type.true-false': 'True / false',

  'q.progress': 'Question {i} of {n}',
  'q.single': 'Choose one answer.',
  'q.multi': 'Several answers are correct: select all of them.',
  'q.tf': 'True or false?',
  'q.validate': 'Check',
  'q.next': 'Next question',
  'q.finish': 'See results',
  'q.quit': 'End session',
  'q.correct': 'Correct!',
  'q.wrong': 'Not quite.',
  'q.explanation': 'Explanation',
  'q.sources': 'Sources',
  'q.fallback': 'Not available in {lang}: shown in {other}.',
  'q.keys': 'Keyboard: 1–9 to select, Enter to confirm.',
  'tf.true': 'True',
  'tf.false': 'False',

  'source.link': 'Link',
  'source.excerpt': 'Excerpt',
  'source.image': 'Image',
  'source.code': 'Code',
  'media.missing': 'Missing file: {path}',

  'results.title': 'Results',
  'results.score': '{c} correct answers out of {n}',
  'results.byLevel': 'By level',
  'results.mistakes': 'Questions to review',
  'results.perfect': 'Perfect score, well done!',
  'results.yourAnswer': 'Your answer',
  'results.expected': 'Expected answer',
  'results.reviewMistakes': 'Retry my mistakes',
  'results.again': 'New draw, same settings',
  'results.settings': 'Change settings',
};

export type MessageKey = keyof typeof en;
type Dictionary = Record<MessageKey, string>;

const fr: Dictionary = {
  'app.tagline': 'Révisez avec des quiz générés à partir de vos documents.',
  'lang.label': 'Langue',
  'nav.home': 'Accueil',

  'load.title': 'Charger des quiz',
  'load.drop': 'Déposez ici vos fichiers de quiz .md ou .zip',
  'load.or': 'ou',
  'load.choose': 'Choisir des fichiers',
  'load.url': 'Charger depuis une URL',
  'load.urlPlaceholder': 'https://…/quiz.md ou .zip',
  'load.urlButton': 'Charger',
  'load.examples': 'Essayer un exemple',
  'load.loading': 'Chargement…',
  'load.failed': 'Impossible de charger {name} : {error}',
  'load.nothing': 'Aucun quiz utilisable dans ces fichiers.',
  'load.privacy': 'Les fichiers restent dans votre navigateur : rien n’est envoyé.',

  'issues.title': '{n} problème(s) détecté(s) au chargement',
  'issues.error': 'Erreur',
  'issues.warning': 'Avertissement',
  'issues.line': 'ligne {n}',

  'config.title': 'Préparer la session',
  'config.quizzes': 'Quiz',
  'config.questionsCount': '{n} questions',
  'config.languages': 'Langues : {list}',
  'config.levels': 'Niveaux',
  'config.types': 'Types de questions',
  'config.tags': 'Thèmes',
  'config.tagsHint': 'Aucun sélectionné = tous les thèmes',
  'config.count': 'Nombre de questions',
  'config.available': '{n} questions correspondantes',
  'config.start': 'Commencer',
  'config.none': 'Aucune question ne correspond à ces filtres.',
  'config.add': 'Ajouter des quiz',
  'config.clear': 'Tout décharger',

  'level.1': 'Découverte',
  'level.2': 'Compréhension',
  'level.3': 'Maîtrise',
  'type.mcq': 'QCM',
  'type.true-false': 'Vrai / faux',

  'q.progress': 'Question {i} sur {n}',
  'q.single': 'Choisissez une réponse.',
  'q.multi': 'Plusieurs réponses sont correctes : sélectionnez-les toutes.',
  'q.tf': 'Vrai ou faux ?',
  'q.validate': 'Valider',
  'q.next': 'Question suivante',
  'q.finish': 'Voir les résultats',
  'q.quit': 'Terminer la session',
  'q.correct': 'Bonne réponse !',
  'q.wrong': 'Pas tout à fait.',
  'q.explanation': 'Explication',
  'q.sources': 'Sources',
  'q.fallback': 'Non disponible en {lang} : affichée en {other}.',
  'q.keys': 'Clavier : 1–9 pour choisir, Entrée pour valider.',
  'tf.true': 'Vrai',
  'tf.false': 'Faux',

  'source.link': 'Lien',
  'source.excerpt': 'Extrait',
  'source.image': 'Image',
  'source.code': 'Code',
  'media.missing': 'Fichier introuvable : {path}',

  'results.title': 'Résultats',
  'results.score': '{c} bonnes réponses sur {n}',
  'results.byLevel': 'Par niveau',
  'results.mistakes': 'Questions à revoir',
  'results.perfect': 'Sans faute, bravo !',
  'results.yourAnswer': 'Votre réponse',
  'results.expected': 'Réponse attendue',
  'results.reviewMistakes': 'Retenter mes erreurs',
  'results.again': 'Nouveau tirage, mêmes réglages',
  'results.settings': 'Modifier les réglages',
};

const dictionaries: Record<string, Dictionary> = { en, fr };
export const UI_LANGUAGES = Object.keys(dictionaries);

const STORAGE_KEY = 'flashcards.lang';
let current = initialLanguage();

function initialLanguage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch {
    // Storage unavailable (private mode…): fall back to the browser language.
  }
  const nav = (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase();
  return dictionaries[nav] ? nav : dictionaries[nav.split('-')[0]] ? nav.split('-')[0] : 'en';
}

export function getLanguage(): string {
  return current;
}

export function setLanguage(lang: string): void {
  current = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Not persisted; fine.
  }
}

function dictionary(): Dictionary {
  return dictionaries[current] ?? dictionaries[current.split('-')[0]] ?? en;
}

export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return dictionary()[key].replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

/** Native name of a language ("français", "English"), capitalized. */
export function languageName(lang: string, inLang = lang): string {
  try {
    const name = new Intl.DisplayNames([inLang], { type: 'language' }).of(lang) ?? lang;
    return name.charAt(0).toLocaleUpperCase(inLang) + name.slice(1);
  } catch {
    return lang;
  }
}
