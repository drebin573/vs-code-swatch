import { useEffect, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';
import { useActiveBaseline, useActiveTheme, useThemeStore } from '../store/themeStore';
import { useUiStore } from '../store/uiStore';
import { defaults, describeKey, fullLabelForKey } from '../theme/defaults';
import type { SemanticTokenStyle } from '../theme/types';
import { findRevealTargets } from '../preview/reveal';
import { ChevronLeft, ChevronRight } from '../preview/icons';
import { PaletteSwatches } from './PaletteSwatches';

function normalizeHex(input: string): string | null {
  const v = input.trim().replace(/^([0-9a-fA-F]{3,8})$/, '#$1');
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v) ? v.toLowerCase() : null;
}

function semanticForeground(style: SemanticTokenStyle): string | undefined {
  return typeof style === 'string' ? style : style.foreground;
}

function withSemanticForeground(style: SemanticTokenStyle, hex: string | undefined): SemanticTokenStyle {
  const base: Exclude<SemanticTokenStyle, string> = typeof style === 'string' ? {} : { ...style };
  delete base.foreground;
  const hasFlags = Object.values(base).some(Boolean);
  if (hex && !hasFlags) return hex;
  return hex ? { ...base, foreground: hex } : base;
}

/**
 * Whether (and how) the selected key is illustrated in the workbench mock,
 * with a button to re-flash it. Keys with no exact region fall back to their
 * family's region (e.g. statusBar.debuggingBackground → the status bar).
 */
function PreviewCoverageRow({ colorKey }: { colorKey: string }) {
  const requestReveal = useUiStore((s) => s.requestReveal);
  const [coverage, setCoverage] = useState<'exact' | 'family' | 'none'>('none');
  useEffect(() => {
    const match = findRevealTargets(document, colorKey);
    setCoverage(match ? (match.exact ? 'exact' : 'family') : 'none');
  }, [colorKey]);

  return (
    <div className="mt-1 flex items-center justify-between text-zinc-400">
      <span>In preview</span>
      {coverage === 'none' ? (
        <span className="text-zinc-600" title="Nothing in the preview mock illustrates this key yet">
          not illustrated
        </span>
      ) : (
        <button
          className="rounded text-sky-300 hover:text-sky-200 hover:underline"
          title={
            coverage === 'exact'
              ? 'Flash the preview element(s) that use this color'
              : 'This exact state isn’t mocked — flash the region it belongs to'
          }
          onClick={() => requestReveal(colorKey)}
        >
          {coverage === 'exact' ? 'visible — flash ✦' : 'region only — flash ✦'}
        </button>
      )}
    </div>
  );
}

/** What the inspector is editing, resolved from the current selection. */
interface Target {
  title: string;
  subtitle: string;
  value: string | null;
  onChange: (hex: string | undefined) => void;
  /** Shown when the value is set; clicking clears it. */
  clearLabel: string | null;
  /** color-key selections also show the VS Code default. */
  defaultValue?: string | null;
  isSet?: boolean;
  /** Differs from the theme's starting point (template or import). */
  changed?: boolean;
  /** Raw dotted key, shown as a tooltip on the (human-readable) title. */
  rawKey?: string;
}

export function InspectorPanel() {
  const theme = useActiveTheme();
  const baseline = useActiveBaseline();
  const { setColor, setTokenColors, setSemanticTokenColors } = useThemeStore();
  const { selection, select, inspectorCollapsed, setInspectorCollapsed } = useUiStore();

  let target: Target | null = null;

  if (selection?.kind === 'color') {
    const key = selection.key;
    const isSet = key in theme.colors;
    const defaultValue = defaults[theme.type][key] ?? null;
    const base = baseline ?? theme.colors;
    target = {
      title: fullLabelForKey(key),
      subtitle: describeKey(key),
      value: theme.colors[key] ?? defaultValue,
      onChange: (hex) => setColor(key, hex),
      clearLabel: isSet ? 'Clear — use VS Code default' : null,
      defaultValue,
      isSet,
      changed: (theme.colors[key]?.toLowerCase() ?? null) !== (base[key]?.toLowerCase() ?? null),
      rawKey: key,
    };
  } else if (selection?.kind === 'token') {
    const rule = theme.tokenColors[selection.index];
    if (rule) {
      const scopes = Array.isArray(rule.scope) ? rule.scope.join(', ') : (rule.scope ?? '(global)');
      target = {
        title: rule.name || scopes,
        subtitle: `Syntax rule · ${scopes}`,
        value: rule.settings.foreground ?? null,
        onChange: (hex) => {
          const next = [...theme.tokenColors];
          next[selection.index] = { ...rule, settings: { ...rule.settings, foreground: hex } };
          setTokenColors(next);
        },
        clearLabel: rule.settings.foreground ? 'Remove foreground' : null,
      };
    }
  } else if (selection?.kind === 'semantic') {
    const style = theme.semanticTokenColors?.[selection.selector];
    if (style !== undefined) {
      target = {
        title: selection.selector,
        subtitle: 'Semantic selector · foreground',
        value: semanticForeground(style) ?? null,
        onChange: (hex) =>
          setSemanticTokenColors({ ...theme.semanticTokenColors, [selection.selector]: withSemanticForeground(style, hex) }),
        clearLabel: semanticForeground(style) ? 'Remove foreground' : null,
      };
    }
  }

  const [hexInput, setHexInput] = useState('');
  const value = target?.value ?? null;
  useEffect(() => {
    setHexInput(value ?? '');
  }, [value, selection]);

  // The strip shown on lg+ in place of the panel when it's collapsed.
  const collapsedStrip = (
    <button
      className={`hidden w-3 shrink-0 items-center justify-center border-l border-zinc-800 bg-zinc-900 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 ${
        inspectorCollapsed ? 'lg:flex' : ''
      }`}
      onClick={() => setInspectorCollapsed(false)}
      title="Show inspector"
      aria-label="Show inspector"
    >
      <ChevronLeft size={12} />
    </button>
  );

  if (!target) {
    // Below lg there's no empty-state panel — the preview gets the space.
    return (
      <>
        <div
          className={`hidden w-[290px] shrink-0 flex-col gap-4 border-l border-zinc-800 bg-zinc-900 p-4 ${
            inspectorCollapsed ? 'lg:hidden' : 'lg:flex'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Inspector</p>
            <button
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              onClick={() => setInspectorCollapsed(true)}
              title="Collapse inspector"
              aria-label="Collapse inspector"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <p className="pt-2 text-center text-[13px] text-zinc-500">
            Select a UI color, a syntax rule, or a semantic selector — or click any part of the preview to jump to its
            color.
          </p>
          <PaletteSwatches onPick={null} />
        </div>
        {collapsedStrip}
      </>
    );
  }

  const { onChange } = target;

  return (
    <>
      {/* A right-hand column on lg+; a dismissible bottom sheet below. */}
      <div
        className={`inspector-sheet fixed inset-x-0 bottom-0 z-40 flex max-h-[60dvh] flex-col gap-3 overflow-y-auto rounded-t-xl border-t border-zinc-700 bg-zinc-900 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] lg:static lg:z-auto lg:max-h-none lg:w-[290px] lg:shrink-0 lg:rounded-none lg:border-l lg:border-t-0 lg:border-zinc-800 lg:shadow-none ${
          inspectorCollapsed ? 'lg:hidden' : ''
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2
              title={target.rawKey}
              className={`break-all text-[13px] font-semibold text-zinc-100 ${target.rawKey ? '' : 'font-mono'}`}
            >
              {target.title}
            </h2>
            <p className="mt-1 text-[12px] leading-snug text-zinc-400">{target.subtitle}</p>
          </div>
          <button
            className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 lg:hidden"
            onClick={() => select(null)}
            aria-label="Close inspector"
          >
            ✕
          </button>
          <button
            className="hidden shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 lg:block"
            onClick={() => setInspectorCollapsed(true)}
            title="Collapse inspector"
            aria-label="Collapse inspector"
          >
            <ChevronRight size={14} />
          </button>
        </div>

      <HexAlphaColorPicker
        color={value ?? '#00000000'}
        onChange={(c) => onChange(c)}
        style={{ width: '100%' }}
      />

      <div className="flex items-center gap-2">
        <span
          className="size-8 shrink-0 rounded border border-zinc-600"
          style={{
            background: value
              ? `linear-gradient(${value}, ${value}), repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 0 0 / 10px 10px`
              : 'repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 0 0 / 10px 10px',
          }}
        />
        <input
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 font-mono text-[12px] text-zinc-200"
          value={hexInput}
          onChange={(e) => {
            setHexInput(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) onChange(hex);
          }}
          placeholder="#rrggbbaa"
          spellCheck={false}
        />
      </div>

      <PaletteSwatches onPick={(hex) => onChange(hex)} />

      {selection?.kind === 'color' && (
        <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2 text-[12px]">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Status</span>
            <span className={target.changed ? 'text-sky-300' : target.isSet ? 'text-zinc-300' : 'text-zinc-500'}>
              {target.changed ? 'changed by you' : target.isSet ? 'set in theme' : 'inherited default'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-zinc-400">
            <span>VS Code default</span>
            <span className="flex items-center gap-1.5 font-mono">
              {target.defaultValue ? (
                <>
                  <span
                    className="inline-block size-3 rounded-sm border border-zinc-600"
                    style={{ background: target.defaultValue }}
                  />
                  {target.defaultValue}
                </>
              ) : (
                <span className="text-zinc-600">none</span>
              )}
            </span>
          </div>
          <PreviewCoverageRow colorKey={selection.key} />
        </div>
      )}

      {target.clearLabel && (
        <button
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[12px] text-zinc-300 hover:bg-zinc-700"
          onClick={() => onChange(undefined)}
        >
          {target.clearLabel}
        </button>
      )}
      </div>
      {collapsedStrip}
    </>
  );
}
