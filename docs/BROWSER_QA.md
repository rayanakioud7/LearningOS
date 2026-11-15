# Browser verification — 0.9.0

Observed on 15 November 2026 in the in-app browser, using the existing disposable localhost:4173 test data. Real 127.0.0.1 study data was not used for synthetic writes. See BROWSER_QA_0_8_0.md for the earlier navigation, desktop/mobile, timer and offline observations.

## New observed checks

- Sunday 15 November displayed Room to recharge, with no timer or outcome buttons. The next Monday session remained under a disclosure.
- From a previously browsed February 2028 date, View today’s plan opened 2026-11-15.
- The restore dialog compared an incoming four-attempt backup against the current five-attempt plan, showed their different latest work and timestamps, preserved a corrected-attempt label, and identified the older export.
- Restore retained the old backup’s paused focus session. Partial review showed the remaining-effort field. Switching to Completed disabled that field despite a deliberately invalid estimate and revealed the exact completion evidence.
- Cancelling that review left four attempt rows, without granting completion. Skipped hid/disabled both irrelevant estimate and completion evidence controls.
- Recover previous plan showed the saved five-attempt plan and restored it afterward.
- A once-per-month GPU choice was verified through the actual native disabled option after selecting a previous Thursday. The acceptance test now checks that DOM state directly; its former isDisabled helper did not represent the option correctly.

The acceptance driver also exercises cross-tab preview refresh and the final mobile/offline flow. Refer to its commit-specific GitHub run for those automated results. Screenshots and final manual viewport/offline observations are recorded with this chat’s release evidence.

## Limits

This is not an exhaustive accessibility audit. Physical two-device transfer, Zen-specific rendering and native PWA installation were not performed. The curriculum policy and future semester assumptions were not changed. Browser progress is not synchronized through Git.
