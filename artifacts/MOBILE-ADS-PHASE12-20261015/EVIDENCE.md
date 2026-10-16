# Evidence and open acceptance

Baseline sources: shared 44a26c5; Options d201858; US c4b8ff7; TW 57eb524. Canonical main checkouts clean; no active claims in affected repositories. Named sibling worktrees created from freshly fetched origin/main. Four scoped claims active. Initial label mismatch was read-only and corrected to the manifest label before material edits.

Implementation drafted across all four owned worktrees; promotion and deployment pending. Credentials and GitHub Actions excluded.

## Integration checkpoint

Shared full suite passed 630 tests before parent added the stale show-rejection regression.
All app TypeScript checks passed after installing the candidate shared package locally.
The development-only package install is not final frozen dependency evidence: final apps
must reinstall from their committed lockfiles pinned to the promoted shared SHA.
Initial app full gates exposed test source-match assumptions after adding placement props,
Options missing direct Babel preset resolution, and US missing hoisted expo-asset.
Replan route: hypothesis; complete dependency declarations / frozen reinstall and update
placement assertions while preserving their order/count requirements, then rerun full gates.
No failures were waived. No source has been promoted or deployed.

Development integration 2026-10-15T23:50Z: Options 84 suites / 581 tests,
US 142 suites / 1104 tests, TW 137 suites / 996 tests passed. Commands used
Jest --runInBand --silent with explicit sibling shared ads source mapping
and consumer-local @babel/runtime mapping. This validates the candidate
integration only, not a frozen installed package or native binary.
Added direct Expo-compatible expo-asset declarations in all three consumers
and Babel preset in Options, with minimal lockfile root declarations.
Stock-detail placement assertion now targets detail_primary, preserving its
original position immediately before verdict explanation; secondary remains
separately named at its existing location. No ad placement was moved or added.

## DEL-ASSURANCE-03

Owner exact confirmation `APPROVE MOBILE-ADS-PHASE12-20261015 owner` received
2026-10-15 and recorded in the runtime. Independent review identified
FND-D88CDE33192B: consent regrant while initialization is pending can leave
fullscreen ads idle when that initialization returns false or rejects.
Manager attempt ATT-DFAF0AE3C77B revises the lifecycle hypothesis to track
consent generation and permit bounded recovery after in-flight completion.
Required verification: false/rejection regressions, full shared tests/types,
independent rereview. Promotion remains blocked pending assurance.
US iOS AdMob propagation remains explicitly deferred; no repeat verification.

Independent rereview accepted ATT-DFAF0AE3C77B: 47 focused tests and TypeScript,
including independent 102-change coalescing probes, stopped/withdrawn late
completion and paid-event dedup. Parent reran full shared 642 tests / 38 suites
and TypeScript successfully. Runtime finding verified passed.

Further integration findings remain open under separate bounded attempts:
FND-241680E3F2B0 / ATT-A6161CB24824 covers reentrant consent persistence,
duplicate launch analytics and unsupported web consent control.
FND-48C15A722833 covers route admission, cooldown-blocked startup wait, and
loaded banner refresh slot stability. These are not waived by existing green
unit counts; native/device/store evidence remains pending.

ATT-A6161CB24824 independently passed: reentrant writes end in withdrawn state,
100 concurrent launch-event callers emit once, and browser controls remain
absent. FND-48C15A722833 repair initially retained banner height for 30 seconds
then collapsed; manager identified that this delays rather than fixes the
refresh layout jump. Same bounded repair revised to retain an established slot
until normal unmount or consent change, while initial no-fill still collapses.
Latest development full suites before this banner correction: Options596,
US1125, TW1017, all pass; shared648 and TypeScript pass. Frozen dependency and
platform/store checks remain pending.

Independent review failed ATT-A74BB91B27B9: route enforcement and persisted
cooldown settlement passed, but 30-second banner removal only delays layout
instability, and excluded startup routes still wait on pending initialization.
Runtime state escalated; implementation stopped pending Owner reopening.
Next bounded direction: preserve established banner slot until unmount/consent
change and settle explicitly excluded startup routes without initialization wait.
Latest source remains local/unmerged/undeployed. No cleanup of pending worktrees.

Owner subsequently repeated exact approval; runtime reopened to experimenting.
ATT-9CF1B58EE6DC is the revised bounded banner/excluded-startup attempt.
All four claims renewed for four hours; no change in ownership or product scope.

ATT-9CF1B58EE6DC producer result: established banner slots persist through
refresh failures without collapse/retry timers; initial no-fill remains zero.
Excluded/unknown startup routes settle during preparation even while SDK
initialization remains pending. Shared650 tests and TypeScript pass; focused
consumer suites Options56/US62/TW64 pass, as do mapped consumer types.
Independent final rereview and exact-commit review remain required.

## DEL-RELEASE-INVENTORY-04

Read-only local source inventory by consent specialist: clear boundary of release
scripts/native identity/privacy declarations; deterministic and reversible report;
no account/credential access or external mutations; fixed product context from
release skill. Independent assurance remains a separate reviewer and cannot be
replaced by this producer inventory.

Independent read-only review of the new shared pure ads modules and tests. Boundary clear,
testable deterministic policies; no edits or external effects; reversible report; context
fixed by PRD/TDD. Reviewer must inspect code and identify concrete blockers independently.
Parent continues app integration in disjoint files while review runs.

## DEL-CONSENT-01
Boundary: consent modules/analytics adapters/tests only in the three owning app worktrees, plus shared consent pure module. Testable: mocked SDK and consent matrices. Reversible: code diff. Sensitive/external effects: local source only, no credentials/network/store changes by delegate. Product context: fixed Owner-approved purpose separation. Route: AI-assisted drafting followed by independent review. Delegate has no promotion authority.

## DEL-ADS-02
Boundary: shared pure admission/telemetry modules and each app fullscreen/banner/policy tests; excludes consent and analytics adapters. Testable fake SDK events and clocks. Reversible source changes. No external side effects or credential access. Product context fixed: no frequency increase, no new formats. AI-assisted implementation, parent integration and independent assurance required.
