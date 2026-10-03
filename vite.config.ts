import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { parseQuiz } from './format/src';

const EXAMPLES_DIR = resolve(__dirname, 'examples');

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? listFiles(p) : [p];
  });
}

/** One entry per example folder: titles per language and the .md files to load. */
function examplesIndex() {
  return readdirSync(EXAMPLES_DIR)
    .filter((d) => statSync(join(EXAMPLES_DIR, d)).isDirectory())
    .map((d) => {
      const files = readdirSync(join(EXAMPLES_DIR, d)).filter((f) => f.endsWith('.md'));
      const titles: Record<string, string> = {};
      for (const f of files) {
        const { quiz } = parseQuiz(readFileSync(join(EXAMPLES_DIR, d, f), 'utf8'));
        if (quiz) titles[quiz.meta.language] = quiz.meta.title;
      }
      return { id: d, titles, files: files.map((f) => `examples/${d}/${f}`) };
    });
}

const TYPES: Record<string, string> = { '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

/** Serves examples/ in dev and copies it into the build, with a generated index.json. */
function examples(): Plugin {
  return {
    name: 'flashcards-examples',
    configureServer(server) {
      server.middlewares.use('/examples', (req, res, next) => {
        const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
        if (path === '/index.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(examplesIndex()));
          return;
        }
        const file = resolve(EXAMPLES_DIR, '.' + path);
        if (!file.startsWith(EXAMPLES_DIR + sep) || !existsSync(file) || statSync(file).isDirectory()) return next();
        res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
        res.end(readFileSync(file));
      });
    },
    generateBundle() {
      for (const file of listFiles(EXAMPLES_DIR)) {
        this.emitFile({ type: 'asset', fileName: `examples/${relative(EXAMPLES_DIR, file).split(sep).join('/')}`, source: readFileSync(file) });
      }
      this.emitFile({ type: 'asset', fileName: 'examples/index.json', source: JSON.stringify(examplesIndex(), null, 2) });
    },
  };
}

export default defineConfig({
  root: 'app',
  // Relative base: the build works from any sub-path (GitHub Pages project site, any static host).
  base: './',
  build: { outDir: '../dist', emptyOutDir: true },
  plugins: [examples()],
  test: { root: '.', include: ['format/test/**/*.test.ts', 'app/test/**/*.test.ts'] },
});
