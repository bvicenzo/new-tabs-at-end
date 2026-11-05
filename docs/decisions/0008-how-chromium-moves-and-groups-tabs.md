# 0008 — How Chromium moves and groups tabs

- **Status:** accepted
- **Date:** 2026-11-05

## Context

Placing a tab at the end of the window or of its group depends on what `chrome.tabs.move`, `chrome.tabs.ungroup` and
`chrome.tabs.group` do to group membership, which the API documentation does not state. The test suite mocks those
calls, so it can only pin what the extension asks for; whether that request lands the tab where intended is a fact
about the browser, recorded here.

## Evidence

Measured in a throwaway Chromium 155 profile (headless), through a diagnostic extension driven over the DevTools
protocol. `[ ]` marks the group; the tab acted on is in bold.

| # | Before | Call | After |
| --- | --- | --- | --- |
| M1a | A [**B** C] D | `move(B, { index: -1 })` | A [C] D **B** — leaves the group |
| M1b | A [**B** C] | `move(B, { index: -1 })` | A [C **B**] — **stays in the group** when the group is last |
| M1c | A [B **C**] | `move(C, { index: -1 })` | unchanged |
| M2a | A [**B** C E] D | `ungroup(B)` | A **B** [C E] D — keeps its position |
| M2b | A [B **C** E] D | `ungroup(C)` | A [B E] **C** D — moves past the group |
| M2c | A [B C **E**] D | `ungroup(E)` | A [B C] **E** D — keeps its position |
| M2d | A [**B** C] D | `move(B, -1)` then `ungroup(B)` | A [C] D **B** — `ungroup` of an ungrouped tab is a no-op, no error |
| M2e | A [**B** C] | `move(B, -1)` then `ungroup(B)` | A [C] **B** |
| M3 | **A** [B C] | `move(A, { index: -1 })` | [B C] **A** — an ungrouped tab does not join the last group |
| M4a | A [B **N** C E] D | `move(N, { index: highest index in the group })` | A [B C E **N**] D — end of the group, still in it |
| M4b | A [B **N** C] | same | A [B C **N**] |
| M4c | A [B **N** C] D | `move(N, { index: highest + 1 })` | A [B C] D **N** — leaves the group |
| M5a | A [B C] D **X** | `group({ tabIds: X, groupId })` | A [B C **X**] D — joins at the end |
| M5b | **A** [B C] D | `group({ tabIds: A, groupId })` | [**A** B C] D — joins at the **start** |
| M5c | A [B C] **X** | `group({ tabIds: X, groupId })` | A [B C **X**] |
| M7 | A [B C E] D, then E moved to 1 | `query({ groupId })` | E, B, C — ordered by index |
| M8 | a popup window with one tab | `move(tab, { index: -1 })` | index 0, same window — harmless |

Errors (M6):

- `move`, `ungroup`, `group` and `get` on a closed tab reject with `No tab with id: <id>.`
- `tabGroups.get` on a missing group rejects with `No group with id: <id>.`
- `query({ groupId })` for a missing group resolves to `[]`.
- An edit while the user drags a tab rejects with `Tabs cannot be edited right now (user may be dragging a tab).`
  This one was **not reproduced** (it needs a real drag); the text is taken from the Chromium 155 binary.

## Decision

- **End of the window** is `move(tab, { index: -1 })` followed by `ungroup(tab)`. The move alone leaves the group
  except when the group is the last one in the window (M1b), and `ungroup` is a harmless no-op otherwise (M2d). The
  move comes first so a failure in between leaves the tab at the end rather than out of its group in the middle.
- **End of the group** is `move(tab, { index })` with the highest index among the group's tabs (M4): the index in
  `move` is the tab's final position. Taking the maximum rather than the last element does not rely on M7.
- **Joining a group** (the toggle shortcut) is `group({ tabIds, groupId })` followed by the end-of-group move,
  because a tab to the left of the group joins at its start (M5b).
- `No tab with id` means the tab closed in the meantime; `Tabs cannot be edited right now` means a drag is in
  progress and the edit is retried.
- Window types are not filtered: a move in a single-tab popup is harmless (M8).

## Consequences

- The tests pin the calls above, not their effect; a Chromium change to group membership on move would not be caught
  by the suite. The scenarios here are the ones to re-run when that is suspected.
- The error texts are matched by prefix and are part of Chromium's extension API surface, not a documented contract.
