import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useActiveTheme } from '../store/themeStore';
import { useUiStore } from '../store/uiStore';
import { themeToCssVars, cssVar, cssVarName } from '../theme/cssVars';
import { findRevealTargets, flashColor } from './reveal';
import { TitleBar } from './TitleBar';
import { ActivityBar } from './ActivityBar';
import { SideBar } from './SideBar';
import { EditorArea } from './EditorArea';
import { PanelArea } from './PanelArea';
import { StatusBar } from './StatusBar';

/**
 * Full VS Code workbench mockup. Every color comes from a --vscode-* CSS
 * variable so the preview and exported theme can never drift apart.
 * Regions carry data-keys="space separated color keys"; clicking one selects
 * its first key in the editor panel.
 */
export function Workbench() {
  const theme = useActiveTheme();
  const selectKey = useUiStore((s) => s.selectKey);
  const reveal = useUiStore((s) => s.reveal);
  const vars = useMemo(() => themeToCssVars(theme), [theme]);
  const rootRef = useRef<HTMLDivElement>(null);
  // Reveal blinks the key's --vscode-* variable, so exactly the pixels drawn
  // with that color flicker: whole areas for backgrounds, glyphs for text.
  const [flash, setFlash] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!reveal || !root) return;
    const match = findRevealTargets(root, reveal.key);
    if (!match) return;
    match.els[0].scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    // Family fallbacks blink the matched region via its primary key instead.
    const key = match.exact ? reveal.key : (match.els[0].dataset.keys ?? '').split(' ')[0];
    // Base comes from vars, not getComputedStyle: the DOM may still be painted
    // with a previous flash's override when reveals fire back-to-back.
    const varName = cssVarName(key);
    const base = (vars as Record<string, string>)[varName];
    const override = { [varName]: flashColor(base) };
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    setFlash(override);
    at(140, () => setFlash(null));
    at(260, () => setFlash(override));
    at(400, () => setFlash(null));
    return () => {
      timers.forEach(clearTimeout);
      setFlash(null);
    };
  }, [reveal]);

  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest('[data-keys]');
    const key = el?.getAttribute('data-keys')?.split(' ')[0];
    if (key) {
      e.stopPropagation();
      selectKey(key, 'preview');
    }
  };

  return (
    <div
      ref={rootRef}
      style={{
        ...vars,
        ...flash,
        color: cssVar('foreground'),
        background: cssVar('editor.background'),
      }}
      className="flex h-full min-h-0 flex-col overflow-hidden text-[13px] antialiased [&_[data-keys]]:cursor-pointer"
      onClick={onClick}
    >
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <ActivityBar />
        <SideBar />
        <div className="flex min-w-0 flex-1 flex-col">
          <EditorArea />
          <PanelArea />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
