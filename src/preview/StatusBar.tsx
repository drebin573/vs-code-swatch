import { cssVar } from '../theme/cssVars';
import { BellIcon, BranchIcon, ErrorIcon, RemoteIcon, SyncIcon, WarningIcon } from './icons';

export function StatusBar() {
  return (
    <div
      data-keys="statusBar.background statusBar.foreground statusBar.border"
      className="flex h-[22px] shrink-0 items-center gap-3 overflow-hidden whitespace-nowrap pr-3 text-[11.5px]"
      style={{
        background: cssVar('statusBar.background'),
        color: cssVar('statusBar.foreground'),
        borderTop: `1px solid ${cssVar('statusBar.border', 'transparent')}`,
      }}
    >
      <span
        data-keys="statusBarItem.remoteBackground statusBarItem.remoteForeground"
        className="flex h-full items-center gap-1 px-2"
        style={{
          background: cssVar('statusBarItem.remoteBackground'),
          color: cssVar('statusBarItem.remoteForeground'),
        }}
      >
        <RemoteIcon size={12} />
      </span>
      <span className="flex items-center gap-1">
        <BranchIcon size={13} /> main
        <SyncIcon size={12} className="ml-0.5" />
      </span>
      <span className="flex items-center gap-1">
        <ErrorIcon size={12} /> 0 <WarningIcon size={12} /> 2
      </span>
      <div className="flex-1" />
      <span className="hidden sm:inline">Ln 7, Col 42</span>
      <span className="hidden md:inline">Spaces: 2</span>
      <span className="hidden md:inline">UTF-8</span>
      <span>TypeScript React</span>
      <BellIcon size={13} />
    </div>
  );
}
