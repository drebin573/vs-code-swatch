import { useMemo } from 'react';
import { cssVar } from '../theme/cssVars';
import { useActiveTheme } from '../store/themeStore';
import { useUiStore } from '../store/uiStore';
import { samples } from '../data/samples';
import { FontStyle, useHighlightedTokens } from './highlighter';

const CURRENT_LINE = 7;

export function CodeView() {
  const theme = useActiveTheme();
  const lang = useUiStore((s) => s.previewLanguage);
  const sample = useMemo(() => samples.find((s) => s.lang === lang) ?? samples[0], [lang]);
  const tokens = useHighlightedTokens(theme, sample.lang, sample.code);
  const plainLines = useMemo(() => sample.code.split('\n'), [sample]);

  return (
    // The frame doesn't scroll itself — scrolling lives on the inner wrapper
    // (native bars hidden) so the mock scrollbar slider stays pinned.
    <div
      data-keys="editor.background editor.foreground"
      className="relative min-h-0 flex-1 overflow-hidden font-mono text-[12.5px] leading-[19px]"
      style={{ background: cssVar('editor.background'), color: cssVar('editor.foreground') }}
    >
      <div className="no-native-scrollbar h-full overflow-auto">
        <div className="min-w-max pb-2">
          {plainLines.map((plain, i) => {
            const n = i + 1;
            const isCurrent = n === CURRENT_LINE;
            const lineTokens = tokens?.[i];
            return (
              <div key={i} className="relative flex pr-20">
                {isCurrent && (
                  // Starts after the gutter (as in VS Code) so horizontally
                  // scrolled code can't show through the sticky line number.
                  <div
                    data-keys="editor.lineHighlightBackground editor.lineHighlightBorder"
                    className="absolute inset-y-0 left-[52px] right-0"
                    style={{
                      background: cssVar('editor.lineHighlightBackground', 'transparent'),
                      border: `1px solid ${cssVar('editor.lineHighlightBorder', 'transparent')}`,
                    }}
                  />
                )}
                <span
                  data-keys={isCurrent ? 'editorLineNumber.activeForeground' : 'editorLineNumber.foreground'}
                  className="sticky left-0 z-10 w-[52px] shrink-0 select-none pr-5 text-right"
                  style={{
                    color: isCurrent
                      ? cssVar('editorLineNumber.activeForeground', cssVar('editorLineNumber.foreground'))
                      : cssVar('editorLineNumber.foreground'),
                    background: cssVar('editor.background'),
                  }}
                >
                  {n}
                </span>
                <span className="relative whitespace-pre">
                  {lineTokens
                    ? lineTokens.map((t, j) => (
                        <span
                          key={j}
                          style={{
                            color: t.color,
                            fontStyle: t.fontStyle && t.fontStyle & FontStyle.Italic ? 'italic' : undefined,
                            fontWeight: t.fontStyle && t.fontStyle & FontStyle.Bold ? 'bold' : undefined,
                            textDecoration:
                              t.fontStyle && t.fontStyle & (FontStyle.Underline | FontStyle.Strikethrough)
                                ? [
                                    t.fontStyle & FontStyle.Underline ? 'underline' : '',
                                    t.fontStyle & FontStyle.Strikethrough ? 'line-through' : '',
                                  ]
                                    .join(' ')
                                    .trim()
                                : undefined,
                          }}
                        >
                          {t.content}
                        </span>
                      ))
                    : plain}
                  {isCurrent && (
                    <span
                      data-keys="editorCursor.foreground"
                      className="ml-px inline-block h-[15px] w-[2px] translate-y-[3px] animate-pulse"
                      style={{ background: cssVar('editorCursor.foreground') }}
                    />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div
        data-keys="scrollbarSlider.background"
        className="absolute right-0 top-6 h-24 w-[10px]"
        style={{ background: cssVar('scrollbarSlider.background') }}
      />
    </div>
  );
}
