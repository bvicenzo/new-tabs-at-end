# 0001 — Detect new tabs by an empty `url` at creation

- **Status:** accepted
- **Date:** 2026-11-04

## Context

`chrome.tabs.onCreated` fires for every tab: the ones the user opens *and* the ones Chrome recreates — session restore
on startup, Ctrl+Shift+T, restoring a closed window. An extension that moves every created tab to the end breaks tab
groups on startup, because a group's first tab is recreated ungrouped and only joins the group a moment later.

We need a signal, available at `onCreated`, that separates "the user asked for a new tab" from "Chrome is bringing a
tab back".

## Evidence

Measured in a throwaway Chromium 155 profile with a diagnostic extension that only logged events, every scenario
driven by real keyboard shortcuts, real clicks or a real browser restart.

| Scenario | `url` at `onCreated` | `status` | `openerTabId` | `transitionType` |
| --- | --- | --- | --- | --- |
| Ctrl+T | **empty** (`pendingUrl` = `chrome://newtab/`) | loading | set | `typed` |
| Link: middle click, Ctrl+click, `target=_blank`, `window.open` | **empty** | loading | set | `link` |
| Alt+Enter in the address bar | **empty** | loading | set | `typed` |
| Link opened from another application | **empty** | loading | set | `start_page` |
| Bookmark bar, middle click | **empty** | loading | set | `auto_bookmark` |
| Bookmark manager, middle click | **empty** | loading | — | `link` |
| Ctrl+Shift+T on a tab (grouped or not) | **filled** | loading | — | `reload` |
| Ctrl+Shift+T on a window | **filled** | unloaded | — | `reload` |
| Browser reopened with a saved session | **filled** | unloaded | — | `reload` |
| Duplicate tab | **filled** | loading | set | `reload` |

Other findings:

- A tab restored with Ctrl+Shift+T is created already inside its group.
- A link opened from a grouped tab is created inside the source tab's group.
- On session restore, a group's first tab is created with `groupId: -1` and joins the group right after.
- Chrome does not keep an unused new tab page in "recently closed", so Ctrl+Shift+T never restores a blank tab.
- `webNavigation.onCreatedNavigationTarget` fires only for links; it is not enough on its own.

## Decision

A tab is **new** when it is created with an empty `url` (the destination is only in `pendingUrl`). A tab created with
its `url` already filled is a restoration or a duplicate and is left where Chrome put it.

## Consequences

- One synchronous check at `onCreated`: no startup grace window, no waiting for other events, no visible jump.
- Duplicated tabs stay next to the original, which is the desired behaviour.
- Tabs created by other extensions through `chrome.tabs.create` count as new.
- Not measured: reopening a saved tab group from the bookmarks bar. It is expected to arrive with a filled `url`, like
  every other restoration.
- The evidence comes from Chromium 155; the signal comes from Chromium's tab model, so Chrome should behave the same,
  but a Chrome update could change it. The test suite pins the rule, not the browser's behaviour.
