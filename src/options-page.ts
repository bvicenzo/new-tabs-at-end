import { TOGGLE_PLACEMENT_COMMAND } from './placement-toggle';
import { type Placement, readPlacement, writePlacement } from './settings';

export interface OptionsPageParts {
  document: Document;
  storage: Pick<chrome.storage.StorageArea, 'get' | 'set'>;
  getMessage: (messageName: string) => string;
  commands: Pick<typeof chrome.commands, 'getAll'>;
  tabs: Pick<typeof chrome.tabs, 'create'>;
}

const SHORTCUTS_PAGE = 'chrome://extensions/shortcuts';

// The options page: where tabs opened from a grouped tab go (docs/decisions/0002), and the toggle's shortcut.
export class OptionsPage {
  constructor(private readonly parts: OptionsPageParts) {}

  async start(): Promise<void> {
    this.translate();
    this.listen();
    await Promise.all([this.showPlacement(), this.showShortcut()]);
  }

  // An element keeps the English text of the page when its message is unknown.
  private translate(): void {
    const { document, getMessage } = this.parts;
    const translatableElements = document.querySelectorAll<HTMLElement>('[data-message]');

    translatableElements.forEach((element) => {
      const translation = getMessage(element.dataset.message as string);

      if (translation) element.textContent = translation;
    });
  }

  private listen(): void {
    const { document, tabs } = this.parts;
    const placementChoices = document.querySelectorAll<HTMLInputElement>('input[name="placement"]');

    placementChoices.forEach((choice) => choice.addEventListener('change', () => void this.save(choice.value)));
    this.element('change-shortcut').addEventListener('click', () => void tabs.create({ url: SHORTCUTS_PAGE }));
  }

  private async showPlacement(): Promise<void> {
    const placement = await readPlacement(this.parts.storage);
    const placementChoice = this.parts.document.querySelector(`input[name="placement"][value="${placement}"]`);

    (placementChoice as HTMLInputElement).checked = true;
  }

  // Chrome leaves the shortcut empty when another extension already took the suggested keys.
  private async showShortcut(): Promise<void> {
    const { commands, getMessage } = this.parts;
    const toggleCommand = (await commands.getAll()).find((command) => command.name === TOGGLE_PLACEMENT_COMMAND);

    this.element('shortcut').textContent = toggleCommand?.shortcut || getMessage('shortcutNotSet');
  }

  private async save(placement: string): Promise<void> {
    const { storage, getMessage } = this.parts;

    try {
      await writePlacement(storage, placement as Placement);
      this.element('status').textContent = getMessage('saved');
    } catch {
      this.element('status').textContent = getMessage('notSaved');
    }
  }

  private element(elementId: string): HTMLElement {
    return this.parts.document.getElementById(elementId) as HTMLElement;
  }
}
