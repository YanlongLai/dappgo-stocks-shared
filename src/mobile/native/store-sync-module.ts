/**
 * The DappGoStoreSync Expo local module (iOS receipt environment + explicit
 * StoreKit sync) lives as one copy per app under `modules/dappgo-store-sync`
 * because Expo autolinks local modules from the app root. Every copy must be
 * byte-identical; each app's parity test hashes its copy against this table.
 *
 * The podspec's `s.source` line names the app repository and is the one
 * permitted difference (normalised before hashing).
 *
 * To change the module: edit it in one app, copy it to the other two, update
 * these hashes in shared, then bump the shared pin in all three apps.
 */
export const STORE_SYNC_MODULE_SHA256: Readonly<Record<string, string>> = {
  'README.md': '578b569e92a3fabfd9fd88ca60c3295fc5663c6d8610a1ffdaa31c0c1a053f83',
  'expo-module.config.json': '33d1c0f95933b55c0fdb095e1920ba2347098745b3b25d4c264d330c290c39ed',
  'ios/DappGoStoreSyncModule.swift': '0634d27ed6d65c701496aae72134801bb83f7ab344375e7ed7af5c30407ad77f',
  'package.json': 'c1e910268dec7be1ec892c52c3e423a63086594192c140d69ba869d13239d466',
  'ios/DappGoStoreSync.podspec': 'bea6a5ff7775ebc04fc7646387433156aba004213a1fb31da2232d1e6b28108a',
};

/** Normalise a file before hashing (only the podspec's source line varies). */
export function normalizeStoreSyncFile(path: string, content: string): string {
  if (!path.endsWith('.podspec')) return content;
  return content.replace(/^\s*s\.source\s*=.*$/m, '  s.source = <app repo>');
}
