// @vitest-environment happy-dom
import { loadOptionsMarkup } from './support/options-document';

describe('options', () => {
  describe('the page script', () => {
    context('when the page loads', () => {
      it('translates the page with the extension messages', async () => {
        const getMessage = vi.fn().mockReturnValue('Atalho');
        const chromeFake = {
          storage: { sync: { get: vi.fn().mockResolvedValue({}) } },
          i18n: { getMessage },
          commands: { getAll: vi.fn().mockResolvedValue([]) },
          tabs: { create: vi.fn() }
        };

        loadOptionsMarkup(document);
        vi.stubGlobal('chrome', chromeFake);
        vi.resetModules();
        await import('../src/options');

        await vi.waitFor(() => expect(document.querySelector('h2')?.textContent).toBe('Atalho'));
        expect(getMessage).toHaveBeenCalledWith('shortcutHeading');
      });
    });
  });
});
