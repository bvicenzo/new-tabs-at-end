import { PlacedTabMemory } from '../src/placed-tab-memory';
import { fakeStorage } from './support/fakes';

describe('PlacedTabMemory', () => {
  describe('#remember', () => {
    context('when the storage refuses the write', () => {
      it('rejects with the error', async () => {
        const sessionStorage = fakeStorage({ set: vi.fn().mockRejectedValue(new Error('QUOTA_BYTES quota exceeded')) });
        const subject = new PlacedTabMemory(sessionStorage);

        await expect(subject.remember({ tabId: 7, sourceGroupId: 3 })).rejects.toThrow('QUOTA_BYTES quota exceeded');
      });
    });

    context('when the storage accepts the write', () => {
      it('stores the tab as the last placed one', async () => {
        const set = vi.fn().mockResolvedValue(undefined);
        const subject = new PlacedTabMemory(fakeStorage({ set }));

        await subject.remember({ tabId: 7, sourceGroupId: 3 });

        expect(set).toHaveBeenCalledExactlyOnceWith({ lastPlacedTab: { tabId: 7, sourceGroupId: 3 } });
      });
    });
  });

  describe('#recall', () => {
    context('when the storage cannot be read', () => {
      it('rejects with the error', async () => {
        const sessionStorage = fakeStorage({ get: vi.fn().mockRejectedValue(new Error('Access to storage denied.')) });
        const subject = new PlacedTabMemory(sessionStorage);

        await expect(subject.recall()).rejects.toThrow('Access to storage denied.');
      });
    });

    context('when the storage is read', () => {
      context('but nothing is stored', () => {
        it('is nothing', async () => {
          const subject = new PlacedTabMemory(fakeStorage({ get: vi.fn().mockResolvedValue({}) }));

          await expect(subject.recall()).resolves.toBeNull();
        });
      });

      context('and something is stored', () => {
        context('but it is null', () => {
          it('is nothing', async () => {
            const get = vi.fn().mockResolvedValue({ lastPlacedTab: null });
            const subject = new PlacedTabMemory(fakeStorage({ get }));

            await expect(subject.recall()).resolves.toBeNull();
          });
        });

        context('but it is not an object', () => {
          it('is nothing', async () => {
            const subject = new PlacedTabMemory(fakeStorage({ get: vi.fn().mockResolvedValue({ lastPlacedTab: 7 }) }));

            await expect(subject.recall()).resolves.toBeNull();
          });
        });

        context('and it is an object', () => {
          context('but its tab id is not a number', () => {
            it('is nothing', async () => {
              const storedTab = { tabId: '7', sourceGroupId: 3 };
              const get = vi.fn().mockResolvedValue({ lastPlacedTab: storedTab });
              const subject = new PlacedTabMemory(fakeStorage({ get }));

              await expect(subject.recall()).resolves.toBeNull();
            });
          });

          context('and its tab id is a number', () => {
            context('but its source group id is not a number', () => {
              it('is nothing', async () => {
                const storedTab = { tabId: 7 };
                const get = vi.fn().mockResolvedValue({ lastPlacedTab: storedTab });
                const subject = new PlacedTabMemory(fakeStorage({ get }));

                await expect(subject.recall()).resolves.toBeNull();
              });
            });

            context('and its source group id is a number', () => {
              it('is the remembered tab', async () => {
                const get = vi.fn().mockResolvedValue({ lastPlacedTab: { tabId: 7, sourceGroupId: 3 } });
                const subject = new PlacedTabMemory(fakeStorage({ get }));

                const placedTab = await subject.recall();

                expect.soft(get).toHaveBeenCalledWith('lastPlacedTab');
                expect(placedTab).toEqual({ tabId: 7, sourceGroupId: 3 });
              });
            });
          });
        });
      });
    });
  });
});
