import { cssVar } from '../theme/cssVars';
import { useUiStore } from '../store/uiStore';
import { samples } from '../data/samples';
import { ChevronRight, CircleDot, CloseIcon, EllipsisIcon, SplitIcon } from './icons';
import { CodeView } from './CodeView';

export const fileNames: Record<string, string> = {
  tsx: 'Workbench.tsx',
  python: 'palette.py',
  rust: 'mapper.rs',
  go: 'rank.go',
  css: 'workbench.css',
  json: 'theme.json',
  markdown: 'README.md',
};

function Tab({ label, active, dirty, onSelect }: { label: string; active: boolean; dirty: boolean; onSelect?: () => void }) {
  return (
    <div
      data-keys={
        active
          ? 'tab.activeBackground tab.activeForeground tab.activeBorderTop tab.activeBorder'
          : 'tab.inactiveBackground tab.inactiveForeground tab.border'
      }
      className="relative flex h-[35px] items-center gap-2 px-3"
      onClick={
        onSelect &&
        ((e) => {
          e.stopPropagation();
          onSelect();
        })
      }
      style={{
        background: active ? cssVar('tab.activeBackground') : cssVar('tab.inactiveBackground'),
        color: active ? cssVar('tab.activeForeground') : cssVar('tab.inactiveForeground'),
        borderRight: `1px solid ${cssVar('tab.border', 'transparent')}`,
        borderTop: `1px solid ${active ? cssVar('tab.activeBorderTop', 'transparent') : 'transparent'}`,
        borderBottom: active ? `1px solid ${cssVar('tab.activeBorder', 'transparent')}` : undefined,
      }}
    >
      <span>{label}</span>
      {dirty ? <CircleDot size={12} /> : <CloseIcon size={12} className="opacity-60" />}
    </div>
  );
}

export function EditorArea() {
  const { previewLanguage, setPreviewLanguage } = useUiStore();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        data-keys="editorGroupHeader.tabsBackground editorGroupHeader.tabsBorder"
        className="flex h-[35px] shrink-0 items-center overflow-hidden"
        style={{
          background: cssVar('editorGroupHeader.tabsBackground'),
          borderBottom: `1px solid ${cssVar('editorGroupHeader.tabsBorder', 'transparent')}`,
        }}
      >
        {samples.map((s, i) => {
          const active = s.lang === previewLanguage;
          return (
            <Tab
              key={s.lang}
              label={fileNames[s.lang] ?? s.label}
              active={active}
              dirty={i === 1}
              // Inactive tabs switch the previewed file; the active tab
              // falls through to click-to-edit its color keys.
              onSelect={active ? undefined : () => setPreviewLanguage(s.lang)}
            />
          );
        })}
        <div className="flex-1" />
        <div className="flex items-center gap-2 px-2 opacity-70">
          <SplitIcon size={14} />
          <EllipsisIcon size={14} />
        </div>
      </div>
      <div
        data-keys="breadcrumb.background breadcrumb.foreground"
        className="flex h-[22px] shrink-0 items-center gap-0.5 px-4 text-[12px]"
        style={{
          background: cssVar('breadcrumb.background', cssVar('editor.background')),
          color: cssVar('breadcrumb.foreground'),
        }}
      >
        src <ChevronRight size={12} /> preview <ChevronRight size={12} />{' '}
        <span data-keys="breadcrumb.focusForeground" style={{ color: cssVar('breadcrumb.focusForeground', 'inherit') }}>
          {fileNames[previewLanguage] ?? previewLanguage}
        </span>
      </div>
      <CodeView />
    </div>
  );
}
