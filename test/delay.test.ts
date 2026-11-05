import { delay } from '../src/delay';

describe('delay', () => {
  describe('delay', () => {
    context('when less than the delay has passed', () => {
      it('is still pending', async () => {
        vi.useFakeTimers();
        const onResolved = vi.fn();

        void delay(100).then(onResolved);
        await vi.advanceTimersByTimeAsync(99);

        expect(onResolved).not.toHaveBeenCalled();
      });
    });

    context('when exactly the delay has passed', () => {
      it('resolves', async () => {
        vi.useFakeTimers();
        const onResolved = vi.fn();

        void delay(100).then(onResolved);
        await vi.advanceTimersByTimeAsync(100);

        expect(onResolved).toHaveBeenCalledOnce();
      });
    });
  });
});
