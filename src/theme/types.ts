/** Mirrors the VS Code color theme JSON format exactly. */

export interface TokenColorSettings {
  foreground?: string;
  background?: string;
  fontStyle?: string; // space-separated: italic bold underline strikethrough
}

export interface TokenColorRule {
  name?: string;
  scope?: string | string[];
  settings: TokenColorSettings;
}

export type SemanticTokenStyle =
  | string
  | {
      foreground?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
    };

export interface ThemeDoc {
  name: string;
  type: 'dark' | 'light';
  colors: Record<string, string>;
  tokenColors: TokenColorRule[];
  semanticHighlighting?: boolean;
  semanticTokenColors?: Record<string, SemanticTokenStyle>;
}

export interface ColorKeyInfo {
  key: string;
  description: string;
}

export interface ColorGroup {
  group: string;
  keys: ColorKeyInfo[];
}
