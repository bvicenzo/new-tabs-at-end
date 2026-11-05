# 0009 — How placement handles failures

- **Status:** accepted
- **Date:** 2026-11-05

## Context

Placing a new tab touches three things that can fail: the setting in `chrome.storage.sync`, the listing of the tab's
group, and the move or ungroup itself. The tab is already open when any of them fails, so the question is never
whether the user gets the tab, only where it ends up and whether anyone hears about the failure.

## Decision

| Failure | What happens to the tab | Who hears about it |
| --- | --- | --- |
| The setting cannot be read | placed with the default, the end of the window | a `console.warn` |
| The setting holds an unknown value (written by a newer version on another synced device) | placed with the default | nobody |
| A tab is being dragged (`Tabs cannot be edited right now`) | the edit is retried every 100 ms, 20 attempts in all; then left where it is | a `console.warn` when giving up |
| The tab closed meanwhile (`No tab with id`) | nothing left to do | nobody |
| The group cannot be listed, or any other refusal from Chrome | left where it is | the error propagates to chrome://extensions > Errors |

A grouped tab is moved before it leaves its group: if the ungroup fails, the tab is already at the end of the window
instead of out of its group in the middle of the strip ([0008](0008-how-chromium-moves-and-groups-tabs.md)).

Placements run one at a time, in the order the tabs were created, so tabs opened together ("Open all bookmarks") keep
their order; a failed placement does not hold up the next one.

## Consequences

- An unexpected refusal is visible to whoever opens the extension's error page, instead of being swallowed; the tab
  stays where Chrome put it, which is what the user would get without the extension.
- A wrong setting never blocks placement: the worst case is the default placement.
- The 20 attempts (two seconds) are a guess: long enough for a quick drag, short enough not to move a tab long after
  the user looked away. Revisit if giving up shows up in practice.
