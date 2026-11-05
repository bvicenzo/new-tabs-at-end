# 0010 — The toggle shortcut acts on the last placed tab

- **Status:** accepted
- **Date:** 2026-11-05

## Context

[0002](0002-new-tab-placement-setting.md) adds a shortcut that switches a single tab between the end of the window and
the end of its group, to correct one case without changing the setting. It does not say which tab. The natural
candidate, the active tab, is the wrong one for the case the shortcut exists for: a link opened with the middle button
opens in the background, so when the user sees it land in the wrong place, the active tab is still the one the link
came from.

## Decision

- The shortcut (`toggle-placement`, suggested `Alt+Shift+G`) acts on the **last new tab the extension placed**, active
  or not. Each placement records `{ tabId, sourceGroupId }` in `chrome.storage.session`, which survives the service
  worker being stopped between events and is cleared when the browser closes.
- If that tab is in the group it came from, it goes to the end of the window and leaves the group. Otherwise, out of
  any group or in another one, it joins its source group and goes to its end: a tab joining from the left lands at
  the group's start, so joining is followed by a move ([0008](0008-how-chromium-moves-and-groups-tabs.md), M5b).
- The shortcut does nothing when:
  - no tab was placed;
  - the last one was opened outside a group, so there is no group to go back to;
  - that tab was closed;
  - its source group no longer exists;
  - the group is in another window, since joining it would carry the tab across windows.
- Placements and toggles share one queue, so a toggle never races the placement of the tab it acts on.

## Consequences

- Correcting a placement takes one key press and no change of focus.
- After a tab opened outside a group, the shortcut does nothing until the next tab opened from a group, even if an
  earlier one is still open.
- Chrome may leave the shortcut unassigned when another extension already uses `Alt+Shift+G`; the options page shows
  the current shortcut, or that none is set, and links to `chrome://extensions/shortcuts`.
