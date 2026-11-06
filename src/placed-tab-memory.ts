// SPDX-License-Identifier: GPL-3.0-or-later
export interface PlacedTab {
  tabId: number;
  sourceGroupId: number;
}

const LAST_PLACED_TAB_KEY = 'lastPlacedTab';

function isPlacedTab(storedTab: unknown): storedTab is PlacedTab {
  if (typeof storedTab !== 'object' || storedTab === null) return false;

  const { tabId, sourceGroupId } = storedTab as Partial<Record<keyof PlacedTab, unknown>>;

  return typeof tabId === 'number' && typeof sourceGroupId === 'number';
}

// The last tab the extension placed, which the toggle shortcut acts on. It lives in the session storage because the
// service worker is stopped between events.
export class PlacedTabMemory {
  constructor(private readonly storage: Pick<chrome.storage.StorageArea, 'get' | 'set'>) {}

  async remember(placedTab: PlacedTab): Promise<void> {
    await this.storage.set({ [LAST_PLACED_TAB_KEY]: placedTab });
  }

  async recall(): Promise<PlacedTab | null> {
    const { [LAST_PLACED_TAB_KEY]: storedTab } = await this.storage.get(LAST_PLACED_TAB_KEY);

    return isPlacedTab(storedTab) ? storedTab : null;
  }
}
