import { useState } from 'react';
import { useActiveTheme } from '../store/themeStore';
import { themeToJson, downloadFile, slugify } from '../theme/io';
import { buildVsix, settingsSnippet } from '../export/vsix';
import { themeToShareUrl } from '../theme/share';

export function ExportMenu() {
  const theme = useActiveTheme();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => {
      setCopied(null);
      setOpen(false);
    }, 900);
  };

  const item =
    'block w-full rounded px-3 py-2 text-left text-[12px] text-zinc-200 hover:bg-zinc-700 cursor-pointer';

  return (
    <div className="relative">
      <button
        className="cursor-pointer rounded border border-sky-700 bg-sky-900/40 px-2.5 py-1 text-[12px] text-sky-200 hover:bg-sky-800/50"
        onClick={() => setOpen(!open)}
      >
        Export ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-64 rounded-lg border border-zinc-700 bg-zinc-800 p-1 shadow-2xl">
            <button
              className={item}
              onClick={() => {
                const { filename, data } = buildVsix(theme);
                downloadFile(filename, data, 'application/zip');
                setOpen(false);
              }}
            >
              <span className="font-medium">Download .vsix</span>
              <span className="block text-[11px] text-zinc-400">Install directly in VS Code or any fork</span>
            </button>
            <button
              className={item}
              onClick={() => {
                downloadFile(`${slugify(theme.name)}-color-theme.json`, themeToJson(theme));
                setOpen(false);
              }}
            >
              <span className="font-medium">Download theme JSON</span>
              <span className="block text-[11px] text-zinc-400">For an extension you maintain yourself</span>
            </button>
            <button className={item} onClick={() => copy('settings', settingsSnippet(theme))}>
              <span className="font-medium">{copied === 'settings' ? '✓ Copied' : 'Copy settings.json snippet'}</span>
              <span className="block text-[11px] text-zinc-400">Try it via colorCustomizations, no install</span>
            </button>
            <button className={item} onClick={() => copy('link', themeToShareUrl(theme))}>
              <span className="font-medium">{copied === 'link' ? '✓ Copied' : 'Copy share link'}</span>
              <span className="block text-[11px] text-zinc-400">Whole theme encoded in the URL</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
