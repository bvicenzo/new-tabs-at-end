import { describe } from 'vitest';

declare global {
  // `context` reads as in RSpec: `describe` names what is tested, `context` names a state.
  var context: typeof describe;
}

globalThis.context = describe;
