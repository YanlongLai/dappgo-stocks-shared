// Independent offline checks. Does not install packages, emit TS, or modify source.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
require.extensions['.ts'] = (module, file) => {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  });
  module._compile(output.outputText, file);
};
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.exports['.'], './src/index.ts');
assert.equal(pkg.exports['./dappgo-products'], './src/dappgo-products.ts');
assert.equal(pkg.main, 'src/index.ts');
assert.equal(pkg.types, 'src/index.ts');
assert.deepEqual(Object.keys(pkg.dependencies || {}), []);
for (const name of ['react', 'react-native', 'zustand']) {
  for (const field of ['dependencies', 'devDependencies']) assert.equal(pkg[field]?.[name], undefined);
  assert.equal(fs.existsSync(path.join(root, 'node_modules', name)), false);
}
const direct = require(path.join(root, 'src/dappgo-products.ts'));
const barrel = require(path.join(root, 'src/index.ts'));
for (const name of ['DAPPGO_PRODUCTS', 'DAPPGO_PROMOTION_COPY', 'getDappGoSiblingProducts']) {
  assert.strictEqual(barrel[name], direct[name], `public barrel ${name}`);
}
const ast = ts.createSourceFile('index.ts', fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
const exportedTypes = ast.statements.filter(ts.isExportDeclaration)
  .filter(n => n.moduleSpecifier?.text === './dappgo-products')
  .flatMap(n => n.exportClause.elements.filter(e => e.isTypeOnly).map(e => e.name.text));
assert.deepEqual(exportedTypes.sort(), ['DappGoApp', 'DappGoLanguage']);
const expected = {
  options: ['6768116720', 'com.dappgo.optionsapp', 'https://options.dappgo.com/us/'],
  'us-stocks': ['6768116546', 'com.dappgo.usstocksapp', 'https://stocks.dappgo.com/us/'],
  'tw-stocks': ['6768116538', 'com.dappgo.twstocksapp', 'https://stocks.dappgo.com/tw/'],
};
assert.deepEqual(direct.DAPPGO_PRODUCTS.map(p => p.id).sort(), Object.keys(expected).sort());
let combinations = 0;
for (const current of Object.keys(expected)) {
  for (const platform of ['ios', 'android', 'web', 'windows', 'macos', 'linux', 'unknown']) {
    for (const language of ['en', 'zh']) {
      const rows = barrel.getDappGoSiblingProducts(current, platform, language);
      assert.equal(rows.length, 2);
      assert.equal(new Set(rows.map(r => r.id)).size, 2);
      const destination = platform === 'ios' ? 'App Store' : platform === 'android' ? 'Google Play' : language === 'zh' ? '網頁版' : 'Web app';
      for (const row of rows) {
        assert.notEqual(row.id, current);
        const url = new URL(row.url);
        const [apple, android, web] = expected[row.id];
        assert.equal(url.protocol, 'https:');
        assert.equal(url.username + url.password + url.hash, '');
        if (platform === 'ios') {
          assert.equal(url.host, 'apps.apple.com');
          assert.equal(url.pathname.split('/').at(-1), `id${apple}`);
          assert.equal(url.search, '');
        } else if (platform === 'android') {
          assert.equal(url.host, 'play.google.com');
          assert.equal(url.pathname, '/store/apps/details');
          assert.deepEqual([...url.searchParams], [['id', android]]);
        } else assert.equal(row.url, web);
        assert.equal(row.destination, destination);
        assert.equal(row.accessibilityLabel, language === 'en' ? `Open ${row.name} in ${destination}` : `在 ${destination} 開啟 ${row.name}`);
        assert.ok(row.summary.length > 0);
        if (language === 'zh') assert.match(row.summary, /[\u3400-\u9fff]/);
      }
      combinations++;
    }
  }
}
for (const language of ['en', 'zh']) {
  const copy = direct.DAPPGO_PROMOTION_COPY[language];
  for (const key of ['title', 'web', 'errorTitle', 'errorMessage']) assert.ok(copy[key].trim());
  assert.match(copy.errorMessage, /dappgo\.com/);
}
console.log(JSON.stringify({ status: 'PASS', combinations, publicValueExports: 3, publicTypeExports: 2, runtimeDependencies: 0, forbiddenLocalPackages: 0, network: 'not performed', scope: 'pure catalog only' }));
