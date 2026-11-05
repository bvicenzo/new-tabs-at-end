import { TabPlacer } from '../src/tab-placer';
import { buildTab } from './support/builders';
import { busyQueue, editorReporting, fakeTabs, runningQueue } from './support/fakes';

describe('TabPlacer', () => {
  describe('#onTabCreated', () => {
    context('when the tab is not new', () => {
      it('leaves it alone, without reading the setting or queueing anything', async () => {
        const restoredTab = buildTab({ id: 7, url: 'https://example.com/restored' });
        const readPlacement = vi.fn();
        const editor = editorReporting('done');
        const queue = busyQueue();
        const subject = new TabPlacer({ tabs: fakeTabs({}), readPlacement, editor, queue });

        await subject.onTabCreated(restoredTab);

        expect.soft(readPlacement).not.toHaveBeenCalled();
        expect.soft(editor.edit).not.toHaveBeenCalled();
        expect(queue.run).not.toHaveBeenCalled();
      });
    });

    context('when the tab is new', () => {
      context('but the queue has not run its placement yet', () => {
        it('does not move it yet', async () => {
          const newTab = buildTab({ id: 7, url: '' });
          const editor = editorReporting('done');
          const queue = busyQueue();
          const subject = new TabPlacer({ tabs: fakeTabs({}), readPlacement: vi.fn(), editor, queue });

          await subject.onTabCreated(newTab);

          expect.soft(queue.run).toHaveBeenCalledOnce();
          expect(editor.edit).not.toHaveBeenCalled();
        });
      });

      context('and the queue runs its placement', () => {
        context('and the tab is not in a group', () => {
          context('but the move rejects', () => {
            it('rejects with the error', async () => {
              const newTab = buildTab({ id: 7, url: '', groupId: -1 });
              const move = vi.fn().mockRejectedValue(new Error('Invalid tab index: 99.'));
              const editor = editorReporting('done');
              const parts = { tabs: fakeTabs({ move }), readPlacement: vi.fn(), editor, queue: runningQueue() };
              const subject = new TabPlacer(parts);

              await expect(subject.onTabCreated(newTab)).rejects.toThrow('Invalid tab index: 99.');
            });
          });

          context('and the move resolves', () => {
            it('moves it to the end of the window, leaving the setting unread', async () => {
              const newTab = buildTab({ id: 7, url: '', groupId: -1 });
              const tabs = fakeTabs({ move: vi.fn().mockResolvedValue(undefined), ungroup: vi.fn() });
              const readPlacement = vi.fn();
              const editor = editorReporting('done');
              const subject = new TabPlacer({ tabs, readPlacement, editor, queue: runningQueue() });

              await subject.onTabCreated(newTab);

              expect.soft(editor.edit).toHaveBeenCalledExactlyOnceWith(7, expect.any(Function));
              expect.soft(tabs.move).toHaveBeenCalledExactlyOnceWith(7, { index: -1 });
              expect.soft(tabs.ungroup).not.toHaveBeenCalled();
              expect(readPlacement).not.toHaveBeenCalled();
            });
          });
        });

        context('and the tab is in a group', () => {
          context('and the setting is the end of the window', () => {
            context('but the move rejects', () => {
              it('rejects with the error, leaving the tab in its group', async () => {
                const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                const move = vi.fn().mockRejectedValue(new Error('Invalid tab index: 99.'));
                const tabs = fakeTabs({ move, ungroup: vi.fn() });
                const readPlacement = vi.fn().mockResolvedValue('window');
                const parts = { tabs, readPlacement, editor: editorReporting('done'), queue: runningQueue() };
                const subject = new TabPlacer(parts);

                await expect.soft(subject.onTabCreated(newTab)).rejects.toThrow('Invalid tab index: 99.');
                expect(tabs.ungroup).not.toHaveBeenCalled();
              });
            });

            context('but the move finds the tab closed', () => {
              it('does not ungroup it', async () => {
                const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                const tabs = fakeTabs({ move: vi.fn().mockResolvedValue(undefined), ungroup: vi.fn() });
                const readPlacement = vi.fn().mockResolvedValue('window');
                const parts = { tabs, readPlacement, editor: editorReporting('closed'), queue: runningQueue() };
                const subject = new TabPlacer(parts);

                await subject.onTabCreated(newTab);

                expect(tabs.ungroup).not.toHaveBeenCalled();
              });
            });

            context('but the move gives up', () => {
              it('does not ungroup it', async () => {
                const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                const tabs = fakeTabs({ move: vi.fn().mockResolvedValue(undefined), ungroup: vi.fn() });
                const readPlacement = vi.fn().mockResolvedValue('window');
                const parts = { tabs, readPlacement, editor: editorReporting('gaveUp'), queue: runningQueue() };
                const subject = new TabPlacer(parts);

                await subject.onTabCreated(newTab);

                expect(tabs.ungroup).not.toHaveBeenCalled();
              });
            });

            context('and the move is done', () => {
              context('but the ungroup rejects', () => {
                it('rejects with the error', async () => {
                  const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                  const ungroup = vi.fn().mockRejectedValue(new Error('Tab 7 is not in a group.'));
                  const tabs = fakeTabs({ move: vi.fn().mockResolvedValue(undefined), ungroup });
                  const readPlacement = vi.fn().mockResolvedValue('window');
                  const parts = { tabs, readPlacement, editor: editorReporting('done'), queue: runningQueue() };
                  const subject = new TabPlacer(parts);

                  await expect(subject.onTabCreated(newTab)).rejects.toThrow('Tab 7 is not in a group.');
                });
              });

              context('and the ungroup resolves', () => {
                it('moves it to the end of the window, then out of its group', async () => {
                  const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                  const move = vi.fn().mockResolvedValue(undefined);
                  const ungroup = vi.fn().mockResolvedValue(undefined);
                  const readPlacement = vi.fn().mockResolvedValue('window');
                  const editor = editorReporting('done');
                  const parts = { tabs: fakeTabs({ move, ungroup }), readPlacement, editor, queue: runningQueue() };
                  const subject = new TabPlacer(parts);

                  await subject.onTabCreated(newTab);

                  expect.soft(editor.edit).toHaveBeenCalledTimes(2);
                  expect.soft(move).toHaveBeenCalledExactlyOnceWith(7, { index: -1 });
                  expect.soft(ungroup).toHaveBeenCalledExactlyOnceWith(7);
                  expect(move).toHaveBeenCalledBefore(ungroup);
                });
              });
            });
          });

          context('and the setting is the end of the group', () => {
            context('but the group cannot be listed', () => {
              it('rejects with the error, leaving the tab in place', async () => {
                const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                const query = vi.fn().mockRejectedValue(new Error('No group with id: 3.'));
                const tabs = fakeTabs({ query, move: vi.fn() });
                const readPlacement = vi.fn().mockResolvedValue('group');
                const parts = { tabs, readPlacement, editor: editorReporting('done'), queue: runningQueue() };
                const subject = new TabPlacer(parts);

                await expect.soft(subject.onTabCreated(newTab)).rejects.toThrow('No group with id: 3.');
                expect(tabs.move).not.toHaveBeenCalled();
              });
            });

            context('and the group is listed', () => {
              context('but it gives the tab no destination', () => {
                it('leaves the tab in place', async () => {
                  const newTab = buildTab({ id: 7, index: 4, url: '', groupId: 3 });
                  const groupTabs = [buildTab({ id: 4, index: 3 }), buildTab({ id: 7, index: 4 })];
                  const tabs = fakeTabs({ query: vi.fn().mockResolvedValue(groupTabs), move: vi.fn() });
                  const readPlacement = vi.fn().mockResolvedValue('group');
                  const parts = { tabs, readPlacement, editor: editorReporting('done'), queue: runningQueue() };
                  const subject = new TabPlacer(parts);

                  await subject.onTabCreated(newTab);

                  expect.soft(tabs.query).toHaveBeenCalledWith({ groupId: 3 });
                  expect(tabs.move).not.toHaveBeenCalled();
                });
              });

              context('and it gives the tab a destination', () => {
                context('but the move rejects', () => {
                  it('rejects with the error', async () => {
                    const newTab = buildTab({ id: 7, index: 3, url: '', groupId: 3 });
                    const groupTabs = [buildTab({ id: 7, index: 3 }), buildTab({ id: 4, index: 4 })];
                    const move = vi.fn().mockRejectedValue(new Error('Invalid tab index: 4.'));
                    const tabs = fakeTabs({ query: vi.fn().mockResolvedValue(groupTabs), move });
                    const readPlacement = vi.fn().mockResolvedValue('group');
                    const parts = { tabs, readPlacement, editor: editorReporting('done'), queue: runningQueue() };
                    const subject = new TabPlacer(parts);

                    await expect(subject.onTabCreated(newTab)).rejects.toThrow('Invalid tab index: 4.');
                  });
                });

                context('and the move resolves', () => {
                  it('moves it to the end of its group', async () => {
                    const newTab = buildTab({ id: 7, index: 3, url: '', groupId: 3 });
                    const groupTabs = [buildTab({ id: 7, index: 3 }), buildTab({ id: 4, index: 4 })];
                    const move = vi.fn().mockResolvedValue(undefined);
                    const tabs = fakeTabs({ query: vi.fn().mockResolvedValue(groupTabs), move, ungroup: vi.fn() });
                    const readPlacement = vi.fn().mockResolvedValue('group');
                    const parts = { tabs, readPlacement, editor: editorReporting('done'), queue: runningQueue() };
                    const subject = new TabPlacer(parts);

                    await subject.onTabCreated(newTab);

                    expect.soft(tabs.move).toHaveBeenCalledExactlyOnceWith(7, { index: 4 });
                    expect(tabs.ungroup).not.toHaveBeenCalled();
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
