import { isNewTab } from '../src/new-tab';
import { buildTab } from './support/builders';

describe('new-tab', () => {
  describe('isNewTab', () => {
    context('when the tab has no id', () => {
      it('is not new', () => {
        const tab = buildTab({ id: undefined, url: '' });

        expect(isNewTab(tab)).toBe(false);
      });
    });

    context('when the tab has an id', () => {
      context('but it is the id of no tab', () => {
        it('is not new', () => {
          const tab = buildTab({ id: -1, url: '' });

          expect(isNewTab(tab)).toBe(false);
        });
      });

      context('and it is the id of a tab', () => {
        context('but its url is absent', () => {
          it('is not new', () => {
            const tab = buildTab({ id: 7, url: undefined });

            expect(isNewTab(tab)).toBe(false);
          });
        });

        context('but its url is filled', () => {
          it('is not new', () => {
            const tab = buildTab({ id: 7, url: 'https://example.com/restored' });

            expect(isNewTab(tab)).toBe(false);
          });
        });

        context('and its url is empty', () => {
          context('and it has no pending url', () => {
            it('is new', () => {
              const tab = buildTab({ id: 7, url: '', pendingUrl: undefined });

              expect(isNewTab(tab)).toBe(true);
            });
          });

          context('and it has a pending url', () => {
            it('is new', () => {
              const tab = buildTab({ id: 7, url: '', pendingUrl: 'chrome://newtab/' });

              expect(isNewTab(tab)).toBe(true);
            });
          });
        });
      });
    });
  });
});
