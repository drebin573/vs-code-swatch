import defaultsJson from '../data/defaults.json';
import colorGroupsJson from '../data/color-groups.json';
import type { ColorGroup, ThemeDoc } from './types';

export const defaults = defaultsJson as { dark: Record<string, string | null>; light: Record<string, string | null> };

export const colorGroups = colorGroupsJson as ColorGroup[];

export const allColorKeys: string[] = colorGroups.flatMap((g) => g.keys.map((k) => k.key));

const descriptions = new Map<string, string>();
for (const g of colorGroups) {
  for (const k of g.keys) descriptions.set(k.key, k.description);
}

export function describeKey(key: string): string {
  return descriptions.get(key) ?? '';
}

// Human-readable labels for list rows ("terminal.ansiBrightBlue" → "ANSI Bright
// Blue"), unique within each group so they read well under the group heading.
const ACRONYMS = new Set(['ansi', 'scm', 'ui']);

function keyWords(key: string): string[] {
  return key
    .split('.')
    .flatMap((seg) => seg.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' '))
    .map((w) => w.toLowerCase());
}

function toLabel(words: string[]): string {
  return words.map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).join(' ');
}

const labels = new Map<string, string>();
for (const g of colorGroups) {
  const groupWords = new Set<string>();
  for (const w of g.group.toLowerCase().replace(/colors?$/, '').trim().split(/\s+/)) {
    groupWords.add(w);
    if (w.endsWith('s')) groupWords.add(w.slice(0, -1)); // "Trees" also covers "tree.*"
  }
  const entries = g.keys.map((k) => {
    const words = keyWords(k.key);
    let strip = 0;
    while (strip < words.length - 1 && groupWords.has(words[strip])) strip++;
    return { key: k.key, words, strip };
  });
  // Un-strip colliding labels (editorGroup.border and tab.border would both be
  // "Border" — restore to "Group Border" / "Tab Border") until unique.
  for (;;) {
    const counts = new Map<string, number>();
    for (const e of entries) {
      const l = toLabel(e.words.slice(e.strip));
      counts.set(l, (counts.get(l) ?? 0) + 1);
    }
    const colliding = entries.filter((e) => counts.get(toLabel(e.words.slice(e.strip)))! > 1 && e.strip > 0);
    if (colliding.length === 0) break;
    for (const e of colliding) e.strip--;
  }
  for (const e of entries) labels.set(e.key, toLabel(e.words.slice(e.strip)));
}

export function labelForKey(key: string): string {
  return labels.get(key) ?? key;
}

// Word-split searchable form ("terminal ansi bright blue") so query substrings
// can't span word joints (searching "term" must not hit list.filterMatch…).
const searchTexts = new Map<string, string>();
for (const key of allColorKeys) searchTexts.set(key, keyWords(key).join(' '));

export function searchTextForKey(key: string): string {
  return searchTexts.get(key) ?? key.toLowerCase();
}

// Guard against docs with a missing/unknown type (older persisted state,
// hand-written imports) — never crash the render over it.
function defaultsFor(theme: ThemeDoc): Record<string, string | null> {
  return defaults[theme.type] ?? defaults.dark;
}

/** The color VS Code would actually use for `key`: the theme's value, else the registry default. */
export function resolveColor(theme: ThemeDoc, key: string): string | null {
  return theme.colors[key] ?? defaultsFor(theme)[key] ?? null;
}

/** Full resolved color map for a theme (theme values over registry defaults). */
export function resolveAllColors(theme: ThemeDoc): Record<string, string | null> {
  const out: Record<string, string | null> = { ...defaultsFor(theme) };
  for (const [key, value] of Object.entries(theme.colors)) out[key] = value;
  return out;
}
