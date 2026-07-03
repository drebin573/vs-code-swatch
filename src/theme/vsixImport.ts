import { unzipSync, strFromU8 } from 'fflate';
import { parseThemeJson } from './io';
import type { ThemeDoc } from './types';

/** Extract the first contributed color theme from a .vsix extension package. */
export async function readVsixTheme(file: File): Promise<ThemeDoc> {
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const read = (path: string) => {
    const data = files[path] ?? files[path.replace(/^\.?\//, '')];
    return data ? strFromU8(data) : null;
  };

  const manifestText = read('extension/package.json');
  if (manifestText) {
    const manifest = JSON.parse(manifestText) as {
      contributes?: { themes?: { label?: string; path: string }[] };
    };
    const contributed = manifest.contributes?.themes?.[0];
    if (contributed) {
      const themePath = `extension/${contributed.path.replace(/^\.?\//, '')}`;
      const themeText = read(themePath);
      if (themeText) {
        const doc = parseThemeJson(themeText);
        if (contributed.label && doc.name === 'Imported Theme') doc.name = contributed.label;
        return doc;
      }
    }
  }

  // Fallback: any *color-theme*.json inside the package.
  for (const [path, data] of Object.entries(files)) {
    if (/color-theme.*\.json$/i.test(path)) return parseThemeJson(strFromU8(data));
  }
  throw new Error('No color theme found in this .vsix');
}
