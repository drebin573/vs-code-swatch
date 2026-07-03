import { formatHex, formatHex8, oklch, parse, wcagContrast, type Oklch } from 'culori';
import type { Palette } from './types';
import { ANSI_SLOT_NAMES, type AnsiScheme } from './types';
import type { ThemeDoc, TokenColorRule } from '../theme/types';

/**
 * Synthesize a complete, coherent VS Code theme from a handful of palette
 * colors. Deterministic: bg/fg/accent are picked by lightness/chroma/contrast,
 * remaining colors are classified into hue buckets, and anything missing is
 * synthesized in OKLCH so it harmonizes with what was provided.
 */

type OK = Oklch;

function toOk(hex: string): OK | null {
  const c = parse(hex);
  return c ? oklch(c) : null;
}

function hx(c: OK): string {
  return formatHex({ ...c, mode: 'oklch' });
}

/** hex with alpha 0–1 appended */
function alpha(hex: string, a: number): string {
  const c = parse(hex);
  if (!c) return hex;
  return formatHex8({ ...c, alpha: a });
}

function shade(c: OK, dl: number): OK {
  return { ...c, l: Math.min(1, Math.max(0, c.l + dl)) };
}

function withChroma(c: OK, factor: number): OK {
  return { ...c, c: (c.c ?? 0) * factor };
}

const HUE_BUCKETS = {
  red: [350, 25],
  orange: [25, 70],
  yellow: [70, 110],
  green: [110, 165],
  cyan: [165, 215],
  blue: [215, 280],
  magenta: [280, 350],
} as const;

type Bucket = keyof typeof HUE_BUCKETS;

function bucketOf(c: OK): Bucket | null {
  if ((c.c ?? 0) < 0.035) return null; // neutral
  const h = ((c.h ?? 0) % 360 + 360) % 360;
  for (const [name, [lo, hi]] of Object.entries(HUE_BUCKETS) as [Bucket, readonly [number, number]][]) {
    if (lo > hi ? h >= lo || h < hi : h >= lo && h < hi) return name;
  }
  return null;
}

const BUCKET_CENTER: Record<Bucket, number> = {
  red: 15,
  orange: 50,
  yellow: 90,
  green: 140,
  cyan: 195,
  blue: 250,
  magenta: 320,
};

export interface GenerateOptions {
  name: string;
  type: 'dark' | 'light';
}

export function generateTheme(palette: Palette, opts: GenerateOptions): ThemeDoc {
  const dark = opts.type === 'dark';
  const all = palette.colors.map((c) => toOk(c.hex)).filter((c): c is OK => c !== null);
  if (all.length === 0) throw new Error('Palette has no parseable colors');

  // --- pick background: the darkest (dark) / lightest (light) color,
  // nudged into a usable range.
  const byL = [...all].sort((a, b) => a.l - b.l);
  let bg = dark ? byL[0] : byL[byL.length - 1];
  if (dark && bg.l > 0.35) bg = { ...bg, l: 0.24 };
  if (!dark && bg.l < 0.85) bg = { ...bg, l: 0.97 };
  bg = withChroma(bg, Math.min(1, 0.06 / Math.max(0.001, bg.c ?? 0)));

  // --- pick foreground: best contrast against bg, boosted until readable.
  let fg =
    [...all]
      .filter((c) => c !== byL[0])
      .sort((a, b) => wcagContrast(hx(b), hx(bg)) - wcagContrast(hx(a), hx(bg)))[0] ?? shade(bg, dark ? 0.6 : -0.6);
  let guard = 0;
  while (wcagContrast(hx(fg), hx(bg)) < 4.5 && guard++ < 20) {
    fg = shade(fg, dark ? 0.05 : -0.05);
  }

  // --- accent: highest-chroma color that isn't the background.
  const accent =
    [...all].filter((c) => Math.abs(c.l - bg.l) > 0.1 || (c.c ?? 0) > 0.05).sort((a, b) => (b.c ?? 0) - (a.c ?? 0))[0] ??
    ({ mode: 'oklch', l: dark ? 0.7 : 0.5, c: 0.15, h: 250 } as OK);

  // --- hue buckets from the remaining palette.
  const buckets = new Map<Bucket, OK>();
  for (const c of all) {
    const b = bucketOf(c);
    if (!b) continue;
    const prev = buckets.get(b);
    if (!prev || (c.c ?? 0) > (prev.c ?? 0)) buckets.set(b, c);
  }

  /** Bucket color adjusted for token readability, synthesized if missing. */
  const hue = (b: Bucket, l = dark ? 0.75 : 0.5): string => {
    const found = buckets.get(b);
    if (found) {
      const adjusted = dark ? Math.max(found.l, 0.65) : Math.min(found.l, 0.55);
      return hx({ ...found, l: adjusted });
    }
    const accentChroma = Math.max(0.09, Math.min(0.17, accent.c ?? 0.12));
    return hx({ mode: 'oklch', l, c: accentChroma, h: BUCKET_CENTER[b] });
  };

  const BG = hx(bg);
  const FG = hx(fg);
  const ACCENT = hx(accent);
  const s = (dl: number) => hx(shade(bg, dark ? dl : -dl)); // surface ladder away from bg
  const surface1 = s(0.03);
  const surface2 = s(0.055);
  const surface3 = s(0.09);
  const border = s(0.12);
  const fgMuted = hx({ ...fg, l: dark ? fg.l - 0.18 : fg.l + 0.18 });
  const fgFaint = hx({ ...fg, l: dark ? fg.l - 0.32 : fg.l + 0.32 });
  const accentFg = wcagContrast(ACCENT, '#ffffff') >= 3 ? '#ffffff' : '#000000';
  const errorRed = hue('red');
  const warnYellow = hue('yellow');
  const infoBlue = hue('blue');
  const okGreen = hue('green');

  const colors: Record<string, string> = {
    // Base
    focusBorder: ACCENT,
    foreground: FG,
    disabledForeground: fgFaint,
    'widget.shadow': alpha('#000000', dark ? 0.36 : 0.16),
    'selection.background': alpha(ACCENT, 0.4),
    descriptionForeground: fgMuted,
    errorForeground: errorRed,
    'icon.foreground': fgMuted,

    // Editor
    'editor.background': BG,
    'editor.foreground': FG,
    'editorLineNumber.foreground': fgFaint,
    'editorLineNumber.activeForeground': fgMuted,
    'editorCursor.foreground': ACCENT,
    'editor.selectionBackground': alpha(ACCENT, 0.27),
    'editor.inactiveSelectionBackground': alpha(ACCENT, 0.14),
    'editor.lineHighlightBackground': alpha(hx(shade(bg, dark ? 0.25 : -0.25)), 0.12),
    'editor.findMatchBackground': alpha(warnYellow, 0.35),
    'editor.findMatchHighlightBackground': alpha(warnYellow, 0.18),
    'editor.wordHighlightBackground': alpha(ACCENT, 0.15),
    'editorWhitespace.foreground': alpha(FG, 0.12),
    'editorIndentGuide.background1': alpha(FG, 0.09),
    'editorIndentGuide.activeBackground1': alpha(FG, 0.22),
    'editorBracketMatch.background': alpha(ACCENT, 0.16),
    'editorBracketMatch.border': alpha(ACCENT, 0.5),
    'editorGutter.modifiedBackground': infoBlue,
    'editorGutter.addedBackground': okGreen,
    'editorGutter.deletedBackground': errorRed,
    'editorWidget.background': surface2,
    'editorWidget.border': border,
    'editorHoverWidget.background': surface2,
    'editorHoverWidget.border': border,
    'editorSuggestWidget.background': surface2,
    'editorSuggestWidget.border': border,
    'editorSuggestWidget.selectedBackground': alpha(ACCENT, 0.25),
    'editorError.foreground': errorRed,
    'editorWarning.foreground': warnYellow,
    'editorInfo.foreground': infoBlue,

    // Chrome
    'titleBar.activeBackground': surface2,
    'titleBar.activeForeground': FG,
    'titleBar.inactiveBackground': surface1,
    'titleBar.inactiveForeground': fgMuted,
    'menubar.selectionBackground': alpha(FG, 0.12),
    'menu.background': surface2,
    'menu.foreground': FG,
    'activityBar.background': surface2,
    'activityBar.foreground': FG,
    'activityBar.inactiveForeground': fgFaint,
    'activityBar.activeBorder': ACCENT,
    'activityBarBadge.background': ACCENT,
    'activityBarBadge.foreground': accentFg,
    'sideBar.background': surface1,
    'sideBar.foreground': fgMuted,
    'sideBar.border': border,
    'sideBarTitle.foreground': fgMuted,
    'sideBarSectionHeader.background': surface1,
    'sideBarSectionHeader.foreground': fgMuted,
    'list.activeSelectionBackground': alpha(ACCENT, 0.28),
    'list.activeSelectionForeground': FG,
    'list.inactiveSelectionBackground': alpha(FG, 0.07),
    'list.hoverBackground': alpha(FG, 0.05),
    'list.highlightForeground': ACCENT,
    'tree.indentGuidesStroke': alpha(FG, 0.15),

    // Tabs
    'editorGroupHeader.tabsBackground': surface1,
    'tab.activeBackground': BG,
    'tab.activeForeground': FG,
    'tab.activeBorderTop': ACCENT,
    'tab.inactiveBackground': surface1,
    'tab.inactiveForeground': fgMuted,
    'tab.border': border,
    'breadcrumb.background': BG,
    'breadcrumb.foreground': fgMuted,
    'breadcrumb.focusForeground': FG,

    // Inputs & buttons
    'button.background': ACCENT,
    'button.foreground': accentFg,
    'button.hoverBackground': hx(shade(accent, dark ? 0.07 : -0.07)),
    'button.secondaryBackground': surface3,
    'button.secondaryForeground': FG,
    'input.background': surface2,
    'input.foreground': FG,
    'input.border': border,
    'input.placeholderForeground': fgFaint,
    'inputOption.activeBorder': ACCENT,
    'inputOption.activeBackground': alpha(ACCENT, 0.25),
    'dropdown.background': surface2,
    'dropdown.foreground': FG,
    'dropdown.border': border,
    'checkbox.background': surface2,
    'checkbox.border': border,
    'badge.background': ACCENT,
    'badge.foreground': accentFg,
    'progressBar.background': ACCENT,

    // Panel & terminal
    'panel.background': BG,
    'panel.border': border,
    'panelTitle.activeForeground': FG,
    'panelTitle.activeBorder': ACCENT,
    'panelTitle.inactiveForeground': fgMuted,
    'terminal.background': BG,
    'terminal.foreground': FG,
    'terminalCursor.foreground': ACCENT,
    'terminal.selectionBackground': alpha(ACCENT, 0.27),

    // Status bar
    'statusBar.background': dark ? surface2 : ACCENT,
    'statusBar.foreground': dark ? fgMuted : accentFg,
    'statusBar.border': border,
    'statusBar.debuggingBackground': hue('orange'),
    'statusBar.debuggingForeground': accentFg,
    'statusBar.noFolderBackground': hue('magenta'),
    'statusBarItem.remoteBackground': ACCENT,
    'statusBarItem.remoteForeground': accentFg,

    // Misc chrome
    'notificationCenterHeader.background': surface3,
    'notifications.background': surface2,
    'notifications.foreground': FG,
    'notifications.border': border,
    'pickerGroup.foreground': ACCENT,
    'quickInput.background': surface2,
    'quickInput.foreground': FG,
    'quickInputList.focusBackground': alpha(ACCENT, 0.25),
    'peekView.border': ACCENT,
    'peekViewEditor.background': surface1,
    'peekViewResult.background': surface2,
    'scrollbarSlider.background': alpha(FG, 0.12),
    'scrollbarSlider.hoverBackground': alpha(FG, 0.2),
    'scrollbarSlider.activeBackground': alpha(FG, 0.28),
    'minimap.background': BG,
    'widget.border': border,
    'sash.hoverBorder': ACCENT,
    'gitDecoration.modifiedResourceForeground': infoBlue,
    'gitDecoration.addedResourceForeground': okGreen,
    'gitDecoration.deletedResourceForeground': errorRed,
    'gitDecoration.untrackedResourceForeground': okGreen,
    'gitDecoration.ignoredResourceForeground': fgFaint,
    'diffEditor.insertedTextBackground': alpha(okGreen, 0.14),
    'diffEditor.removedTextBackground': alpha(errorRed, 0.14),
    'diffEditor.insertedLineBackground': alpha(okGreen, 0.08),
    'diffEditor.removedLineBackground': alpha(errorRed, 0.08),
    'link.activeForeground': ACCENT,
    'textLink.foreground': ACCENT,
    'textLink.activeForeground': hx(shade(accent, 0.08)),
    'walkThrough.embeddedEditorBackground': surface1,
    'debugToolBar.background': surface2,
    'editorGroup.border': border,
    'window.activeBorder': border,
  };

  // --- ANSI: reuse palette buckets so the terminal matches the theme.
  const ansiL = dark ? 0.68 : 0.52;
  const brightL = dark ? 0.78 : 0.45;
  const ansi: Record<string, string> = {
    'terminal.ansiBlack': dark ? surface3 : hx({ ...fg, l: 0.35 }),
    'terminal.ansiRed': hue('red', ansiL),
    'terminal.ansiGreen': hue('green', ansiL),
    'terminal.ansiYellow': hue('yellow', ansiL),
    'terminal.ansiBlue': hue('blue', ansiL),
    'terminal.ansiMagenta': hue('magenta', ansiL),
    'terminal.ansiCyan': hue('cyan', ansiL),
    'terminal.ansiWhite': dark ? fgMuted : hx({ ...fg, l: 0.6 }),
    'terminal.ansiBrightBlack': dark ? fgFaint : hx({ ...fg, l: 0.45 }),
    'terminal.ansiBrightRed': hue('red', brightL),
    'terminal.ansiBrightGreen': hue('green', brightL),
    'terminal.ansiBrightYellow': hue('yellow', brightL),
    'terminal.ansiBrightBlue': hue('blue', brightL),
    'terminal.ansiBrightMagenta': hue('magenta', brightL),
    'terminal.ansiBrightCyan': hue('cyan', brightL),
    'terminal.ansiBrightWhite': dark ? FG : hx({ ...fg, l: 0.3 }),
  };
  Object.assign(colors, ansi);

  // --- Token colors from the same buckets.
  const tokenColors: TokenColorRule[] = [
    { name: 'Comments', scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: fgFaint, fontStyle: 'italic' } },
    { name: 'Strings', scope: ['string', 'string.quoted'], settings: { foreground: hue('green') } },
    { name: 'String escapes', scope: ['constant.character.escape'], settings: { foreground: hue('cyan') } },
    { name: 'Numbers', scope: ['constant.numeric'], settings: { foreground: hue('orange') } },
    { name: 'Constants', scope: ['constant.language', 'support.constant', 'variable.other.constant'], settings: { foreground: hue('orange') } },
    { name: 'Keywords', scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: hue('magenta') } },
    { name: 'Operators', scope: ['keyword.operator'], settings: { foreground: hx(oklch(parse(ACCENT)!)) } },
    { name: 'Functions', scope: ['entity.name.function', 'support.function'], settings: { foreground: hue('blue') } },
    { name: 'Classes & types', scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'], settings: { foreground: hue('yellow') } },
    { name: 'Variables', scope: ['variable', 'variable.parameter'], settings: { foreground: FG } },
    { name: 'Properties', scope: ['variable.other.property', 'support.type.property-name'], settings: { foreground: hue('cyan') } },
    { name: 'Tags', scope: ['entity.name.tag'], settings: { foreground: hue('red') } },
    { name: 'Attributes', scope: ['entity.other.attribute-name'], settings: { foreground: hue('yellow') } },
    { name: 'Punctuation', scope: ['punctuation'], settings: { foreground: fgMuted } },
    { name: 'Markdown headings', scope: ['markup.heading', 'entity.name.section'], settings: { foreground: hx(oklch(parse(ACCENT)!)), fontStyle: 'bold' } },
    { name: 'Markdown emphasis', scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    { name: 'Markdown bold', scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
    { name: 'Markdown code', scope: ['markup.inline.raw', 'markup.fenced_code.block'], settings: { foreground: hue('green') } },
    { name: 'Links', scope: ['markup.underline.link', 'string.other.link'], settings: { foreground: hue('blue') } },
    { name: 'Invalid', scope: ['invalid', 'invalid.illegal'], settings: { foreground: errorRed } },
  ];

  return {
    name: opts.name,
    type: opts.type,
    colors,
    tokenColors,
    semanticHighlighting: true,
  };
}

/** Patch mapping a parsed terminal scheme directly onto terminal.* keys. */
export function ansiSchemeToColors(scheme: AnsiScheme): Record<string, string> {
  const patch: Record<string, string> = {};
  scheme.ansi.forEach((hex, i) => {
    if (hex) patch[`terminal.${ANSI_SLOT_NAMES[i]}`] = hex;
  });
  if (scheme.background) patch['terminal.background'] = scheme.background;
  if (scheme.foreground) patch['terminal.foreground'] = scheme.foreground;
  if (scheme.cursor) patch['terminalCursor.foreground'] = scheme.cursor;
  if (scheme.selectionBackground) {
    const c = parse(scheme.selectionBackground);
    patch['terminal.selectionBackground'] =
      c && (c.alpha === undefined || c.alpha === 1) ? formatHex8({ ...c, alpha: 0.35 }) : scheme.selectionBackground;
  }
  return patch;
}
