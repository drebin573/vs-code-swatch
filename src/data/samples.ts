export interface Sample {
  lang: string;
  label: string;
  code: string;
}

export const samples: Sample[] = [
  {
    lang: 'tsx',
    label: 'TypeScript',
    code: `import { useState } from 'react';
import type { Palette } from './palette';

/** Number of ANSI slots a terminal scheme must fill. */
const ANSI_SLOTS = 16;

export function PaletteCard({ palette }: { palette: Palette }) {
  const [active, setActive] = useState<number | null>(null);
  const label = \`\${palette.name} — \${palette.colors.length} colors\`;

  if (palette.colors.length < ANSI_SLOTS) {
    throw new RangeError('palette too small');
  }

  return (
    <ul aria-label={label} className="palette">
      {palette.colors.map((color, i) => (
        <li key={i} onClick={() => setActive(i)} style={{ background: color.hex }} />
      ))}
    </ul>
  );
}`,
  },
  {
    lang: 'python',
    label: 'Python',
    code: `import colorsys
from dataclasses import dataclass, field

ANSI_NAMES = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"]


@dataclass
class Palette:
    """A named collection of colors extracted from any source."""

    name: str
    colors: list[str] = field(default_factory=list)

    def luminance_sorted(self) -> list[str]:
        # Sort dark → light for background/foreground ladders
        return sorted(self.colors, key=self._lum)

    @staticmethod
    def _lum(hex_color: str) -> float:
        r, g, b = (int(hex_color[i : i + 2], 16) / 255 for i in (1, 3, 5))
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        return l`,
  },
  {
    lang: 'rust',
    label: 'Rust',
    code: `use std::collections::HashMap;

/// Maps palette entries onto VS Code theme slots.
#[derive(Debug, Clone)]
pub struct Mapper<'a> {
    slots: HashMap<&'a str, u32>,
}

impl<'a> Mapper<'a> {
    pub fn assign(&mut self, key: &'a str, rgba: u32) -> Option<u32> {
        let previous = self.slots.insert(key, rgba)?;
        println!("replaced {key}: {previous:#010x} -> {rgba:#010x}");
        Some(previous)
    }
}

fn main() {
    let mut mapper = Mapper { slots: HashMap::new() };
    mapper.assign("editor.background", 0x1e1e2eff);
    assert_eq!(mapper.slots.len(), 1);
}`,
  },
  {
    lang: 'go',
    label: 'Go',
    code: `package palette

import (
	"fmt"
	"sort"
)

// Slot pairs a theme color key with its assigned hex value.
type Slot struct {
	Key string
	Hex uint32
}

func Rank(slots []Slot) []Slot {
	sorted := make([]Slot, len(slots))
	copy(sorted, slots)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].Hex < sorted[j].Hex
	})
	for i, s := range sorted {
		fmt.Printf("%2d %-28s #%08x\\n", i, s.Key, s.Hex)
	}
	return sorted
}`,
  },
  {
    lang: 'css',
    label: 'CSS',
    code: `/* Workbench variables mirror VS Code's webview convention */
:root {
  --vscode-editor-background: #1e1e2e;
  --vscode-editor-foreground: color-mix(in oklch, #cdd6f4 92%, white);
}

.workbench[data-type='dark'] {
  color-scheme: dark;
}

.editor > .line:hover,
.editor > .line.active {
  background: var(--vscode-editor-lineHighlightBackground, transparent);
  outline: 1px solid rgb(205 214 244 / 12%);
}

@media (max-width: 720px) {
  .sidebar {
    display: none;
  }
}`,
  },
  {
    lang: 'json',
    label: 'JSON',
    code: `{
  "name": "catppuccin-mocha",
  "type": "dark",
  "semanticHighlighting": true,
  "colors": {
    "editor.background": "#1e1e2e",
    "editor.foreground": "#cdd6f4",
    "terminal.ansiRed": "#f38ba8",
    "terminal.ansiGreen": "#a6e3a1"
  },
  "tokenColors": [
    {
      "name": "Comments",
      "scope": ["comment", "punctuation.definition.comment"],
      "settings": { "foreground": "#6c7086", "fontStyle": "italic" }
    }
  ]
}`,
  },
  {
    lang: 'markdown',
    label: 'Markdown',
    code: `# Theme Forge

An **open-source** theme builder for VS Code and every editor built on it.

## Features

- Live workbench preview with *real* TextMate highlighting
- Palette import: images, terminal schemes, \`coolors\` lists
- One-click \`.vsix\` export — no scaffolding dance

> Themes are just JSON. Building them shouldn't feel like guesswork.

\`\`\`bash
npm install && npm run dev
\`\`\`

[Contribute on GitHub](https://github.com/example/theme-forge)`,
  },
];
