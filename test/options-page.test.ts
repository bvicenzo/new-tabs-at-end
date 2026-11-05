import { OptionsPage } from '../src/options-page';
import { fakeCommands, fakeStorage, fakeTabs } from './support/fakes';
import { buildOptionsDocument, buildOptionsPageParts, fakeGetMessage } from './support/options-document';

describe('OptionsPage', () => {
  describe('#start', () => {
    describe('the texts', () => {
      context('when the message of an element is unknown', () => {
        it('keeps the text the page already had', async () => {
          const optionsDocument = buildOptionsDocument();
          const getMessage = fakeGetMessage({});
          const subject = new OptionsPage(buildOptionsPageParts({ document: optionsDocument, getMessage }));

          await subject.start();

          expect(optionsDocument.querySelector('legend')?.textContent).toBe('Links opened from a tab in a group go to');
        });
      });

      context('when the message of an element is known', () => {
        it('shows the translated message', async () => {
          const optionsDocument = buildOptionsDocument();
          const legendTranslation = 'Links abertos de uma aba em um grupo vão para';
          const getMessage = fakeGetMessage({ placementLegend: legendTranslation });
          const subject = new OptionsPage(buildOptionsPageParts({ document: optionsDocument, getMessage }));

          await subject.start();

          expect.soft(getMessage).toHaveBeenCalledWith('placementLegend');
          expect(optionsDocument.querySelector('legend')?.textContent).toBe(legendTranslation);
        });
      });
    });

    describe('the placement choice', () => {
      context('when the stored placement is the end of the window', () => {
        it('checks the end of the window', async () => {
          const optionsDocument = buildOptionsDocument();
          const storage = fakeStorage({ get: vi.fn().mockResolvedValue({ placement: 'window' }) });
          const subject = new OptionsPage(buildOptionsPageParts({ document: optionsDocument, storage }));

          await subject.start();

          const windowChoice = optionsDocument.querySelector<HTMLInputElement>('input[value="window"]');
          const groupChoice = optionsDocument.querySelector<HTMLInputElement>('input[value="group"]');

          expect.soft(groupChoice?.checked).toBe(false);
          expect(windowChoice?.checked).toBe(true);
        });
      });

      context('when the stored placement is the end of the group', () => {
        it('checks the end of the group', async () => {
          const optionsDocument = buildOptionsDocument();
          const storage = fakeStorage({ get: vi.fn().mockResolvedValue({ placement: 'group' }) });
          const subject = new OptionsPage(buildOptionsPageParts({ document: optionsDocument, storage }));

          await subject.start();

          const windowChoice = optionsDocument.querySelector<HTMLInputElement>('input[value="window"]');
          const groupChoice = optionsDocument.querySelector<HTMLInputElement>('input[value="group"]');

          expect.soft(windowChoice?.checked).toBe(false);
          expect(groupChoice?.checked).toBe(true);
        });
      });
    });

    describe('the shortcut', () => {
      context('when the commands cannot be listed', () => {
        it('rejects with the error', async () => {
          const commandsRefusal = new Error('Extension context invalidated.');
          const commands = fakeCommands(vi.fn().mockRejectedValue(commandsRefusal));
          const subject = new OptionsPage(buildOptionsPageParts({ commands }));

          await expect(subject.start()).rejects.toBe(commandsRefusal);
        });
      });

      context('when the commands are listed', () => {
        context('but the toggle is not among them', () => {
          it('shows that no shortcut is set', async () => {
            const optionsDocument = buildOptionsDocument();
            const otherCommand = { name: '_execute_action', shortcut: 'Alt+Shift+A' };
            const commands = fakeCommands(vi.fn().mockResolvedValue([otherCommand]));
            const getMessage = fakeGetMessage({ shortcutNotSet: 'not set' });
            const subject = new OptionsPage(buildOptionsPageParts({ document: optionsDocument, commands, getMessage }));

            await subject.start();

            expect(optionsDocument.getElementById('shortcut')?.textContent).toBe('not set');
          });
        });

        context('and the toggle is among them', () => {
          context('but Chrome assigned it no shortcut', () => {
            it('shows that no shortcut is set', async () => {
              const optionsDocument = buildOptionsDocument();
              const toggleCommand = { name: 'toggle-placement', shortcut: '' };
              const commands = fakeCommands(vi.fn().mockResolvedValue([toggleCommand]));
              const getMessage = fakeGetMessage({ shortcutNotSet: 'not set' });
              const parts = buildOptionsPageParts({ document: optionsDocument, commands, getMessage });
              const subject = new OptionsPage(parts);

              await subject.start();

              expect(optionsDocument.getElementById('shortcut')?.textContent).toBe('not set');
            });
          });

          context('and Chrome assigned it a shortcut', () => {
            it('shows the shortcut', async () => {
              const optionsDocument = buildOptionsDocument();
              const toggleCommand = { name: 'toggle-placement', shortcut: 'Alt+Shift+G' };
              const commands = fakeCommands(vi.fn().mockResolvedValue([toggleCommand]));
              const getMessage = fakeGetMessage({ shortcutNotSet: 'not set' });
              const parts = buildOptionsPageParts({ document: optionsDocument, commands, getMessage });
              const subject = new OptionsPage(parts);

              await subject.start();

              expect(optionsDocument.getElementById('shortcut')?.textContent).toBe('Alt+Shift+G');
            });
          });
        });
      });
    });

    describe('choosing a placement', () => {
      context('when the choice cannot be saved', () => {
        it('tells it was not saved', async () => {
          const optionsDocument = buildOptionsDocument();
          const writeLimit = new Error('MAX_WRITE_OPERATIONS_PER_MINUTE');
          const set = vi.fn().mockRejectedValue(writeLimit);
          const storage = fakeStorage({ get: vi.fn().mockResolvedValue({}), set });
          const getMessage = fakeGetMessage({ saved: 'Saved.', notSaved: 'Could not save. Try again.' });
          const subject = new OptionsPage(buildOptionsPageParts({ document: optionsDocument, storage, getMessage }));
          const status = optionsDocument.getElementById('status');

          await subject.start();
          optionsDocument.querySelector<HTMLInputElement>('input[value="group"]')?.click();

          await vi.waitFor(() => expect(status?.textContent).toBe('Could not save. Try again.'));
        });
      });

      context('when the choice is saved', () => {
        context('and it is the end of the window', () => {
          it('stores it and tells it was saved', async () => {
            const optionsDocument = buildOptionsDocument();
            const set = vi.fn().mockResolvedValue(undefined);
            const storage = fakeStorage({ get: vi.fn().mockResolvedValue({ placement: 'group' }), set });
            const getMessage = fakeGetMessage({ saved: 'Saved.', notSaved: 'Could not save. Try again.' });
            const subject = new OptionsPage(buildOptionsPageParts({ document: optionsDocument, storage, getMessage }));

            await subject.start();
            optionsDocument.querySelector<HTMLInputElement>('input[value="window"]')?.click();

            await vi.waitFor(() => expect(optionsDocument.getElementById('status')?.textContent).toBe('Saved.'));
            expect(set).toHaveBeenCalledExactlyOnceWith({ placement: 'window' });
          });
        });

        context('and it is the end of the group', () => {
          it('stores it and tells it was saved', async () => {
            const optionsDocument = buildOptionsDocument();
            const set = vi.fn().mockResolvedValue(undefined);
            const storage = fakeStorage({ get: vi.fn().mockResolvedValue({}), set });
            const getMessage = fakeGetMessage({ saved: 'Saved.', notSaved: 'Could not save. Try again.' });
            const subject = new OptionsPage(buildOptionsPageParts({ document: optionsDocument, storage, getMessage }));

            await subject.start();
            optionsDocument.querySelector<HTMLInputElement>('input[value="group"]')?.click();

            await vi.waitFor(() => expect(optionsDocument.getElementById('status')?.textContent).toBe('Saved.'));
            expect(set).toHaveBeenCalledExactlyOnceWith({ placement: 'group' });
          });
        });
      });
    });

    describe('the change-shortcut button', () => {
      context('when it is clicked', () => {
        it('opens the shortcuts page in a new tab', async () => {
          const optionsDocument = buildOptionsDocument();
          const create = vi.fn().mockResolvedValue(undefined);
          const parts = buildOptionsPageParts({ document: optionsDocument, tabs: fakeTabs({ create }) });
          const subject = new OptionsPage(parts);

          await subject.start();
          optionsDocument.getElementById('change-shortcut')?.click();

          expect(create).toHaveBeenCalledExactlyOnceWith({ url: 'chrome://extensions/shortcuts' });
        });
      });
    });
  });
});
