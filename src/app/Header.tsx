import { useActiveTheme, useThemeStore, undo, redo } from '../store/themeStore';
import { usePaletteStore } from '../store/paletteStore';
import { ExportMenu } from './ExportMenu';
import darkModern from '../data/templates/dark-modern.json';
import lightModern from '../data/templates/light-modern.json';
import type { ThemeDoc } from '../theme/types';

const btn =
  'rounded px-2.5 py-1 text-[12px] text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700 bg-zinc-800 cursor-pointer';

export function Header() {
  const theme = useActiveTheme();
  const { themes, order, activeId, setActive, addTheme, duplicateTheme, deleteTheme, renameTheme, setThemeType } =
    useThemeStore();
  const setImportOpen = usePaletteStore((s) => s.setImportOpen);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3">
      <span className="mr-2 select-none text-[14px] font-semibold tracking-tight text-zinc-100">
        <span className="text-sky-400">◈</span> Theme Forge
      </span>

      <select
        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[12px] text-zinc-200"
        value={activeId}
        onChange={(e) => setActive(e.target.value)}
      >
        {order.map((id) => (
          <option key={id} value={id}>
            {themes[id]?.name}
          </option>
        ))}
      </select>

      <input
        className="w-40 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[12px] text-zinc-200"
        value={theme.name}
        onChange={(e) => renameTheme(e.target.value)}
        aria-label="Theme name"
      />

      <div className="flex overflow-hidden rounded border border-zinc-700 text-[12px]">
        {(['dark', 'light'] as const).map((t) => (
          <button
            key={t}
            className={`px-2.5 py-1 capitalize ${theme.type === t ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            onClick={() => setThemeType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mx-1 h-5 w-px bg-zinc-700" />

      <button className={btn} onClick={() => addTheme({ ...(darkModern as unknown as ThemeDoc), name: 'New Dark Theme' })}>
        New dark
      </button>
      <button className={btn} onClick={() => addTheme({ ...(lightModern as unknown as ThemeDoc), name: 'New Light Theme' })}>
        New light
      </button>
      <button className={btn} onClick={() => duplicateTheme(activeId)}>
        Duplicate
      </button>
      <button
        className={btn}
        onClick={() => {
          if (order.length > 1 && confirm(`Delete "${theme.name}"?`)) deleteTheme(activeId);
        }}
      >
        Delete
      </button>

      <div className="flex-1" />

      <button className={btn} onClick={undo} title="Undo (⌘Z)">
        ↩
      </button>
      <button className={btn} onClick={redo} title="Redo (⇧⌘Z)">
        ↪
      </button>

      <div className="mx-1 h-5 w-px bg-zinc-700" />

      <button className={btn} onClick={() => setImportOpen(true)}>
        Import…
      </button>
      <ExportMenu />
    </header>
  );
}
