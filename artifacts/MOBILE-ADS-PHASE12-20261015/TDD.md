# Technical design and tests

Use shared pure TypeScript modules under dappgo-stocks-shared/src/ads, without React/RN dependencies. Native wrappers remain in each app for SDK and storage boundaries. Consent model separates canRequestAds from analyticsStorage/adStorage/adUserData/adPersonalization. Read supported SDK purpose information conservatively; unknown denies analytics. Refresh after privacy choices and notify subscriptions. Telemetry uses fixed placement/format/event enums and numeric revenue/currency only; no symbols, free text, IDs, URLs or global automatic revenue event duplication. Fullscreen coordinator grants an exclusive token, stores successful exposure timestamps and separates formats; failure releases only own token and retains previous success cooldown. Ads never create artificial loading delays. Stable placement names precede real separate backend unit IDs; never fabricate units.

Tests: consent denial/withdrawal/stale async response; mutex collision, failure/release, clock rollback, restart persisted cooldown; safe route matrix excludes settings/search/detail entry; placement allowlist and revenue dedup; banner no-fill and no layout jump. Run each app full verify and shared TS/Jest before independent review. iOS Cloud uses exact merged SHA and production marker gates; Android signed artifact verified separately. Revert exact app/shared pins for rollback; no server deployment required. Engineering Director: accepted for bounded implementation. AI model changes: not applicable.

Integration clarification: first-load no-fill occupies zero space. A successful
adaptive banner establishes its actual slot; later refresh failure must not
remove that established slot and move surrounding content. Initial successful
insertion is distinct from refresh-induced layout instability and remains a
device-QA check. Fullscreen resume must receive current route context and deny
unknown/Settings/Search; cooldown-proven startup must release content immediately
rather than waiting out the retained maximum startup opportunity.
