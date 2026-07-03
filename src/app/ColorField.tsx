import { useEffect, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';

const checker = 'repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 0 0 / 8px 8px';

/** Compact swatch + hex input with a popover picker. `value` empty = unset. */
export function ColorField({
  value,
  onChange,
  placeholder = 'inherit',
}: {
  value: string;
  onChange: (hex: string | undefined) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  const commit = (raw: string) => {
    const v = raw.trim();
    if (v === '') {
      onChange(undefined);
      return;
    }
    const hex = v.startsWith('#') ? v : `#${v}`;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)) onChange(hex.toLowerCase());
  };

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        className="size-5 shrink-0 rounded-sm border border-zinc-600"
        style={{ background: value ? `linear-gradient(${value}, ${value}), ${checker}` : checker }}
        onClick={() => setOpen(!open)}
        aria-label="Open color picker"
      />
      <input
        className="w-[86px] rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-200 placeholder-zinc-600"
        value={text}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-50 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-xl">
            <HexAlphaColorPicker color={value || '#888888'} onChange={(c) => onChange(c)} />
          </div>
        </>
      )}
    </div>
  );
}
