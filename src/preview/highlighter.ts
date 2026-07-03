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

// Re-registering under the same name replaces the previous registration,
// so live edits don't accumulate stale themes.
const PREVIEW_THEME = 'preview';

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
      highlighter.loadThemeSync({
        name: PREVIEW_THEME,
        type: theme.type,
        colors: {
          ...(editorForeground ? { 'editor.foreground': editorForeground } : {}),
          ...(editorBackground ? { 'editor.background': editorBackground } : {}),
        },
        tokenColors: theme.tokenColors,
        semanticHighlighting: theme.semanticHighlighting,
        semanticTokenColors: theme.semanticTokenColors,
      } as never);
      return highlighter.codeToTokensBase(code, { lang: lang as never, theme: PREVIEW_THEME as never });
    } catch (e) {
      console.warn('highlight failed', e);
      return null;
    }
    // tokenThemeKey covers every theme field read above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighter, tokenThemeKey, lang, code]);
}

export const FontStyle = { Italic: 1, Bold: 2, Underline: 4, Strikethrough: 8 } as const;
