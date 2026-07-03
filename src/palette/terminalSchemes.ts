import { XMLParser } from 'fast-xml-parser';
import { parse as parseYaml } from 'yaml';
import { formatHex, parse as parseColor } from 'culori';
import type { AnsiScheme } from './types';

/**
 * Terminal color scheme parsers. Every format carries semantic ANSI slots,
 * which map 1:1 onto VS Code's terminal.ansi* keys.
 */

function norm(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const c = parseColor(raw.trim()) ?? parseColor(`#${raw.trim()}`);
  return c ? formatHex(c) : undefined;
}

// --- iTerm2 .itermcolors (XML plist) ---------------------------------------

interface PlistDict {
  key: string | string[];
  dict: PlistDict | PlistDict[];
  real?: unknown;
  [k: string]: unknown;
}

export function parseITermColors(xml: string): AnsiScheme {
  const doc = new XMLParser({ ignoreAttributes: true }).parse(xml) as { plist: { dict: PlistDict } };
  const root = doc.plist.dict;
  const keys = Array.isArray(root.key) ? root.key : [root.key];
  const dicts = Array.isArray(root.dict) ? root.dict : [root.dict];

  const componentColor = (d: PlistDict): string | undefined => {
    const ks = Array.isArray(d.key) ? d.key : [d.key];
    const reals = Array.isArray(d.real) ? d.real : [d.real];
    const comp: Record<string, number> = {};
    ks.forEach((k, i) => {
      if (typeof reals[i] === 'number') comp[k as string] = reals[i] as number;
    });
    if (comp['Red Component'] === undefined) return undefined;
    const to255 = (v: number) => Math.round(Math.min(Math.max(v, 0), 1) * 255);
    const hex = (v: number) => to255(v).toString(16).padStart(2, '0');
    return `#${hex(comp['Red Component'])}${hex(comp['Green Component'] ?? 0)}${hex(comp['Blue Component'] ?? 0)}`;
  };

  const scheme: AnsiScheme = { ansi: new Array(16).fill(undefined) };
  keys.forEach((key, i) => {
    const color = dicts[i] ? componentColor(dicts[i]) : undefined;
    if (!color) return;
    const ansi = /^Ansi (\d+) Color$/.exec(key);
    if (ansi) scheme.ansi[Number(ansi[1])] = color;
    else if (key === 'Background Color') scheme.background = color;
    else if (key === 'Foreground Color') scheme.foreground = color;
    else if (key === 'Cursor Color') scheme.cursor = color;
    else if (key === 'Selection Color') scheme.selectionBackground = color;
  });
  return scheme;
}

// --- base16 / base24 YAML ---------------------------------------------------

export function parseBase16(text: string): AnsiScheme {
  const doc = parseYaml(text) as Record<string, unknown>;
  const palette = (doc.palette ?? doc) as Record<string, unknown>;
  const get = (k: string) => norm(palette[k] as string);

  // base16 semantic mapping (https://github.com/chriskempson/base16)
  const scheme: AnsiScheme = {
    name: (doc.name ?? doc.scheme) as string | undefined,
    background: get('base00'),
    foreground: get('base05'),
    cursor: get('base05'),
    ansi: [
      get('base00'), // black
      get('base08'), // red
      get('base0B'), // green
      get('base0A'), // yellow
      get('base0D'), // blue
      get('base0E'), // magenta
      get('base0C'), // cyan
      get('base05'), // white
      get('base03'), // bright black
      get('base08'),
      get('base0B'),
      get('base0A'),
      get('base0D'),
      get('base0E'),
      get('base0C'),
      get('base07'), // bright white
    ],
  };
  return scheme;
}

// --- Alacritty TOML (colors.normal.red = "#...") ----------------------------

export function parseAlacritty(text: string): AnsiScheme {
  const scheme: AnsiScheme = { ansi: new Array(16).fill(undefined) };
  const names = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  let section = '';
  for (const line of text.split('\n')) {
    const sec = /^\s*\[([^\]]+)\]/.exec(line);
    if (sec) {
      section = sec[1].trim();
      continue;
    }
    const kv = /^\s*([\w]+)\s*=\s*["']([^"']+)["']/.exec(line);
    if (!kv) continue;
    const [, key, value] = kv;
    const color = norm(value);
    if (!color) continue;
    if (section === 'colors.primary') {
      if (key === 'background') scheme.background = color;
      if (key === 'foreground') scheme.foreground = color;
    } else if (section === 'colors.cursor' && key === 'cursor') {
      scheme.cursor = color;
    } else if (section === 'colors.normal') {
      const i = names.indexOf(key);
      if (i >= 0) scheme.ansi[i] = color;
    } else if (section === 'colors.bright') {
      const i = names.indexOf(key);
      if (i >= 0) scheme.ansi[i + 8] = color;
    }
  }
  return scheme;
}

// --- Kitty .conf (color0 #000000, foreground #...) --------------------------

export function parseKitty(text: string): AnsiScheme {
  const scheme: AnsiScheme = { ansi: new Array(16).fill(undefined) };
  for (const line of text.split('\n')) {
    const m = /^\s*(color\d{1,2}|foreground|background|cursor|selection_background)\s+(\S+)/.exec(line);
    if (!m) continue;
    const color = norm(m[2]);
    if (!color) continue;
    if (m[1] === 'foreground') scheme.foreground = color;
    else if (m[1] === 'background') scheme.background = color;
    else if (m[1] === 'cursor') scheme.cursor = color;
    else if (m[1] === 'selection_background') scheme.selectionBackground = color;
    else {
      const i = Number(m[1].slice(5));
      if (i < 16) scheme.ansi[i] = color;
    }
  }
  return scheme;
}

// --- Ghostty config (palette = 0=#1d1f21) ------------------------------------

export function parseGhostty(text: string): AnsiScheme {
  const scheme: AnsiScheme = { ansi: new Array(16).fill(undefined) };
  for (const line of text.split('\n')) {
    const m = /^\s*([\w-]+)\s*=\s*(.+)$/.exec(line);
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.trim();
    if (key === 'palette') {
      const p = /^(\d{1,2})\s*=\s*(\S+)/.exec(value);
      if (p) {
        const i = Number(p[1]);
        const color = norm(p[2]);
        if (i < 16 && color) scheme.ansi[i] = color;
      }
    } else if (key === 'background') scheme.background = norm(value);
    else if (key === 'foreground') scheme.foreground = norm(value);
    else if (key === 'cursor-color') scheme.cursor = norm(value);
    else if (key === 'selection-background') scheme.selectionBackground = norm(value);
  }
  return scheme;
}

// --- Windows Terminal scheme JSON -------------------------------------------

export function parseWindowsTerminal(text: string): AnsiScheme {
  const doc = JSON.parse(text) as Record<string, string>;
  const scheme = Array.isArray((doc as unknown as { schemes?: unknown[] }).schemes)
    ? ((doc as unknown as { schemes: Record<string, string>[] }).schemes[0] ?? {})
    : doc;
  const order = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'purple',
    'cyan',
    'white',
    'brightBlack',
    'brightRed',
    'brightGreen',
    'brightYellow',
    'brightBlue',
    'brightPurple',
    'brightCyan',
    'brightWhite',
  ];
  return {
    name: scheme.name,
    background: norm(scheme.background),
    foreground: norm(scheme.foreground),
    cursor: norm(scheme.cursorColor),
    selectionBackground: norm(scheme.selectionBackground),
    ansi: order.map((k) => norm(scheme[k])),
  };
}

// --- Dispatcher ---------------------------------------------------------------

export interface DetectedScheme {
  format: string;
  scheme: AnsiScheme;
}

export function parseTerminalScheme(filename: string, text: string): DetectedScheme | null {
  const lower = filename.toLowerCase();
  const attempts: [string, () => AnsiScheme][] = [];

  if (lower.endsWith('.itermcolors')) attempts.push(['iTerm2', () => parseITermColors(text)]);
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) attempts.push(['base16', () => parseBase16(text)]);
  if (lower.endsWith('.toml')) attempts.push(['Alacritty', () => parseAlacritty(text)]);
  if (lower.endsWith('.conf')) attempts.push(['Kitty', () => parseKitty(text)]);
  if (lower.endsWith('.json')) attempts.push(['Windows Terminal', () => parseWindowsTerminal(text)]);

  // Content-based fallbacks, ordered by distinctiveness.
  attempts.push(
    ['iTerm2', () => (text.includes('Ansi 0 Color') ? parseITermColors(text) : { ansi: [] })],
    ['Ghostty', () => (/^\s*palette\s*=/m.test(text) ? parseGhostty(text) : { ansi: [] })],
    ['Kitty', () => (/^\s*color\d/m.test(text) ? parseKitty(text) : { ansi: [] })],
    ['Alacritty', () => (/\[colors\.(normal|primary|bright)\]/.test(text) ? parseAlacritty(text) : { ansi: [] })],
    ['base16', () => (/base0[0-9A-F]/i.test(text) ? parseBase16(text) : { ansi: [] })],
    ['Windows Terminal', () => (text.trim().startsWith('{') ? parseWindowsTerminal(text) : { ansi: [] })],
  );

  for (const [format, fn] of attempts) {
    try {
      const scheme = fn();
      if (scheme.ansi.filter(Boolean).length >= 8) return { format, scheme };
    } catch {
      // try the next format
    }
  }
  return null;
}
