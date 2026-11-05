import { PlacementToggle } from '../src/placement-toggle';
import { buildTab, buildTabGroup } from './support/builders';
import { busyQueue, fakeTabGroups, fakeTabs, runningQueue } from './support/fakes';

describe('PlacementToggle', () => {
  describe('#onCommand', () => {
    context('when the command is another one', () => {
      it('does nothing, without queueing anything', async () => {
        const memory = { recall: vi.fn() };
        const queue = busyQueue();
        const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
        const parts = { tabs: fakeTabs({}), tabGroups: fakeTabGroups(vi.fn()), mover, memory, queue };
        const subject = new PlacementToggle(parts);

        await subject.onCommand('_execute_action');

        expect.soft(queue.run).not.toHaveBeenCalled();
        expect(memory.recall).not.toHaveBeenCalled();
      });
    });

    context('when the command is the placement toggle', () => {
      context('but the queue has not run it yet', () => {
        it('does not move any tab yet', async () => {
          const memory = { recall: vi.fn() };
          const queue = busyQueue();
          const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
          const parts = { tabs: fakeTabs({}), tabGroups: fakeTabGroups(vi.fn()), mover, memory, queue };
          const subject = new PlacementToggle(parts);

          await subject.onCommand('toggle-placement');

          expect.soft(queue.run).toHaveBeenCalledOnce();
          expect(memory.recall).not.toHaveBeenCalled();
        });
      });

      context('and the queue runs it', () => {
        context('but the memory cannot be read', () => {
          it('rejects with the error', async () => {
            const storageRefusal = new Error('Access to storage denied.');
            const memory = { recall: vi.fn().mockRejectedValue(storageRefusal) };
            const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
            const tabGroups = fakeTabGroups(vi.fn());
            const parts = { tabs: fakeTabs({}), tabGroups, mover, memory, queue: runningQueue() };
            const subject = new PlacementToggle(parts);

            await expect(subject.onCommand('toggle-placement')).rejects.toBe(storageRefusal);
          });
        });

        context('and the memory is read', () => {
          context('but no tab is remembered', () => {
            it('moves no tab', async () => {
              const tabs = fakeTabs({ get: vi.fn() });
              const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
              const memory = { recall: vi.fn().mockResolvedValue(null) };
              const parts = { tabs, tabGroups: fakeTabGroups(vi.fn()), mover, memory, queue: runningQueue() };
              const subject = new PlacementToggle(parts);

              await subject.onCommand('toggle-placement');

              expect.soft(tabs.get).not.toHaveBeenCalled();
              expect.soft(mover.toEndOfWindow).not.toHaveBeenCalled();
              expect(mover.intoGroup).not.toHaveBeenCalled();
            });
          });

          context('and a tab is remembered', () => {
            context('but it was created outside a group', () => {
              it('moves no tab', async () => {
                const tabs = fakeTabs({ get: vi.fn() });
                const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
                const rememberedTab = { tabId: 7, sourceGroupId: -1 };
                const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                const parts = { tabs, tabGroups: fakeTabGroups(vi.fn()), mover, memory, queue: runningQueue() };
                const subject = new PlacementToggle(parts);

                await subject.onCommand('toggle-placement');

                expect.soft(tabs.get).not.toHaveBeenCalled();
                expect.soft(mover.toEndOfWindow).not.toHaveBeenCalled();
                expect(mover.intoGroup).not.toHaveBeenCalled();
              });
            });

            context('and it was created in a group', () => {
              context('but the tab is closed', () => {
                it('moves no tab', async () => {
                  const tabRefusal = new Error('No tab with id: 7.');
                  const tabs = fakeTabs({ get: vi.fn().mockRejectedValue(tabRefusal) });
                  const tabGroups = fakeTabGroups(vi.fn());
                  const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
                  const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                  const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                  const subject = new PlacementToggle({ tabs, tabGroups, mover, memory, queue: runningQueue() });

                  await subject.onCommand('toggle-placement');

                  expect.soft(tabs.get).toHaveBeenCalledExactlyOnceWith(7);
                  expect.soft(tabGroups.get).not.toHaveBeenCalled();
                  expect.soft(mover.toEndOfWindow).not.toHaveBeenCalled();
                  expect(mover.intoGroup).not.toHaveBeenCalled();
                });
              });

              context('but getting the tab fails otherwise', () => {
                it('rejects with the error', async () => {
                  const tabRefusal = new Error('Cannot access contents of the page.');
                  const tabs = fakeTabs({ get: vi.fn().mockRejectedValue(tabRefusal) });
                  const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
                  const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                  const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                  const parts = { tabs, tabGroups: fakeTabGroups(vi.fn()), mover, memory, queue: runningQueue() };
                  const subject = new PlacementToggle(parts);

                  await expect(subject.onCommand('toggle-placement')).rejects.toBe(tabRefusal);
                });
              });

              context('and the tab is found', () => {
                context('but its source group no longer exists', () => {
                  it('moves no tab', async () => {
                    const currentTab = buildTab({ id: 7, windowId: 1, groupId: -1 });
                    const tabs = fakeTabs({ get: vi.fn().mockResolvedValue(currentTab) });
                    const groupRefusal = new Error('No group with id: 3.');
                    const tabGroups = fakeTabGroups(vi.fn().mockRejectedValue(groupRefusal));
                    const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
                    const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                    const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                    const subject = new PlacementToggle({ tabs, tabGroups, mover, memory, queue: runningQueue() });

                    await subject.onCommand('toggle-placement');

                    expect.soft(tabGroups.get).toHaveBeenCalledExactlyOnceWith(3);
                    expect.soft(mover.toEndOfWindow).not.toHaveBeenCalled();
                    expect(mover.intoGroup).not.toHaveBeenCalled();
                  });
                });

                context('but getting the group fails otherwise', () => {
                  it('rejects with the error', async () => {
                    const currentTab = buildTab({ id: 7, windowId: 1, groupId: -1 });
                    const tabs = fakeTabs({ get: vi.fn().mockResolvedValue(currentTab) });
                    const groupRefusal = new Error('Extension context invalidated.');
                    const tabGroups = fakeTabGroups(vi.fn().mockRejectedValue(groupRefusal));
                    const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
                    const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                    const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                    const subject = new PlacementToggle({ tabs, tabGroups, mover, memory, queue: runningQueue() });

                    await expect(subject.onCommand('toggle-placement')).rejects.toBe(groupRefusal);
                  });
                });

                context('and the source group is found', () => {
                  context('but it is in another window than the tab', () => {
                    it('moves no tab', async () => {
                      const currentTab = buildTab({ id: 7, windowId: 1, groupId: -1 });
                      const tabs = fakeTabs({ get: vi.fn().mockResolvedValue(currentTab) });
                      const sourceGroup = buildTabGroup({ id: 3, windowId: 2 });
                      const tabGroups = fakeTabGroups(vi.fn().mockResolvedValue(sourceGroup));
                      const mover = { toEndOfWindow: vi.fn(), intoGroup: vi.fn() };
                      const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                      const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                      const subject = new PlacementToggle({ tabs, tabGroups, mover, memory, queue: runningQueue() });

                      await subject.onCommand('toggle-placement');

                      expect.soft(mover.toEndOfWindow).not.toHaveBeenCalled();
                      expect(mover.intoGroup).not.toHaveBeenCalled();
                    });
                  });

                  context('and it is in the window of the tab', () => {
                    context('and the tab is in its source group', () => {
                      context('but moving it rejects', () => {
                        it('rejects with the error', async () => {
                          const currentTab = buildTab({ id: 7, windowId: 1, groupId: 3 });
                          const tabs = fakeTabs({ get: vi.fn().mockResolvedValue(currentTab) });
                          const sourceGroup = buildTabGroup({ id: 3, windowId: 1 });
                          const tabGroups = fakeTabGroups(vi.fn().mockResolvedValue(sourceGroup));
                          const moveRefusal = new Error('Invalid tab index: 99.');
                          const mover = { toEndOfWindow: vi.fn().mockRejectedValue(moveRefusal), intoGroup: vi.fn() };
                          const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                          const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                          const parts = { tabs, tabGroups, mover, memory, queue: runningQueue() };
                          const subject = new PlacementToggle(parts);

                          await expect(subject.onCommand('toggle-placement')).rejects.toBe(moveRefusal);
                        });
                      });

                      context('and moving it resolves', () => {
                        it('moves it to the end of the window, out of the group', async () => {
                          const currentTab = buildTab({ id: 7, windowId: 1, groupId: 3 });
                          const tabs = fakeTabs({ get: vi.fn().mockResolvedValue(currentTab) });
                          const sourceGroup = buildTabGroup({ id: 3, windowId: 1 });
                          const tabGroups = fakeTabGroups(vi.fn().mockResolvedValue(sourceGroup));
                          const mover = { toEndOfWindow: vi.fn().mockResolvedValue(undefined), intoGroup: vi.fn() };
                          const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                          const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                          const parts = { tabs, tabGroups, mover, memory, queue: runningQueue() };
                          const subject = new PlacementToggle(parts);

                          await subject.onCommand('toggle-placement');

                          expect.soft(mover.toEndOfWindow).toHaveBeenCalledExactlyOnceWith(7, 3);
                          expect(mover.intoGroup).not.toHaveBeenCalled();
                        });
                      });
                    });

                    context('and the tab is in no group', () => {
                      context('but moving it rejects', () => {
                        it('rejects with the error', async () => {
                          const currentTab = buildTab({ id: 7, windowId: 1, groupId: -1 });
                          const tabs = fakeTabs({ get: vi.fn().mockResolvedValue(currentTab) });
                          const sourceGroup = buildTabGroup({ id: 3, windowId: 1 });
                          const tabGroups = fakeTabGroups(vi.fn().mockResolvedValue(sourceGroup));
                          const moveRefusal = new Error('Invalid tab index: 99.');
                          const mover = { intoGroup: vi.fn().mockRejectedValue(moveRefusal), toEndOfWindow: vi.fn() };
                          const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                          const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                          const parts = { tabs, tabGroups, mover, memory, queue: runningQueue() };
                          const subject = new PlacementToggle(parts);

                          await expect(subject.onCommand('toggle-placement')).rejects.toBe(moveRefusal);
                        });
                      });

                      context('and moving it resolves', () => {
                        it('brings it back to the end of its source group', async () => {
                          const currentTab = buildTab({ id: 7, windowId: 1, groupId: -1 });
                          const tabs = fakeTabs({ get: vi.fn().mockResolvedValue(currentTab) });
                          const sourceGroup = buildTabGroup({ id: 3, windowId: 1 });
                          const tabGroups = fakeTabGroups(vi.fn().mockResolvedValue(sourceGroup));
                          const mover = { intoGroup: vi.fn().mockResolvedValue(undefined), toEndOfWindow: vi.fn() };
                          const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                          const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                          const parts = { tabs, tabGroups, mover, memory, queue: runningQueue() };
                          const subject = new PlacementToggle(parts);

                          await subject.onCommand('toggle-placement');

                          expect.soft(mover.intoGroup).toHaveBeenCalledExactlyOnceWith(7, 3);
                          expect(mover.toEndOfWindow).not.toHaveBeenCalled();
                        });
                      });
                    });

                    context('and the tab is in another group', () => {
                      context('but moving it rejects', () => {
                        it('rejects with the error', async () => {
                          const currentTab = buildTab({ id: 7, windowId: 1, groupId: 5 });
                          const tabs = fakeTabs({ get: vi.fn().mockResolvedValue(currentTab) });
                          const sourceGroup = buildTabGroup({ id: 3, windowId: 1 });
                          const tabGroups = fakeTabGroups(vi.fn().mockResolvedValue(sourceGroup));
                          const moveRefusal = new Error('Invalid tab index: 99.');
                          const mover = { intoGroup: vi.fn().mockRejectedValue(moveRefusal), toEndOfWindow: vi.fn() };
                          const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                          const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                          const parts = { tabs, tabGroups, mover, memory, queue: runningQueue() };
                          const subject = new PlacementToggle(parts);

                          await expect(subject.onCommand('toggle-placement')).rejects.toBe(moveRefusal);
                        });
                      });

                      context('and moving it resolves', () => {
                        it('brings it back to the end of its source group', async () => {
                          const currentTab = buildTab({ id: 7, windowId: 1, groupId: 5 });
                          const tabs = fakeTabs({ get: vi.fn().mockResolvedValue(currentTab) });
                          const sourceGroup = buildTabGroup({ id: 3, windowId: 1 });
                          const tabGroups = fakeTabGroups(vi.fn().mockResolvedValue(sourceGroup));
                          const mover = { intoGroup: vi.fn().mockResolvedValue(undefined), toEndOfWindow: vi.fn() };
                          const rememberedTab = { tabId: 7, sourceGroupId: 3 };
                          const memory = { recall: vi.fn().mockResolvedValue(rememberedTab) };
                          const parts = { tabs, tabGroups, mover, memory, queue: runningQueue() };
                          const subject = new PlacementToggle(parts);

                          await subject.onCommand('toggle-placement');

                          expect.soft(mover.intoGroup).toHaveBeenCalledExactlyOnceWith(7, 3);
                          expect(mover.toEndOfWindow).not.toHaveBeenCalled();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
