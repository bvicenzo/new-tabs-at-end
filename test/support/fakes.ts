import type { Mock } from 'vitest';

import type { SerialQueue } from '../../src/serial-queue';
import type { EditOutcome, TabEdition, TabEditor } from '../../src/tab-editor';

type TabsMethod = 'move' | 'ungroup' | 'group' | 'query' | 'get' | 'create';

// chrome.tabs declares overloads a vi.fn() cannot satisfy; the fake carries only the methods an example is about.
export function fakeTabs(methods: Partial<Record<TabsMethod, Mock>>): typeof chrome.tabs {
  return methods as unknown as typeof chrome.tabs;
}

export function fakeStorage(methods: { get?: Mock; set?: Mock }): chrome.storage.StorageArea {
  return methods as unknown as chrome.storage.StorageArea;
}

export function fakeTabGroups(get: Mock): typeof chrome.tabGroups {
  return { get } as unknown as typeof chrome.tabGroups;
}

export function fakeCommands(getAll: Mock): typeof chrome.commands {
  return { getAll } as unknown as typeof chrome.commands;
}

// A queue that runs each task as soon as it is queued.
export function runningQueue(): Pick<SerialQueue, 'run'> {
  return { run: (task) => task() };
}

// A queue still busy with earlier tasks: it accepts the task without running it yet.
export function busyQueue(): Pick<SerialQueue, 'run'> & { run: Mock } {
  return { run: vi.fn().mockResolvedValue(undefined) };
}

// An editor that applies each edition once: it reports `outcome` when Chrome accepts it, and rejects when Chrome
// refuses it.
export function editorReporting(outcome: EditOutcome): Pick<TabEditor, 'edit'> & { edit: Mock } {
  return { edit: vi.fn((_tabId: number, edition: TabEdition) => edition().then(() => outcome)) };
}

// A Chrome edit refused `times` times with `refusal`, then accepted.
export function refusedThenAccepted(refusal: Error, times: number): Mock {
  const edition = vi.fn();

  Array.from({ length: times }).forEach(() => edition.mockRejectedValueOnce(refusal));

  return edition.mockResolvedValue(undefined);
}

interface ChromeFakeParts {
  onTabCreated: Mock;
  onCommand: Mock;
  tabs: Partial<Record<TabsMethod, Mock>>;
  tabGroupsGet: Mock;
  syncGet: Mock;
  session: { get: Mock; set: Mock };
}

// The parts of the `chrome` global the background script wires.
export function buildChromeFake({ onTabCreated, onCommand, tabs, tabGroupsGet, syncGet, session }: ChromeFakeParts) {
  return {
    tabs: { ...tabs, onCreated: { addListener: onTabCreated } },
    tabGroups: { get: tabGroupsGet },
    commands: { onCommand: { addListener: onCommand } },
    storage: { sync: { get: syncGet }, session }
  };
}
