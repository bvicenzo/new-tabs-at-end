// SPDX-License-Identifier: GPL-3.0-or-later
// chrome.tabs.TAB_ID_NONE, written out so the rule is testable without the extension runtime.
const TAB_ID_NONE = -1;

export type PlaceableTab = chrome.tabs.Tab & { id: number };

// A tab the user asked for is created with an empty `url` — its destination is only in `pendingUrl` — while a restored
// or duplicated tab has it filled (docs/decisions/0001). An absent `url` means the "tabs" permission is missing.
export function isNewTab(tab: chrome.tabs.Tab): tab is PlaceableTab {
  return tab.id !== undefined && tab.id !== TAB_ID_NONE && tab.url === '';
}
