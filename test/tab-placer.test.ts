import { TabPlacer } from '../src/tab-placer';
import { buildTab } from './support/builders';
import { busyQueue, runningQueue } from './support/fakes';

describe('TabPlacer', () => {
  describe('#onTabCreated', () => {
    context('when the tab is not new', () => {
      it('leaves it alone, without reading the setting or queueing anything', async () => {
        const restoredTab = buildTab({ id: 7, url: 'https://example.com/restored' });
        const readPlacement = vi.fn();
        const mover = { toEndOfWindow: vi.fn(), toEndOfGroup: vi.fn() };
        const queue = busyQueue();
        const subject = new TabPlacer({ readPlacement, mover, memory: { remember: vi.fn() }, queue });

        await subject.onTabCreated(restoredTab);

        expect.soft(readPlacement).not.toHaveBeenCalled();
        expect.soft(mover.toEndOfWindow).not.toHaveBeenCalled();
        expect(queue.run).not.toHaveBeenCalled();
      });
    });

    context('when the tab is new', () => {
      context('but the queue has not run its placement yet', () => {
        it('does not move it yet', async () => {
          const newTab = buildTab({ id: 7, url: '' });
          const mover = { toEndOfWindow: vi.fn(), toEndOfGroup: vi.fn() };
          const queue = busyQueue();
          const subject = new TabPlacer({ readPlacement: vi.fn(), mover, memory: { remember: vi.fn() }, queue });

          await subject.onTabCreated(newTab);

          expect.soft(queue.run).toHaveBeenCalledOnce();
          expect(mover.toEndOfWindow).not.toHaveBeenCalled();
        });
      });

      context('and the queue runs its placement', () => {
        context('and the tab is not in a group', () => {
          context('but the move rejects', () => {
            it('rejects with the error, remembering nothing', async () => {
              const newTab = buildTab({ id: 7, url: '', groupId: -1 });
              const moveRefusal = new Error('Invalid tab index: 99.');
              const mover = { toEndOfWindow: vi.fn().mockRejectedValue(moveRefusal), toEndOfGroup: vi.fn() };
              const memory = { remember: vi.fn() };
              const subject = new TabPlacer({ readPlacement: vi.fn(), mover, memory, queue: runningQueue() });

              await expect.soft(subject.onTabCreated(newTab)).rejects.toThrow('Invalid tab index: 99.');
              expect(memory.remember).not.toHaveBeenCalled();
            });
          });

          context('and the move resolves', () => {
            context('but remembering the tab rejects', () => {
              it('rejects with the error', async () => {
                const newTab = buildTab({ id: 7, url: '', groupId: -1 });
                const mover = { toEndOfWindow: vi.fn().mockResolvedValue(undefined), toEndOfGroup: vi.fn() };
                const memory = { remember: vi.fn().mockRejectedValue(new Error('QUOTA_BYTES quota exceeded')) };
                const subject = new TabPlacer({ readPlacement: vi.fn(), mover, memory, queue: runningQueue() });

                await expect(subject.onTabCreated(newTab)).rejects.toThrow('QUOTA_BYTES quota exceeded');
              });
            });

            context('and remembering the tab resolves', () => {
              it('moves it to the end of the window, remembering it came from no group', async () => {
                const newTab = buildTab({ id: 7, url: '', groupId: -1 });
                const readPlacement = vi.fn();
                const mover = { toEndOfWindow: vi.fn().mockResolvedValue(undefined), toEndOfGroup: vi.fn() };
                const memory = { remember: vi.fn().mockResolvedValue(undefined) };
                const subject = new TabPlacer({ readPlacement, mover, memory, queue: runningQueue() });

                await subject.onTabCreated(newTab);

                expect.soft(mover.toEndOfWindow).toHaveBeenCalledExactlyOnceWith(7, -1);
                expect.soft(mover.toEndOfGroup).not.toHaveBeenCalled();
                expect.soft(readPlacement).not.toHaveBeenCalled();
                expect(memory.remember).toHaveBeenCalledExactlyOnceWith({ tabId: 7, sourceGroupId: -1 });
              });
            });
          });
        });

        context('and the tab is in a group', () => {
          context('and the setting is the end of the window', () => {
            context('but the move rejects', () => {
              it('rejects with the error, remembering nothing', async () => {
                const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                const moveRefusal = new Error('Invalid tab index: 99.');
                const mover = { toEndOfWindow: vi.fn().mockRejectedValue(moveRefusal), toEndOfGroup: vi.fn() };
                const memory = { remember: vi.fn() };
                const readPlacement = vi.fn().mockResolvedValue('window');
                const subject = new TabPlacer({ readPlacement, mover, memory, queue: runningQueue() });

                await expect.soft(subject.onTabCreated(newTab)).rejects.toThrow('Invalid tab index: 99.');
                expect(memory.remember).not.toHaveBeenCalled();
              });
            });

            context('and the move resolves', () => {
              context('but remembering the tab rejects', () => {
                it('rejects with the error', async () => {
                  const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                  const mover = { toEndOfWindow: vi.fn().mockResolvedValue(undefined), toEndOfGroup: vi.fn() };
                  const memory = { remember: vi.fn().mockRejectedValue(new Error('QUOTA_BYTES quota exceeded')) };
                  const readPlacement = vi.fn().mockResolvedValue('window');
                  const subject = new TabPlacer({ readPlacement, mover, memory, queue: runningQueue() });

                  await expect(subject.onTabCreated(newTab)).rejects.toThrow('QUOTA_BYTES quota exceeded');
                });
              });

              context('and remembering the tab resolves', () => {
                it('moves it to the end of the window, remembering its source group', async () => {
                  const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                  const readPlacement = vi.fn().mockResolvedValue('window');
                  const mover = { toEndOfWindow: vi.fn().mockResolvedValue(undefined), toEndOfGroup: vi.fn() };
                  const memory = { remember: vi.fn().mockResolvedValue(undefined) };
                  const subject = new TabPlacer({ readPlacement, mover, memory, queue: runningQueue() });

                  await subject.onTabCreated(newTab);

                  expect.soft(mover.toEndOfWindow).toHaveBeenCalledExactlyOnceWith(7, 3);
                  expect.soft(mover.toEndOfGroup).not.toHaveBeenCalled();
                  expect(memory.remember).toHaveBeenCalledExactlyOnceWith({ tabId: 7, sourceGroupId: 3 });
                });
              });
            });
          });

          context('and the setting is the end of the group', () => {
            context('but the move rejects', () => {
              it('rejects with the error, remembering nothing', async () => {
                const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                const moveRefusal = new Error('Invalid tab index: 99.');
                const mover = { toEndOfGroup: vi.fn().mockRejectedValue(moveRefusal), toEndOfWindow: vi.fn() };
                const memory = { remember: vi.fn() };
                const readPlacement = vi.fn().mockResolvedValue('group');
                const subject = new TabPlacer({ readPlacement, mover, memory, queue: runningQueue() });

                await expect.soft(subject.onTabCreated(newTab)).rejects.toThrow('Invalid tab index: 99.');
                expect(memory.remember).not.toHaveBeenCalled();
              });
            });

            context('and the move resolves', () => {
              context('but remembering the tab rejects', () => {
                it('rejects with the error', async () => {
                  const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                  const mover = { toEndOfGroup: vi.fn().mockResolvedValue(undefined), toEndOfWindow: vi.fn() };
                  const memory = { remember: vi.fn().mockRejectedValue(new Error('QUOTA_BYTES quota exceeded')) };
                  const readPlacement = vi.fn().mockResolvedValue('group');
                  const subject = new TabPlacer({ readPlacement, mover, memory, queue: runningQueue() });

                  await expect(subject.onTabCreated(newTab)).rejects.toThrow('QUOTA_BYTES quota exceeded');
                });
              });

              context('and remembering the tab resolves', () => {
                it('moves it to the end of its group, remembering its source group', async () => {
                  const newTab = buildTab({ id: 7, url: '', groupId: 3 });
                  const readPlacement = vi.fn().mockResolvedValue('group');
                  const mover = { toEndOfGroup: vi.fn().mockResolvedValue(undefined), toEndOfWindow: vi.fn() };
                  const memory = { remember: vi.fn().mockResolvedValue(undefined) };
                  const subject = new TabPlacer({ readPlacement, mover, memory, queue: runningQueue() });

                  await subject.onTabCreated(newTab);

                  expect.soft(mover.toEndOfGroup).toHaveBeenCalledExactlyOnceWith(7, 3);
                  expect.soft(mover.toEndOfWindow).not.toHaveBeenCalled();
                  expect(memory.remember).toHaveBeenCalledExactlyOnceWith({ tabId: 7, sourceGroupId: 3 });
                });
              });
            });
          });
        });
      });
    });
  });
});
