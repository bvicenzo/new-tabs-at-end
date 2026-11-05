// chrome.tabGroups.TAB_GROUP_ID_NONE, written out so the rules are testable without the extension runtime.
export const TAB_GROUP_ID_NONE = -1;

// The index of a move is the tab's final position, so the end of the group is the highest index among its tabs. There
// is nowhere to go when the tab left the group before it was listed, or is already its last tab (docs/decisions/0008).
export function endOfGroupIndex(tabId: number, groupTabs: chrome.tabs.Tab[]): number | null {
  const listedTab = groupTabs.find((tab) => tab.id === tabId);
  const lastIndexOfGroup = Math.max(...groupTabs.map((tab) => tab.index));

  if (!listedTab || listedTab.index === lastIndexOfGroup) return null;

  return lastIndexOfGroup;
}
