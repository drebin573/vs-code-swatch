import { useState } from 'react';
import { useActiveTheme, useThemeStore, undo, redo } from '../store/themeStore';
import { usePaletteStore } from '../store/paletteStore';
import { useUiStore } from '../store/uiStore';
import { ExportMenu } from './ExportMenu';
import darkModern from '../data/templates/dark-modern.json';
import lightModern from '../data/templates/light-modern.json';
import type { ThemeDoc } from '../theme/types';

const btn =
  'rounded px-2.5 py-1 text-[12px] text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700 bg-zinc-800 cursor-pointer';

// TODO: placeholder — swap for the real repo once it exists.
const GITHUB_URL = 'https://github.com/';

const iconLink = 'rounded p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100';

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <line x1="6" y1="2.5" x2="6" y2="13.5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3.5 2v4.5M3.5 9.5V14M8 2v7M8 12v2M12.5 2v2M12.5 7v7" />
      <path d="M1.6 7h3.8M6.1 10.5h3.8M10.6 4.5h3.8" />
    </svg>
  );
}

/** Reveal-behavior toggles shown in the preferences popover. */
function RevealPrefsFields() {
  const prefs = useUiStore((s) => s.prefs);
  const setRevealPref = useUiStore((s) => s.setRevealPref);
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Flash color in preview</p>
      <label className="flex cursor-pointer items-center gap-2 text-[12px] text-zinc-300">
        <input
          type="checkbox"
          className="accent-sky-500"
          checked={prefs.flashOnListSelect}
          onChange={(e) => setRevealPref({ flashOnListSelect: e.target.checked })}
        />
        When picking a color from the list
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-[12px] text-zinc-300">
        <input
          type="checkbox"
          className="accent-sky-500"
          checked={prefs.flashOnPreviewClick}
          onChange={(e) => setRevealPref({ flashOnPreviewClick: e.target.checked })}
        />
        When clicking the preview directly
      </label>
    </>
  );
}

export function Header() {
  const theme = useActiveTheme();
  const { themes, order, activeId, setActive, addTheme, duplicateTheme, deleteTheme, renameTheme, setThemeType } =
    useThemeStore();
  const setImportOpen = usePaletteStore((s) => s.setImportOpen);
  const { railOpen, setRailOpen } = useUiStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const typeToggle = (
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
  );

  const themeActions = (onDone?: () => void) => (
    <>
      <button
        className={btn}
        onClick={() => {
          addTheme({ ...(darkModern as unknown as ThemeDoc), name: 'New Dark Theme' });
          onDone?.();
        }}
      >
        New dark
      </button>
      <button
        className={btn}
        onClick={() => {
          addTheme({ ...(lightModern as unknown as ThemeDoc), name: 'New Light Theme' });
          onDone?.();
        }}
      >
        New light
      </button>
      <button
        className={btn}
        onClick={() => {
          duplicateTheme(activeId);
          onDone?.();
        }}
      >
        Duplicate
      </button>
      <button
        className={btn}
        onClick={() => {
          if (order.length > 1 && confirm(`Delete "${theme.name}"?`)) deleteTheme(activeId);
          onDone?.();
        }}
      >
        Delete
      </button>
    </>
  );

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-2 sm:px-3">
      <button
        className={`${btn} px-2 py-1.5 lg:hidden`}
        onClick={() => setRailOpen(!railOpen)}
        title="Toggle editor panel"
        aria-label="Toggle editor panel"
      >
        <PanelIcon />
      </button>

      <span className="select-none text-[14px] font-semibold tracking-tight text-zinc-100 md:mr-2">
        <span className="text-sky-400">◈</span>
        <span className="hidden md:inline"> Codeswatch</span>
      </span>

      <select
        className="min-w-0 max-w-44 flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[12px] text-zinc-200 sm:flex-none"
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
        className="hidden w-40 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[12px] text-zinc-200 xl:block"
        value={theme.name}
        onChange={(e) => renameTheme(e.target.value)}
        aria-label="Theme name"
      />

      <div className="hidden xl:block">{typeToggle}</div>

      <div className="mx-1 hidden h-5 w-px bg-zinc-700 xl:block" />

      <div className="hidden items-center gap-2 xl:flex">{themeActions()}</div>

      <div className="flex-1" />

      <button className={btn} onClick={undo} title="Undo (⌘Z)">
        ↩
      </button>
      <button className={btn} onClick={redo} title="Redo (⇧⌘Z)">
        ↪
      </button>

      <div className="mx-1 hidden h-5 w-px bg-zinc-700 md:block" />

      <button className={`${btn} hidden md:block`} onClick={() => setImportOpen(true)}>
        Import…
      </button>
      <ExportMenu />

      <div className="mx-1 hidden h-5 w-px bg-zinc-700 md:block" />

      <button
        className={iconLink}
        onClick={() => setSettingsOpen(!settingsOpen)}
        title="Preferences"
        aria-label="Preferences"
      >
        <GearIcon />
      </button>

      {settingsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
          <div className="fixed right-2 top-12 z-50 flex w-72 flex-col gap-2.5 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
            <RevealPrefsFields />
          </div>
        </>
      )}

      <a
        className={`${iconLink} hidden md:block`}
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        title="Source on GitHub"
        aria-label="GitHub"
      >
        <GitHubIcon />
      </a>

      <button
        className={`${btn} px-2 xl:hidden`}
        onClick={() => setMenuOpen(!menuOpen)}
        title="More actions"
        aria-label="More actions"
      >
        ⋯
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="fixed right-2 top-12 z-50 flex w-64 flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[12px] text-zinc-200"
              value={theme.name}
              onChange={(e) => renameTheme(e.target.value)}
              aria-label="Theme name"
            />
            {typeToggle}
            <div className="grid grid-cols-2 gap-2 [&>button]:w-full">{themeActions(() => setMenuOpen(false))}</div>
            <div className="h-px bg-zinc-800 md:hidden" />
            <button
              className={`${btn} md:hidden`}
              onClick={() => {
                setImportOpen(true);
                setMenuOpen(false);
              }}
            >
              Import…
            </button>
            <a
              className={`${btn} flex items-center justify-center gap-2 no-underline md:hidden`}
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
            >
              <GitHubIcon /> Source on GitHub
            </a>
          </div>
        </>
      )}
    </header>
  );
}
