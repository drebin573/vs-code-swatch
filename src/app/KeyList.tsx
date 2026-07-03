import { useMemo, useState } from 'react';
import { colorGroups, resolveColor } from '../theme/defaults';
import { useActiveTheme } from '../store/themeStore';
import { useUiStore } from '../store/uiStore';
import type { ThemeDoc } from '../theme/types';

function Swatch({ value }: { value: string | null }) {
  return (
    <span
      className="inline-block size-4 shrink-0 rounded-sm border border-zinc-600"
      style={{
        background:
          value ??
          'repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 0 0 / 8px 8px',
      }}
    />
  );
}

function KeyRow({ theme, colorKey }: { theme: ThemeDoc; colorKey: string }) {
  const { selectedKey, selectKey } = useUiStore();
  const isSet = colorKey in theme.colors;
  const value = resolveColor(theme, colorKey);
  return (
    <button
      className={`flex w-full items-center gap-2 rounded px-2 py-[3px] text-left text-[12px] ${
        selectedKey === colorKey ? 'bg-sky-900/60 text-sky-100' : 'text-zinc-300 hover:bg-zinc-800'
      }`}
      onClick={() => selectKey(colorKey)}
    >
      <Swatch value={value} />
      <span className="min-w-0 flex-1 truncate font-mono text-[11.5px]">{colorKey}</span>
      {isSet && <span className="size-1.5 shrink-0 rounded-full bg-sky-400" title="Set in this theme" />}
    </button>
  );
}

export function KeyList() {
  const theme = useActiveTheme();
  const { search, setSearch } = useUiStore();
  const [open, setOpen] = useState<Record<string, boolean>>({ 'Base colors': true });

  const q = search.trim().toLowerCase();
  const visibleGroups = useMemo(() => {
    if (!q) return colorGroups;
    return colorGroups
      .map((g) => ({
        ...g,
        keys: g.keys.filter(
          (k) => k.key.toLowerCase().includes(q) || k.description.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.keys.length > 0);
  }, [q]);

  return (
    <div className="flex w-[260px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900">
      <div className="p-2">
        <input
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-500"
          placeholder="Search 944 colors…  (e.g. terminal.ansi)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-4">
        {visibleGroups.map((g) => {
          const expanded = q ? true : (open[g.group] ?? false);
          const setCount = g.keys.filter((k) => k.key in theme.colors).length;
          return (
            <div key={g.group}>
              <button
                className="mt-1 flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 hover:bg-zinc-800"
                onClick={() => setOpen((o) => ({ ...o, [g.group]: !expanded }))}
              >
                <span className="w-3">{expanded ? '▾' : '▸'}</span>
                <span className="flex-1">{g.group}</span>
                {setCount > 0 && <span className="rounded bg-sky-900 px-1.5 text-[10px] text-sky-200">{setCount}</span>}
                <span className="text-zinc-600">{g.keys.length}</span>
              </button>
              {expanded && g.keys.map((k) => <KeyRow key={k.key} theme={theme} colorKey={k.key} />)}
            </div>
          );
        })}
        {visibleGroups.length === 0 && <p className="px-3 py-4 text-[12px] text-zinc-500">No colors match “{search}”.</p>}
      </div>
    </div>
  );
}
