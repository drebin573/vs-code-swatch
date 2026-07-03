import { cssVar } from '../theme/cssVars';

/**
 * Editor body: line numbers, current-line highlight, selection + find-match
 * samples. Code is plain-colored for now; Shiki-powered TextMate
 * highlighting replaces the inner spans in M3.
 */

const code = [
  `import { createTheme } from './theme';`,
  ``,
  `/** Build a VS Code theme from a palette. */`,
  `export function generate(palette: Palette): ThemeDoc {`,
  `  const accent = palette.pick('accent');`,
  `  return createTheme({`,
  `    name: 'My Theme',`,
  `    type: accent.isDark() ? 'dark' : 'light',`,
  `    colors: mapWorkbench(palette),`,
  `  });`,
  `}`,
  ``,
  `const ratio = 4.5; // WCAG contrast target`,
];

const CURRENT_LINE = 7;
const SELECTION_LINE = 4;
const FIND_LINE = 8;

export function CodeView() {
  return (
    <div
      data-keys="editor.background editor.foreground"
      className="relative min-h-0 flex-1 overflow-hidden font-mono text-[12.5px] leading-[19px]"
      style={{ background: cssVar('editor.background'), color: cssVar('editor.foreground') }}
    >
      {code.map((line, i) => {
        const n = i + 1;
        const isCurrent = n === CURRENT_LINE;
        return (
          <div key={i} className="relative flex">
            {isCurrent && (
              <div
                data-keys="editor.lineHighlightBackground editor.lineHighlightBorder"
                className="absolute inset-0"
                style={{
                  background: cssVar('editor.lineHighlightBackground', 'transparent'),
                  border: `1px solid ${cssVar('editor.lineHighlightBorder', 'transparent')}`,
                }}
              />
            )}
            <span
              data-keys={isCurrent ? 'editorLineNumber.activeForeground' : 'editorLineNumber.foreground'}
              className="relative w-[52px] shrink-0 select-none pr-5 text-right"
              style={{
                color: isCurrent
                  ? cssVar('editorLineNumber.activeForeground', cssVar('editorLineNumber.foreground'))
                  : cssVar('editorLineNumber.foreground'),
              }}
            >
              {n}
            </span>
            <span className="relative whitespace-pre">
              {n === SELECTION_LINE ? (
                <>
                  {line.slice(0, 25)}
                  <span
                    data-keys="editor.selectionBackground"
                    style={{ background: cssVar('editor.selectionBackground') }}
                  >
                    {line.slice(25, 41)}
                  </span>
                  {line.slice(41)}
                </>
              ) : n === FIND_LINE ? (
                <>
                  {line.slice(0, 20)}
                  <span
                    data-keys="editor.findMatchBackground editor.findMatchBorder"
                    style={{
                      background: cssVar('editor.findMatchBackground'),
                      outline: `1px solid ${cssVar('editor.findMatchBorder', 'transparent')}`,
                    }}
                  >
                    {line.slice(20, 26)}
                  </span>
                  {line.slice(26)}
                </>
              ) : (
                line
              )}
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
      <div
        data-keys="scrollbarSlider.background"
        className="absolute right-0 top-6 h-24 w-[10px]"
        style={{ background: cssVar('scrollbarSlider.background') }}
      />
      <div
        data-keys="minimap.background"
        className="absolute bottom-0 right-[10px] top-0 w-16 opacity-90"
        style={{ background: cssVar('minimap.background', cssVar('editor.background')) }}
      >
        {code.map((line, i) => (
          <div
            key={i}
            className="mx-1.5 my-[3px] h-[2px] rounded-sm opacity-40"
            style={{ background: cssVar('editor.foreground'), width: `${Math.min(line.length * 1.2, 52)}px` }}
          />
        ))}
      </div>
    </div>
  );
}
