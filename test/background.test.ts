import { buildTab } from './support/builders';
import { buildChromeFake } from './support/fakes';

describe('background', () => {
  describe('the created-tab listener', () => {
    context('when a new tab is created outside a group', () => {
      it('moves it to the end of the window', async () => {
        const addListener = vi.fn();
        const move = vi.fn().mockResolvedValue(undefined);
        const parts = { addListener, move, ungroup: vi.fn(), query: vi.fn(), syncGet: vi.fn() };

        vi.stubGlobal('chrome', buildChromeFake(parts));
        vi.resetModules();
        await import('../src/background');
        const [[onTabCreated]] = addListener.mock.calls as [[(createdTab: chrome.tabs.Tab) => void]];

        onTabCreated(buildTab({ id: 7, url: '', groupId: -1 }));

        await vi.waitFor(() => expect(move).toHaveBeenCalledExactlyOnceWith(7, { index: -1 }));
      });
    });

    context('when a new tab is created inside a group', () => {
      it('reads the placement from the synced storage', async () => {
        const addListener = vi.fn();
        const syncGet = vi.fn().mockResolvedValue({ placement: 'window' });
        const move = vi.fn().mockResolvedValue(undefined);
        const ungroup = vi.fn().mockResolvedValue(undefined);

        vi.stubGlobal('chrome', buildChromeFake({ addListener, move, ungroup, query: vi.fn(), syncGet }));
        vi.resetModules();
        await import('../src/background');
        const [[onTabCreated]] = addListener.mock.calls as [[(createdTab: chrome.tabs.Tab) => void]];

        onTabCreated(buildTab({ id: 7, url: '', groupId: 3 }));

        await vi.waitFor(() => expect(ungroup).toHaveBeenCalledExactlyOnceWith(7));
        expect(syncGet).toHaveBeenCalledWith('placement');
      });
    });
  });
});
