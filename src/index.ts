/**
 * DappGo Stocks — Shared Utilities
 *
 * Pure-TypeScript helpers consumed by the TW Stocks, US Stocks and Options
 * apps. No React, no React Native, no theme imports —
 * keeps these test-runnable in plain Node and reusable from any future
 * web dashboard / CLI / server.
 *
 * To extend: add the new file to `src/`, export it here, ship a test
 * alongside. Mobile modules use explicit `mobile/<area>/<name>` subpaths;
 * apps pin a full commit SHA tarball as described in README.md.
 */

export {
  DAPPGO_PRODUCTS,
  DAPPGO_PROMOTION_COPY,
  getDappGoSiblingProducts,
  type DappGoApp,
  type DappGoLanguage,
} from './dappgo-products';
export { verdictLabel } from './verdict-label';
export { explainVerdict, type VerdictExplain } from './verdict-explain';
export { daysUntil } from './days-until';
export {
  classifyInsiderActivity,
  type InsiderDirection,
} from './insider-direction';
export { secFormColor, type ColorTokens, type SecFormColor } from './sec-form-color';
export { computeMA } from './compute-ma';
export {
  summarizeSectors,
  type SectorSummary,
} from './sector-aggregate';
export {
  summarizeMarket,
  type MarketSentiment,
} from './ticker-aggregate';
export { computeDrawdown, type DrawdownResult } from './utils/max-drawdown';
export {
  formatPrice,
  formatPercent,
  formatVolume,
  formatMarketCap,
  formatCompactNumber,
  formatDate,
  formatRelativeDate,
  type FormatPriceOpts,
  type FormatPercentOpts,
} from './utils/formatters';
export {
  relativeStrength,
  type RsInputs,
  type RsScores,
} from './utils/relative-strength';
export { riskRating, type RiskInputs, type RiskRating } from './utils/risk-rating';
export {
  classifySentiment,
  type SentimentLabel,
  type SentimentInput,
  type SentimentDisplay,
} from './utils/news-sentiment';
export {
  stripHighlightMarkers,
  parseHighlightSegments,
  countHighlights,
  type HighlightStyle,
  type Segment,
} from './utils/highlight-markers';
export {
  contributionBars,
  type ContributionInput,
  type ContributionBar,
  type ContributionDisplay,
} from './utils/contribution-bars';
export {
  percentageBar,
  type PercentageBarInput,
  type PercentageBarSegment,
} from './utils/percentage-bar';
export {
  explainVerdict as explainVerdictFull,
  type Verdict,
  type SignalsLike,
  type VerdictExplanation,
} from './utils/verdict-explainer';
export * from './tokens';
export {
  priceAxisTicks,
  dateAxisLabels,
  scaleLinear,
  niceCeiling,
  niceFloor,
} from './utils/chart-axis';
export {
  cleanCommentary,
  type CleanedCommentary,
} from './utils/commentary-cleanup';
export {
  summarizeTicker,
  type TickerSummaryInput,
  type TickerSummary,
} from './utils/summarize-ticker';
export {
  buildDashboardSummary,
  type TickerLite,
  type DashboardSummary,
} from './utils/dashboard-summary';
export {
  gate,
  truncateForTier,
  limitForTier,
  daysUntilExpiry,
  effectiveTier,
  type UserTier,
  type GateResult,
} from './utils/feature-gating';
export {
  totalHeaderHeight,
  shouldShowBack,
  truncateHeaderTitle,
  HEADER_HEIGHT,
  HEADER_BACK_LABEL,
  HEADER_TITLE_FONT_SIZE,
  HEADER_SUBTITLE_FONT_SIZE,
  HEADER_BORDER_OPACITY,
  type ScreenHeaderConfig,
} from './utils/screen-header';
export {
  classifyNewsSource,
  tierLabel,
  type SourceTier,
  type SourceInfo,
} from './utils/news-source-reputation';
export {
  relativeTimeShort,
  relativeTimeLong,
  humanizeDuration,
  isSameLocalDay,
  type Locale as TimeLocale,
} from './utils/time-formatter';
export {
  aggregatePortfolio,
  type PortfolioInput,
  type PortfolioStats,
} from './utils/portfolio-aggregator';
export {
  percentile,
  multiKeySort,
  topN,
  quantileBucket,
  zScore,
} from './utils/ranking';
export {
  regimeDisplay,
  volRegimeLabel,
  trendArrow,
  isBenchmarkAbove50,
  isBenchmarkAbove200,
  benchmarkTrend,
  type Regime,
  type VolRegime,
  type TrendDir,
  type RegimeData,
  type RegimeDisplay,
} from './utils/regime-display';
export {
  isFieldFilled,
  computeCompleteness,
  DEFAULT_FIELDS_TW,
  DEFAULT_FIELDS_US,
  DEFAULT_FIELDS_OPTIONS,
  type TickerDict,
  type CompletenessResult,
} from './utils/data-completeness';
export {
  tileGridColumns,
  tileSpan,
  tileWidth,
  TILE_GRID_BREAKPOINTS,
  type TileSize,
  type TileGridOptions,
} from './utils/tile-grid';
export {
  priceDirection,
  directionTone,
  directionArrow,
  MARKET_COLOR_CONVENTION,
  type PriceDirection,
  type MarketColorConvention,
  type DirectionTone,
} from './utils/price-direction';
export {
  pickWatchlistStrip,
  type StripQuote,
  type WatchlistStripItem,
  type WatchlistStrip,
} from './utils/watchlist-strip';
export { formatChangeText, changeToneColor } from './utils/change-text';
export {
  buildValuationTile,
  parseMarketValuationSummary,
  parseZoneCounts,
  parseRiskNotices,
  percentileBand,
  VALUATION_TILE_ZONES,
  type ValuationTileModel,
  type MarketValuationSummary,
  type RatioReading,
  type PercentileBand,
  type ZoneCounts,
  type ValuationTileZone,
  type RiskNotices,
  type RiskNoticeItem,
} from './utils/valuation-tile';
export { packTiles, spanWidth, advanceDecline, type PackedTile } from './utils/tile-pack';
export { trendInsights, type TrendBar, type TrendInsights, type TrendExtreme } from './utils/trend-insights';
export {
  summarizeSignals,
  selectSignals,
  sortSignals,
  applySignalFilter,
  matchesQuery,
  filterCounts,
  SIGNAL_TONES,
  VERDICT_TONE,
  type SignalItem,
  type SignalTone,
  type SignalsOverview as SignalsOverviewModel,
  type SignalFilter,
  type SignalSort,
} from './mobile/signals/model';
export {
  backfillPriceAtAdd,
  changeSinceAdded,
  recordView,
  recordVisit,
  migrateHistory,
  sinceLastVisit,
  EMPTY_HISTORY,
  RECENT_LIMIT,
  BIG_MOVE_PCT,
  type FavoriteRecord,
  type FavoritesHistory,
  type FavoriteEvent,
  type FavoriteEventKind,
  type VisitSnapshotEntry,
} from './mobile/favorites/history';
export {
  buildFlowRows,
  sortFlowRows,
  summarizeFlow,
  ratioHeat,
  mixHex,
  heatColor,
  heatColumns,
  type FlowRow,
  type FlowSort,
  type FlowSummary,
} from './mobile/options-flow/model';
export {
  KEY_POINT_COUNT,
  KEY_POINT_LIMIT,
  SHORT_TEXT_LIMIT,
  keyPointsFromText,
  noteKeyPoints,
  marketKeyPoints,
  formatPoint,
  hasFigure,
  isChineseText,
  type MarketKeyPointInput,
  type MarketMover,
} from './mobile/ai-key-points/model';
export {
  VALUATION_ACCENT,
  ACCENT_BAR_WIDTH,
  overallValuationZone,
  valuationAccent,
  type OverallZone,
} from './mobile/tiles/valuation-accent';
export {
  MONETIZATION_EVENT_NAMES,
  monetizationEvent,
  resolveBuildChannel,
  shouldLogTrialView,
  priceTier,
  type BuildChannel,
  type MonetizationEventMap,
  type MonetizationEventName,
  type PurchaseResult,
  type PaywallKind,
  type TrialMarket,
} from './analytics/monetization';
