import { cssVar } from '../theme/cssVars';
import { AddIcon, CloseIcon, EllipsisIcon, TerminalIcon } from './icons';

const ANSI = [
  'ansiBlack',
  'ansiRed',
  'ansiGreen',
  'ansiYellow',
  'ansiBlue',
  'ansiMagenta',
  'ansiCyan',
  'ansiWhite',
] as const;

function ansi(name: string): string {
  return cssVar(`terminal.${name}`);
}

/** Static terminal transcript that exercises every ANSI slot. */
function Transcript() {
  return (
    <div className="whitespace-pre font-mono text-[12px] leading-[17px]">
      <div>
        <span style={{ color: ansi('ansiGreen') }}>➜</span>{' '}
        <span style={{ color: ansi('ansiCyan') }}>vs-codeswatch</span>{' '}
        <span style={{ color: ansi('ansiBlue') }}>git:(</span>
        <span style={{ color: ansi('ansiRed') }}>main</span>
        <span style={{ color: ansi('ansiBlue') }}>)</span> npm test
      </div>
      <div>
        <span style={{ color: ansi('ansiBrightGreen') }}> PASS </span>
        <span> src/palette/extract.test.ts</span>
      </div>
      <div>
        <span style={{ color: ansi('ansiBrightYellow') }}> WARN </span>
        <span style={{ color: ansi('ansiBrightBlack') }}> 1 slow test (2.3s)</span>
      </div>
      <div>
        <span style={{ color: ansi('ansiBrightRed') }}> FAIL </span>
        <span> src/export/vsix.test.ts</span>
        <span style={{ color: ansi('ansiBrightBlack') }}> — expected </span>
        <span style={{ color: ansi('ansiBrightMagenta') }}>#1e1e2e</span>
      </div>
      <div className="mt-1 flex gap-0">
        {ANSI.map((name) => (
          <span
            key={name}
            data-keys={`terminal.${name}`}
            className="inline-block h-[14px] w-7"
            style={{ background: ansi(name) }}
          />
        ))}
      </div>
      <div className="flex gap-0">
        {ANSI.map((name) => {
          const bright = name.replace('ansi', 'ansiBright');
          return (
            <span
              key={bright}
              data-keys={`terminal.${bright}`}
              className="inline-block h-[14px] w-7"
              style={{ background: ansi(bright) }}
            />
          );
        })}
      </div>
      <div className="mt-1">
        <span style={{ color: ansi('ansiGreen') }}>➜</span>{' '}
        <span style={{ color: ansi('ansiCyan') }}>vs-codeswatch</span>{' '}
        <span
          data-keys="terminalCursor.foreground"
          className="ml-1 inline-block h-[14px] w-[7px] translate-y-[2px]"
          style={{ background: cssVar('terminalCursor.foreground', cssVar('terminal.foreground')) }}
        />
      </div>
    </div>
  );
}

const panelTabs = [
  { label: 'Problems', active: false },
  { label: 'Output', active: false },
  { label: 'Terminal', active: true },
  { label: 'Ports', active: false },
];

export function PanelArea() {
  return (
    <div
      data-keys="panel.background panel.border"
      className="flex h-[190px] shrink-0 flex-col"
      style={{
        background: cssVar('panel.background'),
        borderTop: `1px solid ${cssVar('panel.border', 'transparent')}`,
      }}
    >
      <div className="flex h-[32px] shrink-0 items-center px-3">
        {panelTabs.map((t) => (
          <span
            key={t.label}
            data-keys={t.active ? 'panelTitle.activeForeground panelTitle.activeBorder' : 'panelTitle.inactiveForeground'}
            className="mr-4 flex h-full items-center text-[11px] uppercase tracking-wide"
            style={{
              color: t.active ? cssVar('panelTitle.activeForeground') : cssVar('panelTitle.inactiveForeground'),
              borderBottom: `1px solid ${t.active ? cssVar('panelTitle.activeBorder') : 'transparent'}`,
            }}
          >
            {t.label}
          </span>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-2 opacity-70">
          <TerminalIcon size={14} />
          <span className="text-[12px]">zsh</span>
          <AddIcon size={14} />
          <EllipsisIcon size={14} />
          <CloseIcon size={14} />
        </div>
      </div>
      <div
        data-keys="terminal.background terminal.foreground"
        className="min-h-0 flex-1 overflow-hidden px-3 pb-2"
        style={{
          background: cssVar('terminal.background', cssVar('panel.background')),
          color: cssVar('terminal.foreground'),
        }}
      >
        <Transcript />
      </div>
    </div>
  );
}
