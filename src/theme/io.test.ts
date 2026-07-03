// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseThemeJson, themeToJson } from './io';
import { themeToShareUrl, themeFromLocationHash } from './share';

const oneDarkPro = readFileSync(join(import.meta.dirname, '../test-fixtures/onedark-pro.json'), 'utf8');

describe('theme JSON round-trip', () => {
  it('imports a real-world theme losslessly', () => {
    const original = JSON.parse(oneDarkPro);
    const doc = parseThemeJson(oneDarkPro);

    expect(doc.name).toBe('One Dark Pro');
    expect(doc.type).toBe('dark');
    expect(doc.colors).toEqual(original.colors);
    expect(doc.tokenColors).toEqual(original.tokenColors);
    expect(doc.semanticTokenColors).toEqual(original.semanticTokenColors);

    // Export → reimport is identical.
    const reimported = parseThemeJson(themeToJson(doc));
    expect(reimported).toEqual(doc);
  });

  it('handles JSONC comments and trailing commas', () => {
    const doc = parseThemeJson('{\n // comment\n "name": "X", "type": "dark", "colors": {"a":"#fff",},\n}');
    expect(doc.colors).toEqual({ a: '#fff' });
  });

  it('guesses type from editor.background when missing', () => {
    expect(parseThemeJson('{"colors":{"editor.background":"#fafafa"}}').type).toBe('light');
    expect(parseThemeJson('{"colors":{"editor.background":"#101010"}}').type).toBe('dark');
  });
});

describe('share links', () => {
  it('round-trips a full theme through the URL fragment', () => {
    const doc = parseThemeJson(oneDarkPro);
    const url = themeToShareUrl(doc);
    expect(url.length).toBeLessThan(32_000); // sane URL size

    location.hash = new URL(url).hash;
    const restored = themeFromLocationHash();
    expect(restored).toEqual(doc);
  });
});
