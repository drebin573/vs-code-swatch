import type { ThemeDoc, TokenColorRule } from './types';

function stripJsonComments(text: string): string {
  return text
    .replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m, str) => (str ? m : ''))
    .replace(/,(\s*[}\]])/g, '$1');
}

/** Parse a VS Code theme file (JSON or JSONC) into a ThemeDoc. Throws on malformed input. */
export function parseThemeJson(text: string): ThemeDoc {
  const raw = JSON.parse(stripJsonComments(text)) as Record<string, unknown>;
  const colors = (raw.colors ?? {}) as Record<string, string>;

  // Legacy themes use settings[] with a null-scope entry for editor colors.
  let tokenColors: TokenColorRule[] = [];
  if (Array.isArray(raw.tokenColors)) tokenColors = raw.tokenColors as TokenColorRule[];
  else if (Array.isArray(raw.settings)) {
    tokenColors = (raw.settings as TokenColorRule[]).filter((r) => r.scope !== undefined);
  }

  const type =
    raw.type === 'light' || raw.type === 'hcLight'
      ? 'light'
      : raw.type === 'dark' || raw.type === 'hcDark'
        ? 'dark'
        : guessType(colors);

  return {
    name: typeof raw.name === 'string' ? raw.name : 'Imported Theme',
    type,
    colors,
    tokenColors,
    semanticHighlighting: raw.semanticHighlighting !== false,
    semanticTokenColors: (raw.semanticTokenColors as ThemeDoc['semanticTokenColors']) ?? undefined,
  };
}

function guessType(colors: Record<string, string>): 'dark' | 'light' {
  const bg = colors['editor.background'];
  if (!bg) return 'dark';
  const m = /^#(..)(..)(..)/.exec(bg);
  if (!m) return 'dark';
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128 ? 'dark' : 'light';
}

/** Serialize a ThemeDoc to distributable theme JSON (drops empty sections). */
export function themeToJson(doc: ThemeDoc): string {
  const out: Record<string, unknown> = {
    $schema: 'vscode://schemas/color-theme',
    name: doc.name,
    type: doc.type,
    colors: doc.colors,
    tokenColors: doc.tokenColors,
  };
  if (doc.semanticHighlighting !== undefined) out.semanticHighlighting = doc.semanticHighlighting;
  if (doc.semanticTokenColors && Object.keys(doc.semanticTokenColors).length > 0) {
    out.semanticTokenColors = doc.semanticTokenColors;
  }
  return JSON.stringify(out, null, 2) + '\n';
}

export function downloadFile(name: string, content: string | Uint8Array, mime = 'application/json') {
  const blob = new Blob([content as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'theme'
  );
}

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    // Cancel never fires a change event; resolve null when focus returns.
    window.addEventListener('focus', () => setTimeout(() => resolve(null), 300), { once: true });
    input.click();
  });
}
