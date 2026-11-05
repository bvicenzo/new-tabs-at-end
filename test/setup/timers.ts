// An example that fakes timers gets the real ones back afterwards, so no test file needs a hook for it.
afterEach(() => {
  vi.useRealTimers();
});
