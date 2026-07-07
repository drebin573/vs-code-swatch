import { zipSync, strToU8 } from 'fflate';
import type { ThemeDoc } from '../theme/types';
import { slugify, themeToJson } from '../theme/io';

/**
 * Package a theme as an installable .vsix — just a zip with a manifest.
 * Install via `code --install-extension theme.vsix` or "Install from VSIX"
 * in VS Code / Cursor / VSCodium / any fork.
 */

function xmlEscape(s: string): string {
  return s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function buildVsix(doc: ThemeDoc, publisher = 'vs-codeswatch'): { filename: string; data: Uint8Array } {
  const slug = slugify(doc.name);
  const version = '1.0.0';
  const themePath = `themes/${slug}-color-theme.json`;

  const manifest = {
    name: slug,
    displayName: doc.name,
    description: `${doc.name} — a color theme built with VS-CodeSwatch`,
    version,
    publisher,
    engines: { vscode: '^1.0.0' },
    categories: ['Themes'],
    contributes: {
      themes: [
        {
          label: doc.name,
          uiTheme: doc.type === 'light' ? 'vs' : 'vs-dark',
          path: `./${themePath}`,
        },
      ],
    },
  };

  const readme = `# ${doc.name}

A ${doc.type} color theme for VS Code and VS Code-based editors, built with
[VS-CodeSwatch](https://github.com/drebin573/vs-code-swatch).

## Install

- **From file**: Extensions panel → \`…\` menu → **Install from VSIX…**
- **CLI**: \`code --install-extension ${slug}-${version}.vsix\`

Then pick **${doc.name}** in *Preferences: Color Theme*.
`;

  const vsixManifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="${xmlEscape(slug)}" Version="${version}" Publisher="${xmlEscape(publisher)}" />
    <DisplayName>${xmlEscape(doc.name)}</DisplayName>
    <Description xml:space="preserve">${xmlEscape(manifest.description)}</Description>
    <Tags>theme,color-theme,${doc.type}</Tags>
    <Categories>Themes</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.0.0" />
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="ui,workspace" />
    </Properties>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />
  </Assets>
</PackageManifest>
`;

  const contentTypes = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json" />
  <Default Extension="vsixmanifest" ContentType="text/xml" />
  <Default Extension="md" ContentType="text/markdown" />
</Types>
`;

  const data = zipSync({
    '[Content_Types].xml': strToU8(contentTypes),
    'extension.vsixmanifest': strToU8(vsixManifest),
    'extension/package.json': strToU8(JSON.stringify(manifest, null, 2)),
    'extension/README.md': strToU8(readme),
    [`extension/${themePath}`]: strToU8(themeToJson(doc)),
  });

  return { filename: `${slug}-${version}.vsix`, data };
}

/** settings.json snippet to try a theme without installing it. */
export function settingsSnippet(doc: ThemeDoc): string {
  return JSON.stringify(
    {
      'workbench.colorCustomizations': doc.colors,
      'editor.tokenColorCustomizations': {
        textMateRules: doc.tokenColors,
      },
    },
    null,
    2,
  );
}
