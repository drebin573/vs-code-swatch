import type { ReactNode } from 'react';
import { cssVar } from '../theme/cssVars';
import { AccountIcon, DebugIcon, ExtensionsIcon, FilesIcon, GearIcon, GitIcon, SearchIcon } from './icons';

function Item({
  icon,
  active,
  badge,
}: {
  icon: ReactNode;
  active?: boolean;
  badge?: number;
}) {
  return (
    <div
      data-keys={
        active
          ? 'activityBar.foreground activityBar.activeBorder activityBar.background'
          : 'activityBar.inactiveForeground activityBar.background'
      }
      className="relative flex h-11 w-full items-center justify-center"
      style={{
        color: active ? cssVar('activityBar.foreground') : cssVar('activityBar.inactiveForeground'),
        borderLeft: `2px solid ${active ? cssVar('activityBar.activeBorder') : 'transparent'}`,
        marginRight: 2,
      }}
    >
      {icon}
      {badge !== undefined && (
        <span
          data-keys="activityBarBadge.background activityBarBadge.foreground"
          className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold"
          style={{
            background: cssVar('activityBarBadge.background'),
            color: cssVar('activityBarBadge.foreground'),
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function ActivityBar() {
  return (
    <div
      data-keys="activityBar.background activityBar.border"
      className="flex w-12 shrink-0 flex-col items-center pt-1"
      style={{
        background: cssVar('activityBar.background'),
        borderRight: `1px solid ${cssVar('activityBar.border', 'transparent')}`,
      }}
    >
      <Item icon={<FilesIcon size={22} />} active />
      <Item icon={<SearchIcon size={22} />} />
      <Item icon={<GitIcon size={22} />} badge={3} />
      <Item icon={<DebugIcon size={22} />} />
      <Item icon={<ExtensionsIcon size={22} />} />
      <div className="flex-1" />
      <Item icon={<AccountIcon size={22} />} />
      <Item icon={<GearIcon size={22} />} />
    </div>
  );
}
