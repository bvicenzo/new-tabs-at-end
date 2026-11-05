// The minimum valid tab is a restored one: its `url` filled and outside any group.
export function buildTab(overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab {
  return {
    id: 7,
    index: 0,
    windowId: 1,
    groupId: -1,
    url: 'https://example.com/',
    pinned: false,
    highlighted: false,
    active: false,
    frozen: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    lastAccessed: 0,
    ...overrides
  };
}

export function buildTabGroup(overrides: Partial<chrome.tabGroups.TabGroup> = {}): chrome.tabGroups.TabGroup {
  return { id: 3, windowId: 1, collapsed: false, color: 'grey', shared: false, ...overrides };
}
