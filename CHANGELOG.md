## 0.3.0

- Add bounded cold-start App Open tickets that wait for verified free access and consent, expire before content, and retain fullscreen ownership through native close/error.
- Use a five-minute active-use threshold and automatic fullscreen interval at natural page transitions; keep explicit AI summary rewarded admission and shared ownership.
- Add the `sectors_after_second` banner placement.
- Promote the previously hash-guarded AI summary rewarded policy into the shared source.

# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## 0.5.0

- `utils/tile-grid`: column count by usable width (2 / 3 / 4 at 400 and 600 pt) and tile widths for `small` and `wide` tiles, for the Control-Center style dashboards and foldable/iPad reflow.
- `utils/price-direction`: `priceDirection()`, `directionTone()` and `MARKET_COLOR_CONVENTION` (Taiwan red-up, US green-up).
- `utils/watchlist-strip`: `pickWatchlistStrip()` picks the first watchlist stocks with a quote, or popular stocks to add when the watchlist is empty.

## 0.4.10

- `mobile/purchases/pro`: DappGo Pro subscription state from RevenueCat CustomerInfo (`pro` entitlement), a 72-hour offline trust window, stored-snapshot validation, subscription package lookup, and `canRequestAdsWithPro` (Pro also removes ads). Additive; the ad-free policy is unchanged.
- `mobile/valuation/valuation-v2`: types and parsers for the valuation v2 subscription payload, hub ranking and filters, zone counts, zone-crossing alert detection for tracked stocks, and the advice-wording list apps test their strings against.

## 0.4.9

- Ad unit resolvers take an optional `isPhysicalDevice` (expo-device `isDevice`). `false` (emulator/simulator) always resolves the Google test unit, even in a production store build, so release QA, store review and test-lab traffic stays out of production AdMob reports. Omitted keeps the previous build-based decision.

## 0.4.4

- Research-toned signal labels (Owner decision 2026-11-18): verdict labels read 偏多訊號 / 溫和偏多 / 中性 / 溫和偏空 / 偏空訊號 (en: Bullish signal / Mildly bullish / Neutral / Mildly bearish / Bearish signal) instead of 買進 / 持有 / 觀望 / 避開 / 賣出. Verdict explanations describe what the model sees instead of telling the reader to buy, sell or hold. Signal logic and engine data are unchanged.
- Add `mobile/utils/signal-wording` `neutralizeSignalText()` to reword engine one-liners such as 「今日 2 檔買進 / 5 檔賣出」 at display time.

## 0.4.3

- AI summary reveal: `aiSummaryRevealOffersAd()` tells the reveal control when the next slide offers a rewarded ad, and `SummaryRewardOffer.optedIn` marks a slide that was labelled as watching an ad so the native layer skips the second prompt.

## [Unreleased]

### Added

- Remove-ads intro: `shouldOpenAdFreeIntro()` / `recordAdFreeIntroShown()` open the full remove-ads sheet once per install after the first full-screen ad closes; persisted nudge state gains `introShownAt` (older state parses with `null`). New analytics source `auto`.
- 

### Changed
- 

### Fixed
- 

## [0.4.2] - 2026-11-04

### Changed
- Allow foreground iOS ad requests after ATT denial or unavailability, using non-personalized ads unless personalization is authorized.

## [0.1.0] - 2026-05-05

Initial documented release. Backfilled from git history.

### Added
- Initial scaffold of shared TypeScript utilities for the DappGo Stocks family.
- Shared formatters utility (price / percent / volume / market cap / date).
- Shared design tokens (spacing / typography / divider).
- Verdict-explainer (locale-aware verdict + signal narration).
- News-sentiment classifier (zh-TW + en-US).
- News-source-reputation classifier (tier1 / tier2 / tier3 + emoji + locale labels).
- Highlight-markers util (strip / parse / count bold / italic / mark).
- Contribution-bars + percentage-bar utilities.
- Chart-axis utility (`priceAxisTicks` / `dateAxisLabels` / `scaleLinear` / `niceCeiling` / `niceFloor`).
- Commentary-cleanup post-processor for AI text.
- `summarize-ticker` (oneLine / twoLine / detailed + `hasFreshSignal`).
- Dashboard-summary aggregator (verdict counts + tone + `freshSignalSymbols`).
- Regime-display unifier (TW + US benchmark fields normalised).
- Feature-gating utility (gate / truncate / limit / `effectiveTier`).
- Shared screen-header types + helpers (`HEADER_HEIGHT` 56pt).
- Portfolio aggregator (sentiment + best / worst + avg P/E / yield + drawdown).
- Max-drawdown + relative-strength + risk-rating utilities.
- Typography polish + Anchored VWAP + tab badges + collapse-all + dev mode + ranking util.
- `DEFAULT_FIELDS_OPTIONS` exported from shared index.
