#!/usr/bin/env node
/** Read-only inventory. Usage: node scripts/mobile-shared-inventory.mjs [--ref origin/main] [--json] <us-root> <tw-root> <options-root> */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const args = process.argv.slice(2);
let ref;
let json = false;
let threshold = 0.85;
const roots = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--ref') ref = args[++i];
  else if (args[i] === '--json') json = true;
  else if (args[i] === '--threshold') threshold = Number(args[++i]);
  else roots.push(path.resolve(args[i]));
}
if (roots.length !== 3 || !Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
  throw new Error('Usage: mobile-shared-inventory.mjs [--ref origin/main] [--json] [--threshold 0.85] <us-root> <tw-root> <options-root>');
}
const areas = ['ads', 'i18n', 'updates', 'purchases', 'data', 'utils'];
const blocked = /^(?:react(?:\/|$)|react-native(?:[-/]|$)|expo(?:[-/]|$)|@expo\/|@react-native(?:-[^/]+)?\/|@react-navigation\/|zustand(?:\/|$)|firebase(?:\/|$))|(?:^|\/)(?:stores?|components)(?:\/|$)/;
const git = (root, ...argv) => execFileSync('git', ['-C', root, ...argv], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const shingleCache = new Map();
function shingles(text) {
  if (shingleCache.has(text)) return shingleCache.get(text);
  // Scanner trivia removal normalizes whitespace/comments without changing string constants.
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const tokens = [];
  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) tokens.push(scanner.getTokenText());
  const counts = new Map();
  for (let i = 1; i < tokens.length; i++) {
    const key = `${tokens[i - 1]}\0${tokens[i]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  shingleCache.set(text, counts);
  return counts;
}
function similarity(a, b) {
  if (a === b) return 1;
  const x = shingles(a), y = shingles(b);
  let common = 0, total = 0;
  for (const [token, count] of x) { common += Math.min(count, y.get(token) ?? 0); total += count; }
  for (const count of y.values()) total += count;
  return total === 0 ? 0 : 2 * common / total;
}
function imports(text, filename) {
  const result = [];
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) result.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      const call = node.expression.getText(source);
      if (['require', 'import', 'jest.mock', 'jest.doMock', 'jest.requireActual'].includes(call)) result.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return result;
}
function walk(dir, root) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => item.isDirectory()
    ? walk(path.join(dir, item.name), root) : [path.relative(root, path.join(dir, item.name)).split(path.sep).join('/')]);
}
const apps = roots.map((root, index) => {
  const names = ['us_stocks', 'tw_stocks', 'options'];
  // Include the full src graph so a relative import cannot hide a native dependency.
  const paths = (ref ? git(root, 'ls-tree', '-r', '--name-only', ref, 'src').trim().split('\n').filter(Boolean) : walk(path.join(root, 'src'), root))
    .filter((file) => /\.(?:[cm]?[jt]sx?|json|md)$/.test(file));
  const contents = new Map();
  if (ref) {
    const batch = execFileSync('git', ['-C', root, 'cat-file', '--batch'], {
      input: paths.map((file) => `${ref}:${file}\n`).join(''), maxBuffer: 64 * 1024 * 1024,
    });
    let offset = 0;
    for (const file of paths) {
      const end = batch.indexOf(10, offset);
      const size = Number(batch.subarray(offset, end).toString().split(' ')[2]);
      if (!Number.isFinite(size)) throw new Error(`Cannot read ${ref}:${file}`);
      contents.set(file, batch.subarray(end + 1, end + 1 + size).toString('utf8'));
      offset = end + size + 2;
    }
  }
  const files = new Map(paths.map((file) => {
    const content = ref ? contents.get(file) : fs.readFileSync(path.join(root, file), 'utf8');
    return [file, { content, imports: /\.[cm]?[jt]sx?$/.test(file) ? imports(content, file) : [] }];
  }));
  function reason(file, seen = new Set()) {
    if (seen.has(file)) return null;
    seen.add(file);
    for (const specifier of files.get(file)?.imports ?? []) {
      if (blocked.test(specifier)) return `${file} imports ${specifier}`;
      if (specifier.startsWith('.')) {
        const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
        const dependency = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, `${base}/index.ts`, `${base}/index.tsx`].find((candidate) => files.has(candidate));
        if (dependency) {
          const indirect = reason(dependency, seen);
          if (indirect) return indirect;
        }
      }
    }
    return null;
  }
  return { app: names[index], root, revision: git(root, 'rev-parse', ref ?? 'HEAD').trim(), files, reason };
});
const candidates = [...new Set(apps.flatMap(({ files }) => [...files.keys()].filter((file) => areas.some((area) => file.startsWith(`src/${area}/`)))))].sort();
const rows = [], excluded = [];
for (const file of candidates) {
  const present = apps.filter((app) => app.files.has(file));
  if (present.length < 2) continue;
  const pure = present.filter((app) => !app.reason(file));
  const pairs = [];
  for (let i = 0; i < pure.length; i++) for (let j = i + 1; j < pure.length; j++) {
    const ratio = similarity(pure[i].files.get(file).content, pure[j].files.get(file).content);
    if (ratio >= threshold) pairs.push({ apps: [pure[i].app, pure[j].app], ratio });
  }
  if (pairs.length) rows.push({ file, apps: pure.filter((app) => pairs.some((pair) => pair.apps.includes(app.app))).map((app) => app.app), similarity: Math.min(...pairs.map((pair) => pair.ratio)), pairs });
  else excluded.push({ file, reasons: present.map((app) => ({ app: app.app, reason: app.reason(file) ?? 'No pure peer above the similarity threshold' })) });
}
// Market adapters sometimes have different names (market-data.ts / tw-data.ts).
// Compare pure source files within an area as well as equal relative paths.
for (let i = 0; i < apps.length; i++) for (let j = i + 1; j < apps.length; j++) {
  const left = apps[i], right = apps[j];
  const sourceFiles = (app) => [...app.files.keys()].filter((file) => areas.some((area) => file.startsWith(`src/${area}/`)) && /\.tsx?$/.test(file) && !/(?:\.test\.|\/__tests__\/)/.test(file) && !app.reason(file));
  for (const a of sourceFiles(left)) for (const b of sourceFiles(right)) {
    if (a === b || a.split('/')[1] !== b.split('/')[1]) continue;
    const x = left.files.get(a).content, y = right.files.get(b).content;
    const ratio = similarity(x, y);
    if (ratio >= threshold) rows.push({ file: a, appFiles: { [left.app]: a, [right.app]: b }, apps: [left.app, right.app], similarity: ratio, pairs: [{ apps: [left.app, right.app], ratio }] });
  }
}
rows.sort((a, b) => a.file.localeCompare(b.file) || JSON.stringify(a.appFiles ?? {}).localeCompare(JSON.stringify(b.appFiles ?? {})));
const inventory = { ref: ref ?? 'working tree', threshold, apps: apps.map(({ app, root, revision }) => ({ app, root, revision })), rows, excluded };
if (json) process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
else {
  const decisionsPath = new URL('./mobile-shared-migrations.json', import.meta.url);
  const decisions = fs.existsSync(decisionsPath) ? JSON.parse(fs.readFileSync(decisionsPath, 'utf8')) : {};
  const lines = ['# Mobile shared inventory', '', 'Generated with `scripts/mobile-shared-inventory.mjs`. Sources are read only.', '', `Source: \`${inventory.ref}\`. Near-identical threshold: ${threshold}. Similarity is multiset Sørensen–Dice on consecutive lexical token pairs; whitespace and comments are ignored while string constants retain their content. A ratio of 1.0000 means token-pair counts match. The table shows the minimum qualifying pair ratio; JSON output retains each pair. Tests, JSON and existing shared re-exports are included. Native/store/component dependencies are excluded transitively, including test mocks. Equal relative paths are compared, plus differently named pure TS sources within the same area.`, '', 'Regenerate:', '', '```sh', 'node scripts/mobile-shared-inventory.mjs --ref origin/main \\', '  /Users/yan/git/dappgo-us-stocks-app \\', '  /Users/yan/git/dappgo-tw-stocks-app \\', '  /Users/yan/git/dappgo-options-app > docs/mobile-shared-inventory.md', '```', '', 'Omit `--ref` to inspect working trees; add `--json` for machine-readable pair ratios and exclusions. No fetch/checkouts or app writes are performed. These checkouts were behind their already available `origin/main` refs; the refs above were used without fetching because the task forbids writes outside this worktree.', '', '## Reference revisions', '', ...inventory.apps.map(({ app, revision }) => `- ${app}: \`${revision}\``), '', '## Pure duplicates', '', '| File | Apps | Similarity | Moved/kept + reason |', '|---|---|---:|---|'];
  for (const row of rows) {
    const decision = decisions[row.file];
    const files = [...new Set(Object.values(row.appFiles ?? { file: row.file }))].map((file) => `\`${file}\``).join(' ↔ ');
    lines.push(`| ${files} | ${row.apps.join(', ')} | ${row.similarity.toFixed(4)} | ${decision?.summary ?? 'Kept: different module contracts; review cross-path similarity before consolidation.'} |`);
  }
  const duplicatePaths = new Set(rows.map(({ file }) => file));
  const additional = Object.entries(decisions).filter(([file, decision]) => decision.target && !duplicatePaths.has(file));
  lines.push('', '## Additional extracted cores', '', 'Includes native/store-dependent files split behind the adapter contracts in module headers, and the US-only i18n core. Catalogs, hooks, native presentation and storage adapters remain in apps.', '', '| App file | Extraction |', '|---|---|');
  for (const [file, decision] of additional) lines.push(`| \`${file}\` | ${decision.summary} |`);
  lines.push('', '## Excluded repeated files', '', '| File | Dependency/similarity reason | Extraction decision |', '|---|---|---|');
  for (const row of excluded) lines.push(`| \`${row.file}\` | ${[...new Set(row.reasons.map(({ app, reason }) => `${app}: ${reason}`))].join('; ').replaceAll('|', '\\|')} | ${decisions[row.file]?.summary ?? 'Kept in apps; native/store adapter or divergent market behavior.'} |`);
  const packageRoot = new URL('../', import.meta.url);
  const exports = JSON.parse(fs.readFileSync(new URL('package.json', packageRoot), 'utf8')).exports;
  lines.push('', '## Package exports (0.4.0)', '', 'All previous root, utility and ads subpaths remain supported.', '', '| Export | Target |', '|---|---|');
  for (const [key, target] of Object.entries(exports)) lines.push(`| \`${key}\` | \`${target}\` |`);
  lines.push('', 'Public mobile modules (each supports both `mobile/…` and `src/mobile/…`):', '');
  const mobileRoot = new URL('src/mobile/', packageRoot);
  for (const file of walk(mobileRoot.pathname, mobileRoot.pathname).filter((file) => file.endsWith('.ts') && !file.includes('.test.') && !file.startsWith('__fixtures__/')).sort()) lines.push(`- \`${file.slice(0, -3)}\``);
  lines.push('', '## WP6b per-app follow-up', '');
  lines.push('Create one app-owned `AppProfile` from existing constants and build configuration. Bind factories once in the composition root. Pin all three apps to the future full shared commit SHA tarball and update their pnpm lockfiles. No app repository was changed here. Retain native/UI/integration tests; remove only assertions explicitly relocated to the shared package.', '', 'US/TW legacy `deep-links.ts` currently uses `dappgooptionsapp`; that value is preserved by fixtures and must be passed during migration. Correcting this legacy route is a separate app change. Options’ `market-cap.ts` has a different source order and remains app-specific.', '');
  for (const { app } of apps) {
    lines.push(`### ${app}`, '', '| App file | Follow-up |', '|---|---|');
    for (const [file, decision] of Object.entries(decisions).sort(([a], [b]) => a.localeCompare(b))) {
      if (decision.followup?.[app]) lines.push(`| \`${file}\` | ${decision.followup[app]} |`);
    }
    lines.push('');
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}
