# Release inventory

## Current promotion status (2026-10-16T01:56Z)

All three source PRs are MERGED, designated main checkouts fast-forwarded and
clean. Cloud Test runs24/16/18 are COMPLETE / SUCCEEDED with30/30 destination
results; independent assurance verified exact identities and all issue pages.
Source merge commits and Archive IDs are recorded in CLOUD_TEST_RESULT.md.
Archive runs25/17/19 are RUNNING and actual source SHAs exactly match merged
main. Android Options production build is running through existing managed
signing with credentials frozen. No store submission or production publication
has happened for this work item.

Release evidence and pending artifact/store verification are explicitly
consolidated in this actively claimed shared worktree. App feature checkouts
contain no unique pending evidence; their reviewed source is preserved in
merged main. They may be safely removed only after clean-status, ancestry and
no-active-process checks; retaining this evidence checkout is mandatory until
acceptance or an explicit handoff.

## Historical verification status (2026-10-16T01:44Z)

All three local phone/tablet native suites pass (30 tests total), independently
verified after the exact-sibling product-relocation repair. Full source suites
remain Options598, US1127, TW1017 passing; type and locale checks pass.

| App | Cloud run | Run ID | Actual source SHA |
| --- | --- | --- | --- |
| Options | 24 | 629c0ea2-c9c6-4a9c-b9bd-fb69e9066ab9 | e197a9b5f067e5875d7fc564b00787e6d6d0e786 |
| US | 16 | 0d28965e-3713-4cd2-9d30-6b6a486eadd9 | 0e50cf2929eb1a6b2c9a26ad7af0c7bc82b83654 |
| TW | 18 | f0e18e47-36e6-4861-9f7e-407d0759c34e | 24b7136f6317eba3990fc7b95f4f9532a1680313 |

All three are RUNNING, not passed. No Archive or store deployment yet.
EAS CLI25.0.0 authenticated successfully using the unchanged existing account;
this does not establish signing availability or a production Android artifact.
Generated ignored Android output is stale-versioned and debug-signed and must
not be uploaded. Use the existing managed EAS production signing path.

## Historical verification status (2026-10-16T00:57Z)

Historical Test runs Options21/US14/TW16 ended FAILED after successful
build-for-testing: relocated test workers lacked the source checkout. See
CLOUD_TEST_RESULT.md for exact terminal evidence and retained artifact hashes.
Owner reapproved the bounded hook fix; independent review and 70 isolated
regressions passed. New runs auto-started from pushed exact commits:

| App | Run | Run ID | Actual source SHA |
| --- | --- | --- | --- |
| Options | 22 | 0ba8dbf7-9b93-4b9c-ba15-0d97c3446173 | 87113fae69b8d06162b3cebcda9133d5d7b2d4c4 |
| US | 15 | 25729a8c-283b-442c-b195-627c239adfeb | 96e88b1ecbbcf94ad337c02d75269a9ff95bc708 |
| TW | 17 | 73c73be5-aa07-46e5-ac88-87925ca204c8 | f7e76257e3dff6e8fa9969c775f138beb49ce3fc |

All RUNNING at readback, source identity matches. Cloud Test acceptance is
pending; no Archive or store deployment has occurred for this work item.

## Started Cloud Test runs (2026-10-16T00:39Z)

2026-10-16T00:40Z live readback, independently verified by Singer: all three
RUNNING, exact sourceCommit matches the table, required TEST actions RUNNING.
Completion status and issue counts null: no passing Cloud result claimed.
Query using unsupported include=actions returned400; subsequent GET followed
the run's actual actions related link successfully without retrying any build.

| App | Run | Run ID | Expected immutable source |
| --- | --- | --- | --- |
| Options | 21 | 294f51ce-d221-4da4-922e-bea55b1fc540 | a1180a49220735f43ed3b0bf86d392919be04350 |
| US | 14 | 7b30bd6f-cdc6-4847-9f35-19642786168c | 69d1178ce68a0c83b0bce0601819b5788308c244 |
| TW | 16 | f57d83c4-c769-4ff4-b664-f9c3939a4660 | 23a779947229f1e5cb654659d2633c4cbf2286f8 |

Each accepted start returned PENDING with sourceCommit initially blank. Exact
source must be read back after resolution, not assumed from the POST. Test only,
not Archive/upload/store submission. Current marketing source versions Options
1.5.15, US/TW1.0.4; Android33/17/16, iOS Cloud assigned numbers remain separate.
Exact feature pattern was appended to each verification branch condition, with
the historical pattern preserved. No broad wildcard or Archive trigger change.

## Cloud verification workflow update (2026-10-16T00:31Z)

Owner explicitly selected Xcode Cloud build and verification. Existing verification
workflow IDs were preserved, names changed to Options/US/TW iOS Verify and actions
changed from BUILD/ANY_IOS_DEVICE to TEST/ANY_IOS_SIMULATOR, required to pass.
Each uses scheme settings with supported iPhone18Pro and iPadPro13M5 iOS27
destinations read from the selected Cloud Xcode version. Historical branch triggers,
clean setting and the separate Archive workflows were not changed.

Options ACA77527-0B60-41F6-B761-AADDE197A983;
US DBE1E96F-5CEC-4EFA-8D58-A73FEF3CFE6B;
TW B0B9F19A-1C98-4F85-8882-71D7CB00AEA5.
Initial rejected payload used action destination SIMULATOR (HTTP409, no mutation);
corrected ANY_IOS_SIMULATOR succeeded and authenticated GET verified all three.
This is configuration evidence, not a passing Cloud Test or processed archive.
Native quoting repair and independent review precede source push/Cloud execution.

Readback: 2026-10-15T23:20Z–23:24Z. This is the baseline, not deployment of this work item.

| App | App Store version | Processed iOS build | Play production version | Android code |
| --- | --- | --- | --- | --- |
| Options | 1.5.14 READY_FOR_SALE | 20 VALID | 1.5.14 completed | 32 |
| US Stocks | 1.0.3 READY_FOR_SALE | 13 VALID | 1.0.3 completed | 16 |
| TW Stocks | 1.0.3 READY_FOR_SALE | 15 VALID | 1.0.3 completed | 15 |

App Store app IDs: Options 6768116720; US 6768116546; TW 6768116538.
Bundle/package names: com.dappgo.optionsapp, com.dappgo.usstocksapp,
com.dappgo.twstocksapp. Authenticated ASC GET requests and the existing
Google Play CLI profile were used without changing credentials.

Play track queries succeeded. The CLI's separate vitals startup query returned
an invalid metrics/dimensions request; this is not evidence of an app crash.
No Play release edit was committed.

AdMob console: Options and TW on both platforms and US Android are Ready with
ad serving enabled. US iOS requires verification and is serving-limited.
The public root app-ads.txt responds successfully with the exact publisher
record shown by AdMob. A check-for-updates was requested; its result must be
read back before claiming verification or unrestricted serving.
Owner subsequently instructed waiting for Google's update and no repeated
verification requests for US iOS. Leave that account state pending; do not
press check-for-updates again during this work item.

Existing iOS US description claims first-party Analytics is paused. New release
metadata/privacy must accurately describe the new optional Analytics control;
do not silently reuse that description for the new binary.

Planned patch versions: Options 1.5.15; US/TW 1.0.4, unified per app across
iOS and Android. New internal identifiers require a fresh pre-upload check.
Xcode Cloud's processed build number is authoritative for iOS.

No binary for this work item has been built, uploaded, submitted, or published.

## Native preparation (2026-10-16T00:09Z)

Android prebuild (`--platform android --no-install`, without clean) completed
in all three owning worktrees. Generated Options identity is still 1.5.14/code32;
this is preparation only, not a new-version artifact. Generated release signing
still selects the debug signing configuration, so this output is not eligible
for a Play upload. The existing managed signing path must be used unchanged.
US/TW prebuild warn that expo-system-ui is absent for userInterfaceStyle;
do not describe generated system-theme behavior as device-verified.
No Android devices or iOS simulators were booted at this capture; supported
emulator/simulator destinations exist, but actual phone/tablet execution remains
pending. No production ad impressions were generated by these source checks.

Attempts to read the three earlier uncommitted Play edit IDs returned
`This Edit has been deleted`; no edit was recreated, committed or release
changed in this step. A fresh pre-upload readback is still required before
reserving new Android version codes.
