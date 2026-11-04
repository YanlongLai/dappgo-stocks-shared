import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

test('inventory finds whitespace/constants/cross-path clones and rejects native dependencies transitively', () => {
  const root = path.resolve(__dirname, '../..');
  const scratch = fs.mkdtempSync(path.join(root, 'node_modules/.cache/mobile-inventory-'));
  try {
    const apps = ['us_stocks', 'tw_stocks', 'options'].map(app => path.join(scratch, app));
    for (const [index, app] of apps.entries()) {
      const write = (name: string, text: string) => {
        const file = path.join(app, 'src', name);
        fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text);
      };
      write('ads/shared.ts', `export function policy(value: number) { ${index === 0 ? '\n  ' : ''} return value > 3 ? true : false; }`);
      write('ads/config.ts', `export const app = '${index}'; export function policy(value: number) { return value > 3 ? true : false; }`);
      write('ads/native.ts', "import { Platform } from 'react-native'; export const platform = Platform.OS;");
      write('ads/indirect.ts', "export { platform } from './native';");
      write('ads/storage.ts', "export { default } from '../platform/storage';");
      write('platform/storage.ts', "import storage from '@react-native-async-storage/async-storage'; export default storage;");
      write('ads/dynamic.ts', "export const sdk = require('expo-application');");
      write('ads/store.ts', "export { state } from '../store/settings-store';");
      write(`data/${index === 0 ? 'market-data' : 'tw-data'}.ts`, 'export function fetchPath(path: string) { return "dashboard/" + path; }');
    }
    const output = execFileSync(process.execPath, ['scripts/mobile-shared-inventory.mjs', '--json', ...apps], { cwd: root, encoding: 'utf8' });
    const inventory = JSON.parse(output);
    expect(inventory.rows.find((row: { file: string; appFiles?: unknown }) => row.file === 'src/ads/shared.ts' && !row.appFiles).similarity).toBe(1);
    expect(inventory.rows.find((row: { file: string; appFiles?: unknown }) => row.file === 'src/ads/config.ts' && !row.appFiles).apps).toHaveLength(3);
    expect(inventory.rows.some((row: { appFiles?: unknown }) => row.appFiles)).toBe(true);
    for (const name of ['native', 'indirect', 'storage', 'dynamic', 'store']) {
      expect(inventory.rows.some((row: { file: string }) => row.file === `src/ads/${name}.ts`)).toBe(false);
      expect(inventory.excluded.some((row: { file: string }) => row.file === `src/ads/${name}.ts`)).toBe(true);
    }
  } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
});
