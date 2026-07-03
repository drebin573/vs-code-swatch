import type { CSSProperties } from 'react';
import type { ThemeDoc } from './types';
import { resolveAllColors } from './defaults';

/** Same convention VS Code uses for webviews: editor.background → --vscode-editor-background */
export function cssVarName(key: string): string {
  return `--vscode-${key.replace(/\./g, '-')}`;
}

export function cssVar(key: string, fallback?: string): string {
  return fallback ? `var(${cssVarName(key)}, ${fallback})` : `var(${cssVarName(key)})`;
}

/** Style object holding one CSS custom property per resolved color, applied at the preview root. */
export function themeToCssVars(theme: ThemeDoc): CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(resolveAllColors(theme))) {
    if (value !== null) style[cssVarName(key)] = value;
  }
  return style as CSSProperties;
}
