# dappgo-stocks-shared

> Pure-TypeScript shared utilities for the **DappGo Stocks** product family.

Single source of truth for portable logic shared by [TW Stocks](https://github.com/YanlongLai/dappgo-tw-stocks-app), [US Stocks](https://github.com/YanlongLai/dappgo-us-stocks-app), and [Options](https://github.com/YanlongLai/dappgo-options-app). Version **0.4.0** adds the shared mobile logic layer. Runtime modules have no React or native dependencies and run in Node.

## Modules

| Module | Purpose |
|---|---|
| `verdict-label` | English verdict code → 繁中 label (BUY → 買進, HOT → 熱絡, …) |
| `verdict-explain` | Plain-language meaning + suggested action + risk band per verdict |
| `days-until` | Timezone-safe `YYYY-MM-DD` → days delta calculation |
| `insider-direction` | Classify net insider activity (`buying / selling / mixed / none`) |
| `sec-form-color` | SEC form type → semantic color (8-K red, 10-K gold, …) |
| `compute-ma` | Rolling simple moving average over OHLCV bars |
| `sector-aggregate` | Verdict counts + top gainer / loser per sector rotation |
| `ticker-aggregate` | Market sentiment summary across all tickers |

All modules are independently importable:

```ts
import { verdictLabel } from 'dappgo-stocks-shared/verdict-label';
import { computeMA } from 'dappgo-stocks-shared/compute-ma';
```

Or via the barrel:

```ts
import { verdictLabel, computeMA } from 'dappgo-stocks-shared';
```

## Mobile layer contract

`src/mobile/<area>/<name>.ts` owns portable policies, controllers, parsers and helpers. Apps supply an explicit `AppProfile` for identity, ad/product IDs, market/repository, cache settings, store targets and report patterns. Profiles are app-owned values passed to factories; shared runtime code never reads `process.env` or a global app profile. The three app snapshots in `src/mobile/__fixtures__` are test fixtures, not production configuration.

| Area | Shared logic |
|---|---|
| `ads` | Fullscreen admission/controllers, consent/request policy, measurement, route and banner policy, app-access admission, analytics consent with injected storage |
| `i18n` | Translation lookup, device locale resolution, catalog validation, Intl helpers requiring an explicit locale, engine-prose conversion selection |
| `updates` | Version comparison/policy, version gate controller, access admission, profile-bound store targets |
| `purchases` | Profile-bound product/entitlement lookup, entitlement state, recovery error policy, bounded reconciliation, store-operation admission |
| `data` | CDN → optional gateway → GitHub Raw, pointer/hash parsing, injected-fetch timeouts, in-memory cache, portable data helpers |
| `startup` | Startup entitlement/privacy/access decision; the existing startup fullscreen controller remains under `ads` |
| `utils` | Duplicated portable layout, navigation, search, indicator, coverage and presentation helpers |

React hooks/components, stores, native ad/billing/Firebase/permission SDKs, AsyncStorage/SecureStore/browser storage, platform lifecycle subscriptions, navigation/presentation, editorial catalogs and market-specific schema/data adapters stay in apps. A split module's header states its adapter contract. For example, apps read the current settings store before calling the shared Intl helpers, provide OpenCC as a converter, and provide storage through a structural protocol to the analytics controller.

```ts
import type { AppProfile } from 'dappgo-stocks-shared/mobile/app-profile';
import { createAdUnitCatalog } from 'dappgo-stocks-shared/mobile/ads/admob-config';
import { createDataSourceChain } from 'dappgo-stocks-shared/mobile/data/source-chain';
import { formatNumber } from 'dappgo-stocks-shared/mobile/i18n/format';

// Construct appProfile once from this app's existing configuration.
function bindMobileLogic(appProfile: AppProfile, fetcher: typeof fetch) {
  return {
    adUnits: createAdUnitCatalog(appProfile),
    data: createDataSourceChain(appProfile, { fetcher }),
  };
}
formatNumber(1234.5, { maximumFractionDigits: 2 }, 'zh-Hant');
```

`mobile/*` and `src/mobile/*` both resolve nested module names, such as `mobile/data/latest-pointer`. Existing `ads/*` and `src/ads/*` paths remain compatibility re-exports of `mobile/ads/*`, preserving the same runtime classes/functions. Existing utility/root imports also keep working. There is no mobile barrel because several areas intentionally expose names such as `formatPercent` with different contracts.

The [generated inventory and migration report](docs/mobile-shared-inventory.md) contains the full module/export list, pinned source revisions, similarity ratios, moved/kept reasons and exact per-app WP6b file actions. Market-specific algorithm differences remain in apps. The only `src/i18n` implementation currently exists in US Stocks; its portable core is prepared here for reuse while its catalogs remain local.

## Pin from an app

After the shared changes have a reviewed release commit, each app pins the immutable tarball to the **full 40-character commit SHA**, then updates its lockfile. Replace the placeholder below with that release's actual SHA; a version bump alone does not move an app's existing pin.

```json
{
  "dependencies": {
    "dappgo-stocks-shared": "https://codeload.github.com/YanlongLai/dappgo-stocks-shared/tar.gz/<FULL_40_CHARACTER_RELEASE_SHA>"
  }
}
```

```bash
pnpm install
pnpm install --frozen-lockfile
```

Do not use `main`, a moving tag or a local filesystem dependency for a release. WP6a changes only this package; the three app pins and thin adapters are follow-up work in WP6b.

For local sibling development:

```bash
cd dappgo-tw-stocks-app
pnpm add file:../dappgo-stocks-shared
```

Then update import paths from `'../utils/verdict-label'` to `'dappgo-stocks-shared/verdict-label'`.

> **React Native note**: Metro requires symlinks to be enabled (`watchFolders` config). For Expo SDK 54+ this is on by default. If you hit a "module not found", confirm `metro.config.js` includes the shared package's directory in `watchFolders`.

## Run tests

```bash
pnpm install
pnpm test
pnpm tsc
```

## Family

```
dappgo-stocks-shared (this) ← single source of truth
       ▲                    ▲                    ▲
dappgo-tw-stocks-app  dappgo-us-stocks-app  dappgo-options-app
```

## License

Proprietary. © DappGo.
