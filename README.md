# VS-CodeSwatch

A web-based theme builder for VS Code and every editor built on it (Cursor, VSCodium, Windsurf, Antigravity, etc). Free, open source, no accounts. [Try the demo!](https://demo.codes.watch)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) 

## About

Designing a VS Code theme means hand-editing a JSON file with ~950 color keys and reloading to see what changed. VS-CodeSwatch gives you a live, pixel-faithful workbench preview instead: click any part of the mock editor to jump to its color, tweak it with a picker, and watch the whole thing update in real time.

Unlike other theme builders, it's fully open source and adds the two things they always seem to miss: **palette import** (build a theme from an image, a coolors link, or your terminal's color scheme) and **ANSI terminal colors** (with a live terminal preview).

## Features

- **Faithful preview** — every default resolved from VS Code's own source, syntax highlighting rendered with real TextMate grammars (Shiki), so what you see is what ships
- **All 944 color keys**, grouped and searchable, with VS Code's official descriptions and defaults
- **Click-to-edit** — click any region of the preview to select its color key
- **Palette import** — paste hex lists / CSS variables / Tailwind configs / coolors.co URLs, drop an image, or import terminal schemes: iTerm2 `.itermcolors`, base16 YAML, Alacritty, Kitty, Ghostty, Windows Terminal
- **Theme generation** — synthesize a complete, coherent theme (workbench + terminal + syntax tokens) from any palette, in OKLCH with contrast guarantees
- **ANSI colors** — first-class terminal color editing with a live terminal pane
- **Remix anything** — import any theme's JSON or `.vsix` and start from there
- **One-click `.vsix` export** — an installable extension package built in your browser; also theme JSON, a `settings.json` snippet, and shareable links (the whole theme compressed into the URL)
- **TextMate & semantic token editors**, multi-theme workspace, undo/redo, autosave to localStorage

Everything runs client-side. Your themes never leave your browser unless you export them.

## Usage

Open the app, pick a starter (Dark/Light Modern), and start clicking things. The typical flows:

- **From scratch**: New dark → click the preview or search keys → tweak → Export.
- **From a palette**: Import… → paste colors or drop an image → *Generate dark theme* → refine.
- **From your terminal setup**: Import… → drop your iTerm2/Ghostty/Alacritty/Kitty scheme → *Apply to terminal colors* (or generate a whole theme from it).
- **From an existing theme**: Import… → drop a theme `.json` or `.vsix` → remix.

To install your theme: **Export ▾ → Download .vsix**, then in VS Code run *Extensions: Install from VSIX…* (or `code --install-extension my-theme-1.0.0.vsix`).

## Development

```bash
npm install
npm run dev     # start the app
npx vitest run  # unit tests (palette parsers, generator, vsix packaging)
npm run build   # production build
```

### Regenerating VS Code default data

`src/data/` (color defaults, key groups, starter templates) is generated from the VS Code sources so it can track upstream releases:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/microsoft/vscode.git /tmp/vscode
git -C /tmp/vscode sparse-checkout set src/vs extensions
curl -sL https://raw.githubusercontent.com/microsoft/vscode-docs/main/api/references/theme-color.md -o /tmp/theme-color.md
node scripts/generate-defaults.ts /tmp/vscode /tmp/theme-color.md
```

## Contributing

Issues and PRs are welcome! This project exists because the alternatives weren't open source. Good first contributions: more preview surfaces (diff editor, notifications, quick input), more terminal scheme formats, better palette→slot heuristics.

## License

VS-CodeSwatch is licensed under the MIT license. See [`LICENSE`](LICENSE) for details. Vendored default-color data is derived from [microsoft/vscode](https://github.com/microsoft/vscode) (MIT).

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/T1I322HUMQ)