import { TabEditor } from '../src/tab-editor';
import { refusedThenAccepted } from './support/fakes';

describe('TabEditor', () => {
  describe('#edit', () => {
    context('when Chrome refuses the edition', () => {
      context('and the tab is closed', () => {
        it('is closed', async () => {
          const edition = vi.fn().mockRejectedValue(new Error('No tab with id: 7.'));
          const wait = vi.fn().mockResolvedValue(undefined);
          const subject = new TabEditor(wait);

          const outcome = await subject.edit(7, edition);

          expect.soft(wait).not.toHaveBeenCalled();
          expect(outcome).toBe('closed');
        });
      });

      context('and the refusal is unexpected', () => {
        it('rejects with the error', async () => {
          const edition = vi.fn().mockRejectedValue(new Error('Invalid tab index: 99.'));
          const subject = new TabEditor(vi.fn());

          await expect(subject.edit(7, edition)).rejects.toThrow('Invalid tab index: 99.');
        });
      });

      context('and a tab is being dragged', () => {
        context('and the drag outlasts every attempt', () => {
          it('gives up after 20 attempts 100 ms apart, with a warning', async () => {
            const dragRefusal = new Error('Tabs cannot be edited right now (user may be dragging a tab).');
            const edition = vi.fn().mockRejectedValue(dragRefusal);
            const wait = vi.fn().mockResolvedValue(undefined);
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const subject = new TabEditor(wait);

            const outcome = await subject.edit(7, edition);

            expect.soft(edition).toHaveBeenCalledTimes(20);
            expect.soft(wait).toHaveBeenCalledTimes(19);
            expect.soft(wait).toHaveBeenCalledWith(100);
            expect.soft(warn).toHaveBeenCalledWith('Gave up editing tab 7 after 20 attempts: a tab was being dragged.');
            expect(outcome).toBe('gaveUp');
          });
        });

        context('and the next attempt finds the tab closed', () => {
          it('is closed', async () => {
            const dragRefusal = new Error('Tabs cannot be edited right now (user may be dragging a tab).');
            const edition = vi
              .fn()
              .mockRejectedValueOnce(dragRefusal)
              .mockRejectedValueOnce(new Error('No tab with id: 7.'));
            const subject = new TabEditor(vi.fn().mockResolvedValue(undefined));

            await expect(subject.edit(7, edition)).resolves.toBe('closed');
          });
        });

        context('and the next attempt is refused unexpectedly', () => {
          it('rejects with the error', async () => {
            const dragRefusal = new Error('Tabs cannot be edited right now (user may be dragging a tab).');
            const edition = vi
              .fn()
              .mockRejectedValueOnce(dragRefusal)
              .mockRejectedValueOnce(new Error('Invalid tab index: 99.'));
            const subject = new TabEditor(vi.fn().mockResolvedValue(undefined));

            await expect(subject.edit(7, edition)).rejects.toThrow('Invalid tab index: 99.');
          });
        });

        context('and the drag ends before the last attempt', () => {
          it('is done after waiting 100 ms', async () => {
            const dragRefusal = new Error('Tabs cannot be edited right now (user may be dragging a tab).');
            const edition = refusedThenAccepted(dragRefusal, 1);
            const wait = vi.fn().mockResolvedValue(undefined);
            const subject = new TabEditor(wait);

            const outcome = await subject.edit(7, edition);

            expect.soft(edition).toHaveBeenCalledTimes(2);
            expect.soft(wait).toHaveBeenCalledExactlyOnceWith(100);
            expect(outcome).toBe('done');
          });
        });

        context('and the drag ends on the last attempt', () => {
          it('is done on the 20th attempt', async () => {
            const dragRefusal = new Error('Tabs cannot be edited right now (user may be dragging a tab).');
            const edition = refusedThenAccepted(dragRefusal, 19);
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            const subject = new TabEditor(vi.fn().mockResolvedValue(undefined));

            const outcome = await subject.edit(7, edition);

            expect.soft(edition).toHaveBeenCalledTimes(20);
            expect.soft(warn).not.toHaveBeenCalled();
            expect(outcome).toBe('done');
          });
        });
      });
    });

    context('when Chrome accepts the edition', () => {
      it('is done', async () => {
        const edition = vi.fn().mockResolvedValue(undefined);
        const subject = new TabEditor(vi.fn());

        const outcome = await subject.edit(7, edition);

        expect.soft(edition).toHaveBeenCalledOnce();
        expect(outcome).toBe('done');
      });
    });
  });
});
