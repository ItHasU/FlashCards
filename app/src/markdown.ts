import hljs from 'highlight.js/lib/common';
import MarkdownIt, { type RendererRule } from 'markdown-it';
import { isLocalPath } from '../../format/src';
import { t } from './i18n';
import type { MediaResolver } from './library';

interface Env {
  resolve: MediaResolver;
}

const md = new MarkdownIt({
  html: false, // quiz files may come from anywhere: never render raw HTML
  linkify: true,
  typographer: false,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      } catch {
        // fall through to plain rendering
      }
    }
    return '';
  },
});

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const src = String(token.attrGet('src') ?? '');
  const resolved = (env as unknown as Env).resolve(src);
  if (!resolved) {
    return `<span class="media-missing">${md.utils.escapeHtml(t('media.missing', { path: src }))}</span>`;
  }
  token.attrSet('src', resolved);
  token.attrSet('loading', 'lazy');
  return self.renderToken(tokens, idx, options);
};

const defaultLinkOpen: RendererRule = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = String(token.attrGet('href') ?? '');
  if (isLocalPath(href)) {
    const resolved = (env as unknown as Env).resolve(href);
    if (resolved) token.attrSet('href', resolved);
  }
  if (!href.startsWith('#')) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

export function renderBlock(text: string, resolve: MediaResolver): string {
  return md.render(text, { resolve } satisfies Env);
}

export function renderInline(text: string, resolve: MediaResolver): string {
  return md.renderInline(text, { resolve } satisfies Env);
}
