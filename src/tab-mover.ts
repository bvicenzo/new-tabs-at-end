import { endOfGroupIndex, TAB_GROUP_ID_NONE } from './destination';
import type { TabEditor } from './tab-editor';

interface TabMoverParts {
  tabs: Pick<typeof chrome.tabs, 'move' | 'ungroup' | 'group' | 'query'>;
  editor: Pick<TabEditor, 'edit'>;
}

const END_OF_WINDOW = -1;

// The moves the extension makes, each as Chrome needs it done (docs/decisions/0008).
export class TabMover {
  constructor(private readonly parts: TabMoverParts) {}

  // A move to the end keeps the tab in its group when that group is the last one in the window, so a grouped tab also
  // leaves it — after the move, so a failure in between leaves it at the end rather than out of its group.
  async toEndOfWindow(tabId: number, groupId: number): Promise<void> {
    const { tabs, editor } = this.parts;
    const moveOutcome = await editor.edit(tabId, () => tabs.move(tabId, { index: END_OF_WINDOW }));
    const isGrouped = groupId !== TAB_GROUP_ID_NONE;

    if (moveOutcome === 'done' && isGrouped) await editor.edit(tabId, () => tabs.ungroup(tabId));
  }

  async toEndOfGroup(tabId: number, groupId: number): Promise<void> {
    const { tabs, editor } = this.parts;
    const groupTabs = await tabs.query({ groupId });
    const lastIndexOfGroup = endOfGroupIndex(tabId, groupTabs);

    if (lastIndexOfGroup !== null) await editor.edit(tabId, () => tabs.move(tabId, { index: lastIndexOfGroup }));
  }

  // A tab joining from the left of the group lands at its start, so joining is followed by a move to its end.
  async intoGroup(tabId: number, groupId: number): Promise<void> {
    const { tabs, editor } = this.parts;
    const joinOutcome = await editor.edit(tabId, () => tabs.group({ tabIds: tabId, groupId }));

    if (joinOutcome === 'done') await this.toEndOfGroup(tabId, groupId);
  }
}
