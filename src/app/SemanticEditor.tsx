import { useActiveTheme, useThemeStore } from '../store/themeStore';
import { useUiStore } from '../store/uiStore';
import type { SemanticTokenStyle } from '../theme/types';

interface NormalStyle {
  foreground?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

function normalize(style: SemanticTokenStyle): NormalStyle {
  return typeof style === 'string' ? { foreground: style } : style;
}

function denormalize(style: NormalStyle): SemanticTokenStyle {
  const { foreground, ...flags } = style;
  const hasFlags = Object.values(flags).some(Boolean);
  if (foreground && !hasFlags) return foreground;
  return { ...(foreground ? { foreground } : {}), ...Object.fromEntries(Object.entries(flags).filter(([, v]) => v)) };
}

const FLAGS = ['italic', 'bold', 'underline', 'strikethrough'] as const;

const checker = 'repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 0 0 / 8px 8px';

export function SemanticEditor() {
  const theme = useActiveTheme();
  const { setSemanticTokenColors, setSemanticHighlighting } = useThemeStore();
  const { selection, select } = useUiStore();
  const map = theme.semanticTokenColors ?? {};
  const entries = Object.entries(map);

  const setEntry = (selector: string, style: NormalStyle | null, oldSelector?: string) => {
    const next = { ...map };
    if (oldSelector !== undefined && oldSelector !== selector) delete next[oldSelector];
    if (style === null) delete next[selector];
    else next[selector] = denormalize(style);
    setSemanticTokenColors(next);
  };

  const selectedSelector = selection?.kind === 'semantic' ? selection.selector : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
      <label className="flex items-center gap-2 px-1 text-[12px] text-zinc-300">
        <input
          type="checkbox"
          checked={theme.semanticHighlighting !== false}
          onChange={(e) => setSemanticHighlighting(e.target.checked)}
        />
        Enable semantic highlighting
      </label>
      <p className="px-1 text-[11px] leading-snug text-zinc-500">
        Language-server token styles, e.g. <code className="text-zinc-400">variable.readonly</code> or{' '}
        <code className="text-zinc-400">*.mutable:rust</code>. Click a selector to edit its color in the inspector.
        These apply on top of TextMate rules in VS Code (the code preview shows TextMate rules only).
      </p>
      {entries.map(([selector, style]) => {
        const s = normalize(style);
        const selected = selectedSelector === selector;
        return (
          <div
            key={selector}
            className={`space-y-1.5 rounded border p-2 ${selected ? 'border-sky-700 bg-sky-950/30' : 'border-zinc-800 bg-zinc-900/60'}`}
          >
            <div className="flex items-center gap-2">
              <button
                className="size-5 shrink-0 rounded-sm border border-zinc-600 hover:border-zinc-300"
                style={{ background: s.foreground ? `linear-gradient(${s.foreground}, ${s.foreground}), ${checker}` : checker }}
                title="Edit color in the inspector"
                onClick={() => select({ kind: 'semantic', selector })}
              />
              <input
                className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 font-mono text-[11.5px] text-zinc-200"
                defaultValue={selector}
                spellCheck={false}
                onFocus={() => select({ kind: 'semantic', selector })}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== selector) {
                    setEntry(v, s, selector);
                    if (selectedSelector === selector) select({ kind: 'semantic', selector: v });
                  }
                }}
              />
              <button
                className="rounded border border-red-900 px-1.5 py-0.5 text-[11px] text-red-400 hover:bg-red-950"
                onClick={() => {
                  setEntry(selector, null);
                  if (selectedSelector === selector) select(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {FLAGS.map((flag) => (
                <label key={flag} className="flex items-center gap-1 text-[11px] text-zinc-300">
                  <input type="checkbox" checked={!!s[flag]} onChange={(e) => setEntry(selector, { ...s, [flag]: e.target.checked })} />
                  {flag}
                </label>
              ))}
            </div>
          </div>
        );
      })}
      <button
        className="mt-1 rounded border border-dashed border-zinc-700 px-2 py-1.5 text-[12px] text-zinc-400 hover:bg-zinc-800"
        onClick={() => {
          let name = 'variable.readonly';
          let n = 2;
          while (name in map) name = `variable.readonly.${n++}`;
          setEntry(name, { foreground: '#4fc1ff' });
          select({ kind: 'semantic', selector: name });
        }}
      >
        + Add selector
      </button>
    </div>
  );
}
