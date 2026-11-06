// SPDX-License-Identifier: GPL-3.0-or-later
import { isClosedTabError, isMissingGroupError } from './chrome-errors';
import { TAB_GROUP_ID_NONE } from './destination';
import type { PlacedTabMemory } from './placed-tab-memory';
import type { SerialQueue } from './serial-queue';
import type { TabMover } from './tab-mover';

export const TOGGLE_PLACEMENT_COMMAND = 'toggle-placement';

interface PlacementToggleParts {
  tabs: Pick<typeof chrome.tabs, 'get'>;
  tabGroups: Pick<typeof chrome.tabGroups, 'get'>;
  mover: Pick<TabMover, 'toEndOfWindow' | 'intoGroup'>;
  memory: Pick<PlacedTabMemory, 'recall'>;
  queue: Pick<SerialQueue, 'run'>;
}

// A tab or group that no longer exists leaves nothing to toggle; any other refusal rejects.
async function findUnlessGone<Found>(lookup: Promise<Found>, isGone: (error: unknown) => boolean) {
  try {
    return await lookup;
  } catch (error) {
    if (isGone(error)) return null;

    throw error;
  }
}

// The shortcut that corrects a single placement (docs/decisions/0002): the last tab placed from a grouped tab switches
// between the end of the window and the end of the group it came from, even while it stays in the background.
export class PlacementToggle {
  constructor(private readonly parts: PlacementToggleParts) {}

  async onCommand(command: string): Promise<void> {
    if (command !== TOGGLE_PLACEMENT_COMMAND) return;

    await this.parts.queue.run(() => this.toggle());
  }

  private async toggle(): Promise<void> {
    const { tabs, tabGroups, mover, memory } = this.parts;
    const placedTab = await memory.recall();

    if (!placedTab || placedTab.sourceGroupId === TAB_GROUP_ID_NONE) return;

    const { tabId, sourceGroupId } = placedTab;
    const currentTab = await findUnlessGone(tabs.get(tabId), isClosedTabError);

    if (!currentTab) return;

    const sourceGroup = await findUnlessGone(tabGroups.get(sourceGroupId), isMissingGroupError);

    // Joining a group in another window would carry the tab across windows.
    if (!sourceGroup || sourceGroup.windowId !== currentTab.windowId) return;
    if (currentTab.groupId === sourceGroupId) return mover.toEndOfWindow(tabId, sourceGroupId);

    return mover.intoGroup(tabId, sourceGroupId);
  }
}
