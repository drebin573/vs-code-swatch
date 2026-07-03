export interface PaletteColor {
  hex: string;
  label?: string;
}

export interface Palette {
  name?: string;
  colors: PaletteColor[];
}

/** Semantic ANSI slots carried by terminal color schemes. */
export interface AnsiScheme {
  name?: string;
  background?: string;
  foreground?: string;
  cursor?: string;
  selectionBackground?: string;
  /** Indices 0–15: black…white then brightBlack…brightWhite. */
  ansi: (string | undefined)[];
}

export const ANSI_SLOT_NAMES = [
  'ansiBlack',
  'ansiRed',
  'ansiGreen',
  'ansiYellow',
  'ansiBlue',
  'ansiMagenta',
  'ansiCyan',
  'ansiWhite',
  'ansiBrightBlack',
  'ansiBrightRed',
  'ansiBrightGreen',
  'ansiBrightYellow',
  'ansiBrightBlue',
  'ansiBrightMagenta',
  'ansiBrightCyan',
  'ansiBrightWhite',
] as const;

export function ansiSchemeToPalette(scheme: AnsiScheme): Palette {
  const colors: PaletteColor[] = [];
  if (scheme.background) colors.push({ hex: scheme.background, label: 'background' });
  if (scheme.foreground) colors.push({ hex: scheme.foreground, label: 'foreground' });
  scheme.ansi.forEach((hex, i) => {
    if (hex) colors.push({ hex, label: ANSI_SLOT_NAMES[i].replace('ansi', '') });
  });
  return { name: scheme.name, colors };
}
