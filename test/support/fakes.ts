import type { Mock } from 'vitest';

import type { SerialQueue } from '../../src/serial-queue';
import type { EditOutcome, TabEdition, TabEditor } from '../../src/tab-editor';

type TabsMethod = 'move' | 'ungroup' | 'query';

// chrome.tabs declares overloads a vi.fn() cannot satisfy; the fake carries only the methods an example is about.
export function fakeTabs(methods: Partial<Record<TabsMethod, Mock>>): typeof chrome.tabs {
  return methods as unknown as typeof chrome.tabs;
}

export function fakeStorage(get: Mock): chrome.storage.StorageArea {
  return { get } as unknown as chrome.storage.StorageArea;
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
  addListener: Mock;
  move: Mock;
  ungroup: Mock;
  query: Mock;
  syncGet: Mock;
}

// The parts of the `chrome` global the background script wires.
export function buildChromeFake({ addListener, move, ungroup, query, syncGet }: ChromeFakeParts): unknown {
  return { tabs: { onCreated: { addListener }, move, ungroup, query }, storage: { sync: { get: syncGet } } };
}
