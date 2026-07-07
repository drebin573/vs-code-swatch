import { cssVar } from '../theme/cssVars';

const menus = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'];

export function TitleBar() {
  return (
    <div
      data-keys="titleBar.activeBackground titleBar.activeForeground titleBar.border"
      className="flex h-[32px] shrink-0 items-center gap-1 px-2"
      style={{
        background: cssVar('titleBar.activeBackground'),
        color: cssVar('titleBar.activeForeground'),
        borderBottom: `1px solid ${cssVar('titleBar.border', 'transparent')}`,
      }}
    >
      <div className="mr-1 flex items-center gap-2 pl-1">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </div>
      {menus.map((m, i) => (
        <span
          key={m}
          data-keys={i === 0 ? 'menubar.selectionBackground menubar.selectionForeground' : undefined}
          className={`rounded px-1.5 py-0.5 ${i > 1 ? 'hidden md:inline' : ''}`}
          style={
            i === 0
              ? {
                  background: cssVar('menubar.selectionBackground'),
                  color: cssVar('menubar.selectionForeground', 'inherit'),
                }
              : undefined
          }
        >
          {m}
        </span>
      ))}
      <div className="min-w-0 flex-1" />
      <span className="truncate pr-2 opacity-80">my-theme — vs-codeswatch</span>
    </div>
  );
}
