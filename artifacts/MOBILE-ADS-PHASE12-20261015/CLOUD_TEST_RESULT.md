# Xcode Cloud verification — 2026-10-16 UTC

All three manually started required Test actions reached COMPLETE / FAILED.
No Archive, store upload, review submission or publication was performed.

| App | Run | Run ID | Verified source SHA | Finished UTC |
| --- | --- | --- | --- | --- |
| Options | 21 | 294f51ce-d221-4da4-922e-bea55b1fc540 | a1180a49220735f43ed3b0bf86d392919be04350 | 00:46:11.328 |
| US | 14 | 7b30bd6f-cdc6-4847-9f35-19642786168c | 69d1178ce68a0c83b0bce0601819b5788308c244 | 00:45:42.531 |
| TW | 16 | f57d83c4-c769-4ff4-b664-f9c3939a4660 | 23a779947229f1e5cb654659d2633c4cbf2286f8 | 00:45:57.164 |

Each action emitted build-for-testing products and result/log bundles, but
this does not establish successful test execution. US tablet and TW phone
test-worker logs report the pre-xcodebuild hook failing at line 6: its relocated
script path resolves `ci_scripts/../../ios`, which does not exist. The checked-in
hook assumes checkout availability before distinguishing the action. Options
fails even earlier while invoking the missing relative
`scripts/sync-ios-release-metadata.sh` from the relocated hook. Both phone and
tablet stderr have now been downloaded for all three apps. The early action
branch must precede Options metadata sync as well as checkout/dependency setup.

Retained build-worker logs confirm npm ci and CocoaPods completed in all three
apps, followed by `TEST BUILD SUCCEEDED`: Options 00:43:39Z, US 00:43:25Z,
TW 00:43:31Z. The failures occurred afterward on separate test workers, not
during compilation. No successful Cloud XCTest count is claimed for these runs.

Proposed bounded repair: distinguish test-without-building before checkout or
dependency setup; retain build-for-testing and Archive dependency validation and
the production ads gate. Add isolated action/path regression cases, independently
review, then verify new exact source SHAs in Cloud. Do not blindly retry unchanged
source or treat the prior local simulator tests as Cloud success.

AI001 finding FND-13475CC21E32 escalated the work item. The attempted bounded
remediation record was rejected because an Owner-approved experimenting state
is required. At 00:52:52 UTC the Owner renewed the exact approval; event 41
reopened experimenting and ATT-4753D495E9DE records the bounded hypothesis repair.
All pending worktrees and failed run evidence remain retained. Keys and AdMob
account verification are untouched; GitHub Actions remain excluded.

## Approved successor verification

Local isolated hook regressions pass Options 24/24, US 23/23, TW 23/23.
Independent Singer review passes those cases and shell syntax, with no behavioral
blocker; exact-commit readback confirms only the reviewed hook and regression
file were added, and all app checkouts are clean. This is not Cloud success.

Pushing the reviewed source automatically started the existing Verify workflows;
no duplicate manual run was requested:

| App | New source SHA | Cloud run | Run ID |
| --- | --- | --- | --- |
| Options | 87113fae69b8d06162b3cebcda9133d5d7b2d4c4 | 22 | 0ba8dbf7-9b93-4b9c-ba15-0d97c3446173 |
| US | 96e88b1ecbbcf94ad337c02d75269a9ff95bc708 | 15 | 25729a8c-283b-442c-b195-627c239adfeb |
| TW | f7e76257e3dff6e8fa9969c775f138beb49ce3fc | 17 | 73c73be5-aa07-46e5-ac88-87925ca204c8 |

All actual source SHAs were read back from Apple. Options 22 was subsequently
auto-canceled after the reviewed changelog correction; Options 23
(`b51fdfc8-9114-4bf2-a983-e0a51a747290`) uses
`c4ea2184bb52ccfe8ce29b1e525c278cc4ac0131`. At the latest API readback,
Options 23, US 15 and TW 17 remain RUNNING; this is not passing evidence.
No release Archive is started.

## Test-product relocation finding

The US 15 live test log confirms the repaired pre-test hook passed on both
phone and tablet. XCTest then fails because the test Info.plist embeds the
build worker's absolute product path, which is unavailable on the test worker.
Finding FND-DEE01F26F296 / attempt ATT-6EDD02AACA6F holds release pending a
bounded test-harness repair and independent verification. Existing identity,
privacy and ads assertions remain required.

Downloaded US 15 TEST_PRODUCTS artifact
`68d2882d-27cf-4121-b2f7-6d74aab19995` has SHA-256
`af2c3177834bc51b813b94c9cc0943e80b56f0763504e901747b1bbed4714dfb`.
Its app and test bundle are siblings under
`Binaries/0/Debug-iphonesimulator`; the xctestrun uses `__TESTROOT__` rather
than the original build-worker absolute directory. Resolve only the exact
named sibling from the loaded test bundle URL and verify actual relocation.
Do not substitute local success for the subsequent real Cloud test result.

The independent source re-review passes after adding metadata type checks and
failed-prerequisite guards. Exact sibling resolution retains all four original
assertion methods; a fifth method exercises copied/relocated products. Native
execution subsequently passed all six local phone/tablet result bundles:
Options 5+5, US 5+5, TW 5+5; zero failures or skips. Independent assurance
verified each relocation test and matching frozen source hashes. This repairs
the local harness, not the still-required Cloud execution gate.

The earlier Options 23 / US 15 / TW 17 runs are now COMPLETE / FAILED and
remain preserved. The reviewed repair was committed and pushed; automatic
Cloud runs read back as PENDING on the following exact source identities:

| App | Source SHA | Run | Run ID |
| --- | --- | --- | --- |
| Options | e197a9b5f067e5875d7fc564b00787e6d6d0e786 | 24 | 629c0ea2-c9c6-4a9c-b9bd-fb69e9066ab9 |
| US | 0e50cf2929eb1a6b2c9a26ad7af0c7bc82b83654 | 16 | 0d28965e-3713-4cd2-9d30-6b6a486eadd9 |
| TW | 24b7136f6317eba3990fc7b95f4f9532a1680313 | 18 | f0e18e47-36e6-4861-9f7e-407d0759c34e |

No duplicate manual run, Archive, upload or submission was requested.

## Cloud verification passed and source promoted

Options24, US16 and TW18 reached COMPLETE / SUCCEEDED. Independent assurance
confirmed exact source SHAs, required Test action success, five methods on
both iPhone18Pro and iPadPro13M5 iOS27 (30 destination results SUCCESS).
All issue pages were inspected: zero ERRORs; warnings remain456/447/418.
Passing tests do not imply zero warnings or production artifact acceptance.

The reviewed PRs were merged using exact-head matching:

| App | PR | Merged main SHA | Release Archive run / ID |
| --- | --- | --- | --- |
| Options | 33 | 3c6affb59c6030be5e3575bfd2bed0418ef1f64d | 25 / 67e2af6f-10f2-4b5f-b19f-f1190b274374 |
| US | 34 | 6f37effa02a545c7fb2f8fd4180e2b86418bffa7 | 17 / d74468df-df93-4893-a516-e78b5b3ab611 |
| TW | 18 | 60e69dbc5bedcf8903545889c88301373ee95b32 | 19 / 84ad47e7-800b-49ea-bb57-18bf9a222be8 |

Clean designated main checkouts were fast-forwarded. Archive starts explicitly
select the observed main reference, but source SHA must still be read back from
each run after resolution. All Archive requests returned PENDING; no Archive
success, processed store build, review submission or publication is claimed.
Android production build uses EAS CLI25.0.0 local mode with frozen credentials;
its artifact and signing verification remain pending.

Retained downloaded build-for-testing ZIP hashes:

| App | Kind | Artifact ID | SHA-256 |
| --- | --- | --- | --- |
| Options | Result | d5258047-ef89-4480-b3f5-a9099e73a643 | 70634926700c7490b5fbea041fbdd7d53d77d1a04812e3658a9ad3cb00389050 |
| Options | Logs | 64b7779a-edfd-4137-aa99-db41be0cb70e | 24ef347f3fd3912815ad0b185d40efeb969422bd1c79784d819aec4f728b3261 |
| US | Result | 2569daa1-109f-484e-9ab3-1a8a6a0e44f8 | 1d3a6f39b1728ddccd1d805d74c760c3148f5c30f6182e6eaf3f6cfbf95b157b |
| US | Logs | d4e1525c-d202-484c-9ee9-9d46ec68ea54 | 130f84b812b62ba899defcdcd27f20d2d3ef72c19e875aa083768a85c7837572 |
| TW | Result | 04599d28-d0d2-4496-9c35-43a3e9338a74 | 34184fd3a5c26173a5a0f750169c391b828d431a62e0c400c9f855c1e1af6f79 |
| TW | Logs | 9327a983-1a2d-477b-aa19-ad06e5b0ba72 | 2979db707da0448cf9188c0843da4f78eb686b351fe2378766673f386656ff38 |
