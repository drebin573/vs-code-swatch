import { useState } from 'react';
import { useActiveTheme, useThemeStore } from '../store/themeStore';
import { useUiStore } from '../store/uiStore';
import type { TokenColorRule } from '../theme/types';

const STYLE_FLAGS = ['italic', 'bold', 'underline', 'strikethrough'] as const;

function scopeSummary(scope: TokenColorRule['scope']): string {
  if (!scope) return '(global)';
  const list = Array.isArray(scope) ? scope : [scope];
  return list.join(', ');
}

function RuleRow({
  rule,
  index,
  count,
  selected,
  onSelect,
  onChange,
  onDelete,
  onMove,
}: {
  rule: TokenColorRule;
  index: number;
  count: number;
  selected: boolean;
  onSelect: () => void;
  onChange: (r: TokenColorRule) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const fontStyle = rule.settings.fontStyle ?? '';
  const flags = new Set(fontStyle.split(/\s+/).filter(Boolean));

  const toggleFlag = (flag: string) => {
    if (flags.has(flag)) flags.delete(flag);
    else flags.add(flag);
    const next = STYLE_FLAGS.filter((f) => flags.has(f)).join(' ');
    onChange({ ...rule, settings: { ...rule.settings, fontStyle: next || undefined } });
  };

  return (
    <div className={`rounded border ${selected ? 'border-sky-700 bg-sky-950/30' : 'border-zinc-800 bg-zinc-900/60'}`}>
      <button
        className={`flex w-full items-center gap-2 px-2 py-1.5 text-left ${selected ? 'hover:bg-sky-950/50' : 'hover:bg-zinc-800/60'}`}
        onClick={() => {
          onSelect();
          setExpanded(selected ? !expanded : true);
        }}
      >
        <span
          className="size-4 shrink-0 rounded-sm border border-zinc-600"
          style={{ background: rule.settings.foreground ?? 'transparent' }}
        />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[12px] ${selected ? 'text-sky-100' : 'text-zinc-200'}`}>
            {rule.name || scopeSummary(rule.scope)}
          </span>
          {rule.name && <span className="block truncate font-mono text-[10.5px] text-zinc-500">{scopeSummary(rule.scope)}</span>}
        </span>
        <span
          className="text-[11px] italic text-zinc-500"
          style={{
            fontStyle: flags.has('italic') ? 'italic' : 'normal',
            fontWeight: flags.has('bold') ? 700 : 400,
          }}
        >
          {fontStyle}
        </span>
        <span className="text-zinc-600">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-zinc-800 p-2">
          <input
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[12px] text-zinc-200 placeholder-zinc-600"
            placeholder="Rule name (optional)"
            value={rule.name ?? ''}
            onChange={(e) => onChange({ ...rule, name: e.target.value || undefined })}
          />
          <textarea
            className="h-16 w-full resize-y rounded border border-zinc-700 bg-zinc-800 px-2 py-1 font-mono text-[11px] text-zinc-200 placeholder-zinc-600"
            placeholder="TextMate scopes, one per line or comma-separated"
            value={Array.isArray(rule.scope) ? rule.scope.join('\n') : (rule.scope ?? '')}
            spellCheck={false}
            onChange={(e) => {
              const scopes = e.target.value
                .split(/[\n,]/)
                .map((s) => s.trim())
                .filter(Boolean);
              onChange({ ...rule, scope: scopes.length === 1 ? scopes[0] : scopes });
            }}
          />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {STYLE_FLAGS.map((flag) => (
              <label key={flag} className="flex items-center gap-1 text-[11px] text-zinc-300">
                <input type="checkbox" checked={flags.has(flag)} onChange={() => toggleFlag(flag)} />
                {flag}
              </label>
            ))}
          </div>
          <div className="flex gap-1.5 pt-1">
            <button
              className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              ↑
            </button>
            <button
              className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
              disabled={index === count - 1}
              onClick={() => onMove(1)}
            >
              ↓
            </button>
            <div className="flex-1" />
            <button className="rounded border border-red-900 px-2 py-0.5 text-[11px] text-red-400 hover:bg-red-950" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TokenEditor() {
  const theme = useActiveTheme();
  const setTokenColors = useThemeStore((s) => s.setTokenColors);
  const { selection, select } = useUiStore();
  const rules = theme.tokenColors;

  const update = (i: number, rule: TokenColorRule) => {
    const next = [...rules];
    next[i] = rule;
    setTokenColors(next);
  };

  const selectedIndex = selection?.kind === 'token' ? selection.index : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
      <p className="px-1 text-[11px] leading-snug text-zinc-500">
        TextMate rules, applied top to bottom — later rules win. Click a rule to edit its color in the inspector; the
        code preview re-highlights live.
      </p>
      {rules.map((rule, i) => (
        <RuleRow
          key={i}
          rule={rule}
          index={i}
          count={rules.length}
          selected={selectedIndex === i}
          onSelect={() => select({ kind: 'token', index: i })}
          onChange={(r) => update(i, r)}
          onDelete={() => {
            setTokenColors(rules.filter((_, j) => j !== i));
            if (selectedIndex === i) select(null);
            else if (selectedIndex !== null && selectedIndex > i) select({ kind: 'token', index: selectedIndex - 1 });
          }}
          onMove={(dir) => {
            const next = [...rules];
            const [moved] = next.splice(i, 1);
            next.splice(i + dir, 0, moved);
            setTokenColors(next);
            if (selectedIndex === i) select({ kind: 'token', index: i + dir });
            else if (selectedIndex === i + dir) select({ kind: 'token', index: i });
          }}
        />
      ))}
      <button
        className="mt-1 rounded border border-dashed border-zinc-700 px-2 py-1.5 text-[12px] text-zinc-400 hover:bg-zinc-800"
        onClick={() => {
          setTokenColors([...rules, { name: 'New rule', scope: 'keyword', settings: { foreground: '#c586c0' } }]);
          select({ kind: 'token', index: rules.length });
        }}
      >
        + Add rule
      </button>
    </div>
  );
}
