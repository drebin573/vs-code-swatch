import { describe, expect, it } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { buildVsix, settingsSnippet } from './vsix';
import darkModern from '../data/templates/dark-modern.json';
import type { ThemeDoc } from '../theme/types';

const doc: ThemeDoc = { ...(darkModern as unknown as ThemeDoc), name: 'Forge Test Theme' };

describe('buildVsix', () => {
  it('produces a valid vsix that round-trips', () => {
    const { filename, data } = buildVsix(doc);
    expect(filename).toBe('forge-test-theme-1.0.0.vsix');

    const files = unzipSync(data);
    expect(Object.keys(files).sort()).toEqual([
      '[Content_Types].xml',
      'extension.vsixmanifest',
      'extension/README.md',
      'extension/package.json',
      'extension/themes/forge-test-theme-color-theme.json',
    ]);

    const manifest = JSON.parse(strFromU8(files['extension/package.json']));
    expect(manifest.contributes.themes[0]).toEqual({
      label: 'Forge Test Theme',
      uiTheme: 'vs-dark',
      path: './themes/forge-test-theme-color-theme.json',
    });

    const theme = JSON.parse(strFromU8(files['extension/themes/forge-test-theme-color-theme.json']));
    expect(theme.colors).toEqual(doc.colors);
    expect(theme.tokenColors).toEqual(doc.tokenColors);

    const vsixManifest = strFromU8(files['extension.vsixmanifest']);
    expect(vsixManifest).toContain('Id="forge-test-theme"');
    expect(vsixManifest).toContain('<Categories>Themes</Categories>');

    // Emit the artifact for a manual `code --install-extension` check.
    if (process.env.VSIX_OUT) {
      const fs = require('node:fs') as typeof import('node:fs');
      fs.writeFileSync(`${process.env.VSIX_OUT}/${filename}`, data);
    }
  });

  it('marks light themes as vs', () => {
    const { data } = buildVsix({ ...doc, type: 'light' });
    const files = unzipSync(data);
    const manifest = JSON.parse(strFromU8(files['extension/package.json']));
    expect(manifest.contributes.themes[0].uiTheme).toBe('vs');
  });
});

describe('settingsSnippet', () => {
  it('contains customization sections', () => {
    const snippet = JSON.parse(settingsSnippet(doc));
    expect(snippet['workbench.colorCustomizations']['editor.background']).toBe(doc.colors['editor.background']);
    expect(Array.isArray(snippet['editor.tokenColorCustomizations'].textMateRules)).toBe(true);
  });
});
