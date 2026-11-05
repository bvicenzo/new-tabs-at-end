import { buildTab, buildTabGroup } from './support/builders';
import { buildChromeFake } from './support/fakes';

describe('background', () => {
  describe('the created-tab listener', () => {
    context('when a new tab is created outside a group', () => {
      it('moves it to the end of the window and remembers it', async () => {
        const onTabCreated = vi.fn();
        const move = vi.fn().mockResolvedValue(undefined);
        const session = { get: vi.fn(), set: vi.fn().mockResolvedValue(undefined) };
        const chromeFake = buildChromeFake({
          onTabCreated,
          onCommand: vi.fn(),
          tabs: { move },
          tabGroupsGet: vi.fn(),
          syncGet: vi.fn(),
          session
        });

        vi.stubGlobal('chrome', chromeFake);
        vi.resetModules();
        await import('../src/background');
        const [[placeCreatedTab]] = onTabCreated.mock.calls as [[(createdTab: chrome.tabs.Tab) => void]];

        placeCreatedTab(buildTab({ id: 7, url: '', groupId: -1 }));

        const rememberedTab = { tabId: 7, sourceGroupId: -1 };

        await vi.waitFor(() => expect(session.set).toHaveBeenCalledWith({ lastPlacedTab: rememberedTab }));
        expect(move).toHaveBeenCalledExactlyOnceWith(7, { index: -1 });
      });
    });

    context('when a new tab is created inside a group', () => {
      it('reads the placement from the synced storage', async () => {
        const onTabCreated = vi.fn();
        const syncGet = vi.fn().mockResolvedValue({ placement: 'window' });
        const tabs = { move: vi.fn().mockResolvedValue(undefined), ungroup: vi.fn().mockResolvedValue(undefined) };
        const session = { get: vi.fn(), set: vi.fn().mockResolvedValue(undefined) };
        const parts = { onTabCreated, onCommand: vi.fn(), tabs, tabGroupsGet: vi.fn(), syncGet, session };
        const chromeFake = buildChromeFake(parts);

        vi.stubGlobal('chrome', chromeFake);
        vi.resetModules();
        await import('../src/background');
        const [[placeCreatedTab]] = onTabCreated.mock.calls as [[(createdTab: chrome.tabs.Tab) => void]];

        placeCreatedTab(buildTab({ id: 7, url: '', groupId: 3 }));

        await vi.waitFor(() => expect(tabs.ungroup).toHaveBeenCalledExactlyOnceWith(7));
        expect(syncGet).toHaveBeenCalledWith('placement');
      });
    });
  });

  describe('the command listener', () => {
    context('when the placement toggle is pressed', () => {
      it('brings the last placed tab back to its source group', async () => {
        const onCommand = vi.fn();
        const lastPlacedTab = { tabId: 7, sourceGroupId: 3 };
        const session = { get: vi.fn().mockResolvedValue({ lastPlacedTab }), set: vi.fn() };
        const groupTabs = [buildTab({ id: 4, index: 2, groupId: 3 }), buildTab({ id: 7, index: 2, groupId: 3 })];
        const tabs = {
          get: vi.fn().mockResolvedValue(buildTab({ id: 7, index: 5, windowId: 1, groupId: -1 })),
          group: vi.fn().mockResolvedValue(3),
          query: vi.fn().mockResolvedValue(groupTabs)
        };
        const tabGroupsGet = vi.fn().mockResolvedValue(buildTabGroup({ id: 3, windowId: 1 }));
        const parts = { onTabCreated: vi.fn(), onCommand, tabs, tabGroupsGet, syncGet: vi.fn(), session };
        const chromeFake = buildChromeFake(parts);

        vi.stubGlobal('chrome', chromeFake);
        vi.resetModules();
        await import('../src/background');
        const [[toggleLastPlacedTab]] = onCommand.mock.calls as [[(command: string) => void]];

        toggleLastPlacedTab('toggle-placement');

        await vi.waitFor(() => expect(tabs.group).toHaveBeenCalledExactlyOnceWith({ tabIds: 7, groupId: 3 }));
        expect(session.get).toHaveBeenCalledWith('lastPlacedTab');
      });
    });
  });
});
