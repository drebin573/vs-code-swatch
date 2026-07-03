import { cssVar } from '../theme/cssVars';
import { ChevronRight, CircleDot, CloseIcon, EllipsisIcon, SplitIcon } from './icons';
import { CodeView } from './CodeView';

const tabs = [
  { label: 'Workbench.tsx', active: true, dirty: false },
  { label: 'store.ts', active: false, dirty: true },
  { label: 'theme.json', active: false, dirty: false },
];

function Tab({ label, active, dirty }: (typeof tabs)[number]) {
  return (
    <div
      data-keys={
        active
          ? 'tab.activeBackground tab.activeForeground tab.activeBorderTop tab.activeBorder'
          : 'tab.inactiveBackground tab.inactiveForeground tab.border'
      }
      className="relative flex h-[35px] items-center gap-2 px-3"
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
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        data-keys="editorGroupHeader.tabsBackground editorGroupHeader.tabsBorder"
        className="flex h-[35px] shrink-0 items-center"
        style={{
          background: cssVar('editorGroupHeader.tabsBackground'),
          borderBottom: `1px solid ${cssVar('editorGroupHeader.tabsBorder', 'transparent')}`,
        }}
      >
        {tabs.map((t) => (
          <Tab key={t.label} {...t} />
        ))}
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
          Workbench.tsx
        </span>
      </div>
      <CodeView />
    </div>
  );
}
