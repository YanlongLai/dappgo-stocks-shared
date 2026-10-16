# Implementation and validation

Keep product IDs, bilingual names/summaries, store URLs, browser destinations
and labels in a pure TypeScript catalog in dappgo-stocks-shared. Export through
the shared facade and pin each consumer to the promoted shared commit. Use
Options as the canonical native card and mirror identical source to US/TW.
TW must pass its actual selected language rather than hard-coded Chinese.

Test the platform/language/current-app matrix, six exact destinations,
self-exclusion, accessible labels, graceful rejected openURL, and light/dark
theme token use. Run full consumer TypeScript/Jest/i18n gates and independent
review before promotion. Source merge is not an installed-app update. The
existing Analytics release hold remains until separately repaired. Rollback
is reverting focused commits and restoring the prior shared dependency pin.
