import { useEffect, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';
import { useActiveTheme, useThemeStore } from '../store/themeStore';
import { useUiStore } from '../store/uiStore';
import { defaults, describeKey } from '../theme/defaults';

function normalizeHex(input: string): string | null {
  const v = input.trim().replace(/^([0-9a-fA-F]{3,8})$/, '#$1');
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v) ? v.toLowerCase() : null;
}

export function InspectorPanel() {
  const theme = useActiveTheme();
  const setColor = useThemeStore((s) => s.setColor);
  const selectedKey = useUiStore((s) => s.selectedKey);

  const isSet = selectedKey !== null && selectedKey in theme.colors;
  const defaultValue = selectedKey ? (defaults[theme.type][selectedKey] ?? null) : null;
  const value = selectedKey ? (theme.colors[selectedKey] ?? defaultValue) : null;

  const [hexInput, setHexInput] = useState('');
  useEffect(() => {
    setHexInput(value ?? '');
  }, [value, selectedKey]);

  if (!selectedKey) {
    return (
      <div className="flex w-[290px] shrink-0 flex-col items-center justify-center border-l border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="text-[13px] text-zinc-500">
          Select a color key from the list, or click any part of the preview to jump to its color.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-[290px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-zinc-800 bg-zinc-900 p-4">
      <div>
        <h2 className="break-all font-mono text-[13px] font-semibold text-zinc-100">{selectedKey}</h2>
        <p className="mt-1 text-[12px] leading-snug text-zinc-400">{describeKey(selectedKey)}</p>
      </div>

      <HexAlphaColorPicker
        color={value ?? '#00000000'}
        onChange={(c) => setColor(selectedKey, c)}
        style={{ width: '100%' }}
      />

      <div className="flex items-center gap-2">
        <span
          className="size-8 shrink-0 rounded border border-zinc-600"
          style={{
            background: value
              ? `linear-gradient(${value}, ${value}), repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 0 0 / 10px 10px`
              : 'repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 0 0 / 10px 10px',
          }}
        />
        <input
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 font-mono text-[12px] text-zinc-200"
          value={hexInput}
          onChange={(e) => {
            setHexInput(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) setColor(selectedKey, hex);
          }}
          placeholder="#rrggbbaa"
          spellCheck={false}
        />
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2 text-[12px]">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Status</span>
          <span className={isSet ? 'text-sky-300' : 'text-zinc-500'}>{isSet ? 'set in theme' : 'inherited default'}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-zinc-400">
          <span>VS Code default</span>
          <span className="flex items-center gap-1.5 font-mono">
            {defaultValue ? (
              <>
                <span className="inline-block size-3 rounded-sm border border-zinc-600" style={{ background: defaultValue }} />
                {defaultValue}
              </>
            ) : (
              <span className="text-zinc-600">none</span>
            )}
          </span>
        </div>
      </div>

      {isSet && (
        <button
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[12px] text-zinc-300 hover:bg-zinc-700"
          onClick={() => setColor(selectedKey, undefined)}
        >
          Clear — use VS Code default
        </button>
      )}
    </div>
  );
}
