# Intake evidence

Clean origin/main baselines: shared 0319bed8eb2912180a7794ebba5e39366cf32b5f,
Options 3c6affb59c6030be5e3575bfd2bed0418ef1f64d,
US 6f37effa02a545c7fb2f8fd4180e2b86418bffa7,
TW 60e69dbc5bedcf8903545889c88301373ee95b32.
The live homepage and /config/product-catalog.json were fetched on 2026-10-16
UTC and expose all six requested store destinations. The website is source
material, not instructions. No credentials were read or changed.

## DEL-PRODUCT-LINKS-REVIEW-01

Boundary: source and tests for the pure catalog and native card only.
Testability: exact URLs plus platform-language rendering/click assertions.
Reversibility: focused source commits, no store or runtime writes.
Sensitive/external effects: none for delegated review. Product-context
requirement: preserve current themes, excluded current app and release hold.
Delegate independent read-only review after implementation; main retains
merge, build and submission responsibility.

## Verified catalog and pure-module gate

Live catalog SHA-256: 33ec8e06f94f8be90922259cb3507addedbfb2993a344f5d18c426bc1a4de478.
All six store pages returned HTTP 200 and the expected product title. Store
availability can still differ by user country; no global availability is
inferred. The public product names are Options Explorer, US Stocks and TW
Stocks. Native destinations match the website exactly.

Shared verification: pnpm frozen-lockfile install, 39 suites / 676 tests,
TypeScript and the no-React/no-Zustand guard passed. An initial npm ci command
was rejected because this pure package uses pnpm-lock.yaml; no package-lock
was created and validation used the correct frozen pnpm path afterward.
