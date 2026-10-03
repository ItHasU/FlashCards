/**
 * History of the quizzes loaded in this browser, kept in localStorage.
 * Quizzes loaded from URLs are reloaded from their URLs; dropped files are stored with their
 * content when it fits, so that they can be reopened without the original files.
 */

export interface StoredFile {
  name: string;
  /** File content: text for Markdown, base64 for anything else (zip, images…). */
  data: string;
  encoding: 'text' | 'base64';
}

export type HistorySource = { kind: 'urls'; urls: string[] } | { kind: 'files'; names: string[]; files?: StoredFile[] };

export interface HistoryEntry {
  /** Identifies the source, so that loading the same quizzes again moves the entry to the top. */
  key: string;
  /** Quiz titles per language, one map per quiz. */
  quizzes: { id: string; titles: Record<string, string>; languages: string[]; questions: number }[];
  source: HistorySource;
  loadedAt: string;
}

export const STORAGE_KEY = 'flashcards.history';
export const MAX_ENTRIES = 20;
/** Above this total size (in characters), dropped files are remembered without their content. */
export const MAX_CONTENT_CHARS = 1_500_000;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // access denied (privacy settings, sandboxed iframe…)
  }
}

export function readHistory(store: StorageLike | null = storage()): HistoryEntry[] {
  try {
    const raw = store?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]).filter((e) => e && typeof e.key === 'string' && Array.isArray(e.quizzes)) : [];
  } catch {
    return [];
  }
}

/** Writes the entries, dropping file contents then old entries until it fits in the quota. */
function writeHistory(entries: HistoryEntry[], store: StorageLike | null): HistoryEntry[] {
  if (!store) return entries;
  let list = entries.slice(0, MAX_ENTRIES);
  for (;;) {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(list));
      return list;
    } catch {
      // Drop the content of the oldest entry that has one, else the oldest entry.
      let heavy = -1;
      for (let i = list.length - 1; i >= 0; i--) {
        const src = list[i].source;
        if (src.kind === 'files' && src.files) {
          heavy = i;
          break;
        }
      }
      if (heavy >= 0) {
        const src = list[heavy].source as Extract<HistorySource, { kind: 'files' }>;
        list = list.map((x, i) => (i === heavy ? { ...x, source: { kind: 'files', names: src.names } } : x));
      } else if (list.length > 1) list = list.slice(0, -1);
      else return list;
    }
  }
}

export function addToHistory(entry: HistoryEntry, store: StorageLike | null = storage()): HistoryEntry[] {
  const others = readHistory(store).filter((e) => e.key !== entry.key);
  return writeHistory([entry, ...others], store);
}

export function removeFromHistory(key: string, store: StorageLike | null = storage()): HistoryEntry[] {
  return writeHistory(
    readHistory(store).filter((e) => e.key !== key),
    store,
  );
}

export function clearHistory(store: StorageLike | null = storage()): void {
  try {
    store?.removeItem(STORAGE_KEY);
  } catch {
    // nothing to do
  }
}

/** Short, stable fingerprint of a string (FNV-1a). */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function urlsKey(urls: string[]): string {
  return `urls:${fingerprint(urls.join('\n'))}`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function fromBase64(data: string): Uint8Array<ArrayBuffer> {
  const binary = atob(data);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Describes dropped files for the history, with their content when small enough. */
export async function filesSource(files: File[]): Promise<{ key: string; source: HistorySource }> {
  const stored: StoredFile[] = [];
  for (const f of files) {
    if (/\.md$/i.test(f.name)) stored.push({ name: f.name, data: await f.text(), encoding: 'text' });
    else stored.push({ name: f.name, data: toBase64(new Uint8Array(await f.arrayBuffer())), encoding: 'base64' });
  }
  const names = files.map((f) => f.name);
  const key = `files:${fingerprint(stored.map((s) => `${s.name}\n${s.data}`).join('\n'))}`;
  const size = stored.reduce((n, s) => n + s.data.length, 0);
  return { key, source: size <= MAX_CONTENT_CHARS ? { kind: 'files', names, files: stored } : { kind: 'files', names } };
}

/** Rebuilds File objects from a history entry, or null when the content was not stored. */
export function restoreFiles(source: HistorySource): File[] | null {
  if (source.kind !== 'files' || !source.files) return null;
  return source.files.map((s) => (s.encoding === 'text' ? new File([s.data], s.name, { type: 'text/markdown' }) : new File([fromBase64(s.data)], s.name)));
}
