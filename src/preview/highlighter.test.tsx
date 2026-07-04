// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHighlightedTokens } from './highlighter';
import type { ThemeDoc } from '../theme/types';

function themeWithKeywordColor(foreground: string): ThemeDoc {
  return {
    name: 'test',
    type: 'dark',
    colors: { 'editor.foreground': '#dddddd', 'editor.background': '#111111' },
    tokenColors: [{ scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground } }],
  };
}

function keywordToken(tokens: ReturnType<typeof useHighlightedTokens>) {
  return tokens?.flat().find((t) => t.content.includes('const'));
}

describe('useHighlightedTokens', () => {
  // Regression: shiki only re-applies a theme to its tokenizer when the theme
  // name changes, so editing tokenColors used to leave the preview stale
  // until a full page reload.
  it('re-tokenizes live when tokenColors change', async () => {
    const { result, rerender } = renderHook(({ theme }) => useHighlightedTokens(theme, 'tsx', 'const x = 1;'), {
      initialProps: { theme: themeWithKeywordColor('#ff0000') },
    });

    await waitFor(() => expect(result.current).not.toBeNull(), { timeout: 15_000 });
    expect(keywordToken(result.current)?.color?.toLowerCase()).toBe('#ff0000');

    rerender({ theme: themeWithKeywordColor('#00ff00') });
    await waitFor(() => expect(keywordToken(result.current)?.color?.toLowerCase()).toBe('#00ff00'));

    // And back again — the two alternating registrations must not go stale.
    rerender({ theme: themeWithKeywordColor('#0000ff') });
    await waitFor(() => expect(keywordToken(result.current)?.color?.toLowerCase()).toBe('#0000ff'));
  });
});
