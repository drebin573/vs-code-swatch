import type { ReactNode } from 'react';
import { cssVar } from '../theme/cssVars';
import { ChevronDown, ChevronRight, EllipsisIcon, FileIcon, FolderIcon } from './icons';

type Row = {
  label: string;
  depth: number;
  kind: 'folder-open' | 'folder' | 'file';
  state?: 'selected' | 'hover' | 'inactive';
  git?: 'modified' | 'added' | 'untracked';
};

const rows: Row[] = [
  { label: 'src', depth: 0, kind: 'folder-open' },
  { label: 'palette', depth: 1, kind: 'folder' },
  { label: 'preview', depth: 1, kind: 'folder-open' },
  { label: 'Workbench.tsx', depth: 2, kind: 'file', state: 'selected', git: 'modified' },
  { label: 'StatusBar.tsx', depth: 2, kind: 'file', state: 'hover' },
  { label: 'icons.tsx', depth: 2, kind: 'file', git: 'added' },
  { label: 'store.ts', depth: 1, kind: 'file', state: 'inactive' },
  { label: 'theme.json', depth: 1, kind: 'file', git: 'untracked' },
  { label: 'package.json', depth: 0, kind: 'file' },
  { label: 'README.md', depth: 0, kind: 'file' },
];

const gitKeys: Record<NonNullable<Row['git']>, string> = {
  modified: 'gitDecoration.modifiedResourceForeground',
  added: 'gitDecoration.addedResourceForeground',
  untracked: 'gitDecoration.untrackedResourceForeground',
};

function TreeRow({ row }: { row: Row }) {
  const stateKeys: Record<string, string> = {
    selected: 'list.activeSelectionBackground list.activeSelectionForeground',
    hover: 'list.hoverBackground list.hoverForeground',
    inactive: 'list.inactiveSelectionBackground',
  };
  const bg =
    row.state === 'selected'
      ? cssVar('list.activeSelectionBackground')
      : row.state === 'hover'
        ? cssVar('list.hoverBackground')
        : row.state === 'inactive'
          ? cssVar('list.inactiveSelectionBackground')
          : 'transparent';
  const fg = row.git
    ? cssVar(gitKeys[row.git])
    : row.state === 'selected'
      ? cssVar('list.activeSelectionForeground', 'inherit')
      : 'inherit';

  let icon: ReactNode;
  if (row.kind === 'file') icon = <FileIcon size={14} className="opacity-80" />;
  else icon = <FolderIcon size={14} className="opacity-80" />;

  return (
    <div
      data-keys={row.git ? gitKeys[row.git] : row.state ? stateKeys[row.state] : 'sideBar.foreground'}
      className="flex h-[22px] items-center gap-1.5 pr-2"
      style={{ paddingLeft: 8 + row.depth * 12, background: bg, color: fg }}
    >
      {row.kind === 'folder-open' ? (
        <ChevronDown size={14} className="opacity-70" />
      ) : row.kind === 'folder' ? (
        <ChevronRight size={14} className="opacity-70" />
      ) : (
        <span className="w-[14px]" />
      )}
      {icon}
      <span className="truncate">{row.label}</span>
      {row.git === 'modified' && <span className="ml-auto text-[11px]">M</span>}
      {row.git === 'added' && <span className="ml-auto text-[11px]">A</span>}
      {row.git === 'untracked' && <span className="ml-auto text-[11px]">U</span>}
    </div>
  );
}

export function SideBar() {
  return (
    <div
      data-keys="sideBar.background sideBar.foreground sideBar.border"
      className="hidden w-[220px] shrink-0 flex-col sm:flex"
      style={{
        background: cssVar('sideBar.background'),
        color: cssVar('sideBar.foreground', cssVar('foreground')),
        borderRight: `1px solid ${cssVar('sideBar.border', 'transparent')}`,
      }}
    >
      <div
        data-keys="sideBarTitle.foreground"
        className="flex h-[35px] items-center justify-between px-4 text-[11px] uppercase tracking-wide"
        style={{ color: cssVar('sideBarTitle.foreground') }}
      >
        Explorer
        <EllipsisIcon size={14} />
      </div>
      <div
        data-keys="sideBarSectionHeader.background sideBarSectionHeader.foreground"
        className="flex h-[22px] items-center gap-1 px-1 text-[11px] font-bold uppercase"
        style={{
          background: cssVar('sideBarSectionHeader.background'),
          color: cssVar('sideBarSectionHeader.foreground', 'inherit'),
        }}
      >
        <ChevronDown size={14} />
        codeswatch
      </div>
      <div className="flex-1 overflow-hidden py-0.5">
        {rows.map((r) => (
          <TreeRow key={r.label} row={r} />
        ))}
      </div>
    </div>
  );
}
