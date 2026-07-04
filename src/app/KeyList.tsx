import { useEffect, useMemo, useRef, useState } from 'react';
import { allColorKeys, colorGroups, labelForKey, resolveColor, searchTextForKey } from '../theme/defaults';
import { changedColorKeys, useActiveBaseline, useActiveTheme } from '../store/themeStore';
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

function KeyRow({ theme, colorKey, changed }: { theme: ThemeDoc; colorKey: string; changed: boolean }) {
  const { selection, selectKey } = useUiStore();
  const isSelected = selection?.kind === 'color' && selection.key === colorKey;
  const value = resolveColor(theme, colorKey);
  return (
    <button
      data-list-key={colorKey}
      title={colorKey}
      className={`flex w-full items-center gap-2 rounded px-2 py-[3px] text-left text-[12px] ${
        isSelected ? 'bg-sky-900/60 text-sky-100' : 'text-zinc-300 hover:bg-zinc-800'
      }`}
      onClick={() => selectKey(colorKey, 'list')}
    >
      <Swatch value={value} />
      <span className="min-w-0 flex-1 truncate">{labelForKey(colorKey)}</span>
      {changed && <span className="size-1.5 shrink-0 rounded-full bg-sky-400" title="Changed by you" />}
    </button>
  );
}

// Module-level so remounts (tab switches) don't replay an old reveal request.
let consumedListRevealTick = 0;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function KeyList() {
  const theme = useActiveTheme();
  const baseline = useActiveBaseline();
  const changed = useMemo(() => changedColorKeys(theme, baseline), [theme, baseline]);
  const { search, setSearch, listReveal } = useUiStore();
  const [open, setOpen] = useState<Record<string, boolean>>({ 'Base colors': true });
  const listRef = useRef<HTMLDivElement>(null);

  const q = search.trim().toLowerCase();
  const visibleGroups = useMemo(() => {
    const rawTokens = q.split(/\s+/).filter(Boolean);
    if (rawTokens.length === 0) return colorGroups;
    // Dots in a query mean key-path words: "terminal.ansi" → "terminal ansi".
    const wordTokens = rawTokens.map((t) => t.replace(/\./g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const descRes = rawTokens.map((t) => new RegExp('\\b' + escapeRegExp(t), 'i'));
    // Strictest tier that matches anything wins: word-split key text (substrings
    // can't span word joints), then raw key ("statusbar"), then plain-English
    // word starts in descriptions ("drag").
    const tiers: ((k: (typeof colorGroups)[number]['keys'][number]) => boolean)[] = [
      (k) => wordTokens.every((t) => searchTextForKey(k.key).includes(t)),
      (k) => rawTokens.every((t) => k.key.toLowerCase().includes(t)),
      (k) => descRes.every((r) => r.test(k.description)),
    ];
    for (const matches of tiers) {
      const groups = colorGroups
        .map((g) => ({ ...g, keys: g.keys.filter(matches) }))
        .filter((g) => g.keys.length > 0);
      if (groups.length > 0) return groups;
    }
    return [];
  }, [q]);
  const visibleKeys = useMemo(
    () => new Set(visibleGroups.flatMap((g) => g.keys.map((k) => k.key))),
    [visibleGroups],
  );

  // Preview clicks reveal the key here too: expand its group, drop a search
  // filter that would hide it, and scroll its row into view.
  useEffect(() => {
    if (!listReveal || listReveal.tick === consumedListRevealTick) return;
    consumedListRevealTick = listReveal.tick;
    const group = colorGroups.find((g) => g.keys.some((k) => k.key === listReveal.key));
    if (!group) return;
    if (q && !visibleKeys.has(listReveal.key)) {
      useUiStore.getState().setSearch('');
    }
    setOpen((o) => ({ ...o, [group.group]: true }));
    // Next macrotask: the expanded/unfiltered rows have rendered by then.
    const id = window.setTimeout(() => {
      listRef.current
        ?.querySelector(`[data-list-key="${listReveal.key}"]`)
        ?.scrollIntoView?.({ block: 'nearest' });
    }, 0);
    return () => window.clearTimeout(id);
  }, [listReveal, q, visibleKeys]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-2">
        <input
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-500"
          placeholder={`Search ${allColorKeys.length} colors…  (e.g. ansi bright)`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-1 pb-4">
        {visibleGroups.map((g) => {
          const expanded = q ? true : (open[g.group] ?? false);
          const changedCount = g.keys.filter((k) => changed.has(k.key)).length;
          return (
            <div key={g.group}>
              <button
                className="mt-1 flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 hover:bg-zinc-800"
                onClick={() => setOpen((o) => ({ ...o, [g.group]: !expanded }))}
              >
                <span className="w-3">{expanded ? '▾' : '▸'}</span>
                <span className="flex-1">{g.group}</span>
                {changedCount > 0 && (
                  <span
                    className="min-w-[30px] rounded-full bg-sky-900 px-1.5 py-px text-center text-[10px] tabular-nums text-sky-200"
                    title={`${changedCount} changed by you`}
                  >
                    {changedCount}
                  </span>
                )}
                <span
                  className="min-w-[30px] rounded-full bg-zinc-800/80 px-1.5 py-px text-center text-[10px] tabular-nums text-zinc-500"
                  title={`${g.keys.length} colors in this group`}
                >
                  {g.keys.length}
                </span>
              </button>
              {expanded &&
                g.keys.map((k) => (
                  <KeyRow key={k.key} theme={theme} colorKey={k.key} changed={changed.has(k.key)} />
                ))}
            </div>
          );
        })}
        {visibleGroups.length === 0 && <p className="px-3 py-4 text-[12px] text-zinc-500">No colors match “{search}”.</p>}
      </div>
    </div>
  );
}
