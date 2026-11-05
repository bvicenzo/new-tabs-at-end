import { TAB_GROUP_ID_NONE } from './destination';
import { isNewTab, type PlaceableTab } from './new-tab';
import type { PlacedTabMemory } from './placed-tab-memory';
import type { SerialQueue } from './serial-queue';
import type { Placement } from './settings';
import type { TabMover } from './tab-mover';

interface TabPlacerParts {
  readPlacement: () => Promise<Placement>;
  mover: Pick<TabMover, 'toEndOfWindow' | 'toEndOfGroup'>;
  memory: Pick<PlacedTabMemory, 'remember'>;
  queue: Pick<SerialQueue, 'run'>;
}

// Moves each new tab to the end of the window, or of its group when the setting says so (docs/decisions/0002), and
// remembers it for the toggle shortcut.
export class TabPlacer {
  constructor(private readonly parts: TabPlacerParts) {}

  async onTabCreated(createdTab: chrome.tabs.Tab): Promise<void> {
    if (!isNewTab(createdTab)) return;

    await this.parts.queue.run(() => this.place(createdTab));
  }

  private async place(newTab: PlaceableTab): Promise<void> {
    await this.move(newTab);
    await this.parts.memory.remember({ tabId: newTab.id, sourceGroupId: newTab.groupId });
  }

  // The setting only concerns a tab opened inside a group; any other new tab goes to the end of the window.
  private async move({ id, groupId }: PlaceableTab): Promise<void> {
    const { readPlacement, mover } = this.parts;
    const isGrouped = groupId !== TAB_GROUP_ID_NONE;

    if (!isGrouped || await readPlacement() === 'window') return mover.toEndOfWindow(id, groupId);

    return mover.toEndOfGroup(id, groupId);
  }
}
