import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Window } from 'happy-dom';

import type { OptionsPageParts } from '../../src/options-page';
import { fakeCommands, fakeStorage, fakeTabs } from './fakes';

// Read from the project root, where the tests run: under happy-dom, `URL` is not Node's and cannot name a file. The
// page's own script tag is dropped — the examples run the script under test themselves.
const OPTIONS_MARKUP = readFileSync(join(process.cwd(), 'static/options.html'), 'utf8')
  .replace(/<script\b[^>]*><\/script>/, '');

// A fresh copy of the options page the extension ships, so every example starts from its real markup.
export function buildOptionsDocument(): Document {
  const optionsWindow = new Window();

  optionsWindow.document.write(OPTIONS_MARKUP);

  return optionsWindow.document as unknown as Document;
}

// The page as the browser opened it, for the script that runs on the global `document`.
export function loadOptionsMarkup(pageDocument: Document): void {
  pageDocument.write(OPTIONS_MARKUP);
}

// chrome.i18n.getMessage answers an empty string for a message it does not know.
export function fakeGetMessage(messages: Record<string, string>) {
  return vi.fn((messageName: string) => messages[messageName] ?? '');
}

// The minimum the page needs: nothing stored, no command listed, no message known, no tab opened.
export function buildOptionsPageParts(overrides: Partial<OptionsPageParts> = {}): OptionsPageParts {
  return {
    document: buildOptionsDocument(),
    storage: fakeStorage({ get: vi.fn().mockResolvedValue({}) }),
    getMessage: fakeGetMessage({}),
    commands: fakeCommands(vi.fn().mockResolvedValue([])),
    tabs: fakeTabs({}),
    ...overrides
  };
}
