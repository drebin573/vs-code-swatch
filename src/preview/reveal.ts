/**
 * "Reveal in preview": preview regions carry data-keys="space separated color
 * keys" (see Workbench). Given a selected key, find the region(s) that
 * illustrate it so the UI can scroll to them and blink the key's color.
 */

export interface RevealMatch {
  els: HTMLElement[];
  /**
   * true when the key itself is illustrated; false when only its family is
   * (e.g. statusBar.debuggingBackground falls back to the statusBar region).
   */
  exact: boolean;
}

function keysOf(el: HTMLElement): string[] {
  return (el.dataset.keys ?? '').split(' ');
}

export function findRevealTargets(root: ParentNode, key: string): RevealMatch | null {
  const tagged = Array.from(root.querySelectorAll<HTMLElement>('[data-keys]'));
  const exact = tagged.filter((el) => keysOf(el).includes(key));
  if (exact.length > 0) return { els: exact, exact: true };
  // Fall back to the key's family so "where even is this?" always has an
  // answer when the region exists: querySelectorAll is document order, so the
  // first match is the outermost region — reveal just that one.
  const family = key.split('.')[0];
  const near = tagged.find((el) => keysOf(el).some((k) => k.split('.')[0] === family));
  return near ? { els: [near], exact: false } : null;
}

/**
 * The "blink" version of a color: pushed hard toward white (or toward black
 * for already-light colors) and made opaque, so exactly the pixels drawn with
 * the color pop — the whole area for a background, just the glyphs for text.
 */
export function flashColor(base: string | null | undefined): string {
  const hex = base?.trim().match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (!hex) return '#7dd3fc';
  const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  const alpha = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1;
  // Alpha-weighted luminance: a faint overlay color reads dark, so brighten it.
  const lum = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * alpha;
  const to = lum < 0.55 ? 255 : 0;
  return '#' + [r, g, b].map((c) => Math.round(c + (to - c) * 0.7).toString(16).padStart(2, '0')).join('');
}
