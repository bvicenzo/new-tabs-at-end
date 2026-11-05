import { delay } from './delay';
import { PlacedTabMemory } from './placed-tab-memory';
import { PlacementToggle } from './placement-toggle';
import { SerialQueue } from './serial-queue';
import { readPlacement } from './settings';
import { TabEditor } from './tab-editor';
import { TabMover } from './tab-mover';
import { TabPlacer } from './tab-placer';

// Placements and toggles share one queue, so a toggle never races the placement of the tab it acts on.
const queue = new SerialQueue();
const mover = new TabMover({ tabs: chrome.tabs, editor: new TabEditor(delay) });
const memory = new PlacedTabMemory(chrome.storage.session);
const placer = new TabPlacer({ readPlacement: () => readPlacement(chrome.storage.sync), mover, memory, queue });
const toggle = new PlacementToggle({ tabs: chrome.tabs, tabGroups: chrome.tabGroups, mover, memory, queue });

// A failed placement or toggle is left to reject, so it shows in the extension's errors (docs/decisions/0009).
chrome.tabs.onCreated.addListener((createdTab) => void placer.onTabCreated(createdTab));
chrome.commands.onCommand.addListener((command) => void toggle.onCommand(command));
