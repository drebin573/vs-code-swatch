import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { ThemeDoc } from './types';

/** Whole theme compressed into the URL fragment — sharing needs no server. */
export function themeToShareUrl(doc: ThemeDoc): string {
  const encoded = compressToEncodedURIComponent(JSON.stringify(doc));
  return `${location.origin}${location.pathname}#theme=${encoded}`;
}

export function themeFromLocationHash(): ThemeDoc | null {
  const m = /#theme=(.+)$/.exec(location.hash);
  if (!m) return null;
  try {
    const json = decompressFromEncodedURIComponent(m[1]);
    if (!json) return null;
    const doc = JSON.parse(json) as ThemeDoc;
    if (typeof doc.name !== 'string' || typeof doc.colors !== 'object') return null;
    return { ...doc, tokenColors: doc.tokenColors ?? [] };
  } catch {
    return null;
  }
}

export function clearShareHash() {
  history.replaceState(null, '', location.pathname + location.search);
}
