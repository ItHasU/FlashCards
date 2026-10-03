import JSZip from 'jszip';
import { isLocalPath, loadQuiz, resolveMediaPath, type Issue } from '../../format/src';
import type { Library, MediaResolver } from './library';

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  avif: 'image/avif',
  pdf: 'application/pdf',
  txt: 'text/plain',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
};

const hasFrontMatter = (text: string) => /^﻿?---\r?\n/.test(text);
const extension = (name: string) => name.split('.').pop()!.toLowerCase();
const fileName = (path: string) => path.split('/').pop()!;

function blobUrl(data: Blob | ArrayBuffer, name: string): string {
  const type = MIME[extension(name)] ?? 'application/octet-stream';
  return URL.createObjectURL(new Blob([data], { type }));
}

export interface LoadSummary {
  quizzes: number;
  failures: string[];
}

function addText(library: Library, text: string, path: string, resolve: MediaResolver, mediaExists?: (p: string) => boolean): boolean {
  const { quiz, issues } = loadQuiz(text, { path, mediaExists });
  if (quiz) library.add(quiz, resolve, issues);
  else library.addIssues(issues);
  return quiz !== null;
}

/** Resolver for files inside a bundle: local paths map to blob URLs, absolute URLs are kept. */
function bundleResolver(path: string, media: Map<string, string>): MediaResolver {
  return (target) => {
    if (!isLocalPath(target)) return target;
    return media.get(resolveMediaPath(path, target)) ?? media.get(fileName(resolveMediaPath(path, target)));
  };
}

async function loadZip(library: Library, data: Blob | ArrayBuffer, zipName: string): Promise<number> {
  const zip = await JSZip.loadAsync(data);
  const entries = Object.values(zip.files).filter((f) => !f.dir && !f.name.startsWith('__MACOSX/'));
  const media = new Map<string, string>();
  const texts: [string, string][] = [];
  for (const entry of entries) {
    if (entry.name.endsWith('.md')) {
      const text = await entry.async('string');
      if (hasFrontMatter(text)) texts.push([entry.name, text]);
    } else {
      media.set(entry.name, blobUrl(await entry.async('arraybuffer'), entry.name));
    }
  }
  let count = 0;
  for (const [name, text] of texts) {
    const display = `${zipName}:${name}`;
    const prefix = `${zipName}:`;
    const resolve = bundleResolver(name, media);
    const exists = (p: string) => media.has(p.startsWith(prefix) ? p.slice(prefix.length) : p);
    if (addText(library, text, display, (t) => resolve(t), exists)) count++;
  }
  if (texts.length === 0) library.addIssues([{ severity: 'error', message: 'No quiz file in this archive.', file: zipName }]);
  return count;
}

/** Loads files picked or dropped by the user: .md, .zip, and loose media referenced by the .md files. */
export async function loadFiles(library: Library, files: File[]): Promise<LoadSummary> {
  const summary: LoadSummary = { quizzes: 0, failures: [] };
  const loose = new Map<string, string>();
  for (const f of files) if (!/\.(md|zip)$/i.test(f.name)) loose.set(f.name, blobUrl(f, f.name));
  const looseResolver: MediaResolver = (target) => (isLocalPath(target) ? loose.get(fileName(resolveMediaPath(undefined, target))) : target);

  for (const f of files) {
    try {
      if (/\.zip$/i.test(f.name)) summary.quizzes += await loadZip(library, f, f.name);
      else if (/\.md$/i.test(f.name)) {
        if (addText(library, await f.text(), f.name, looseResolver)) summary.quizzes++;
      }
    } catch (e) {
      summary.failures.push(`${f.name}: ${(e as Error).message}`);
    }
  }
  return summary;
}

/** Loads a quiz from a URL (.md, or .zip). Media of a .md are resolved relative to its URL. */
export async function loadUrl(library: Library, url: string): Promise<LoadSummary> {
  const summary: LoadSummary = { quizzes: 0, failures: [] };
  try {
    const absolute = new URL(url, location.href).href;
    const response = await fetch(absolute);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const name = fileName(new URL(absolute).pathname) || absolute;
    const type = response.headers.get('content-type') ?? '';
    if (/\.zip$/i.test(name) || type.includes('zip')) {
      summary.quizzes += await loadZip(library, await response.arrayBuffer(), name);
    } else {
      const resolve: MediaResolver = (target) => new URL(target, absolute).href;
      if (addText(library, await response.text(), name, resolve)) summary.quizzes++;
    }
  } catch (e) {
    summary.failures.push(`${url}: ${(e as Error).message}`);
  }
  return summary;
}

export interface ExampleEntry {
  id: string;
  titles: Record<string, string>;
  files: string[];
}

export async function fetchExamples(): Promise<ExampleEntry[]> {
  try {
    const response = await fetch('examples/index.json');
    if (!response.ok) return [];
    return (await response.json()) as ExampleEntry[];
  } catch {
    return [];
  }
}

export type { Issue };
