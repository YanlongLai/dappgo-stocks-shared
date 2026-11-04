# Mobile shared inventory

Generated with `scripts/mobile-shared-inventory.mjs`. Sources are read only.

Source: `origin/main`. Near-identical threshold: 0.85. Similarity is multiset Sørensen–Dice on consecutive lexical token pairs; whitespace and comments are ignored while string constants retain their content. A ratio of 1.0000 means token-pair counts match. The table shows the minimum qualifying pair ratio; JSON output retains each pair. Tests, JSON and existing shared re-exports are included. Native/store/component dependencies are excluded transitively, including test mocks. Equal relative paths are compared, plus differently named pure TS sources within the same area.

Regenerate:

```sh
node scripts/mobile-shared-inventory.mjs --ref origin/main \
  /Users/yan/git/dappgo-us-stocks-app \
  /Users/yan/git/dappgo-tw-stocks-app \
  /Users/yan/git/dappgo-options-app > docs/mobile-shared-inventory.md
```

Omit `--ref` to inspect working trees; add `--json` for machine-readable pair ratios and exclusions. No fetch/checkouts or app writes are performed. These checkouts were behind their already available `origin/main` refs; the refs above were used without fetching because the task forbids writes outside this worktree.

## Reference revisions

- us_stocks: `fc937cee1dd83c5d7630e6181a68e271f04e7931`
- tw_stocks: `5170afb187b5499cf17cc9a3816d5d7d64487b79`
- options: `238835ca5b0b815271b57380a17f85185b19feec`

## Pure duplicates

| File | Apps | Similarity | Moved/kept + reason |
|---|---|---:|---|
| `src/ads/ad-privacy-options.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/ad-privacy-options.ts`; shared pure implementation. |
| `src/ads/admob-config.test.ts` | us_stocks, tw_stocks | 1.0000 | Pure regression coverage moved to `src/mobile/ads/admob-config.test.ts`; app integration assertions remain local. |
| `src/ads/admob-config.ts` | us_stocks, tw_stocks, options | 0.9188 | Moved to `src/mobile/ads/admob-config.ts`; bind `createAdUnitCatalog` with an explicit app profile.  |
| `src/ads/admob.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/admob.ts`; shared pure implementation. |
| `src/ads/ai-summary-fullscreen-policy.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Already covered by the shared rewarded-admission regression suite, now relocated to mobile/ads. |
| `src/ads/ai-summary-interstitial.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/ads/ai-summary-interstitial.ts`. |
| `src/ads/ai-summary-interstitial.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/ai-summary-interstitial.ts`; shared pure implementation. |
| `src/ads/ai-summary-rewarded-types.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/ai-summary-rewarded-types.ts`; shared pure implementation. |
| `src/ads/ai-summary-rewarded.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/ai-summary-rewarded.ts`; shared pure implementation. |
| `src/ads/AnalyticsConsentControl.web.tsx` | us_stocks, tw_stocks, options | 1.0000 | Kept: React component boundary; platform selection and UI remain in apps. |
| `src/ads/app-access.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/ads/app-access.ts`. |
| `src/ads/app-access.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/app-access.ts`; shared pure implementation. |
| `src/ads/app-open-ad.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/app-open-ad.ts`; shared pure implementation. |
| `src/ads/app-open-ad.types.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/app-open-ad.types.ts`; shared pure implementation. |
| `src/ads/app-open-policy.test.ts` | us_stocks, tw_stocks | 1.0000 | Pure regression coverage moved to `src/mobile/ads/app-open-policy.test.ts`; app integration assertions remain local. |
| `src/ads/app-open-policy.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/ads/app-open-policy.ts`; bind `createAppOpenPolicy` with an explicit app profile. Preserve US/TW 4-hour and Options 5-minute resume cooldowns; absent Options startup constants remain undefined. |
| `src/ads/collapsible-banner-policy.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/ads/collapsible-banner-policy.ts`. |
| `src/ads/collapsible-banner-policy.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/collapsible-banner-policy.ts`; shared pure implementation. |
| `src/ads/interstitial-ad.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/interstitial-ad.ts`; shared pure implementation. |
| `src/ads/interstitial-policy.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/ads/interstitial-policy.ts`. |
| `src/ads/interstitial-policy.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/interstitial-policy.ts`; shared pure implementation. |
| `src/ads/interstitial-route-policy.test.ts` | us_stocks, tw_stocks, options | 0.9167 | Pure regression coverage moved to `src/mobile/ads/interstitial-route-policy.test.ts`; app integration assertions remain local. |
| `src/ads/interstitial-route-policy.ts` | us_stocks, tw_stocks, options | 0.9444 | Moved to `src/mobile/ads/interstitial-route-policy.ts`; bind `createInterstitialRoutePolicy` with an explicit app profile.  |
| `src/ads/ui-ad-access.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/ads/ui-ad-access.ts`; shared pure implementation. |
| `src/data/auth.web.ts` | us_stocks, tw_stocks, options | 0.8991 | Moved pure anonymous-auth fallback to `src/mobile/data/auth.web.ts`; Options retains its narrower named export surface. |
| `src/data/cache.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Pure regression coverage moved to `src/mobile/data/cache.test.ts`; app integration assertions remain local. |
| `src/data/cache.ts` | us_stocks, tw_stocks, options | 0.9943 | Moved to `src/mobile/data/cache.ts`; bind `createMemoryCache` with an explicit app profile. Keep a single bound in-memory cache instance per app. |
| `src/data/crashlytics.web.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/data/crashlytics.web.ts`; shared pure implementation. |
| `src/data/device-id.web.ts` | us_stocks, tw_stocks | 1.0000 | Kept: browser storage/identity adapter, outside the pure mobile core. |
| `src/data/ensure-user-doc.web.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/data/ensure-user-doc.web.ts`; shared pure implementation. |
| `src/data/fetch-with-timeout.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/data/fetch-with-timeout.ts`; factory requires fetch implementation and forwards caller abort. |
| `src/data/mappers.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/data/mappers.ts`; shared pure implementation. Options retains its divergent implementation. |
| `src/data/market-data.ts` ↔ `src/data/tw-data.ts` | us_stocks, tw_stocks | 0.8602 | Split US/TW duplicate delivery core into `source-chain.ts`, `latest-pointer.ts` and `data-hash.ts`; market schemas/cache/retry adapters remain in apps. |
| `src/data/notifications.web.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/data/notifications.web.ts`; shared pure implementation. |
| `src/data/ohlc-generator.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/data/ohlc-generator.ts`; shared pure implementation. |
| `src/data/parser.ts` | us_stocks, tw_stocks | 0.9875 | Moved to `src/mobile/data/parser.ts`; bind `createReportParser` with an explicit app profile.  |
| `src/data/privacy-config.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/data/privacy-config.ts`; shared pure implementation. |
| `src/data/sample-prices.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/data/sample-prices.ts`; shared pure implementation. |
| `src/data/schema-validator.test.ts` | us_stocks, tw_stocks | 0.8832 | Moved with `src/mobile/data/schema-validator.ts`. |
| `src/data/schema-validator.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/data/schema-validator.ts`; shared pure implementation. |
| `src/data/schema.ts` | us_stocks, tw_stocks | 0.9615 | Kept: US/TW validation fields and rich dashboard types differ; retain market schema adapters. |
| `src/data/secure-keys.web.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/data/secure-keys.web.ts`; shared pure implementation. |
| `src/purchases/ad-free-catalog.ts` | us_stocks, tw_stocks, options | 0.9494 | Moved to `src/mobile/purchases/ad-free-catalog.ts`; bind `createAdFreeCatalog` with an explicit app profile. Keep each app’s iOS lifetime product namespace. |
| `src/purchases/ad-free-reconciliation.test.ts` | us_stocks, options | 0.9305 | Pure regression coverage moved to `src/mobile/purchases/ad-free-reconciliation.test.ts`; app integration assertions remain local. |
| `src/purchases/ad-free-reconciliation.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/purchases/ad-free-reconciliation.ts`; shared pure implementation. |
| `src/purchases/ad-free-state.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/purchases/ad-free-state.ts`; shared pure implementation. |
| `src/purchases/ad-free.test.ts` | us_stocks, tw_stocks, options | 0.9643 | Pure regression coverage moved to `src/mobile/purchases/ad-free.test.ts`; app integration assertions remain local. |
| `src/purchases/ad-free.web.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/purchases/ad-free.web.ts`; shared pure implementation. |
| `src/purchases/store-operation.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/purchases/store-operation.ts`; shared pure implementation. |
| `src/updates/update-access.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/updates/update-access.ts`; shared pure implementation. |
| `src/updates/version-controller.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/updates/version-controller.ts`. |
| `src/updates/version-controller.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/updates/version-controller.ts`; shared pure implementation. |
| `src/updates/version-policy.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/updates/version-policy.ts`. |
| `src/updates/version-policy.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/updates/version-policy.ts`; shared pure implementation. |
| `src/utils/__tests__/ai-commentary.test.ts` | us_stocks, tw_stocks | 0.9413 | Kept: tests for divergent locale/catalog/market behavior; corresponding app module remains local. |
| `src/utils/__tests__/buy-back-simulator.test.ts` | us_stocks, tw_stocks | 0.9878 | Moved with `src/mobile/utils/buy-back-simulator.ts`. |
| `src/utils/__tests__/candle-layout.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/candle-layout.ts`. |
| `src/utils/__tests__/contribution-display.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/contribution-display.ts`. |
| `src/utils/__tests__/dashboard-tone.test.ts` | us_stocks, tw_stocks | 1.0000 | Kept: tests for divergent locale/catalog/market behavior; corresponding app module remains local. |
| `src/utils/__tests__/dashboard-top-mover.test.ts` | us_stocks, tw_stocks | 0.8941 | Moved with `src/mobile/utils/dashboard-top-mover.ts`. |
| `src/utils/__tests__/data-hash.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/data/data-hash.ts`. |
| `src/utils/__tests__/deep-link.test.ts` | us_stocks, tw_stocks | 0.9052 | Moved with `src/mobile/utils/deep-link.ts`. |
| `src/utils/__tests__/empty-state-detector.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/empty-state-detector.ts`. |
| `src/utils/__tests__/extra-indicators.test.ts` | us_stocks, tw_stocks | 1.0000 | Kept: tests embed copies of screen-local indicator functions; no independent module in inventory scope to move. |
| `src/utils/__tests__/glossary.test.ts` | us_stocks, tw_stocks | 0.9929 | Kept: tests for divergent locale/catalog/market behavior; corresponding app module remains local. |
| `src/utils/__tests__/hot-rank-board.test.ts` | us_stocks, tw_stocks | 0.9804 | Moved with `src/mobile/utils/hot-rank-board.ts`. |
| `src/utils/__tests__/insight-sort.test.ts` | us_stocks, tw_stocks | 0.9965 | Moved with `src/mobile/utils/insight-sort.ts`. |
| `src/utils/__tests__/multi-period-pills.test.ts` | us_stocks, tw_stocks | 1.0000 | Kept: tests for divergent locale/catalog/market behavior; corresponding app module remains local. |
| `src/utils/__tests__/onboarding-state.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/utils/onboarding-state.ts`. |
| `src/utils/__tests__/sentiment-dot.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/sentiment-dot.ts`. |
| `src/utils/__tests__/stock-navigation.test.ts` | us_stocks, tw_stocks | 0.9777 | Moved with `src/mobile/utils/stock-navigation.ts`. |
| `src/utils/__tests__/tab-badges.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/tab-badges.ts`. |
| `src/utils/__tests__/ticker-filter.test.ts` | us_stocks, tw_stocks | 0.8749 | Moved with `src/mobile/utils/ticker-filter.ts`. |
| `src/utils/__tests__/top-movers-board.test.ts` | us_stocks, tw_stocks | 0.8788 | Moved with `src/mobile/utils/top-movers-board.ts`. |
| `src/utils/__tests__/verdict-color.test.ts` | us_stocks, tw_stocks | 1.0000 | Pure regression coverage moved to `src/mobile/utils/verdict-color.test.ts`; app integration assertions remain local. |
| `src/utils/__tests__/verdict-score.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/verdict-score.ts`. |
| `src/utils/__tests__/version-tap.test.ts` | us_stocks, tw_stocks | 0.9912 | Moved with `src/mobile/utils/version-tap.ts`. |
| `src/utils/__tests__/vwap-display.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/vwap-display.ts`. |
| `src/utils/__tests__/weekly-movers-format.test.ts` | us_stocks, tw_stocks | 0.9483 | Moved with `src/mobile/utils/weekly-movers-format.ts`. |
| `src/utils/ai-commentary.ts` | us_stocks, tw_stocks | 0.9557 | Kept: locale fallback/selection algorithms differ, beyond app constants. |
| `src/utils/bollinger-bands.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/bollinger-bands.ts`. |
| `src/utils/bollinger-bands.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/bollinger-bands.ts`; shared pure implementation. |
| `src/utils/buy-back-simulator.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/buy-back-simulator.ts`; shared pure implementation. |
| `src/utils/candle-layout.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/candle-layout.ts`; shared pure implementation. |
| `src/utils/compute-ma.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/compute-ma.ts`. |
| `src/utils/compute-ma.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/compute-ma.ts`; shared pure implementation. |
| `src/utils/constants.test.ts` | us_stocks, options | 0.9193 | Kept: app universe/retention configuration tests; relevant extraction constants are copied to three shared profile fixtures. |
| `src/utils/contribution-bars.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/contribution-bars.ts`; shared pure implementation. |
| `src/utils/contribution-display.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/contribution-display.ts`; shared pure implementation. |
| `src/utils/dashboard-top-mover.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/dashboard-top-mover.ts`; shared pure implementation. |
| `src/utils/data-coverage.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/data-coverage.ts`; shared pure implementation. Options retains its divergent implementation. |
| `src/utils/data-hash.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/data/data-hash.ts`; shared pure implementation. |
| `src/utils/deep-link.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/deep-link.ts`; shared pure implementation. |
| `src/utils/deep-links.test.ts` | us_stocks, tw_stocks | 1.0000 | Pure regression coverage moved to `src/mobile/utils/deep-links.test.ts`; app integration assertions remain local. |
| `src/utils/deep-links.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/deep-links.ts`; bind `createDeepLinks` with an explicit app profile. US/TW’s existing legacy scheme is `dappgooptionsapp`; preserve it in this extraction. |
| `src/utils/earnings-calendar.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/utils/earnings-calendar.ts`. |
| `src/utils/earnings-calendar.ts` | us_stocks, tw_stocks, options | 0.9837 | Moved to `src/mobile/utils/earnings-calendar.ts`; shared pure implementation. |
| `src/utils/empty-state-detector.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/empty-state-detector.ts`; shared pure implementation. |
| `src/utils/glossary-linker.ts` | us_stocks, tw_stocks, options | 0.9673 | Moved matcher to `src/mobile/utils/glossary-linker.ts`; app catalogs and locale mapping are explicit factory dependencies. |
| `src/utils/glossary.ts` | us_stocks, tw_stocks | 0.9177 | Kept: market-specific editorial catalog, owned by each app. |
| `src/utils/highlight-markers.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/utils/highlight-markers.ts`. |
| `src/utils/highlight-markers.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/utils/highlight-markers.ts`; shared pure implementation. |
| `src/utils/hot-rank-board.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/hot-rank-board.ts`; shared pure implementation. |
| `src/utils/insight-sort.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/insight-sort.ts`; shared pure implementation. |
| `src/utils/insight-types.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/insight-types.ts`; shared pure implementation. |
| `src/utils/market-status.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/utils/market-status.ts`. |
| `src/utils/market-status.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/utils/market-status.ts`; shared pure implementation. |
| `src/utils/native-presentation.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/utils/native-presentation.ts`. |
| `src/utils/native-presentation.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/utils/native-presentation.ts`; shared pure implementation. |
| `src/utils/news-aggregator.ts` | us_stocks, tw_stocks | 0.9295 | Kept: US feed and dashboard selection behavior differs from TW. |
| `src/utils/onboarding-state.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/utils/onboarding-state.ts`; shared pure implementation. |
| `src/utils/report-sections.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/report-sections.ts`; shared pure implementation. |
| `src/utils/responsive-layout.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/responsive-layout.ts`. |
| `src/utils/responsive-layout.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/utils/responsive-layout.ts`; shared pure implementation. |
| `src/utils/rotation-safe-layout.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/utils/rotation-safe-layout.ts`. |
| `src/utils/rotation-safe-layout.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/utils/rotation-safe-layout.ts`; shared pure implementation. |
| `src/utils/search-history.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/search-history.ts`; shared pure implementation. Options retains its divergent implementation. |
| `src/utils/sentiment-dot.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/sentiment-dot.ts`; shared pure implementation. |
| `src/utils/settings-rows.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/settings-rows.ts`; shared pure implementation. |
| `src/utils/shared.ts` | us_stocks, tw_stocks, options | 1.0000 | Kept: already a thin re-export of the existing shared package barrel. |
| `src/utils/signal-labels.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/signal-labels.ts`. |
| `src/utils/signal-labels.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/signal-labels.ts`; shared pure implementation. |
| `src/utils/stale-detection.test.ts` | us_stocks, tw_stocks, options | 0.9031 | Moved with `src/mobile/utils/stale-detection.ts`. |
| `src/utils/stale-detection.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/utils/stale-detection.ts`; shared pure implementation. |
| `src/utils/stock-navigation.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/stock-navigation.ts`; shared pure implementation. |
| `src/utils/summary-highlights.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/summary-highlights.ts`. |
| `src/utils/summary-highlights.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/summary-highlights.ts`; shared pure implementation. |
| `src/utils/tab-badges.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/tab-badges.ts`; shared pure implementation. |
| `src/utils/theme-mode.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/theme-mode.ts`; shared pure implementation. |
| `src/utils/ticker-filter.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/ticker-filter.ts`; shared pure implementation. |
| `src/utils/top-movers-board.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/top-movers-board.ts`; shared pure implementation. |
| `src/utils/types.ts` | us_stocks, tw_stocks, options | 0.8749 | Moved identical US/TW types to `src/mobile/utils/types.ts`; Options’ richer domain types stay in its app. |
| `src/utils/verdict-color.ts` | us_stocks, tw_stocks | 0.9065 | Moved identical runtime color mapping to `src/mobile/utils/verdict-color.ts`; TW nullable type is compatible with US callers. |
| `src/utils/verdict-explain.test.ts` | us_stocks, tw_stocks | 1.0000 | Kept: tests for divergent locale/catalog/market behavior; corresponding app module remains local. |
| `src/utils/verdict-factors.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/verdict-factors.ts`. |
| `src/utils/verdict-factors.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/verdict-factors.ts`; shared pure implementation. |
| `src/utils/verdict-label.test.ts` | us_stocks, tw_stocks | 1.0000 | Moved with `src/mobile/utils/verdict-label.ts`. |
| `src/utils/verdict-label.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/verdict-label.ts`; shared pure implementation. |
| `src/utils/verdict-score.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/verdict-score.ts`; shared pure implementation. |
| `src/utils/version-tap.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/version-tap.ts`; shared pure implementation. |
| `src/utils/vwap-display.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/vwap-display.ts`; shared pure implementation. |
| `src/utils/watchlist-toggle.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/watchlist-toggle.ts`; shared pure implementation. |
| `src/utils/web-search-shortcut.test.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved with `src/mobile/utils/web-search-shortcut.ts`. |
| `src/utils/web-search-shortcut.ts` | us_stocks, tw_stocks, options | 1.0000 | Moved to `src/mobile/utils/web-search-shortcut.ts`; shared pure implementation. |
| `src/utils/weekly-movers-format.ts` | us_stocks, tw_stocks | 1.0000 | Moved to `src/mobile/utils/weekly-movers-format.ts`; shared pure implementation. |

## Additional extracted cores

Includes native/store-dependent files split behind the adapter contracts in module headers, and the US-only i18n core. Catalogs, hooks, native presentation and storage adapters remain in apps.

| App file | Extraction |
|---|---|
| `src/purchases/ad-free.web.test.ts` | Pure browser fallback assertions moved to `src/mobile/purchases/ad-free.web.test.ts`; native SDK mock is virtual in Node. |
| `src/utils/data-coverage.test.ts` | Moved with `src/mobile/utils/data-coverage.ts`. |
| `src/utils/report-sections.test.ts` | Moved with `src/mobile/utils/report-sections.ts`. |
| `src/utils/search-history.test.ts` | Moved with `src/mobile/utils/search-history.ts`. |
| `src/utils/__tests__/search-history.test.ts` | Moved with `src/mobile/utils/search-history.ts`. |
| `src/utils/__tests__/watchlist-toggle.test.ts` | Moved with `src/mobile/utils/watchlist-toggle.ts`. |
| `src/i18n/locale.ts` | Moved to `src/mobile/i18n/locale.ts`; shared pure implementation. |
| `src/i18n/locale.test.ts` | Moved with `src/mobile/i18n/locale.ts`. |
| `src/i18n/translate.ts` | Moved to `src/mobile/i18n/translate.ts`; shared pure implementation. |
| `src/i18n/translate.test.ts` | Moved with `src/mobile/i18n/translate.ts`. |
| `src/i18n/catalog-validation.ts` | Moved to `src/mobile/i18n/catalog-validation.ts`; shared pure implementation. |
| `src/data/public-request.ts` | Moved to `src/mobile/data/public-request.ts`; shared pure implementation. |
| `src/data/public-request.web.ts` | Moved to `src/mobile/data/public-request.web.ts`; shared pure implementation. |
| `src/ads/analytics-consent.ts` | Split core to `src/mobile/ads/analytics-consent.ts`; factory receives storage protocol; AsyncStorage adapter remains in app. |
| `src/ads/ad-request-options.ts` | Split pure request/identity policy to `src/mobile/ads/ad-request-options.ts`; platform/AppState reads remain in app. |
| `src/ads/ad-measurement.ts` | Split profile-bound reporter to `src/mobile/ads/ad-measurement.ts`; Firebase/native platform adapter remains in app. |
| `src/ads/startup-ad-decision.ts` | Moved structural startup decision to `src/mobile/startup/startup-ad-decision.ts`; no native type dependency remains. |
| `src/data/tw-data.ts` | Split shared delivery/pointer/hash core to `src/mobile/data/{source-chain,latest-pointer,data-hash}.ts`; TW schema/cache/retry code remains. |
| `src/data/github-api.ts` | Split common report-path/delivery/timeout/pointer helpers; app-specific report indexing and dashboard adapters remain. |
| `src/i18n/format.ts` | Split pure Intl helpers to `src/mobile/i18n/format.ts`; locale is required and settings-store defaults stay in US adapter. |
| `src/i18n/content-locale.ts` | Split conversion-selection core to `src/mobile/i18n/content-locale.ts`; OpenCC initialization and React hook stay in US adapter. |
| `src/constants/update-target.ts` | Moved URL/identity selection to `src/mobile/updates/update-target.ts`; native store opening remains in apps. |
| `src/updates/version-runtime.ts` | Native runtime remains in apps; profile-bound version-policy factory is shared. |
| `src/ads/startup-ad-decision.test.ts` | Pure regression coverage moved to `src/mobile/startup/startup-ad-decision.test.ts`; app integration assertions remain local. |
| `src/ads/analytics-consent.test.ts` | Pure regression coverage moved to `src/mobile/ads/analytics-consent.test.ts`; app integration assertions remain local. |
| `src/i18n/format.test.ts` | Pure regression coverage moved to `src/mobile/i18n/format.test.ts`; app integration assertions remain local. |
| `src/i18n/catalog-validation.test.ts` | Pure regression coverage moved to `src/mobile/i18n/catalog-validation.test.ts`; app integration assertions remain local. |
| `src/purchases/ad-free.ts` | Split pure entitlement/customer-info patch, lifetime-package lookup, cancellation and recovery error mapping to `src/mobile/purchases/entitlement.ts`; native purchase state machine and SDK remain in apps. |

## Excluded repeated files

| File | Dependency/similarity reason | Extraction decision |
|---|---|---|
| `src/ads/AnalyticsConsentControl.test.tsx` | us_stocks: src/ads/AnalyticsConsentControl.test.tsx imports react; tw_stocks: src/ads/AnalyticsConsentControl.test.tsx imports react; options: src/ads/AnalyticsConsentControl.test.tsx imports react | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/AnalyticsConsentControl.tsx` | us_stocks: src/ads/AnalyticsConsentControl.tsx imports react; tw_stocks: src/ads/AnalyticsConsentControl.tsx imports react; options: src/ads/AnalyticsConsentControl.tsx imports react | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/ad-measurement.ts` | us_stocks: src/ads/ad-measurement.ts imports react-native; tw_stocks: src/ads/ad-measurement.ts imports react-native; options: src/ads/ad-measurement.ts imports react-native | Split profile-bound reporter to `src/mobile/ads/ad-measurement.ts`; Firebase/native platform adapter remains in app. |
| `src/ads/ad-request-options.ts` | us_stocks: src/ads/ad-request-options.ts imports react-native; tw_stocks: src/ads/ad-request-options.ts imports react-native; options: src/ads/ad-request-options.ts imports react-native | Split pure request/identity policy to `src/mobile/ads/ad-request-options.ts`; platform/AppState reads remain in app. |
| `src/ads/admob.native.ts` | us_stocks: src/ads/admob.native.ts imports expo-constants; tw_stocks: src/ads/admob.native.ts imports expo-constants; options: src/ads/admob.native.ts imports expo-constants | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/ai-summary-rewarded.native.test.ts` | us_stocks: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage; tw_stocks: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage; options: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/ai-summary-rewarded.native.ts` | us_stocks: src/ads/ai-summary-rewarded.native.ts imports react-native; tw_stocks: src/ads/ai-summary-rewarded.native.ts imports react-native; options: src/ads/ai-summary-rewarded.native.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/analytics-consent.test.ts` | us_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; tw_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; options: src/platform/storage.ts imports @react-native-async-storage/async-storage | Pure regression coverage moved to `src/mobile/ads/analytics-consent.test.ts`; app integration assertions remain local. |
| `src/ads/analytics-consent.ts` | us_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; tw_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; options: src/platform/storage.ts imports @react-native-async-storage/async-storage | Split core to `src/mobile/ads/analytics-consent.ts`; factory receives storage protocol; AsyncStorage adapter remains in app. |
| `src/ads/app-open-ad.native.test.ts` | us_stocks: src/ads/app-open-ad.native.test.ts imports @react-native-async-storage/async-storage; tw_stocks: src/ads/app-open-ad.native.test.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/app-open-ad.native.ts` | us_stocks: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage; tw_stocks: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage; options: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/att-runtime.test.ts` | us_stocks: src/ads/att-runtime.test.ts imports react-native; tw_stocks: src/ads/att-runtime.test.ts imports react-native; options: src/ads/att-runtime.test.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/consent.native.test.ts` | us_stocks: src/ads/consent.native.test.ts imports react-native; tw_stocks: src/ads/consent.native.test.ts imports react-native; options: src/ads/consent.native.test.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/fullscreen-runtime.test.ts` | us_stocks: src/ads/fullscreen-runtime.test.ts imports @react-native-async-storage/async-storage; tw_stocks: src/ads/fullscreen-runtime.test.ts imports @react-native-async-storage/async-storage; options: src/ads/fullscreen-runtime.test.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/fullscreen-runtime.ts` | us_stocks: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage; tw_stocks: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage; options: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/interstitial-ad.native.ts` | us_stocks: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage; tw_stocks: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage; options: src/ads/fullscreen-runtime.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/privacy-options.native.test.ts` | us_stocks: src/ads/privacy-options.native.test.ts imports react-native; tw_stocks: src/ads/privacy-options.native.test.ts imports react-native; options: src/ads/privacy-options.native.test.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/privacy-options.web.test.ts` | us_stocks: src/ads/privacy-options.web.test.ts imports react-native-google-mobile-ads; tw_stocks: src/ads/privacy-options.web.test.ts imports react-native-google-mobile-ads; options: src/ads/privacy-options.web.test.ts imports react-native-google-mobile-ads | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/startup-ad-decision.test.ts` | us_stocks: src/ads/ad-request-options.ts imports react-native; tw_stocks: src/ads/ad-request-options.ts imports react-native; options: src/ads/ad-request-options.ts imports react-native | Pure regression coverage moved to `src/mobile/startup/startup-ad-decision.test.ts`; app integration assertions remain local. |
| `src/ads/startup-ad-decision.ts` | us_stocks: src/ads/ad-request-options.ts imports react-native; tw_stocks: src/ads/ad-request-options.ts imports react-native; options: src/ads/ad-request-options.ts imports react-native | Moved structural startup decision to `src/mobile/startup/startup-ad-decision.ts`; no native type dependency remains. |
| `src/ads/tracking-authorization.ts` | us_stocks: src/ads/tracking-authorization.ts imports react-native; tw_stocks: src/ads/tracking-authorization.ts imports react-native; options: src/ads/tracking-authorization.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/use-ad-privacy-options.test.tsx` | us_stocks: src/ads/use-ad-privacy-options.test.tsx imports react-native; tw_stocks: src/ads/use-ad-privacy-options.test.tsx imports react-native; options: src/ads/use-ad-privacy-options.test.tsx imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/ads/use-ad-privacy-options.ts` | us_stocks: src/ads/use-ad-privacy-options.ts imports react; tw_stocks: src/ads/use-ad-privacy-options.ts imports react; options: src/ads/use-ad-privacy-options.ts imports react | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/__tests__/alert-notifications.test.ts` | us_stocks: src/data/__tests__/alert-notifications.test.ts imports @react-native-async-storage/async-storage; tw_stocks: src/data/__tests__/alert-notifications.test.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/account.ts` | us_stocks: src/data/firebase.ts imports firebase/app; tw_stocks: src/data/firebase.ts imports firebase/app; options: src/data/account.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/account.web.ts` | us_stocks: src/data/firebase.ts imports firebase/app; tw_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; options: src/data/account.web.ts imports ../store/settings-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/alert-notifications.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: src/utils/alert-checker.ts imports ../store/alerts-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/analytics-native-config.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/analytics.test.ts` | us_stocks: src/data/analytics.test.ts imports @react-native-async-storage/async-storage; tw_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; options: src/data/analytics.test.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/analytics.ts` | us_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; tw_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; options: src/data/analytics.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/analytics.web.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; options: src/data/analytics.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/auth.ts` | us_stocks: src/data/firebase.ts imports firebase/app; tw_stocks: src/data/firebase.ts imports firebase/app; options: src/data/firebase.ts imports firebase/app | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/crashlytics.test.ts` | us_stocks: src/data/crashlytics.test.ts imports @react-native-firebase/crashlytics; tw_stocks: src/data/crashlytics.test.ts imports @react-native-firebase/crashlytics; options: src/data/crashlytics.test.ts imports @react-native-firebase/crashlytics | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/crashlytics.ts` | us_stocks: src/data/crashlytics.ts imports @react-native-firebase/crashlytics; tw_stocks: src/data/crashlytics.ts imports @react-native-firebase/crashlytics; options: src/data/crashlytics.ts imports @react-native-firebase/crashlytics | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/device-id.ts` | us_stocks: src/data/device-id.ts imports expo-secure-store; tw_stocks: src/data/device-id.ts imports expo-secure-store; options: src/data/device-id.ts imports expo-secure-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/ensure-user-doc.ts` | us_stocks: src/data/firebase.ts imports firebase/app; tw_stocks: src/data/firebase.ts imports firebase/app; options: src/data/firebase.ts imports firebase/app | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/firebase.ts` | us_stocks: src/data/firebase.ts imports firebase/app; tw_stocks: src/data/firebase.ts imports firebase/app; options: src/data/firebase.ts imports firebase/app | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/firebase.web.ts` | us_stocks: src/data/firebase.web.ts imports firebase/app; tw_stocks: src/data/firebase.web.ts imports firebase/app; options: src/data/firebase.web.ts imports firebase/app | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/github-api.test.ts` | tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/github-api.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Split common report-path/delivery/timeout/pointer helpers; app-specific report indexing and dashboard adapters remain. |
| `src/data/glossary-data.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/notification-permissions.ts` | us_stocks: src/data/notification-permissions.ts imports expo-notifications; tw_stocks: src/data/notification-permissions.ts imports expo-notifications | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/notification-permissions.web.ts` | us_stocks: src/data/notification-permissions.ts imports expo-notifications; tw_stocks: src/data/notification-permissions.ts imports expo-notifications | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/notification-prefs.test.ts` | us_stocks: src/data/firebase.ts imports firebase/app; tw_stocks: src/data/firebase.ts imports firebase/app; options: src/data/firebase.ts imports firebase/app | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/notification-prefs.ts` | us_stocks: src/data/firebase.ts imports firebase/app; tw_stocks: src/data/firebase.ts imports firebase/app; options: src/data/firebase.ts imports firebase/app | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/notification-prefs.web.ts` | us_stocks: src/data/firebase.ts imports firebase/app; tw_stocks: src/data/firebase.ts imports firebase/app; options: src/data/firebase.ts imports firebase/app | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/notifications.ts` | us_stocks: src/data/notifications.ts imports expo-notifications; tw_stocks: src/data/notifications.ts imports expo-notifications; options: src/utils/i18n.ts imports react | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/public-request.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Moved to `src/mobile/data/public-request.ts`; shared pure implementation. |
| `src/data/public-request.web.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Moved to `src/mobile/data/public-request.web.ts`; shared pure implementation. |
| `src/data/push.test.ts` | us_stocks: src/data/firebase.ts imports firebase/app; tw_stocks: src/data/firebase.ts imports firebase/app; options: src/data/firebase.ts imports firebase/app | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/push.ts` | us_stocks: src/data/push.ts imports react-native; tw_stocks: src/data/push.ts imports react-native; options: src/data/push.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/push.web.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: src/data/push.ts imports react-native; options: src/data/push.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/refresh-engine.ts` | us_stocks: src/data/refresh-engine.ts imports react-native; tw_stocks: src/data/refresh-engine.ts imports react-native; options: src/data/refresh-engine.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/schema.test.ts` | tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/data/secure-keys.ts` | us_stocks: src/data/secure-keys.ts imports expo-secure-store; tw_stocks: src/data/secure-keys.ts imports expo-secure-store; options: src/data/secure-keys.ts imports expo-secure-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/purchases/ad-free-purchase.test.ts` | us_stocks: src/purchases/ad-free-purchase.test.ts imports react-native; tw_stocks: src/purchases/ad-free-purchase.test.ts imports react-native; options: src/purchases/ad-free-purchase.test.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/purchases/ad-free-store-recovery.test.ts` | us_stocks: src/purchases/ad-free-store-recovery.test.ts imports react-native; tw_stocks: src/purchases/ad-free-store-recovery.test.ts imports react-native; options: src/purchases/ad-free-store-recovery.test.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/purchases/ad-free.ts` | us_stocks: src/purchases/apple-store-sync.ts imports react-native; tw_stocks: src/purchases/apple-store-sync.ts imports react-native; options: src/purchases/apple-store-sync.ts imports react-native | Split pure entitlement/customer-info patch, lifetime-package lookup, cancellation and recovery error mapping to `src/mobile/purchases/entitlement.ts`; native purchase state machine and SDK remain in apps. |
| `src/purchases/ad-free.web.test.ts` | us_stocks: src/purchases/ad-free.web.test.ts imports react-native-purchases; tw_stocks: src/purchases/ad-free.web.test.ts imports react-native-purchases; options: src/purchases/ad-free.web.test.ts imports react-native-purchases | Pure browser fallback assertions moved to `src/mobile/purchases/ad-free.web.test.ts`; native SDK mock is virtual in Node. |
| `src/purchases/apple-store-sync.test.ts` | us_stocks: src/purchases/apple-store-sync.test.ts imports react-native; tw_stocks: src/purchases/apple-store-sync.test.ts imports react-native; options: src/purchases/apple-store-sync.test.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/purchases/apple-store-sync.ts` | us_stocks: src/purchases/apple-store-sync.ts imports react-native; tw_stocks: src/purchases/apple-store-sync.ts imports react-native; options: src/purchases/apple-store-sync.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/updates/version-runtime.test.ts` | us_stocks: src/updates/version-runtime.test.ts imports react-native; tw_stocks: src/updates/version-runtime.test.ts imports react-native; options: src/updates/version-runtime.test.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/updates/version-runtime.ts` | us_stocks: src/updates/version-runtime.ts imports expo-application; tw_stocks: src/updates/version-runtime.ts imports expo-application; options: src/updates/version-runtime.ts imports expo-application | Native runtime remains in apps; profile-bound version-policy factory is shared. |
| `src/utils/__tests__/a11y-stock-row.test.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/alert-checker.test.ts` | us_stocks: src/utils/alert-checker.ts imports ../store/alerts-store; tw_stocks: src/utils/alert-checker.ts imports ../store/alerts-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/card-visibility.test.ts` | us_stocks: src/utils/card-visibility.ts imports ../store/card-visibility-store; tw_stocks: src/utils/card-visibility.ts imports ../store/card-visibility-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/compare-metrics.test.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/header-haptics.test.ts` | us_stocks: src/utils/header-haptics.ts imports expo-router; tw_stocks: src/utils/header-haptics.ts imports expo-router | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/hot-rank-display.test.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/ma-cross-display.test.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/news-aggregator.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/news-quality.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/notification-prefs-derived.test.ts` | us_stocks: src/data/notification-permissions.ts imports expo-notifications; tw_stocks: src/data/notification-permissions.ts imports expo-notifications | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/offline-cache.test.ts` | us_stocks: src/utils/__tests__/offline-cache.test.ts imports @react-native-async-storage/async-storage; tw_stocks: src/utils/__tests__/offline-cache.test.ts imports @react-native-async-storage/async-storage; options: src/utils/__tests__/offline-cache.test.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/onboarding-pages.test.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/search-history.test.ts` | us_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Moved with `src/mobile/utils/search-history.ts`. |
| `src/utils/__tests__/sector-filter.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/sector-rs-display.test.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/settings-actions.test.ts` | us_stocks: src/utils/settings-actions.ts imports ../store/settings-store; tw_stocks: src/utils/settings-actions.ts imports ../store/settings-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/share-stock.test.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/signal-presets.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/stock-action-bar.test.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/supported-tickers.test.ts` | tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/tier-features.test.ts` | us_stocks: src/utils/tier-features.ts imports ../store/settings-store; tw_stocks: src/utils/tier-features.ts imports ../store/settings-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/top-movers.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/verdict-change.test.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/volume-by-price-display.test.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/watchlist-share-text.test.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/__tests__/watchlist-toggle.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Moved with `src/mobile/utils/watchlist-toggle.ts`. |
| `src/utils/a11y-stock-row.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/accessibility.ts` | us_stocks: src/utils/accessibility.ts imports react; tw_stocks: src/utils/accessibility.ts imports react; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/alert-checker.ts` | us_stocks: src/utils/alert-checker.ts imports ../store/alerts-store; tw_stocks: src/utils/alert-checker.ts imports ../store/alerts-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/card-visibility.ts` | us_stocks: src/utils/card-visibility.ts imports ../store/card-visibility-store; tw_stocks: src/utils/card-visibility.ts imports ../store/card-visibility-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/compare-metrics.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/constants.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/dashboard-tone.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/data-coverage.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Moved with `src/mobile/utils/data-coverage.ts`. |
| `src/utils/emoji-to-icon.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/export.ts` | us_stocks: src/utils/export.ts imports ../store/watchlist-store; tw_stocks: src/utils/export.ts imports ../store/watchlist-store; options: src/utils/export.ts imports ../store/watchlist-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/format.test.ts` | us_stocks: src/utils/format.test.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/format.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/haptics.ts` | us_stocks: src/utils/haptics.ts imports react-native; tw_stocks: src/utils/haptics.ts imports react-native; options: src/utils/haptics.ts imports react-native | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/header-haptics.ts` | us_stocks: src/utils/header-haptics.ts imports expo-router; tw_stocks: src/utils/header-haptics.ts imports expo-router; options: src/utils/header-haptics.ts imports expo-router | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/hot-rank-display.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/i18n.push-keys.test.ts` | us_stocks: src/utils/i18n.push-keys.test.ts imports ../store/settings-store; tw_stocks: src/utils/i18n.push-keys.test.ts imports ../store/settings-store; options: src/utils/i18n.push-keys.test.ts imports ../store/settings-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/i18n.ts` | us_stocks: src/i18n/index.ts imports react; tw_stocks: src/utils/i18n.ts imports react; options: src/utils/i18n.ts imports react | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/locale.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/locale.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/ma-cross-display.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/multi-period-pills.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/news-quality.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/notification-prefs-derived.ts` | us_stocks: src/data/notification-permissions.ts imports expo-notifications; tw_stocks: src/data/notification-permissions.ts imports expo-notifications | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/offline-cache.ts` | us_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; tw_stocks: src/platform/storage.ts imports @react-native-async-storage/async-storage; options: src/platform/storage.ts imports @react-native-async-storage/async-storage | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/onboarding-pages.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/open-news-article.test.ts` | us_stocks: src/utils/open-news-article.test.ts imports expo-web-browser; tw_stocks: src/utils/open-news-article.test.ts imports expo-web-browser; options: src/utils/open-news-article.test.ts imports expo-web-browser | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/open-news-article.ts` | us_stocks: src/utils/open-news-article.ts imports expo-web-browser; tw_stocks: src/utils/open-news-article.ts imports expo-web-browser; options: src/utils/open-news-article.ts imports expo-web-browser | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/search-history.test.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Moved with `src/mobile/utils/search-history.ts`. |
| `src/utils/sector-filter.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/sector-rs-display.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/settings-actions.ts` | us_stocks: src/utils/settings-actions.ts imports ../store/settings-store; tw_stocks: src/utils/settings-actions.ts imports ../store/settings-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/share-stock.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/signal-presets.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/stock-action-bar.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/supported-tickers.ts` | tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/tier-features.ts` | us_stocks: src/utils/tier-features.ts imports ../store/settings-store; tw_stocks: src/utils/tier-features.ts imports ../store/settings-store | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/top-movers.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/valuation-model-format.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; options: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/verdict-change.ts` | us_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons; tw_stocks: src/utils/emoji-to-icon.ts imports @expo/vector-icons | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/verdict-explain.ts` | us_stocks: No pure peer above the similarity threshold; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/volume-by-price-display.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |
| `src/utils/watchlist-share-text.ts` | us_stocks: src/i18n/format.ts imports ../store/settings-store; tw_stocks: No pure peer above the similarity threshold | Kept in apps; native/store adapter or divergent market behavior. |

## Package exports (0.4.0)

All previous root, utility and ads subpaths remain supported.

| Export | Target |
|---|---|
| `.` | `./src/index.ts` |
| `./dappgo-products` | `./src/dappgo-products.ts` |
| `./verdict-label` | `./src/verdict-label.ts` |
| `./verdict-explain` | `./src/verdict-explain.ts` |
| `./days-until` | `./src/days-until.ts` |
| `./insider-direction` | `./src/insider-direction.ts` |
| `./sec-form-color` | `./src/sec-form-color.ts` |
| `./compute-ma` | `./src/compute-ma.ts` |
| `./sector-aggregate` | `./src/sector-aggregate.ts` |
| `./ticker-aggregate` | `./src/ticker-aggregate.ts` |
| `./ads/*` | `./src/ads/*.ts` |
| `./src/ads/*` | `./src/ads/*.ts` |
| `./mobile/*` | `./src/mobile/*.ts` |
| `./src/mobile/*` | `./src/mobile/*.ts` |

Public mobile modules (each supports both `mobile/…` and `src/mobile/…`):

- `ads/ad-measurement`
- `ads/ad-privacy-options`
- `ads/ad-request-options`
- `ads/admission`
- `ads/admob-config`
- `ads/admob`
- `ads/ai-summary-interstitial`
- `ads/ai-summary-rewarded-types`
- `ads/ai-summary-rewarded`
- `ads/analytics-consent`
- `ads/app-access`
- `ads/app-open-ad`
- `ads/app-open-ad.types`
- `ads/app-open-policy`
- `ads/collapsible-banner-policy`
- `ads/consent`
- `ads/fullscreen-controller`
- `ads/interstitial-ad`
- `ads/interstitial-policy`
- `ads/interstitial-route-policy`
- `ads/route-policy`
- `ads/startup-app-open-controller`
- `ads/telemetry`
- `ads/ui-ad-access`
- `app-profile`
- `data/auth.web`
- `data/cache`
- `data/crashlytics.web`
- `data/data-hash`
- `data/ensure-user-doc.web`
- `data/fetch-with-timeout`
- `data/latest-pointer`
- `data/mappers`
- `data/notifications.web`
- `data/ohlc-generator`
- `data/parser`
- `data/privacy-config`
- `data/public-request`
- `data/public-request.web`
- `data/sample-prices`
- `data/schema-validator`
- `data/secure-keys.web`
- `data/source-chain`
- `i18n/catalog-validation`
- `i18n/content-locale`
- `i18n/format`
- `i18n/locale`
- `i18n/translate`
- `purchases/ad-free-catalog`
- `purchases/ad-free-reconciliation`
- `purchases/ad-free-state`
- `purchases/ad-free.web`
- `purchases/entitlement`
- `purchases/store-operation`
- `startup/startup-ad-decision`
- `updates/update-access`
- `updates/update-target`
- `updates/version-controller`
- `updates/version-policy`
- `utils/bollinger-bands`
- `utils/buy-back-simulator`
- `utils/candle-layout`
- `utils/compute-ma`
- `utils/contribution-bars`
- `utils/contribution-display`
- `utils/dashboard-top-mover`
- `utils/data-coverage`
- `utils/deep-link`
- `utils/deep-links`
- `utils/earnings-calendar`
- `utils/empty-state-detector`
- `utils/glossary-linker`
- `utils/highlight-markers`
- `utils/hot-rank-board`
- `utils/insight-sort`
- `utils/insight-types`
- `utils/market-status`
- `utils/native-presentation`
- `utils/onboarding-state`
- `utils/report-sections`
- `utils/responsive-layout`
- `utils/rotation-safe-layout`
- `utils/search-history`
- `utils/sentiment-dot`
- `utils/settings-rows`
- `utils/signal-labels`
- `utils/stale-detection`
- `utils/stock-navigation`
- `utils/summary-highlights`
- `utils/tab-badges`
- `utils/theme-mode`
- `utils/ticker-filter`
- `utils/top-movers-board`
- `utils/types`
- `utils/verdict-color`
- `utils/verdict-factors`
- `utils/verdict-label`
- `utils/verdict-score`
- `utils/version-tap`
- `utils/vwap-display`
- `utils/watchlist-toggle`
- `utils/web-search-shortcut`
- `utils/weekly-movers-format`

## WP6b per-app follow-up

Create one app-owned `AppProfile` from existing constants and build configuration. Bind factories once in the composition root. Pin all three apps to the future full shared commit SHA tarball and update their pnpm lockfiles. No app repository was changed here. Retain native/UI/integration tests; remove only assertions explicitly relocated to the shared package.

US/TW legacy `deep-links.ts` currently uses `dappgooptionsapp`; that value is preserved by fixtures and must be passed during migration. Correcting this legacy route is a separate app change. Options’ `market-cap.ts` has a different source order and remains app-specific.

### us_stocks

| App file | Follow-up |
|---|---|
| `package.json` | Pin dappgo-stocks-shared 0.4.0 to its future full 40-character commit SHA codeload tarball; update lockfile and validate with frozen-lockfile install. |
| `pnpm-lock.yaml` | Pin dappgo-stocks-shared 0.4.0 to its future full 40-character commit SHA codeload tarball; update lockfile and validate with frozen-lockfile install. |
| `src/ads/ad-measurement.ts` | Keep native wrapper: bind `createAdMeasurement(appProfile, platform, getAdConsentSnapshot, emit)`; keep `Platform` and `trackEvent` imports in app. |
| `src/ads/ad-privacy-options.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ad-privacy-options`. |
| `src/ads/ad-request-options.ts` | Keep native wrapper: pass `Platform.OS` and `AppState.currentState === "active"` to shared request policy; re-export structural consent types and `adRequestIdentity`. |
| `src/ads/admob-config.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/admob-config.ts` | Thin adapter: bind `createAdUnitCatalog(appProfile)` once and re-export the existing API.  |
| `src/ads/admob.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/admob`. |
| `src/ads/ai-summary-fullscreen-policy.test.ts` | Delete duplicated admission/controller assertions covered by shared rewarded-admission tests; retain native rewarded SDK tests. |
| `src/ads/ai-summary-interstitial.test.ts` | Delete after package tests cover `src/mobile/ads/ai-summary-interstitial.ts`. |
| `src/ads/ai-summary-interstitial.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ai-summary-interstitial`. |
| `src/ads/ai-summary-rewarded-types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ai-summary-rewarded-types`. |
| `src/ads/ai-summary-rewarded.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ai-summary-rewarded`. |
| `src/ads/analytics-consent.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/analytics-consent.ts` | Thin adapter: create one `createAnalyticsConsent(AsyncStorage)` controller; re-export its methods and the shared `ANALYTICS_CONSENT_KEY`. Keep storage imports in app. |
| `src/ads/app-access.test.ts` | Delete after package tests cover `src/mobile/ads/app-access.ts`. |
| `src/ads/app-access.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/app-access`. |
| `src/ads/app-open-ad.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/app-open-ad`. |
| `src/ads/app-open-ad.types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/app-open-ad.types`. |
| `src/ads/app-open-policy.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/app-open-policy.ts` | Thin adapter: bind `createAppOpenPolicy(appProfile)` once and re-export the existing API. Preserve US/TW 4-hour and Options 5-minute resume cooldowns; absent Options startup constants remain undefined. |
| `src/ads/collapsible-banner-policy.test.ts` | Delete after package tests cover `src/mobile/ads/collapsible-banner-policy.ts`. |
| `src/ads/collapsible-banner-policy.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/collapsible-banner-policy`. |
| `src/ads/interstitial-ad.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/interstitial-ad`. |
| `src/ads/interstitial-policy.test.ts` | Delete after package tests cover `src/mobile/ads/interstitial-policy.ts`. |
| `src/ads/interstitial-policy.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/interstitial-policy`. |
| `src/ads/interstitial-route-policy.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/interstitial-route-policy.ts` | Thin adapter: bind `createInterstitialRoutePolicy(appProfile)` once and re-export the existing API.  |
| `src/ads/startup-ad-decision.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/startup-ad-decision.ts` | Thin re-export from `dappgo-stocks-shared/mobile/startup/startup-ad-decision`. |
| `src/ads/ui-ad-access.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ui-ad-access`. |
| `src/constants/update-target.ts` | Thin adapter: bind/re-export `createUpdateTarget(appProfile)` with existing UPDATE_APPLICATION_ID and Apple ID. |
| `src/data/auth.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/auth.web`. |
| `src/data/cache.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/data/cache.ts` | Thin adapter: bind `createMemoryCache(appProfile)` once and re-export the existing API. Keep a single bound in-memory cache instance per app. |
| `src/data/crashlytics.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/crashlytics.web`. |
| `src/data/ensure-user-doc.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/ensure-user-doc.web`. |
| `src/data/fetch-with-timeout.ts` | Thin adapter: export `fetchWithTimeout = createFetchWithTimeout(fetch)`; keep platform request preparation at the call site. The shared helper preserves external abort as Options already does. |
| `src/data/github-api.ts` | Keep delegating dashboard/report adapter; re-export shared `reportPathForLanguage`; use shared chain through market-data as today. |
| `src/data/mappers.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/mappers`. |
| `src/data/market-data.ts` | Keep schema/cache/retry/report adapter; replace private `sourceUrls`, `fetchOrFallback`, `fetchJsonWithFallback`, pointer interface/path guard with profile-bound `createDataSourceChain`, `LatestPointer`, `parseLatestPointer`, `dashboardDataPath` and shared hash helper. Preserve request options. |
| `src/data/notifications.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/notifications.web`. |
| `src/data/ohlc-generator.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/ohlc-generator`. |
| `src/data/parser.ts` | Thin adapter: bind `createReportParser(appProfile)` once and re-export the existing API.  |
| `src/data/privacy-config.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/privacy-config`. |
| `src/data/public-request.ts` | Thin named re-export of `publicJsonRequest` from shared `mobile/data/public-request`; preserve the US export surface. |
| `src/data/public-request.web.ts` | Thin named re-export of `publicJsonRequest` from shared `mobile/data/public-request.web`. |
| `src/data/sample-prices.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/sample-prices`. |
| `src/data/schema-validator.test.ts` | Delete after package tests cover `src/mobile/data/schema-validator.ts`. |
| `src/data/schema-validator.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/schema-validator`. |
| `src/data/secure-keys.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/secure-keys.web`. |
| `src/i18n/catalog-validation.test.ts` | Keep real catalog completeness/compact-label tests in app; remove only generic validation unit cases copied to shared. |
| `src/i18n/catalog-validation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/i18n/catalog-validation`. |
| `src/i18n/content-locale.ts` | Keep `toSimplified` with lazy OpenCC and `useContentLocale`; bind `createContentLocalizer(toSimplified)` and re-export `localizeContent`. |
| `src/i18n/format.test.ts` | Keep settings-store default-locale wrapper test; remove copied Intl/explicit-locale unit cases. |
| `src/i18n/format.ts` | Keep thin existing-signature wrappers: resolve default locale from settings store and pass it explicitly as the third argument to shared formatNumber/formatPercent/formatDate. |
| `src/i18n/locale.test.ts` | Delete after package tests cover `src/mobile/i18n/locale.ts`. |
| `src/i18n/locale.ts` | Thin re-export from `dappgo-stocks-shared/mobile/i18n/locale`. |
| `src/i18n/translate.test.ts` | Delete after package tests cover `src/mobile/i18n/translate.ts`. |
| `src/i18n/translate.ts` | Thin re-export from `dappgo-stocks-shared/mobile/i18n/translate`. |
| `src/mobile-profile.ts (new)` | Create/export one explicit AppProfile from current IDs, market/repository, cooldown, parser and cache constants; resolve environment/build values only in the app. Do not import test fixtures. |
| `src/purchases/ad-free-catalog.ts` | Thin adapter: bind `createAdFreeCatalog(appProfile)` once and re-export the existing API. Keep each app’s iOS lifetime product namespace. |
| `src/purchases/ad-free-reconciliation.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/purchases/ad-free-reconciliation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/ad-free-reconciliation`. |
| `src/purchases/ad-free-state.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/ad-free-state`. |
| `src/purchases/ad-free.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/purchases/ad-free.ts` | Keep native RevenueCat/key/identity/receipt/transaction adapter. Bind `createEntitlementPolicy(appProfile)`; publish `customerInfoPatch(info)` in syncCustomerInfo, use `findLifetimePackage(packages, store)` in loadOfferings, and import shared `isStoreCancellation`/`appleRecoveryErrorCode`. Keep native purchase/recovery tests. |
| `src/purchases/ad-free.web.test.ts` | Keep `web-app.json` adsMode wiring assertion in app; delete duplicated pure fallback assertions now covered by shared tests. |
| `src/purchases/ad-free.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/ad-free.web`. |
| `src/purchases/store-operation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/store-operation`. |
| `src/updates/update-access.ts` | Thin re-export from `dappgo-stocks-shared/mobile/updates/update-access`. |
| `src/updates/version-controller.test.ts` | Delete after package tests cover `src/mobile/updates/version-controller.ts`. |
| `src/updates/version-controller.ts` | Thin re-export from `dappgo-stocks-shared/mobile/updates/version-controller`. |
| `src/updates/version-policy.test.ts` | Delete after package tests cover `src/mobile/updates/version-policy.ts`. |
| `src/updates/version-policy.ts` | Thin re-export from `dappgo-stocks-shared/mobile/updates/version-policy`. |
| `src/updates/version-runtime.ts` | Keep Expo Application, AppState, interval and native lifecycle adapter; bind `createVersionPolicy(appProfile, { fetcher: fetch })` for checks, and import the shared VersionController. |
| `src/utils/__tests__/buy-back-simulator.test.ts` | Delete after package tests cover `src/mobile/utils/buy-back-simulator.ts`. |
| `src/utils/__tests__/candle-layout.test.ts` | Delete after package tests cover `src/mobile/utils/candle-layout.ts`. |
| `src/utils/__tests__/contribution-display.test.ts` | Delete after package tests cover `src/mobile/utils/contribution-display.ts`. |
| `src/utils/__tests__/dashboard-top-mover.test.ts` | Delete after package tests cover `src/mobile/utils/dashboard-top-mover.ts`. |
| `src/utils/__tests__/data-hash.test.ts` | Delete after package tests cover `src/mobile/data/data-hash.ts`. |
| `src/utils/__tests__/deep-link.test.ts` | Delete after package tests cover `src/mobile/utils/deep-link.ts`. |
| `src/utils/__tests__/empty-state-detector.test.ts` | Delete after package tests cover `src/mobile/utils/empty-state-detector.ts`. |
| `src/utils/__tests__/hot-rank-board.test.ts` | Delete after package tests cover `src/mobile/utils/hot-rank-board.ts`. |
| `src/utils/__tests__/insight-sort.test.ts` | Delete after package tests cover `src/mobile/utils/insight-sort.ts`. |
| `src/utils/__tests__/onboarding-state.test.ts` | Delete after package tests cover `src/mobile/utils/onboarding-state.ts`. |
| `src/utils/__tests__/search-history.test.ts` | Delete after package tests cover `src/mobile/utils/search-history.ts`. |
| `src/utils/__tests__/sentiment-dot.test.ts` | Delete after package tests cover `src/mobile/utils/sentiment-dot.ts`. |
| `src/utils/__tests__/stock-navigation.test.ts` | Delete after package tests cover `src/mobile/utils/stock-navigation.ts`. |
| `src/utils/__tests__/tab-badges.test.ts` | Delete after package tests cover `src/mobile/utils/tab-badges.ts`. |
| `src/utils/__tests__/ticker-filter.test.ts` | Delete after package tests cover `src/mobile/utils/ticker-filter.ts`. |
| `src/utils/__tests__/top-movers-board.test.ts` | Delete after package tests cover `src/mobile/utils/top-movers-board.ts`. |
| `src/utils/__tests__/verdict-color.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/utils/__tests__/verdict-score.test.ts` | Delete after package tests cover `src/mobile/utils/verdict-score.ts`. |
| `src/utils/__tests__/version-tap.test.ts` | Delete after package tests cover `src/mobile/utils/version-tap.ts`. |
| `src/utils/__tests__/vwap-display.test.ts` | Delete after package tests cover `src/mobile/utils/vwap-display.ts`. |
| `src/utils/__tests__/watchlist-toggle.test.ts` | Delete after package tests cover `src/mobile/utils/watchlist-toggle.ts`. |
| `src/utils/__tests__/weekly-movers-format.test.ts` | Delete after package tests cover `src/mobile/utils/weekly-movers-format.ts`. |
| `src/utils/bollinger-bands.test.ts` | Delete after package tests cover `src/mobile/utils/bollinger-bands.ts`. |
| `src/utils/bollinger-bands.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/bollinger-bands`. |
| `src/utils/buy-back-simulator.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/buy-back-simulator`. |
| `src/utils/candle-layout.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/candle-layout`. |
| `src/utils/compute-ma.test.ts` | Delete after package tests cover `src/mobile/utils/compute-ma.ts`. |
| `src/utils/compute-ma.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/compute-ma`. |
| `src/utils/contribution-bars.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/contribution-bars`. |
| `src/utils/contribution-display.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/contribution-display`. |
| `src/utils/dashboard-top-mover.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/dashboard-top-mover`. |
| `src/utils/data-coverage.test.ts` | Delete after package tests cover `src/mobile/utils/data-coverage.ts`. |
| `src/utils/data-coverage.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/data-coverage`. |
| `src/utils/data-hash.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/data-hash`. |
| `src/utils/deep-link.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/deep-link`. |
| `src/utils/deep-links.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/utils/deep-links.ts` | Thin adapter: bind `createDeepLinks(appProfile)` once and re-export the existing API. US/TW’s existing legacy scheme is `dappgooptionsapp`; preserve it in this extraction. |
| `src/utils/earnings-calendar.test.ts` | Delete after package tests cover `src/mobile/utils/earnings-calendar.ts`. |
| `src/utils/earnings-calendar.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/earnings-calendar`. |
| `src/utils/empty-state-detector.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/empty-state-detector`. |
| `src/utils/glossary-linker.ts` | Thin adapter: bind `createGlossaryLinker(GLOSSARY_TERMS, resolveLanguage)`; keep the app catalog and existing locale mapping (`asLegacyLanguage` in US, bilingual identity in TW/Options). |
| `src/utils/highlight-markers.test.ts` | Delete after package tests cover `src/mobile/utils/highlight-markers.ts`. |
| `src/utils/highlight-markers.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/highlight-markers`. |
| `src/utils/hot-rank-board.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/hot-rank-board`. |
| `src/utils/insight-sort.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/insight-sort`. |
| `src/utils/insight-types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/insight-types`. |
| `src/utils/market-status.test.ts` | Delete after package tests cover `src/mobile/utils/market-status.ts`. |
| `src/utils/market-status.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/market-status`. |
| `src/utils/native-presentation.test.ts` | Delete after package tests cover `src/mobile/utils/native-presentation.ts`. |
| `src/utils/native-presentation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/native-presentation`. |
| `src/utils/onboarding-state.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/onboarding-state`. |
| `src/utils/report-sections.test.ts` | Delete after package tests cover `src/mobile/utils/report-sections.ts`. |
| `src/utils/report-sections.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/report-sections`. |
| `src/utils/responsive-layout.test.ts` | Delete after package tests cover `src/mobile/utils/responsive-layout.ts`. |
| `src/utils/responsive-layout.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/responsive-layout`. |
| `src/utils/rotation-safe-layout.test.ts` | Delete after package tests cover `src/mobile/utils/rotation-safe-layout.ts`. |
| `src/utils/rotation-safe-layout.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/rotation-safe-layout`. |
| `src/utils/search-history.test.ts` | Delete after package tests cover `src/mobile/utils/search-history.ts`. |
| `src/utils/search-history.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/search-history`. |
| `src/utils/sentiment-dot.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/sentiment-dot`. |
| `src/utils/settings-rows.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/settings-rows`. |
| `src/utils/signal-labels.test.ts` | Delete after package tests cover `src/mobile/utils/signal-labels.ts`. |
| `src/utils/signal-labels.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/signal-labels`. |
| `src/utils/stale-detection.test.ts` | Delete after package tests cover `src/mobile/utils/stale-detection.ts`. |
| `src/utils/stale-detection.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/stale-detection`. |
| `src/utils/stock-navigation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/stock-navigation`. |
| `src/utils/summary-highlights.test.ts` | Delete after package tests cover `src/mobile/utils/summary-highlights.ts`. |
| `src/utils/summary-highlights.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/summary-highlights`. |
| `src/utils/tab-badges.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/tab-badges`. |
| `src/utils/theme-mode.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/theme-mode`. |
| `src/utils/ticker-filter.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/ticker-filter`. |
| `src/utils/top-movers-board.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/top-movers-board`. |
| `src/utils/types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/types`. |
| `src/utils/verdict-color.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/verdict-color` (including TW Verdict type). |
| `src/utils/verdict-factors.test.ts` | Delete after package tests cover `src/mobile/utils/verdict-factors.ts`. |
| `src/utils/verdict-factors.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/verdict-factors`. |
| `src/utils/verdict-label.test.ts` | Delete after package tests cover `src/mobile/utils/verdict-label.ts`. |
| `src/utils/verdict-label.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/verdict-label`. |
| `src/utils/verdict-score.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/verdict-score`. |
| `src/utils/version-tap.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/version-tap`. |
| `src/utils/vwap-display.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/vwap-display`. |
| `src/utils/watchlist-toggle.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/watchlist-toggle`. |
| `src/utils/web-search-shortcut.test.ts` | Delete after package tests cover `src/mobile/utils/web-search-shortcut.ts`. |
| `src/utils/web-search-shortcut.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/web-search-shortcut`. |
| `src/utils/weekly-movers-format.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/weekly-movers-format`. |

### tw_stocks

| App file | Follow-up |
|---|---|
| `package.json` | Pin dappgo-stocks-shared 0.4.0 to its future full 40-character commit SHA codeload tarball; update lockfile and validate with frozen-lockfile install. |
| `pnpm-lock.yaml` | Pin dappgo-stocks-shared 0.4.0 to its future full 40-character commit SHA codeload tarball; update lockfile and validate with frozen-lockfile install. |
| `src/ads/ad-measurement.ts` | Keep native wrapper: bind `createAdMeasurement(appProfile, platform, getAdConsentSnapshot, emit)`; keep `Platform` and `trackEvent` imports in app. |
| `src/ads/ad-privacy-options.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ad-privacy-options`. |
| `src/ads/ad-request-options.ts` | Keep native wrapper: pass `Platform.OS` and `AppState.currentState === "active"` to shared request policy; re-export structural consent types and `adRequestIdentity`. |
| `src/ads/admob-config.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/admob-config.ts` | Thin adapter: bind `createAdUnitCatalog(appProfile)` once and re-export the existing API.  |
| `src/ads/admob.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/admob`. |
| `src/ads/ai-summary-fullscreen-policy.test.ts` | Delete duplicated admission/controller assertions covered by shared rewarded-admission tests; retain native rewarded SDK tests. |
| `src/ads/ai-summary-interstitial.test.ts` | Delete after package tests cover `src/mobile/ads/ai-summary-interstitial.ts`. |
| `src/ads/ai-summary-interstitial.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ai-summary-interstitial`. |
| `src/ads/ai-summary-rewarded-types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ai-summary-rewarded-types`. |
| `src/ads/ai-summary-rewarded.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ai-summary-rewarded`. |
| `src/ads/analytics-consent.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/analytics-consent.ts` | Thin adapter: create one `createAnalyticsConsent(AsyncStorage)` controller; re-export its methods and the shared `ANALYTICS_CONSENT_KEY`. Keep storage imports in app. |
| `src/ads/app-access.test.ts` | Delete after package tests cover `src/mobile/ads/app-access.ts`. |
| `src/ads/app-access.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/app-access`. |
| `src/ads/app-open-ad.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/app-open-ad`. |
| `src/ads/app-open-ad.types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/app-open-ad.types`. |
| `src/ads/app-open-policy.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/app-open-policy.ts` | Thin adapter: bind `createAppOpenPolicy(appProfile)` once and re-export the existing API. Preserve US/TW 4-hour and Options 5-minute resume cooldowns; absent Options startup constants remain undefined. |
| `src/ads/collapsible-banner-policy.test.ts` | Delete after package tests cover `src/mobile/ads/collapsible-banner-policy.ts`. |
| `src/ads/collapsible-banner-policy.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/collapsible-banner-policy`. |
| `src/ads/interstitial-ad.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/interstitial-ad`. |
| `src/ads/interstitial-policy.test.ts` | Delete after package tests cover `src/mobile/ads/interstitial-policy.ts`. |
| `src/ads/interstitial-policy.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/interstitial-policy`. |
| `src/ads/interstitial-route-policy.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/interstitial-route-policy.ts` | Thin adapter: bind `createInterstitialRoutePolicy(appProfile)` once and re-export the existing API.  |
| `src/ads/startup-ad-decision.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/startup-ad-decision.ts` | Thin re-export from `dappgo-stocks-shared/mobile/startup/startup-ad-decision`. |
| `src/ads/ui-ad-access.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ui-ad-access`. |
| `src/constants/update-target.ts` | Thin adapter: bind/re-export `createUpdateTarget(appProfile)` with existing UPDATE_APPLICATION_ID and Apple ID. |
| `src/data/auth.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/auth.web`. |
| `src/data/cache.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/data/cache.ts` | Thin adapter: bind `createMemoryCache(appProfile)` once and re-export the existing API. Keep a single bound in-memory cache instance per app. |
| `src/data/crashlytics.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/crashlytics.web`. |
| `src/data/ensure-user-doc.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/ensure-user-doc.web`. |
| `src/data/fetch-with-timeout.ts` | Thin adapter: export `fetchWithTimeout = createFetchWithTimeout(fetch)`; keep platform request preparation at the call site. The shared helper preserves external abort as Options already does. |
| `src/data/github-api.ts` | Keep report/index compatibility logic; re-export shared `reportPathForLanguage` where equivalent; use shared chain in tw-data without replacing language-index behavior. |
| `src/data/mappers.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/mappers`. |
| `src/data/notifications.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/notifications.web`. |
| `src/data/ohlc-generator.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/ohlc-generator`. |
| `src/data/parser.ts` | Thin adapter: bind `createReportParser(appProfile)` once and re-export the existing API.  |
| `src/data/privacy-config.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/privacy-config`. |
| `src/data/public-request.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/public-request`. |
| `src/data/public-request.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/public-request.web`. |
| `src/data/sample-prices.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/sample-prices`. |
| `src/data/schema-validator.test.ts` | Delete after package tests cover `src/mobile/data/schema-validator.ts`. |
| `src/data/schema-validator.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/schema-validator`. |
| `src/data/secure-keys.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/secure-keys.web`. |
| `src/data/tw-data.ts` | Keep TW schema/cache/retry/report adapter; replace private source-chain helpers and pointer/path guard with the shared profile-bound core. Keep manifest locale normalization and request options. |
| `src/mobile-profile.ts (new)` | Create/export one explicit AppProfile from current IDs, market/repository, cooldown, parser and cache constants; resolve environment/build values only in the app. Do not import test fixtures. |
| `src/purchases/ad-free-catalog.ts` | Thin adapter: bind `createAdFreeCatalog(appProfile)` once and re-export the existing API. Keep each app’s iOS lifetime product namespace. |
| `src/purchases/ad-free-reconciliation.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/purchases/ad-free-reconciliation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/ad-free-reconciliation`. |
| `src/purchases/ad-free-state.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/ad-free-state`. |
| `src/purchases/ad-free.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/purchases/ad-free.ts` | Keep native RevenueCat/key/identity/receipt/transaction adapter. Bind `createEntitlementPolicy(appProfile)`; publish `customerInfoPatch(info)` in syncCustomerInfo, use `findLifetimePackage(packages, store)` in loadOfferings, and import shared `isStoreCancellation`/`appleRecoveryErrorCode`. Keep native purchase/recovery tests. |
| `src/purchases/ad-free.web.test.ts` | Keep `web-app.json` adsMode wiring assertion in app; delete duplicated pure fallback assertions now covered by shared tests. |
| `src/purchases/ad-free.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/ad-free.web`. |
| `src/purchases/store-operation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/store-operation`. |
| `src/updates/update-access.ts` | Thin re-export from `dappgo-stocks-shared/mobile/updates/update-access`. |
| `src/updates/version-controller.test.ts` | Delete after package tests cover `src/mobile/updates/version-controller.ts`. |
| `src/updates/version-controller.ts` | Thin re-export from `dappgo-stocks-shared/mobile/updates/version-controller`. |
| `src/updates/version-policy.test.ts` | Delete after package tests cover `src/mobile/updates/version-policy.ts`. |
| `src/updates/version-policy.ts` | Thin re-export from `dappgo-stocks-shared/mobile/updates/version-policy`. |
| `src/updates/version-runtime.ts` | Keep Expo Application, AppState, interval and native lifecycle adapter; bind `createVersionPolicy(appProfile, { fetcher: fetch })` for checks, and import the shared VersionController. |
| `src/utils/__tests__/buy-back-simulator.test.ts` | Delete after package tests cover `src/mobile/utils/buy-back-simulator.ts`. |
| `src/utils/__tests__/candle-layout.test.ts` | Delete after package tests cover `src/mobile/utils/candle-layout.ts`. |
| `src/utils/__tests__/contribution-display.test.ts` | Delete after package tests cover `src/mobile/utils/contribution-display.ts`. |
| `src/utils/__tests__/dashboard-top-mover.test.ts` | Delete after package tests cover `src/mobile/utils/dashboard-top-mover.ts`. |
| `src/utils/__tests__/data-hash.test.ts` | Delete after package tests cover `src/mobile/data/data-hash.ts`. |
| `src/utils/__tests__/deep-link.test.ts` | Delete after package tests cover `src/mobile/utils/deep-link.ts`. |
| `src/utils/__tests__/empty-state-detector.test.ts` | Delete after package tests cover `src/mobile/utils/empty-state-detector.ts`. |
| `src/utils/__tests__/hot-rank-board.test.ts` | Delete after package tests cover `src/mobile/utils/hot-rank-board.ts`. |
| `src/utils/__tests__/insight-sort.test.ts` | Delete after package tests cover `src/mobile/utils/insight-sort.ts`. |
| `src/utils/__tests__/onboarding-state.test.ts` | Delete after package tests cover `src/mobile/utils/onboarding-state.ts`. |
| `src/utils/__tests__/sentiment-dot.test.ts` | Delete after package tests cover `src/mobile/utils/sentiment-dot.ts`. |
| `src/utils/__tests__/stock-navigation.test.ts` | Delete after package tests cover `src/mobile/utils/stock-navigation.ts`. |
| `src/utils/__tests__/tab-badges.test.ts` | Delete after package tests cover `src/mobile/utils/tab-badges.ts`. |
| `src/utils/__tests__/ticker-filter.test.ts` | Delete after package tests cover `src/mobile/utils/ticker-filter.ts`. |
| `src/utils/__tests__/top-movers-board.test.ts` | Delete after package tests cover `src/mobile/utils/top-movers-board.ts`. |
| `src/utils/__tests__/verdict-color.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/utils/__tests__/verdict-score.test.ts` | Delete after package tests cover `src/mobile/utils/verdict-score.ts`. |
| `src/utils/__tests__/version-tap.test.ts` | Delete after package tests cover `src/mobile/utils/version-tap.ts`. |
| `src/utils/__tests__/vwap-display.test.ts` | Delete after package tests cover `src/mobile/utils/vwap-display.ts`. |
| `src/utils/__tests__/watchlist-toggle.test.ts` | Delete after package tests cover `src/mobile/utils/watchlist-toggle.ts`. |
| `src/utils/__tests__/weekly-movers-format.test.ts` | Delete after package tests cover `src/mobile/utils/weekly-movers-format.ts`. |
| `src/utils/bollinger-bands.test.ts` | Delete after package tests cover `src/mobile/utils/bollinger-bands.ts`. |
| `src/utils/bollinger-bands.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/bollinger-bands`. |
| `src/utils/buy-back-simulator.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/buy-back-simulator`. |
| `src/utils/candle-layout.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/candle-layout`. |
| `src/utils/compute-ma.test.ts` | Delete after package tests cover `src/mobile/utils/compute-ma.ts`. |
| `src/utils/compute-ma.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/compute-ma`. |
| `src/utils/contribution-bars.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/contribution-bars`. |
| `src/utils/contribution-display.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/contribution-display`. |
| `src/utils/dashboard-top-mover.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/dashboard-top-mover`. |
| `src/utils/data-coverage.test.ts` | Delete after package tests cover `src/mobile/utils/data-coverage.ts`. |
| `src/utils/data-coverage.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/data-coverage`. |
| `src/utils/data-hash.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/data-hash`. |
| `src/utils/deep-link.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/deep-link`. |
| `src/utils/deep-links.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/utils/deep-links.ts` | Thin adapter: bind `createDeepLinks(appProfile)` once and re-export the existing API. US/TW’s existing legacy scheme is `dappgooptionsapp`; preserve it in this extraction. |
| `src/utils/earnings-calendar.test.ts` | Delete after package tests cover `src/mobile/utils/earnings-calendar.ts`. |
| `src/utils/earnings-calendar.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/earnings-calendar`. |
| `src/utils/empty-state-detector.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/empty-state-detector`. |
| `src/utils/glossary-linker.ts` | Thin adapter: bind `createGlossaryLinker(GLOSSARY_TERMS, resolveLanguage)`; keep the app catalog and existing locale mapping (`asLegacyLanguage` in US, bilingual identity in TW/Options). |
| `src/utils/highlight-markers.test.ts` | Delete after package tests cover `src/mobile/utils/highlight-markers.ts`. |
| `src/utils/highlight-markers.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/highlight-markers`. |
| `src/utils/hot-rank-board.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/hot-rank-board`. |
| `src/utils/insight-sort.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/insight-sort`. |
| `src/utils/insight-types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/insight-types`. |
| `src/utils/market-status.test.ts` | Delete after package tests cover `src/mobile/utils/market-status.ts`. |
| `src/utils/market-status.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/market-status`. |
| `src/utils/native-presentation.test.ts` | Delete after package tests cover `src/mobile/utils/native-presentation.ts`. |
| `src/utils/native-presentation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/native-presentation`. |
| `src/utils/onboarding-state.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/onboarding-state`. |
| `src/utils/report-sections.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/report-sections`. |
| `src/utils/responsive-layout.test.ts` | Delete after package tests cover `src/mobile/utils/responsive-layout.ts`. |
| `src/utils/responsive-layout.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/responsive-layout`. |
| `src/utils/rotation-safe-layout.test.ts` | Delete after package tests cover `src/mobile/utils/rotation-safe-layout.ts`. |
| `src/utils/rotation-safe-layout.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/rotation-safe-layout`. |
| `src/utils/search-history.test.ts` | Delete after package tests cover `src/mobile/utils/search-history.ts`. |
| `src/utils/search-history.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/search-history`. |
| `src/utils/sentiment-dot.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/sentiment-dot`. |
| `src/utils/settings-rows.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/settings-rows`. |
| `src/utils/signal-labels.test.ts` | Delete after package tests cover `src/mobile/utils/signal-labels.ts`. |
| `src/utils/signal-labels.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/signal-labels`. |
| `src/utils/stale-detection.test.ts` | Delete after package tests cover `src/mobile/utils/stale-detection.ts`. |
| `src/utils/stale-detection.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/stale-detection`. |
| `src/utils/stock-navigation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/stock-navigation`. |
| `src/utils/summary-highlights.test.ts` | Delete after package tests cover `src/mobile/utils/summary-highlights.ts`. |
| `src/utils/summary-highlights.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/summary-highlights`. |
| `src/utils/tab-badges.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/tab-badges`. |
| `src/utils/theme-mode.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/theme-mode`. |
| `src/utils/ticker-filter.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/ticker-filter`. |
| `src/utils/top-movers-board.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/top-movers-board`. |
| `src/utils/types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/types`. |
| `src/utils/verdict-color.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/verdict-color` (including TW Verdict type). |
| `src/utils/verdict-factors.test.ts` | Delete after package tests cover `src/mobile/utils/verdict-factors.ts`. |
| `src/utils/verdict-factors.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/verdict-factors`. |
| `src/utils/verdict-label.test.ts` | Delete after package tests cover `src/mobile/utils/verdict-label.ts`. |
| `src/utils/verdict-label.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/verdict-label`. |
| `src/utils/verdict-score.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/verdict-score`. |
| `src/utils/version-tap.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/version-tap`. |
| `src/utils/vwap-display.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/vwap-display`. |
| `src/utils/watchlist-toggle.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/watchlist-toggle`. |
| `src/utils/web-search-shortcut.test.ts` | Delete after package tests cover `src/mobile/utils/web-search-shortcut.ts`. |
| `src/utils/web-search-shortcut.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/web-search-shortcut`. |
| `src/utils/weekly-movers-format.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/weekly-movers-format`. |

### options

| App file | Follow-up |
|---|---|
| `package.json` | Pin dappgo-stocks-shared 0.4.0 to its future full 40-character commit SHA codeload tarball; update lockfile and validate with frozen-lockfile install. |
| `pnpm-lock.yaml` | Pin dappgo-stocks-shared 0.4.0 to its future full 40-character commit SHA codeload tarball; update lockfile and validate with frozen-lockfile install. |
| `src/ads/ad-measurement.ts` | Keep native wrapper: bind `createAdMeasurement(appProfile, platform, getAdConsentSnapshot, emit)`; keep `Platform` and `trackEvent` imports in app. |
| `src/ads/ad-privacy-options.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ad-privacy-options`. |
| `src/ads/ad-request-options.ts` | Keep native wrapper: pass `Platform.OS` and `AppState.currentState === "active"` to shared request policy; re-export structural consent types and `adRequestIdentity`. |
| `src/ads/admob-config.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/admob-config.ts` | Thin adapter: bind `createAdUnitCatalog(appProfile)` once and re-export the existing API.  |
| `src/ads/admob.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/admob`. |
| `src/ads/ai-summary-fullscreen-policy.test.ts` | Delete duplicated admission/controller assertions covered by shared rewarded-admission tests; retain native rewarded SDK tests. |
| `src/ads/ai-summary-interstitial.test.ts` | Delete after package tests cover `src/mobile/ads/ai-summary-interstitial.ts`. |
| `src/ads/ai-summary-interstitial.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ai-summary-interstitial`. |
| `src/ads/ai-summary-rewarded-types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ai-summary-rewarded-types`. |
| `src/ads/ai-summary-rewarded.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ai-summary-rewarded`. |
| `src/ads/analytics-consent.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/analytics-consent.ts` | Thin adapter: create one `createAnalyticsConsent(AsyncStorage)` controller; re-export its methods and the shared `ANALYTICS_CONSENT_KEY`. Keep storage imports in app. |
| `src/ads/app-access.test.ts` | Delete after package tests cover `src/mobile/ads/app-access.ts`. |
| `src/ads/app-access.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/app-access`. |
| `src/ads/app-open-ad.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/app-open-ad`. |
| `src/ads/app-open-ad.types.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/app-open-ad.types`. |
| `src/ads/app-open-policy.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/app-open-policy.ts` | Thin adapter: bind `createAppOpenPolicy(appProfile)` once and re-export the existing API. Preserve US/TW 4-hour and Options 5-minute resume cooldowns; absent Options startup constants remain undefined. |
| `src/ads/collapsible-banner-policy.test.ts` | Delete after package tests cover `src/mobile/ads/collapsible-banner-policy.ts`. |
| `src/ads/collapsible-banner-policy.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/collapsible-banner-policy`. |
| `src/ads/interstitial-ad.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/interstitial-ad`. |
| `src/ads/interstitial-policy.test.ts` | Delete after package tests cover `src/mobile/ads/interstitial-policy.ts`. |
| `src/ads/interstitial-policy.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/interstitial-policy`. |
| `src/ads/interstitial-route-policy.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/interstitial-route-policy.ts` | Thin adapter: bind `createInterstitialRoutePolicy(appProfile)` once and re-export the existing API.  |
| `src/ads/startup-ad-decision.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/ads/startup-ad-decision.ts` | Thin re-export from `dappgo-stocks-shared/mobile/startup/startup-ad-decision`. |
| `src/ads/ui-ad-access.ts` | Thin re-export from `dappgo-stocks-shared/mobile/ads/ui-ad-access`. |
| `src/constants/update-target.ts` | Thin adapter: bind/re-export `createUpdateTarget(appProfile)` with existing UPDATE_APPLICATION_ID and Apple ID. |
| `src/data/auth.web.ts` | Thin named re-export of `ensureAuth` and `onUid` from shared `mobile/data/auth.web`; preserve the current Options API. |
| `src/data/cache.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/data/cache.ts` | Thin adapter: bind `createMemoryCache(appProfile)` once and re-export the existing API. Keep a single bound in-memory cache instance per app. |
| `src/data/crashlytics.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/crashlytics.web`. |
| `src/data/ensure-user-doc.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/ensure-user-doc.web`. |
| `src/data/github-api.ts` | Keep schema/cache/report adapter; replace local `sourceUrls`, fetch fallback helpers, `LatestPointer`/path guard and `fetchWithTimeout` with shared cores. Bind fetch to `publicDataRequest`; re-export shared `reportPathForLanguage` and preserve timeout exports. |
| `src/data/mappers.ts` | Keep app implementation: Options has different matrix enrichment/mapping. |
| `src/data/notifications.web.ts` | Thin named re-export of `requestPermissions`, `scheduleDailyReminder`, `cancelDailyReminder` from shared `mobile/data/notifications.web`; retain the current Options API. |
| `src/data/ohlc-generator.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/ohlc-generator`. |
| `src/data/parser.ts` | Keep `extractTickerMetrics` and its market-specific helpers; bind/re-export only `parseReport` from `createReportParser(appProfile)`. Preserve English date/timestamp patterns. |
| `src/data/public-request.ts` | Keep `publicDataRequest` native adapter; it deliberately passes caller RequestInit through. |
| `src/data/secure-keys.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/secure-keys.web`. |
| `src/mobile-profile.ts (new)` | Create/export one explicit AppProfile from current IDs, market/repository, cooldown, parser and cache constants; resolve environment/build values only in the app. Do not import test fixtures. |
| `src/purchases/ad-free-catalog.ts` | Thin adapter: bind `createAdFreeCatalog(appProfile)` once and re-export the existing API. Keep each app’s iOS lifetime product namespace. |
| `src/purchases/ad-free-reconciliation.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/purchases/ad-free-reconciliation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/ad-free-reconciliation`. |
| `src/purchases/ad-free-state.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/ad-free-state`. |
| `src/purchases/ad-free.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/purchases/ad-free.ts` | Keep native RevenueCat/key/identity/receipt/transaction adapter. Bind `createEntitlementPolicy(appProfile)`; publish `customerInfoPatch(info)` in syncCustomerInfo, use `findLifetimePackage(packages, store)` in loadOfferings, and import shared `isStoreCancellation`/`appleRecoveryErrorCode`. Keep native purchase/recovery tests. |
| `src/purchases/ad-free.web.test.ts` | Keep `web-app.json` adsMode wiring assertion in app; delete duplicated pure fallback assertions now covered by shared tests. |
| `src/purchases/ad-free.web.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/ad-free.web`. |
| `src/purchases/store-operation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/purchases/store-operation`. |
| `src/updates/update-access.ts` | Thin re-export from `dappgo-stocks-shared/mobile/updates/update-access`. |
| `src/updates/version-controller.test.ts` | Delete after package tests cover `src/mobile/updates/version-controller.ts`. |
| `src/updates/version-controller.ts` | Thin re-export from `dappgo-stocks-shared/mobile/updates/version-controller`. |
| `src/updates/version-policy.test.ts` | Delete after package tests cover `src/mobile/updates/version-policy.ts`. |
| `src/updates/version-policy.ts` | Thin re-export from `dappgo-stocks-shared/mobile/updates/version-policy`. |
| `src/updates/version-runtime.ts` | Keep Expo Application, AppState, interval and native lifecycle adapter; bind `createVersionPolicy(appProfile, { fetcher: fetch })` for checks, and import the shared VersionController. |
| `src/utils/__tests__/onboarding-state.test.ts` | Delete after package tests cover `src/mobile/utils/onboarding-state.ts`. |
| `src/utils/__tests__/search-history.test.ts` | Delete after package tests cover `src/mobile/utils/search-history.ts`. |
| `src/utils/data-coverage.test.ts` | Delete after package tests cover `src/mobile/utils/data-coverage.ts`. |
| `src/utils/data-coverage.ts` | Keep app implementation: Options has different universe-contract and coverage resolution. |
| `src/utils/data-hash.ts` | Thin re-export from `dappgo-stocks-shared/mobile/data/data-hash`. |
| `src/utils/deep-links.test.ts` | Delete duplicated pure-core assertions after switching imports; retain app adapter/config/native integration assertions. |
| `src/utils/deep-links.ts` | Thin adapter: bind `createDeepLinks(appProfile)` once and re-export the existing API. US/TW’s existing legacy scheme is `dappgooptionsapp`; preserve it in this extraction. |
| `src/utils/earnings-calendar.test.ts` | Delete after package tests cover `src/mobile/utils/earnings-calendar.ts`. |
| `src/utils/earnings-calendar.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/earnings-calendar`. |
| `src/utils/glossary-linker.ts` | Thin adapter: bind `createGlossaryLinker(GLOSSARY_TERMS, resolveLanguage)`; keep the app catalog and existing locale mapping (`asLegacyLanguage` in US, bilingual identity in TW/Options). |
| `src/utils/highlight-markers.test.ts` | Delete after package tests cover `src/mobile/utils/highlight-markers.ts`. |
| `src/utils/highlight-markers.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/highlight-markers`. |
| `src/utils/market-status.test.ts` | Delete after package tests cover `src/mobile/utils/market-status.ts`. |
| `src/utils/market-status.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/market-status`. |
| `src/utils/native-presentation.test.ts` | Delete after package tests cover `src/mobile/utils/native-presentation.ts`. |
| `src/utils/native-presentation.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/native-presentation`. |
| `src/utils/onboarding-state.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/onboarding-state`. |
| `src/utils/responsive-layout.test.ts` | Delete after package tests cover `src/mobile/utils/responsive-layout.ts`. |
| `src/utils/responsive-layout.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/responsive-layout`. |
| `src/utils/rotation-safe-layout.test.ts` | Delete after package tests cover `src/mobile/utils/rotation-safe-layout.ts`. |
| `src/utils/rotation-safe-layout.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/rotation-safe-layout`. |
| `src/utils/search-history.ts` | Keep app implementation: Options has different symbol normalization and minimum-query behavior. |
| `src/utils/stale-detection.test.ts` | Delete after package tests cover `src/mobile/utils/stale-detection.ts`. |
| `src/utils/stale-detection.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/stale-detection`. |
| `src/utils/web-search-shortcut.test.ts` | Delete after package tests cover `src/mobile/utils/web-search-shortcut.ts`. |
| `src/utils/web-search-shortcut.ts` | Thin re-export from `dappgo-stocks-shared/mobile/utils/web-search-shortcut`. |

