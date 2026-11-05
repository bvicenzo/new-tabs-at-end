// Runs tasks one at a time, in the order they were queued: tabs opened together keep their order at the end.
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();

  // A task starts once every earlier one has settled; one that fails does not hold up the ones behind it.
  run<Outcome>(task: () => Promise<Outcome>): Promise<Outcome> {
    const outcome = this.tail.then(task);

    this.tail = outcome.catch(() => undefined);

    return outcome;
  }
}
