import { describe, expect, it } from 'vitest';
import {
  addToHistory,
  clearHistory,
  filesSource,
  MAX_CONTENT_CHARS,
  MAX_ENTRIES,
  readHistory,
  removeFromHistory,
  restoreFiles,
  STORAGE_KEY,
  urlsKey,
  type HistoryEntry,
} from '../src/history';

/** In-memory Storage, optionally refusing values above `quota` characters. */
function fakeStorage(quota = Infinity) {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (v.length > quota) throw new DOMException('quota', 'QuotaExceededError');
      data.set(k, v);
    },
    removeItem: (k: string) => void data.delete(k),
  };
}

const entry = (key: string, extra: Partial<HistoryEntry> = {}): HistoryEntry => ({
  key,
  quizzes: [{ id: key, titles: { en: `Quiz ${key}` }, languages: ['en'], questions: 3 }],
  source: { kind: 'urls', urls: [`https://x.y/${key}.md`] },
  loadedAt: '2026-10-03T12:00:00.000Z',
  ...extra,
});

describe('history', () => {
  it('adds entries newest first, moving a reloaded source to the top', () => {
    const store = fakeStorage();
    addToHistory(entry('a'), store);
    addToHistory(entry('b'), store);
    expect(readHistory(store).map((e) => e.key)).toEqual(['b', 'a']);
    addToHistory(entry('a', { loadedAt: '2026-10-04T00:00:00.000Z' }), store);
    expect(readHistory(store).map((e) => [e.key, e.loadedAt])).toEqual([
      ['a', '2026-10-04T00:00:00.000Z'],
      ['b', '2026-10-03T12:00:00.000Z'],
    ]);
  });

  it(`keeps at most ${MAX_ENTRIES} entries`, () => {
    const store = fakeStorage();
    for (let i = 0; i < MAX_ENTRIES + 5; i++) addToHistory(entry(`q${i}`), store);
    const keys = readHistory(store).map((e) => e.key);
    expect(keys).toHaveLength(MAX_ENTRIES);
    expect(keys[0]).toBe(`q${MAX_ENTRIES + 4}`);
  });

  it('removes and clears entries', () => {
    const store = fakeStorage();
    addToHistory(entry('a'), store);
    addToHistory(entry('b'), store);
    expect(removeFromHistory('a', store).map((e) => e.key)).toEqual(['b']);
    clearHistory(store);
    expect(readHistory(store)).toEqual([]);
  });

  it('ignores corrupted or missing storage', () => {
    const store = fakeStorage();
    store.data.set(STORAGE_KEY, '{not json');
    expect(readHistory(store)).toEqual([]);
    expect(readHistory(null)).toEqual([]);
    expect(addToHistory(entry('a'), null).map((e) => e.key)).toEqual(['a']);
  });

  it('drops stored file contents, then old entries, when the quota is exceeded', () => {
    const store = fakeStorage(1500);
    const withFile = entry('f', { source: { kind: 'files', names: ['big.md'], files: [{ name: 'big.md', data: 'x'.repeat(1000), encoding: 'text' }] } });
    addToHistory(withFile, store);
    expect(readHistory(store)[0].source).toMatchObject({ files: [{ name: 'big.md' }] });
    addToHistory(entry('u', { quizzes: [{ id: 'u', titles: { en: 'y'.repeat(600) }, languages: ['en'], questions: 1 }] }), store);
    const [u, f] = readHistory(store);
    expect(u.key).toBe('u');
    expect(f.source).toEqual({ kind: 'files', names: ['big.md'] }); // content dropped, entry kept
  });

  it('stores dropped files and restores them, text and binary', async () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255]);
    const { key, source } = await filesSource([new File(['---\ntitle: T\n---\n'], 'quiz.md'), new File([bytes], 'media.png')]);
    expect(key).toMatch(/^files:/);
    const restored = restoreFiles(source)!;
    expect(restored.map((f) => f.name)).toEqual(['quiz.md', 'media.png']);
    expect(await restored[0].text()).toBe('---\ntitle: T\n---\n');
    expect([...new Uint8Array(await restored[1].arrayBuffer())]).toEqual([...bytes]);
    expect((await filesSource([new File(['---\ntitle: T\n---\n'], 'quiz.md'), new File([bytes], 'media.png')])).key).toBe(key);
  });

  it('remembers large files without their content', async () => {
    const { source } = await filesSource([new File(['a'.repeat(MAX_CONTENT_CHARS + 1)], 'huge.md')]);
    expect(source).toEqual({ kind: 'files', names: ['huge.md'] });
    expect(restoreFiles(source)).toBeNull();
  });

  it('identifies URL lists by their content and order', () => {
    expect(urlsKey(['a', 'b'])).toBe(urlsKey(['a', 'b']));
    expect(urlsKey(['a', 'b'])).not.toBe(urlsKey(['b', 'a']));
  });
});
