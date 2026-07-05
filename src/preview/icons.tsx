import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16) => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'currentColor',
  xmlns: 'http://www.w3.org/2000/svg',
});

/* Simplified codicon-style glyphs, drawn for crispness at 16px. */

export const FilesIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M4.5 2.5h5l3 3v8h-8v-11z" strokeWidth="1.2" />
    <path d="M9.5 2.5v3h3" strokeWidth="1.2" />
    <path d="M4.5 5.5h-2v9h7v-2" strokeWidth="1.2" />
  </svg>
);

export const SearchIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <circle cx="6.5" cy="6.5" r="4" strokeWidth="1.4" />
    <path d="M9.5 9.5l4.5 4.5" strokeWidth="1.4" />
  </svg>
);

export const GitIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <circle cx="4.5" cy="3.5" r="1.6" strokeWidth="1.2" />
    <circle cx="4.5" cy="12.5" r="1.6" strokeWidth="1.2" />
    <circle cx="11.5" cy="6" r="1.6" strokeWidth="1.2" />
    <path d="M4.5 5.1v5.8M11.5 7.6c0 2.5-3 2.2-5 3.4" strokeWidth="1.2" />
  </svg>
);

export const DebugIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M4 3.5l9 4.5-9 4.5v-9z" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

export const ExtensionsIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <rect x="2.5" y="8" width="5" height="5" strokeWidth="1.2" />
    <rect x="8.5" y="8" width="5" height="5" strokeWidth="1.2" />
    <rect x="5.5" y="2.5" width="5" height="5" strokeWidth="1.2" />
  </svg>
);

export const GearIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <circle cx="8" cy="8" r="2.2" strokeWidth="1.2" />
    <path
      d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6L11 5M5 11l-1.4 1.4"
      strokeWidth="1.2"
    />
  </svg>
);

export const AccountIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <circle cx="8" cy="5.5" r="2.5" strokeWidth="1.2" />
    <path d="M2.8 13.5a5.5 5.5 0 0 1 10.4 0" strokeWidth="1.2" />
  </svg>
);

export const CloseIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M4 4l8 8M12 4l-8 8" strokeWidth="1.2" />
  </svg>
);

export const ChevronDown = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M4 6l4 4 4-4" strokeWidth="1.3" />
  </svg>
);

export const ChevronRight = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M6 4l4 4-4 4" strokeWidth="1.3" />
  </svg>
);

export const ChevronLeft = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M10 4l-4 4 4 4" strokeWidth="1.3" />
  </svg>
);

export const CircleDot = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="8" cy="8" r="3.5" />
  </svg>
);

export const ErrorIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <circle cx="8" cy="8" r="5.5" strokeWidth="1.2" />
    <path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" strokeWidth="1.2" />
  </svg>
);

export const WarningIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M8 2.5l6 11H2l6-11z" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M8 6.5v3.2" strokeWidth="1.2" />
    <circle cx="8" cy="11.4" r="0.4" fill="currentColor" stroke="none" />
  </svg>
);

export const BellIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M8 2.5a3.8 3.8 0 0 1 3.8 3.8c0 3.2 1.2 4.2 1.2 4.2H3s1.2-1 1.2-4.2A3.8 3.8 0 0 1 8 2.5zM6.8 12.8a1.3 1.3 0 0 0 2.4 0" strokeWidth="1.2" />
  </svg>
);

export const BranchIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <circle cx="5" cy="4" r="1.5" strokeWidth="1.1" />
    <circle cx="5" cy="12" r="1.5" strokeWidth="1.1" />
    <circle cx="11" cy="6" r="1.5" strokeWidth="1.1" />
    <path d="M5 5.5v5M11 7.5c0 2-2.5 2-4.5 3" strokeWidth="1.1" />
  </svg>
);

export const SyncIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M13 8a5 5 0 0 1-9 3M3 8a5 5 0 0 1 9-3" strokeWidth="1.2" />
    <path d="M12 2.5V5h-2.5M4 13.5V11h2.5" strokeWidth="1.2" />
  </svg>
);

export const SplitIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <rect x="2.5" y="3" width="11" height="10" strokeWidth="1.1" />
    <path d="M8 3v10" strokeWidth="1.1" />
  </svg>
);

export const EllipsisIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="3.5" cy="8" r="1" />
    <circle cx="8" cy="8" r="1" />
    <circle cx="12.5" cy="8" r="1" />
  </svg>
);

export const FolderIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M1.5 3.5h5l1.5 2h6.5v7h-13v-9z" strokeWidth="1.1" strokeLinejoin="round" />
  </svg>
);

export const FileIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M4 1.5h5.5l2.5 2.5v10.5h-8v-13z" strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M9.5 1.5V4H12" strokeWidth="1.1" />
  </svg>
);

export const TerminalIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M3 4.5l3.5 3.5L3 11.5M8 12h5" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const AddIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M8 3v10M3 8h10" strokeWidth="1.2" />
  </svg>
);

export const RemoteIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p} fill="none" stroke="currentColor">
    <path d="M6 4l-4 4 4 4M10 4l4 4-4 4" strokeWidth="1.4" />
  </svg>
);
