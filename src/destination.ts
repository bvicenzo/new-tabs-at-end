// chrome.tabGroups.TAB_GROUP_ID_NONE, written out so the rules are testable without the extension runtime.
export const TAB_GROUP_ID_NONE = -1;

const END_OF_WINDOW = -1;

export interface Destination {
  index: number;
  leaveGroup: boolean;
}

// A move to the end keeps the tab in its group when that group is the last one in the window, so a grouped tab also
// has to leave it (docs/decisions/0008).
export function windowDestination(tab: chrome.tabs.Tab): Destination {
  return { index: END_OF_WINDOW, leaveGroup: tab.groupId !== TAB_GROUP_ID_NONE };
}

// The index of a move is the tab's final position, so the end of the group is the highest index among its tabs. There
// is nowhere to go when the tab left the group before it was listed, or is already its last tab.
export function groupDestination(tabId: number, groupTabs: chrome.tabs.Tab[]): Destination | null {
  const listedTab = groupTabs.find((tab) => tab.id === tabId);
  const lastIndexOfGroup = Math.max(...groupTabs.map((tab) => tab.index));

  if (!listedTab || listedTab.index === lastIndexOfGroup) return null;

  return { index: lastIndexOfGroup, leaveGroup: false };
}
