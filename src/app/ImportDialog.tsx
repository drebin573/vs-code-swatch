import { useCallback, useState, type DragEvent } from 'react';
import { useThemeStore } from '../store/themeStore';
import { usePaletteStore } from '../store/paletteStore';
import { extractFromText } from '../palette/extractText';
import { parseTerminalScheme, type DetectedScheme } from '../palette/terminalSchemes';
import { extractFromImageFile } from '../palette/extractImage';
import { ansiSchemeToColors, generateTheme } from '../palette/generate';
import { ansiSchemeToPalette, type Palette } from '../palette/types';
import { parseThemeJson } from '../theme/io';
import { readVsixTheme } from '../theme/vsixImport';
import type { ThemeDoc } from '../theme/types';

type Result =
  | { kind: 'palette'; palette: Palette; source: string }
  | { kind: 'ansi'; detected: DetectedScheme; source: string }
  | { kind: 'theme'; doc: ThemeDoc; source: string };

const btn = 'rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-[12px] text-zinc-200 hover:bg-zinc-700 cursor-pointer';
const primaryBtn = 'rounded border border-sky-700 bg-sky-800/60 px-3 py-1.5 text-[12px] text-sky-100 hover:bg-sky-700 cursor-pointer';

function Swatches({ palette }: { palette: Palette }) {
  return (
    <div className="flex flex-wrap gap-1">
      {palette.colors.slice(0, 48).map((c, i) => (
        <span
          key={i}
          title={c.label ? `${c.label} ${c.hex}` : c.hex}
          className="size-6 rounded border border-zinc-700"
          style={{ background: c.hex }}
        />
      ))}
      {palette.colors.length > 48 && <span className="self-center text-[11px] text-zinc-500">+{palette.colors.length - 48}</span>}
    </div>
  );
}

export function ImportDialog() {
  const { importOpen, setImportOpen, setPalette } = usePaletteStore();
  const { addTheme, setColors } = useThemeStore();
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const close = () => {
    setImportOpen(false);
    setResult(null);
    setText('');
    setError(null);
  };

  const onText = (value: string) => {
    setText(value);
    setError(null);
    if (!value.trim()) {
      setResult(null);
      return;
    }
    // Pasted content might itself be a terminal scheme or a full theme.
    const scheme = parseTerminalScheme('pasted', value);
    if (scheme) {
      setResult({ kind: 'ansi', detected: scheme, source: 'pasted text' });
      return;
    }
    try {
      const doc = parseThemeJson(value);
      if (Object.keys(doc.colors).length > 5 || doc.tokenColors.length > 0) {
        setResult({ kind: 'theme', doc, source: 'pasted theme JSON' });
        return;
      }
    } catch {
      // not a theme — fall through to color extraction
    }
    const palette = extractFromText(value);
    setResult(palette.colors.length > 0 ? { kind: 'palette', palette, source: 'pasted text' } : null);
  };

  const onFile = useCallback(async (file: File) => {
    setError(null);
    try {
      if (file.type.startsWith('image/')) {
        const palette = await extractFromImageFile(file);
        setResult({ kind: 'palette', palette, source: file.name });
        return;
      }
      if (file.name.endsWith('.vsix')) {
        const doc = await readVsixTheme(file);
        setResult({ kind: 'theme', doc, source: file.name });
        return;
      }
      const content = await file.text();
      const scheme = parseTerminalScheme(file.name, content);
      if (scheme) {
        if (!scheme.scheme.name) scheme.scheme.name = file.name.replace(/\.\w+$/, '');
        setResult({ kind: 'ansi', detected: scheme, source: file.name });
        return;
      }
      try {
        const doc = parseThemeJson(content);
        setResult({ kind: 'theme', doc, source: file.name });
        return;
      } catch {
        // not a theme either — last resort: scrape colors from the text
      }
      const palette = extractFromText(content);
      if (palette.colors.length > 0) {
        palette.name = file.name.replace(/\.\w+$/, '');
        setResult({ kind: 'palette', palette, source: file.name });
      } else {
        setError(`Couldn't find colors, a terminal scheme, or a theme in ${file.name}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void onFile(file);
  };

  if (!importOpen) return null;

  const paletteOf = (r: Result): Palette =>
    r.kind === 'palette'
      ? r.palette
      : r.kind === 'ansi'
        ? ansiSchemeToPalette(r.detected.scheme)
        : {
            name: r.doc.name,
            colors: [...new Set(Object.values(r.doc.colors).map((hex) => hex.slice(0, 7)))].map((hex) => ({ hex })),
          };

  const generate = (type: 'dark' | 'light') => {
    if (!result) return;
    const palette = paletteOf(result);
    const doc = generateTheme(palette, { name: palette.name ?? 'Generated Theme', type });
    if (result.kind === 'ansi') Object.assign(doc.colors, ansiSchemeToColors(result.detected.scheme));
    addTheme(doc);
    setPalette(palette);
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={close}>
      <div
        className="flex max-h-full w-[560px] flex-col gap-3 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-100">Import</h2>
          <button className="text-zinc-500 hover:text-zinc-200" onClick={close}>
            ✕
          </button>
        </div>

        <div
          className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-5 text-center text-[12px] ${
            dragging ? 'border-sky-500 bg-sky-950/30 text-sky-200' : 'border-zinc-700 text-zinc-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <p className="font-medium text-zinc-300">Drop a file here</p>
          <p>
            image · VS Code theme <code>.json</code> / <code>.vsix</code> · iTerm2 <code>.itermcolors</code> · base16{' '}
            <code>.yaml</code> · Alacritty <code>.toml</code> · Kitty <code>.conf</code> · Ghostty config · Windows Terminal
          </p>
          <label className={`${btn} mt-1`}>
            Choose file…
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>
        </div>

        <textarea
          className="h-28 w-full resize-y rounded border border-zinc-700 bg-zinc-800 p-2 font-mono text-[11.5px] text-zinc-200 placeholder-zinc-600"
          placeholder={`…or paste anything with colors in it:\nhex lists, CSS variables, Tailwind configs, a coolors.co URL,\na terminal scheme, or full theme JSON`}
          value={text}
          spellCheck={false}
          onChange={(e) => onText(e.target.value)}
        />

        {error && <p className="rounded border border-red-900 bg-red-950/40 p-2 text-[12px] text-red-300">{error}</p>}

        {result && (
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="text-[12px] text-zinc-400">
              {result.kind === 'ansi' && (
                <>
                  Detected <span className="font-semibold text-zinc-200">{result.detected.format}</span> terminal scheme
                </>
              )}
              {result.kind === 'theme' && (
                <>
                  VS Code theme <span className="font-semibold text-zinc-200">{result.doc.name}</span> ({result.doc.type},{' '}
                  {Object.keys(result.doc.colors).length} colors)
                </>
              )}
              {result.kind === 'palette' && (
                <>
                  <span className="font-semibold text-zinc-200">{result.palette.colors.length}</span> colors extracted
                </>
              )}{' '}
              from {result.source}
            </p>
            <Swatches palette={paletteOf(result)} />
            <div className="mt-1 flex flex-wrap gap-2">
              {result.kind === 'theme' && (
                <button
                  className={primaryBtn}
                  onClick={() => {
                    addTheme(result.doc);
                    setPalette(paletteOf(result));
                    close();
                  }}
                >
                  Open as new theme
                </button>
              )}
              {result.kind === 'ansi' && (
                <button
                  className={primaryBtn}
                  onClick={() => {
                    setColors(ansiSchemeToColors(result.detected.scheme));
                    setPalette(paletteOf(result));
                    close();
                  }}
                >
                  Apply to terminal colors
                </button>
              )}
              <button className={result.kind === 'palette' ? primaryBtn : btn} onClick={() => generate('dark')}>
                Generate dark theme
              </button>
              <button className={btn} onClick={() => generate('light')}>
                Generate light theme
              </button>
              <button
                className={btn}
                onClick={() => {
                  setPalette(paletteOf(result));
                  close();
                }}
              >
                Keep as palette
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
