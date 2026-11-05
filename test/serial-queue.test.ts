import { SerialQueue } from '../src/serial-queue';

describe('SerialQueue', () => {
  describe('#run', () => {
    context('when no earlier task was queued', () => {
      context('and the task rejects', () => {
        it('rejects with the task error', async () => {
          const subject = new SerialQueue();

          await expect(subject.run(() => Promise.reject(new Error('move refused')))).rejects.toThrow('move refused');
        });
      });

      context('and the task resolves', () => {
        it('resolves with the task value', async () => {
          const subject = new SerialQueue();

          await expect(subject.run(() => Promise.resolve('placed'))).resolves.toBe('placed');
        });
      });
    });

    context('when an earlier task was queued', () => {
      context('but it has not settled yet', () => {
        it('does not start the task', async () => {
          const laterTask = vi.fn().mockResolvedValue('placed');
          const subject = new SerialQueue();

          void subject.run(() => new Promise<never>(() => undefined));
          void subject.run(laterTask);
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(laterTask).not.toHaveBeenCalled();
        });
      });

      context('and it rejected', () => {
        it('starts the task and resolves with its value', async () => {
          const subject = new SerialQueue();

          const earlierPlacement = subject.run(() => Promise.reject(new Error('move refused')));
          const laterPlacement = subject.run(() => Promise.resolve('placed'));

          await expect.soft(earlierPlacement).rejects.toThrow('move refused');
          await expect(laterPlacement).resolves.toBe('placed');
        });
      });

      context('and it resolved', () => {
        it('starts the task and resolves with its value', async () => {
          const subject = new SerialQueue();

          const earlierPlacement = subject.run(() => Promise.resolve('moved'));
          const laterPlacement = subject.run(() => Promise.resolve('placed'));

          await expect.soft(earlierPlacement).resolves.toBe('moved');
          await expect(laterPlacement).resolves.toBe('placed');
        });
      });
    });
  });
});
