# Release inventory

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
