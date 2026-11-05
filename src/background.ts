import { delay } from './delay';
import { SerialQueue } from './serial-queue';
import { readPlacement } from './settings';
import { TabEditor } from './tab-editor';
import { TabPlacer } from './tab-placer';

const placer = new TabPlacer({
  tabs: chrome.tabs,
  readPlacement: () => readPlacement(chrome.storage.sync),
  editor: new TabEditor(delay),
  queue: new SerialQueue()
});

// A failed placement is left to reject, so it shows in the extension's errors (docs/decisions/0009).
chrome.tabs.onCreated.addListener((createdTab) => void placer.onTabCreated(createdTab));
