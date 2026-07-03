import { formatHex, formatHex8, parse } from 'culori';
import type { Palette, PaletteColor } from './types';

/**
 * Pull every color out of arbitrary pasted text: hex codes, rgb()/rgba(),
 * hsl()/hsla(), oklch() — covers CSS variables, Tailwind configs, plain
 * lists, coolors.co URLs. Nearby identifiers become labels.
 */
export function extractFromText(text: string): Palette {
  const colors: PaletteColor[] = [];
  const seen = new Set<string>();

  const add = (raw: string, label?: string) => {
    const parsed = parse(raw);
    if (!parsed) return;
    const hex = parsed.alpha !== undefined && parsed.alpha < 1 ? formatHex8(parsed) : formatHex(parsed);
    if (seen.has(hex)) return;
    seen.add(hex);
    colors.push({ hex, label });
  };

  // coolors.co URLs: /palette/1e1e2e-cdd6f4-f38ba8
  const coolors = /coolors\.co\/(?:palette\/)?((?:[0-9a-fA-F]{6}-?)+)/.exec(text);
  if (coolors) {
    for (const hex of coolors[1].split('-')) add(`#${hex}`);
  }

  const pattern =
    /(?:(--[\w-]+|\$[\w-]+|["']?[\w.-]+["']?)\s*[:=]\s*)?["']?(#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|(?:rgba?|hsla?|oklch|oklab)\([^)]*\))/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const label = m[1]?.replace(/["']/g, '').replace(/^--|^\$/, '');
    add(m[2], label && /[a-zA-Z]/.test(label) ? label : undefined);
  }

  return { colors };
}
