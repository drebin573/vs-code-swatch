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
