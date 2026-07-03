import { useMemo, type MouseEvent } from 'react';
import { useActiveTheme } from '../store/themeStore';
import { useUiStore } from '../store/uiStore';
import { themeToCssVars, cssVar } from '../theme/cssVars';
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
  const vars = useMemo(() => themeToCssVars(theme), [theme]);

  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest('[data-keys]');
    const key = el?.getAttribute('data-keys')?.split(' ')[0];
    if (key) {
      e.stopPropagation();
      selectKey(key);
    }
  };

  return (
    <div
      style={{
        ...vars,
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
