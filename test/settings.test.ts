import { readPlacement, writePlacement } from '../src/settings';
import { fakeStorage } from './support/fakes';

describe('settings', () => {
  describe('readPlacement', () => {
    context('when the storage cannot be read', () => {
      it('falls back to the end of the window with a warning', async () => {
        const readFailure = new Error('QUOTA_BYTES quota exceeded');
        const syncStorage = fakeStorage({ get: vi.fn().mockRejectedValue(readFailure) });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const placement = await readPlacement(syncStorage);

        expect.soft(placement).toBe('window');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not read the placement setting'), readFailure);
      });
    });

    context('when the storage is read', () => {
      context('but it holds no placement', () => {
        it('reads as the end of the window', async () => {
          const syncStorage = fakeStorage({ get: vi.fn().mockResolvedValue({}) });

          await expect(readPlacement(syncStorage)).resolves.toBe('window');
        });
      });

      context('but it holds an unknown placement', () => {
        it('reads as the end of the window', async () => {
          const syncStorage = fakeStorage({ get: vi.fn().mockResolvedValue({ placement: 'nextToOpener' }) });

          await expect(readPlacement(syncStorage)).resolves.toBe('window');
        });
      });

      context('and it holds the end of the window', () => {
        it('reads as the end of the window', async () => {
          const get = vi.fn().mockResolvedValue({ placement: 'window' });

          const placement = await readPlacement(fakeStorage({ get }));

          expect.soft(get).toHaveBeenCalledWith('placement');
          expect(placement).toBe('window');
        });
      });

      context('and it holds the end of the group', () => {
        it('reads as the end of the group', async () => {
          const syncStorage = fakeStorage({ get: vi.fn().mockResolvedValue({ placement: 'group' }) });

          await expect(readPlacement(syncStorage)).resolves.toBe('group');
        });
      });
    });
  });

  describe('writePlacement', () => {
    // no subject: writePlacement is a function of the storage it is given

    context('when the storage refuses the write', () => {
      it('rejects with the error', async () => {
        const writeLimit = new Error('MAX_WRITE_OPERATIONS_PER_MINUTE');
        const syncStorage = fakeStorage({ set: vi.fn().mockRejectedValue(writeLimit) });

        await expect(writePlacement(syncStorage, 'group')).rejects.toThrow('MAX_WRITE_OPERATIONS_PER_MINUTE');
      });
    });

    context('when the storage accepts the write', () => {
      it('stores the placement', async () => {
        const set = vi.fn().mockResolvedValue(undefined);

        await writePlacement(fakeStorage({ set }), 'group');

        expect(set).toHaveBeenCalledExactlyOnceWith({ placement: 'group' });
      });
    });
  });
});
