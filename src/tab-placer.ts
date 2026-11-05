import { type Destination, groupDestination, TAB_GROUP_ID_NONE, windowDestination } from './destination';
import { isNewTab, type PlaceableTab } from './new-tab';
import type { SerialQueue } from './serial-queue';
import type { Placement } from './settings';
import type { TabEditor } from './tab-editor';

interface TabPlacerParts {
  tabs: Pick<typeof chrome.tabs, 'query' | 'move' | 'ungroup'>;
  readPlacement: () => Promise<Placement>;
  editor: Pick<TabEditor, 'edit'>;
  queue: Pick<SerialQueue, 'run'>;
}

// Moves each new tab to the end of the window, or of its group when the setting says so (docs/decisions/0002).
export class TabPlacer {
  constructor(private readonly parts: TabPlacerParts) {}

  async onTabCreated(createdTab: chrome.tabs.Tab): Promise<void> {
    if (!isNewTab(createdTab)) return;

    await this.parts.queue.run(() => this.place(createdTab));
  }

  // The tab is moved before it leaves its group: a failure in between leaves it at the end, not out of its group.
  private async place(newTab: PlaceableTab): Promise<void> {
    const destination = await this.destinationOf(newTab);

    if (!destination) return;

    const { tabs, editor } = this.parts;
    const moveOutcome = await editor.edit(newTab.id, () => tabs.move(newTab.id, { index: destination.index }));

    if (moveOutcome === 'done' && destination.leaveGroup) await editor.edit(newTab.id, () => tabs.ungroup(newTab.id));
  }

  // The setting only concerns a tab opened inside a group; any other new tab goes to the end of the window.
  private async destinationOf(newTab: PlaceableTab): Promise<Destination | null> {
    const isGrouped = newTab.groupId !== TAB_GROUP_ID_NONE;

    if (!isGrouped || await this.parts.readPlacement() === 'window') return windowDestination(newTab);

    const groupTabs = await this.parts.tabs.query({ groupId: newTab.groupId });

    return groupDestination(newTab.id, groupTabs);
  }
}
