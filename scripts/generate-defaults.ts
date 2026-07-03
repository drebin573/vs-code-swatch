/**
 * Generates vendored VS Code default-color data from a checkout of microsoft/vscode.
 *
 * Sources:
 *  - src/vs/**\/*.ts        registerColor(...) calls (parsed with the TS compiler API)
 *  - terminalColorRegistry  ansiColorMap object literal (ANSI colors registered in a loop)
 *  - extensions/*\/package.json  contributes.colors
 *  - theme-color.md         docs reference, for grouping + descriptions
 *  - extensions/theme-defaults  starter theme templates (includes flattened)
 *
 * Usage: node scripts/generate-defaults.ts <vscode-dir> <theme-color.md>
 * Emits: src/data/defaults.json, src/data/color-groups.json, src/data/templates/*.json
 */
import ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';

const [vscodeDir, docsMd] = process.argv.slice(2);
if (!vscodeDir || !docsMd) {
  console.error('usage: node scripts/generate-defaults.ts <vscode-dir> <theme-color.md>');
  process.exit(1);
}
const outDir = path.join(import.meta.dirname, '..', 'src', 'data');
fs.mkdirSync(path.join(outDir, 'templates'), { recursive: true });

// ---------------------------------------------------------------------------
// Color math, ported from vscode src/vs/base/common/color.ts so resolved
// defaults match VS Code bit-for-bit.
// ---------------------------------------------------------------------------

interface RGBA { r: number; g: number; b: number; a: number }

function roundFloat(n: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function fromHex(hex: string): RGBA | null {
  const m = /^#([0-9a-fA-F]{3,8})$/.exec(hex);
  if (!m) return null;
  const h = m[1];
  const p = (s: string) => parseInt(s, 16);
  switch (h.length) {
    case 3: return { r: p(h[0] + h[0]), g: p(h[1] + h[1]), b: p(h[2] + h[2]), a: 1 };
    case 4: return { r: p(h[0] + h[0]), g: p(h[1] + h[1]), b: p(h[2] + h[2]), a: p(h[3] + h[3]) / 255 };
    case 6: return { r: p(h.slice(0, 2)), g: p(h.slice(2, 4)), b: p(h.slice(4, 6)), a: 1 };
    case 8: return { r: p(h.slice(0, 2)), g: p(h.slice(2, 4)), b: p(h.slice(4, 6)), a: p(h.slice(6, 8)) / 255 };
    default: return null;
  }
}

function toHex(c: RGBA): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  const base = `#${h(c.r)}${h(c.g)}${h(c.b)}`;
  const a = Math.round(c.a * 255);
  return a === 255 ? base : base + h(a);
}

interface HSLA { h: number; s: number; l: number; a: number }

function toHSLA(c: RGBA): HSLA {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (min + max) / 2;
  const chroma = max - min;
  if (chroma > 0) {
    s = Math.min(l <= 0.5 ? chroma / (2 * l) : chroma / (2 - 2 * l), 1);
    switch (max) {
      case r: h = (g - b) / chroma + (g < b ? 6 : 0); break;
      case g: h = (b - r) / chroma + 2; break;
      case b: h = (r - g) / chroma + 4; break;
    }
    h *= 60;
    h = Math.round(h);
  }
  return { h, s: roundFloat(s, 3), l: roundFloat(l, 3), a: c.a };
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function fromHSLA(hsla: HSLA): RGBA {
  const h = hsla.h / 360;
  const { s, l, a } = hsla;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
}

function lighten(c: RGBA, factor: number): RGBA {
  const hsla = toHSLA(c);
  return fromHSLA({ ...hsla, l: hsla.l + hsla.l * factor });
}

function darken(c: RGBA, factor: number): RGBA {
  const hsla = toHSLA(c);
  return fromHSLA({ ...hsla, l: hsla.l - hsla.l * factor });
}

function transparent(c: RGBA, factor: number): RGBA {
  return { ...c, a: c.a * factor };
}

function mix(c: RGBA, other: RGBA, factor = 0.5): RGBA {
  const t = Math.min(Math.max(factor, 0), 1);
  return {
    r: c.r + (other.r - c.r) * t,
    g: c.g + (other.g - c.g) * t,
    b: c.b + (other.b - c.b) * t,
    a: c.a + (other.a - c.a) * t,
  };
}

function makeOpaque(c: RGBA, bg: RGBA): RGBA {
  if (c.a === 1 || bg.a !== 1) return c;
  return {
    r: bg.r - c.a * (bg.r - c.r),
    g: bg.g - c.a * (bg.g - c.g),
    b: bg.b - c.a * (bg.b - c.b),
    a: 1,
  };
}

function relativeLuminance(c: RGBA): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return roundFloat(0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b), 4);
}

// ---------------------------------------------------------------------------
// IR for default color values
// ---------------------------------------------------------------------------

type IR =
  | null
  | { k: 'lit'; hex: string }
  | { k: 'ref'; id: string }
  | { k: 'name'; name: string }
  | { k: 'darken' | 'lighten' | 'transparent'; value: IR; factor: number }
  | { k: 'opaque'; value: IR; background: IR }
  | { k: 'oneOf'; values: IR[] }
  | { k: 'ifDefinedThenElse'; if: IR; then: IR; else: IR }
  | { k: 'lessProminent'; value: IR; background: IR; factor: number; transparency: number }
  | { k: 'mix'; color: IR; with: IR; ratio: number };

type Slot = 'dark' | 'light' | 'hcDark' | 'hcLight';
interface Entry { id: string; defaults: Record<Slot, IR>; description: string; source: string }

const entries = new Map<string, Entry>();
const varToId = new Map<string, string>();
const skipped: string[] = [];

// ---------------------------------------------------------------------------
// TS AST parsing
// ---------------------------------------------------------------------------

const TRANSFORM_FNS = new Set(['darken', 'lighten', 'transparent', 'opaque', 'oneOf', 'ifDefinedThenElse', 'lessProminent']);
const COLOR_STATICS: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  transparent: '#00000000',
  red: '#ff0000',
  blue: '#0000ff',
  green: '#00ff00',
  cyan: '#00ffff',
  lightgrey: '#d3d3d3',
};

// File-local const declarations, collected in a pre-pass so expressions like
// `transparent(defaultInsertColor, 0.5)` or factor constants resolve.
let localIR = new Map<string, IR>();
let localNum = new Map<string, number>();

function evalNumber(node: ts.Expression): number | null {
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isIdentifier(node)) return localNum.get(node.text) ?? null;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const inner = evalNumber(node.operand as ts.Expression);
    return inner === null ? null : -inner;
  }
  if (ts.isParenthesizedExpression(node)) return evalNumber(node.expression);
  if (ts.isBinaryExpression(node)) {
    const l = evalNumber(node.left), r = evalNumber(node.right);
    if (l === null || r === null) return null;
    switch (node.operatorToken.kind) {
      case ts.SyntaxKind.PlusToken: return l + r;
      case ts.SyntaxKind.MinusToken: return l - r;
      case ts.SyntaxKind.AsteriskToken: return l * r;
      case ts.SyntaxKind.SlashToken: return l / r;
    }
  }
  return null;
}

function parseColorValue(node: ts.Expression, ctx: string): IR {
  node = ts.isParenthesizedExpression(node) || ts.isAsExpression(node)
    ? (node as ts.ParenthesizedExpression | ts.AsExpression).expression
    : node;

  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text.startsWith('#') ? { k: 'lit', hex: node.text.toLowerCase() } : { k: 'ref', id: node.text };
  }

  if (ts.isIdentifier(node)) {
    const local = localIR.get(node.text);
    return local !== undefined ? local : { k: 'name', name: node.text };
  }

  // Raw transform object literals, e.g. { op: ColorTransformType.Mix, color: X, with: Y, ratio: 0.3 }
  if (ts.isObjectLiteralExpression(node)) {
    const props = new Map<string, ts.Expression>();
    for (const p of node.properties) {
      if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) props.set(p.name.text, p.initializer);
    }
    const opExpr = props.get('op');
    if (opExpr && ts.isPropertyAccessExpression(opExpr)) {
      switch (opExpr.name.text) {
        case 'Mix':
          return {
            k: 'mix',
            color: parseColorValue(props.get('color')!, ctx),
            with: parseColorValue(props.get('with')!, ctx),
            ratio: props.get('ratio') ? (evalNumber(props.get('ratio')!) ?? 0.5) : 0.5,
          };
        case 'Darken':
        case 'Lighten':
        case 'Transparent': {
          const factor = evalNumber(props.get('factor')!);
          if (factor !== null) {
            return {
              k: opExpr.name.text.toLowerCase() as 'darken' | 'lighten' | 'transparent',
              value: parseColorValue(props.get('value')!, ctx),
              factor,
            };
          }
        }
      }
    }
    skipped.push(`${ctx}: object literal ${node.getText().slice(0, 60)}`);
    return null;
  }

  if (ts.isPropertyAccessExpression(node)) {
    // Color.white and friends
    if (ts.isIdentifier(node.expression) && node.expression.text === 'Color' && node.name.text in COLOR_STATICS) {
      return { k: 'lit', hex: COLOR_STATICS[node.name.text] };
    }
    skipped.push(`${ctx}: property access ${node.getText().slice(0, 60)}`);
    return null;
  }

  if (ts.isNewExpression(node)) {
    // new Color(new RGBA(r, g, b, a?))
    const arg = node.arguments?.[0];
    if (arg && ts.isNewExpression(arg) && arg.arguments && arg.arguments.length >= 3) {
      const nums = arg.arguments.map((a) => evalNumber(a as ts.Expression));
      if (nums.every((n) => n !== null)) {
        const [r, g, b, a] = nums as number[];
        return { k: 'lit', hex: toHex({ r, g, b, a: a ?? 1 }) };
      }
    }
    skipped.push(`${ctx}: new expression ${node.getText().slice(0, 60)}`);
    return null;
  }

  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    // Color.fromHex('#...')
    if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'fromHex') {
      const a = node.arguments[0];
      if (a && ts.isStringLiteral(a)) return { k: 'lit', hex: a.text.toLowerCase() };
    }
    // someColor.transparent(0.5) style method chains
    if (ts.isPropertyAccessExpression(callee) && ['transparent', 'darken', 'lighten'].includes(callee.name.text)) {
      const target = parseColorValue(callee.expression, ctx);
      const factor = node.arguments[0] ? evalNumber(node.arguments[0]) : null;
      if (target && factor !== null) {
        return { k: callee.name.text as 'transparent' | 'darken' | 'lighten', value: target, factor };
      }
    }
    if (ts.isIdentifier(callee) && TRANSFORM_FNS.has(callee.text)) {
      const args = node.arguments as readonly ts.Expression[];
      switch (callee.text) {
        case 'darken':
        case 'lighten':
        case 'transparent': {
          const value = parseColorValue(args[0], ctx);
          const factor = evalNumber(args[1]);
          if (factor === null) break;
          return { k: callee.text, value, factor };
        }
        case 'opaque':
          return { k: 'opaque', value: parseColorValue(args[0], ctx), background: parseColorValue(args[1], ctx) };
        case 'oneOf':
          return { k: 'oneOf', values: args.map((a) => parseColorValue(a, ctx)) };
        case 'ifDefinedThenElse':
          return {
            k: 'ifDefinedThenElse',
            if: parseColorValue(args[0], ctx),
            then: parseColorValue(args[1], ctx),
            else: parseColorValue(args[2], ctx),
          };
        case 'lessProminent': {
          const factor = evalNumber(args[2]);
          const transparency = evalNumber(args[3]);
          if (factor === null || transparency === null) break;
          return {
            k: 'lessProminent',
            value: parseColorValue(args[0], ctx),
            background: parseColorValue(args[1], ctx),
            factor,
            transparency,
          };
        }
      }
    }
    skipped.push(`${ctx}: call ${node.getText().slice(0, 60)}`);
    return null;
  }

  skipped.push(`${ctx}: ${ts.SyntaxKind[node.kind]} ${node.getText().slice(0, 60)}`);
  return null;
}

function parseDefaults(node: ts.Expression, ctx: string): Record<Slot, IR> {
  const unwrapped = ts.isAsExpression(node) || ts.isParenthesizedExpression(node)
    ? (node as ts.AsExpression | ts.ParenthesizedExpression).expression
    : node;
  if (ts.isObjectLiteralExpression(unwrapped)) {
    const isDefaultsObject = unwrapped.properties.some(
      (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && (p.name.text === 'dark' || p.name.text === 'light'),
    );
    if (isDefaultsObject) {
      const out: Record<Slot, IR> = { dark: null, light: null, hcDark: null, hcLight: null };
      for (const p of unwrapped.properties) {
        if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) {
          const slot = p.name.text as Slot;
          if (slot === 'dark' || slot === 'light' || slot === 'hcDark' || slot === 'hcLight') {
            out[slot] = parseColorValue(p.initializer, ctx);
          }
        }
      }
      return out;
    }
  }
  const v = parseColorValue(node, ctx);
  return { dark: v, light: v, hcDark: v, hcLight: v };
}

function extractDescription(node: ts.Expression | undefined): string {
  if (!node) return '';
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isCallExpression(node)) {
    // nls.localize('key', 'description', ...args) — take the first string arg after the key
    for (let i = 1; i < node.arguments.length; i++) {
      const a = node.arguments[i];
      if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) return a.text;
    }
  }
  return '';
}

function walkFile(filePath: string) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.includes('registerColor') && !text.includes('ansiColorMap')) return;
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
  const rel = path.relative(vscodeDir, filePath);

  // Pre-pass: collect file-local const colors/numbers (quietly — a failed parse
  // here just means the const wasn't a color constant).
  localIR = new Map();
  localNum = new Map();
  const quiet = skipped.length;
  const prePass = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const init = node.initializer;
      const isRegisterColor =
        ts.isCallExpression(init) && ts.isIdentifier(init.expression) && init.expression.text === 'registerColor';
      if (!isRegisterColor) {
        const num = evalNumber(init);
        if (num !== null) {
          localNum.set(node.name.text, num);
        } else {
          const ir = parseColorValue(init, rel);
          if (ir !== null && ir.k !== 'name') localIR.set(node.name.text, ir);
        }
      }
    }
    ts.forEachChild(node, prePass);
  };
  prePass(sf);
  skipped.length = quiet;

  const visit = (node: ts.Node) => {
    // const someVar = registerColor('id', ...)  → varName ↦ id, for cross-file references
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === 'registerColor' &&
      ts.isIdentifier(node.name)
    ) {
      const idArg = node.initializer.arguments[0];
      if (idArg && (ts.isStringLiteral(idArg) || ts.isNoSubstitutionTemplateLiteral(idArg))) {
        varToId.set(node.name.text, idArg.text);
      }
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'registerColor') {
      const [idArg, defaultsArg, descArg] = node.arguments;
      if (idArg && (ts.isStringLiteral(idArg) || ts.isNoSubstitutionTemplateLiteral(idArg)) && defaultsArg) {
        const id = idArg.text;
        if (!entries.has(id)) {
          entries.set(id, {
            id,
            defaults: parseDefaults(defaultsArg, `${rel}:${id}`),
            description: extractDescription(descArg),
            source: rel,
          });
        }
      } else if (idArg && !ts.isStringLiteral(idArg)) {
        skipped.push(`${rel}: dynamic color id ${idArg.getText().slice(0, 60)}`);
      }
    }

    // ansiColorMap = { 'terminal.ansiX': { index, defaults: {...} }, ... }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'ansiColorMap' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const prop of node.initializer.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const id = ts.isStringLiteral(prop.name) ? prop.name.text : ts.isIdentifier(prop.name) ? prop.name.text : null;
        if (!id || !ts.isObjectLiteralExpression(prop.initializer)) continue;
        const defaultsProp = prop.initializer.properties.find(
          (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'defaults',
        );
        if (defaultsProp) {
          entries.set(id, {
            id,
            defaults: parseDefaults(defaultsProp.initializer, `${rel}:${id}`),
            description: `'${id.replace('terminal.ansi', '')}' ANSI color in the terminal.`,
            source: rel,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  };
  visit(sf);
}

function* tsFiles(dir: string): Generator<string> {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* tsFiles(full);
    else if (e.name.endsWith('.ts') && !e.name.endsWith('.d.ts') && !e.name.includes('.test.')) yield full;
  }
}

console.log('Parsing registerColor calls…');
for (const f of tsFiles(path.join(vscodeDir, 'src', 'vs'))) walkFile(f);
console.log(`  ${entries.size} colors from src/vs, ${varToId.size} named vars`);

// ---------------------------------------------------------------------------
// Extension-contributed colors (contributes.colors in package.json)
// ---------------------------------------------------------------------------

const extDir = path.join(vscodeDir, 'extensions');
let extCount = 0;
for (const ext of fs.readdirSync(extDir, { withFileTypes: true })) {
  if (!ext.isDirectory()) continue;
  const pkgPath = path.join(extDir, ext.name, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const colors = pkg.contributes?.colors;
  if (!Array.isArray(colors)) continue;
  let nls: Record<string, string> = {};
  const nlsPath = path.join(extDir, ext.name, 'package.nls.json');
  if (fs.existsSync(nlsPath)) nls = JSON.parse(fs.readFileSync(nlsPath, 'utf8'));
  for (const c of colors) {
    if (!c.id || entries.has(c.id)) continue;
    const toIR = (v: unknown): IR => {
      if (typeof v !== 'string') return null;
      return v.startsWith('#') ? { k: 'lit', hex: v.toLowerCase() } : { k: 'ref', id: v };
    };
    const desc = typeof c.description === 'string' ? c.description.replace(/^%(.*)%$/, (_: string, k: string) => nls[k] ?? '') : '';
    entries.set(c.id, {
      id: c.id,
      defaults: {
        dark: toIR(c.defaults?.dark),
        light: toIR(c.defaults?.light),
        hcDark: toIR(c.defaults?.highContrast),
        hcLight: toIR(c.defaults?.highContrastLight),
      },
      description: desc,
      source: `extensions/${ext.name}`,
    });
    extCount++;
  }
}
console.log(`  ${extCount} colors from extension contributions`);

// ---------------------------------------------------------------------------
// Resolve name refs → id refs, then resolve values per theme type
// ---------------------------------------------------------------------------

function resolveNames(ir: IR, ctx: string): IR {
  if (ir === null) return null;
  switch (ir.k) {
    case 'name': {
      const id = varToId.get(ir.name);
      if (!id) {
        skipped.push(`${ctx}: unresolved identifier '${ir.name}'`);
        return null;
      }
      return { k: 'ref', id };
    }
    case 'darken':
    case 'lighten':
    case 'transparent':
      return { ...ir, value: resolveNames(ir.value, ctx) };
    case 'opaque':
      return { ...ir, value: resolveNames(ir.value, ctx), background: resolveNames(ir.background, ctx) };
    case 'oneOf':
      return { ...ir, values: ir.values.map((v) => resolveNames(v, ctx)) };
    case 'ifDefinedThenElse':
      return { ...ir, if: resolveNames(ir.if, ctx), then: resolveNames(ir.then, ctx), else: resolveNames(ir.else, ctx) };
    case 'lessProminent':
      return { ...ir, value: resolveNames(ir.value, ctx), background: resolveNames(ir.background, ctx) };
    case 'mix':
      return { ...ir, color: resolveNames(ir.color, ctx), with: resolveNames(ir.with, ctx) };
    default:
      return ir;
  }
}

for (const e of entries.values()) {
  for (const slot of ['dark', 'light', 'hcDark', 'hcLight'] as Slot[]) {
    e.defaults[slot] = resolveNames(e.defaults[slot], `${e.source}:${e.id}`);
  }
}

function resolveColor(id: string, slot: 'dark' | 'light', seen: Set<string>): RGBA | undefined {
  const entry = entries.get(id);
  if (!entry || seen.has(id)) return undefined;
  seen.add(id);
  const result = evalIR(entry.defaults[slot], slot, seen);
  seen.delete(id);
  return result;
}

function evalIR(ir: IR, slot: 'dark' | 'light', seen: Set<string>): RGBA | undefined {
  if (ir === null) return undefined;
  switch (ir.k) {
    case 'lit': return fromHex(ir.hex) ?? undefined;
    case 'ref': return resolveColor(ir.id, slot, seen);
    case 'name': return undefined;
    case 'darken': {
      const c = evalIR(ir.value, slot, seen);
      return c && darken(c, ir.factor);
    }
    case 'lighten': {
      const c = evalIR(ir.value, slot, seen);
      return c && lighten(c, ir.factor);
    }
    case 'transparent': {
      const c = evalIR(ir.value, slot, seen);
      return c && transparent(c, ir.factor);
    }
    case 'opaque': {
      const c = evalIR(ir.value, slot, seen);
      const bg = evalIR(ir.background, slot, seen);
      if (!c) return undefined;
      return bg ? makeOpaque(c, bg) : c;
    }
    case 'oneOf': {
      for (const v of ir.values) {
        const c = evalIR(v, slot, seen);
        if (c) return c;
      }
      return undefined;
    }
    case 'ifDefinedThenElse':
      // Resolving registry defaults for a theme that defines nothing → always 'else'
      return evalIR(ir.else, slot, seen);
    case 'lessProminent': {
      const from = evalIR(ir.value, slot, seen);
      if (!from) return undefined;
      const bg = evalIR(ir.background, slot, seen);
      if (!bg) return transparent(from, ir.factor * ir.transparency);
      const fromLum = relativeLuminance(from);
      const bgLum = relativeLuminance(bg);
      const adjusted = fromLum < bgLum
        ? from // already darker
        : fromLum > bgLum
          ? darken(from, ir.factor)
          : from;
      const other = fromLum > bgLum
        ? adjusted
        : fromLum < bgLum && relativeLuminance(from) < bgLum
          ? from
          : lighten(from, ir.factor);
      // getLighterColor/getDarkerColor: keep as-is when already lighter/darker, else adjust
      const result = fromLum < bgLum ? other : adjusted;
      return transparent(result, ir.transparency);
    }
    case 'mix': {
      const a = evalIR(ir.color, slot, seen) ?? { r: 0, g: 0, b: 0, a: 0 };
      const b = evalIR(ir.with, slot, seen) ?? { r: 0, g: 0, b: 0, a: 0 };
      return mix(a, b, ir.ratio);
    }
  }
}

console.log('Resolving color graph…');
const resolved: Record<'dark' | 'light', Record<string, string | null>> = { dark: {}, light: {} };
for (const slot of ['dark', 'light'] as const) {
  for (const id of entries.keys()) {
    const c = resolveColor(id, slot, new Set());
    resolved[slot][id] = c ? toHex(c) : null;
  }
}

// ---------------------------------------------------------------------------
// Docs markdown → groups + descriptions
// ---------------------------------------------------------------------------

console.log('Parsing theme-color.md…');
const md = fs.readFileSync(docsMd, 'utf8');
interface KeyInfo { key: string; description: string }
const groups: { group: string; keys: KeyInfo[] }[] = [];
let current: { group: string; keys: KeyInfo[] } | null = null;
for (const line of md.split('\n')) {
  const heading = /^##\s+(.+)$/.exec(line);
  if (heading) {
    current = { group: heading[1].trim(), keys: [] };
    groups.push(current);
    continue;
  }
  const bullet = /^-\s+`([a-zA-Z0-9.]+)`\s*:?\s*(.*)$/.exec(line);
  if (bullet && current) {
    current.keys.push({ key: bullet[1], description: bullet[2].trim() });
  }
}
const documented = new Set(groups.flatMap((g) => g.keys.map((k) => k.key)));
const nonEmptyGroups = groups.filter((g) => g.keys.length > 0);

// Registry colors the docs page doesn't list yet → put in a trailing group,
// keep registry description.
const undocumented: KeyInfo[] = [];
for (const e of entries.values()) {
  if (!documented.has(e.id)) undocumented.push({ key: e.id, description: e.description });
}
if (undocumented.length) {
  undocumented.sort((a, b) => a.key.localeCompare(b.key));
  nonEmptyGroups.push({ group: 'Other', keys: undocumented });
}
// Docs keys that no longer exist in the registry (removed/renamed) → drop.
for (const g of nonEmptyGroups) {
  g.keys = g.keys.filter((k) => entries.has(k.key));
}

// ---------------------------------------------------------------------------
// Starter templates from theme-defaults (flatten "include" chains)
// ---------------------------------------------------------------------------

function stripJsonComments(text: string): string {
  return text
    .replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m, str) => (str ? m : ''))
    .replace(/,(\s*[}\]])/g, '$1');
}

function loadThemeFile(file: string): Record<string, unknown> {
  const dir = path.dirname(file);
  const data = JSON.parse(stripJsonComments(fs.readFileSync(file, 'utf8')));
  if (typeof data.include === 'string') {
    const base = loadThemeFile(path.join(dir, data.include));
    return {
      ...base,
      ...data,
      include: undefined,
      colors: { ...(base.colors as object), ...(data.colors as object) },
      tokenColors: [...((base.tokenColors as unknown[]) ?? []), ...((data.tokenColors as unknown[]) ?? [])],
      semanticTokenColors: { ...(base.semanticTokenColors as object), ...(data.semanticTokenColors as object) },
    };
  }
  return data;
}

const themesDir = path.join(extDir, 'theme-defaults', 'themes');
const templates: [string, string][] = [
  ['dark_modern.json', 'dark-modern.json'],
  ['dark_plus.json', 'dark-plus.json'],
  ['light_modern.json', 'light-modern.json'],
  ['light_plus.json', 'light-plus.json'],
];
for (const [src, dest] of templates) {
  const theme = loadThemeFile(path.join(themesDir, src));
  delete theme.include;
  delete theme.$schema;
  fs.writeFileSync(path.join(outDir, 'templates', dest), JSON.stringify(theme, null, 2));
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

fs.writeFileSync(path.join(outDir, 'defaults.json'), JSON.stringify(resolved, null, 1));
fs.writeFileSync(path.join(outDir, 'color-groups.json'), JSON.stringify(nonEmptyGroups, null, 1));
fs.writeFileSync(
  path.join(import.meta.dirname, 'generate-defaults.log'),
  skipped.join('\n'),
);

const nullDark = Object.values(resolved.dark).filter((v) => v === null).length;
console.log(`Done. ${entries.size} colors (${nullDark} null by default in dark), ${nonEmptyGroups.length} groups, ${skipped.length} skipped expressions (see scripts/generate-defaults.log)`);
