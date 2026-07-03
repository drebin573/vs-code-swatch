import { describe, expect, it } from 'vitest';
import { wcagContrast } from 'culori';
import { extractFromText } from './extractText';
import { parseTerminalScheme } from './terminalSchemes';
import { quantize } from './extractImage';
import { ansiSchemeToColors, generateTheme } from './generate';
import { ANSI_SLOT_NAMES } from './types';

describe('extractFromText', () => {
  it('extracts hex colors and dedupes', () => {
    const p = extractFromText('#ff0000 #00ff00 #ff0000 #0000ffcc');
    expect(p.colors.map((c) => c.hex)).toEqual(['#ff0000', '#00ff00', '#0000ffcc']);
  });

  it('labels CSS variables and object keys', () => {
    const p = extractFromText(`--rosewater: #f5e0dc;\n  'flamingo': '#f2cdcd',\n mauve = rgb(203, 166, 247)`);
    expect(p.colors).toEqual([
      { hex: '#f5e0dc', label: 'rosewater' },
      { hex: '#f2cdcd', label: 'flamingo' },
      { hex: '#cba6f7', label: 'mauve' },
    ]);
  });

  it('parses coolors.co URLs', () => {
    const p = extractFromText('https://coolors.co/palette/264653-2a9d8f-e9c46a');
    expect(p.colors.map((c) => c.hex)).toEqual(['#264653', '#2a9d8f', '#e9c46a']);
  });

  it('parses hsl() and short hex', () => {
    const p = extractFromText('background: hsl(0, 100%, 50%); accent: #abc;');
    expect(p.colors.map((c) => c.hex)).toEqual(['#ff0000', '#aabbcc']);
  });
});

describe('parseTerminalScheme', () => {
  it('parses iTerm2 .itermcolors plists', () => {
    const entry = (key: string, r: number, g: number, b: number) => `
      <key>${key}</key>
      <dict>
        <key>Blue Component</key><real>${b}</real>
        <key>Green Component</key><real>${g}</real>
        <key>Red Component</key><real>${r}</real>
      </dict>`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <plist version="1.0"><dict>
      ${Array.from({ length: 16 }, (_, i) => entry(`Ansi ${i} Color`, i / 16, 0.5, 0.25)).join('')}
      ${entry('Background Color', 0, 0, 0)}
      ${entry('Foreground Color', 1, 1, 1)}
      </dict></plist>`;
    const result = parseTerminalScheme('theme.itermcolors', xml);
    expect(result?.format).toBe('iTerm2');
    expect(result?.scheme.background).toBe('#000000');
    expect(result?.scheme.foreground).toBe('#ffffff');
    expect(result?.scheme.ansi[8]).toBe('#808040');
  });

  it('parses base16 YAML', () => {
    const yaml = `scheme: "Test"\n${Array.from({ length: 16 }, (_, i) => `base0${i.toString(16).toUpperCase()}: "${i.toString(16).repeat(6)}"`).join('\n')}`;
    const result = parseTerminalScheme('test.yaml', yaml);
    expect(result?.format).toBe('base16');
    expect(result?.scheme.background).toBe('#000000');
    expect(result?.scheme.ansi[1]).toBe('#888888'); // base08
  });

  it('parses Kitty conf', () => {
    const conf = `foreground #dddddd\nbackground #111111\n${Array.from({ length: 16 }, (_, i) => `color${i} #${(i * 4).toString(16).padStart(2, '0').repeat(3)}`).join('\n')}`;
    const result = parseTerminalScheme('kitty.conf', conf);
    expect(result?.format).toBe('Kitty');
    expect(result?.scheme.ansi[3]).toBe('#0c0c0c');
    expect(result?.scheme.foreground).toBe('#dddddd');
  });

  it('parses Ghostty config', () => {
    const cfg = `background = 282c34\nforeground = ffffff\n${Array.from({ length: 16 }, (_, i) => `palette = ${i}=#${(255 - i * 8).toString(16).padStart(2, '0').repeat(3)}`).join('\n')}`;
    const result = parseTerminalScheme('config', cfg);
    expect(result?.format).toBe('Ghostty');
    expect(result?.scheme.background).toBe('#282c34');
    expect(result?.scheme.ansi[0]).toBe('#ffffff');
  });

  it('parses Alacritty TOML', () => {
    const names = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
    const toml = `[colors.primary]\nbackground = "#1d2021"\nforeground = "#ebdbb2"\n[colors.normal]\n${names.map((n, i) => `${n} = "#${i.toString(16).padStart(2, '0').repeat(3)}"`).join('\n')}\n[colors.bright]\n${names.map((n, i) => `${n} = "#${(i + 8).toString(16).padStart(2, '0').repeat(3)}"`).join('\n')}`;
    const result = parseTerminalScheme('alacritty.toml', toml);
    expect(result?.format).toBe('Alacritty');
    expect(result?.scheme.ansi[1]).toBe('#010101');
    expect(result?.scheme.ansi[15]).toBe('#0f0f0f');
    expect(result?.scheme.background).toBe('#1d2021');
  });

  it('parses Windows Terminal JSON', () => {
    const json = JSON.stringify({
      name: 'Test',
      background: '#0c0c0c',
      foreground: '#cccccc',
      black: '#0c0c0c',
      red: '#c50f1f',
      green: '#13a10e',
      yellow: '#c19c00',
      blue: '#0037da',
      purple: '#881798',
      cyan: '#3a96dd',
      white: '#cccccc',
      brightBlack: '#767676',
      brightRed: '#e74856',
      brightGreen: '#16c60c',
      brightYellow: '#f9f1a5',
      brightBlue: '#3b78ff',
      brightPurple: '#b4009e',
      brightCyan: '#61d6d6',
      brightWhite: '#f2f2f2',
    });
    const result = parseTerminalScheme('scheme.json', json);
    expect(result?.format).toBe('Windows Terminal');
    expect(result?.scheme.ansi[5]).toBe('#881798');
    expect(result?.scheme.ansi[13]).toBe('#b4009e');
  });
});

describe('quantize', () => {
  it('finds dominant colors', () => {
    // 100 red pixels + 50 blue pixels
    const px: number[] = [];
    for (let i = 0; i < 100; i++) px.push(255, 0, 0, 255);
    for (let i = 0; i < 50; i++) px.push(0, 0, 255, 255);
    const result = quantize(new Uint8ClampedArray(px), 2);
    expect(result).toEqual(['#ff0000', '#0000ff']);
  });

  it('skips transparent pixels', () => {
    const px = [255, 0, 0, 0, 0, 255, 0, 255];
    expect(quantize(new Uint8ClampedArray(px), 2)).toEqual(['#00ff00']);
  });
});

describe('generateTheme', () => {
  const catppuccin = extractFromText(
    '#1e1e2e #cdd6f4 #f38ba8 #a6e3a1 #f9e2af #89b4fa #cba6f7 #94e2d5 #fab387',
  );

  it('produces a readable dark theme with all ANSI slots', () => {
    const theme = generateTheme(catppuccin, { name: 'Cat', type: 'dark' });
    expect(theme.type).toBe('dark');
    expect(theme.colors['editor.background']).toBe('#1e1e2e');
    for (const slot of ANSI_SLOT_NAMES) {
      expect(theme.colors[`terminal.${slot}`]).toMatch(/^#[0-9a-f]{6,8}$/);
    }
    const contrast = wcagContrast(theme.colors['editor.foreground'], theme.colors['editor.background']);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    expect(theme.tokenColors.length).toBeGreaterThan(10);
  });

  it('produces a light theme when asked', () => {
    const theme = generateTheme(catppuccin, { name: 'Cat Light', type: 'light' });
    expect(theme.type).toBe('light');
    const contrast = wcagContrast(theme.colors['editor.foreground'], theme.colors['editor.background']);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});

describe('ansiSchemeToColors', () => {
  it('maps slots and adds selection alpha', () => {
    const patch = ansiSchemeToColors({
      background: '#101010',
      foreground: '#e0e0e0',
      cursor: '#ff00ff',
      selectionBackground: '#3355aa',
      ansi: ['#000000', '#cc0000', ...new Array(14).fill(undefined)],
    });
    expect(patch['terminal.ansiRed']).toBe('#cc0000');
    expect(patch['terminal.background']).toBe('#101010');
    expect(patch['terminalCursor.foreground']).toBe('#ff00ff');
    expect(patch['terminal.selectionBackground']).toBe('#3355aa59');
    expect(patch['terminal.ansiGreen']).toBeUndefined();
  });
});
