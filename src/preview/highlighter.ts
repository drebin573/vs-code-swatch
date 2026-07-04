import { useEffect, useMemo, useState } from 'react';
import { createHighlighter, type Highlighter, type ThemedToken } from 'shiki';
import type { ThemeDoc } from '../theme/types';
import { resolveColor } from '../theme/defaults';
import { samples } from '../data/samples';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [],
    langs: samples.map((s) => s.lang),
  });
  return highlighterPromise;
}

// Shiki only re-applies a theme to its tokenizer when the theme *name*
// changes (`_lastTheme !== name` guard in @shikijs/primitive setTheme), so
// re-registering under one constant name leaves tokenization stale until a
// full reload. Alternating between two names defeats the guard while keeping
// the registry bounded at two entries.
const PREVIEW_THEMES = ['preview-a', 'preview-b'] as const;
let previewFlip = 0;

/**
 * Tokenize `code` with the active theme's actual TextMate rules — the exact
 * highlighting VS Code would produce. Returns null until the (lazily loaded)
 * highlighter is ready.
 */
export function useHighlightedTokens(theme: ThemeDoc, lang: string, code: string): ThemedToken[][] | null {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((h) => {
      if (!cancelled) setHighlighter(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const editorForeground = resolveColor(theme, 'editor.foreground');
  const editorBackground = resolveColor(theme, 'editor.background');

  // Token output only depends on these parts of the theme document — plain
  // color edits elsewhere must not re-tokenize.
  const tokenThemeKey = useMemo(
    () => JSON.stringify([theme.type, theme.tokenColors, theme.semanticTokenColors, editorForeground, editorBackground]),
    [theme.type, theme.tokenColors, theme.semanticTokenColors, editorForeground, editorBackground],
  );

  return useMemo(() => {
    if (!highlighter) return null;
    try {
      previewFlip = 1 - previewFlip;
      const previewTheme = PREVIEW_THEMES[previewFlip];
      highlighter.loadThemeSync({
        name: previewTheme,
        type: theme.type,
        colors: {
          ...(editorForeground ? { 'editor.foreground': editorForeground } : {}),
          ...(editorBackground ? { 'editor.background': editorBackground } : {}),
        },
        tokenColors: theme.tokenColors,
        semanticHighlighting: theme.semanticHighlighting,
        semanticTokenColors: theme.semanticTokenColors,
      } as never);
      return highlighter.codeToTokensBase(code, { lang: lang as never, theme: previewTheme as never });
    } catch (e) {
      console.warn('highlight failed', e);
      return null;
    }
    // tokenThemeKey covers every theme field read above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighter, tokenThemeKey, lang, code]);
}

export const FontStyle = { Italic: 1, Bold: 2, Underline: 4, Strikethrough: 8 } as const;
