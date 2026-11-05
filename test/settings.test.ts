import { readPlacement } from '../src/settings';
import { fakeStorage } from './support/fakes';

describe('settings', () => {
  describe('readPlacement', () => {
    context('when the storage cannot be read', () => {
      it('falls back to the end of the window with a warning', async () => {
        const readFailure = new Error('QUOTA_BYTES quota exceeded');
        const syncStorage = fakeStorage(vi.fn().mockRejectedValue(readFailure));
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const placement = await readPlacement(syncStorage);

        expect.soft(placement).toBe('window');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not read the placement setting'), readFailure);
      });
    });

    context('when the storage is read', () => {
      context('but it holds no placement', () => {
        it('reads as the end of the window', async () => {
          const syncStorage = fakeStorage(vi.fn().mockResolvedValue({}));

          await expect(readPlacement(syncStorage)).resolves.toBe('window');
        });
      });

      context('but it holds an unknown placement', () => {
        it('reads as the end of the window', async () => {
          const syncStorage = fakeStorage(vi.fn().mockResolvedValue({ placement: 'nextToOpener' }));

          await expect(readPlacement(syncStorage)).resolves.toBe('window');
        });
      });

      context('and it holds the end of the window', () => {
        it('reads as the end of the window', async () => {
          const get = vi.fn().mockResolvedValue({ placement: 'window' });

          const placement = await readPlacement(fakeStorage(get));

          expect.soft(get).toHaveBeenCalledWith('placement');
          expect(placement).toBe('window');
        });
      });

      context('and it holds the end of the group', () => {
        it('reads as the end of the group', async () => {
          const syncStorage = fakeStorage(vi.fn().mockResolvedValue({ placement: 'group' }));

          await expect(readPlacement(syncStorage)).resolves.toBe('group');
        });
      });
    });
  });
});
