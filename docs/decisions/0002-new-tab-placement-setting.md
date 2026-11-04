# 0002 — Where a link opened from a grouped tab goes is a setting

- **Status:** accepted
- **Date:** 2026-11-04

## Context

Chrome creates a link opened from a grouped tab inside that group. "The end" can then mean two things: the end of the
window (leaving the group, as other "new tabs last" extensions do) or the end of the group.

## Decision

An options page offers two placements for tabs opened from a grouped tab:

- **End of the window** (default) — leaves the group, matching the behaviour users of similar extensions are used to.
- **End of the group** — stays in the source tab's group.

A configurable keyboard shortcut toggles the current tab between the two placements, to correct a single case without
changing the setting. The choice is stored in `chrome.storage.sync`.

New tabs that are not opened from a grouped tab always go to the end of the window. Duplicated tabs are not new (see
[0001](0001-detect-new-tabs-by-empty-url.md)) and stay next to the original.

## Alternatives rejected

- **Ask every time.** An extension cannot open a dialog in the browser UI; the options are a system notification, a
  popup window or an in-page overlay (which needs access to every site and does not work on `chrome://` pages). Links
  opened with the middle button open in the background precisely so the user keeps their focus; a question on every
  such link breaks that flow. The shortcut covers the occasional exception without interrupting.
