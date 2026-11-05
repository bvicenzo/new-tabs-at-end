import { callbackOf, enclosingExample, enclosingGroup, isTableHead, testBlockKind } from '../../utils/test-blocks';
import { calleeCall, callNamed, callTitled, firstCall, lastCall, parseProgram } from '../support/parse';

describe('utils/test-blocks', () => {
  describe('testBlockKind', () => {
    context('when the callee is not rooted at an identifier', () => {
      it('returns null', () => {
        const call = firstCall(parseProgram("this.it('opens a tab', () => {});"));

        expect(testBlockKind(call)).toBeNull();
      });
    });

    context('when the callee is rooted at an identifier', () => {
      context('but the identifier is not a test-block name', () => {
        it('returns null', () => {
          const call = firstCall(parseProgram('vi.fn();'));

          expect(testBlockKind(call)).toBeNull();
        });
      });

      context('and the identifier is a test-block name', () => {
        context('but a parameter of an enclosing function shadows it', () => {
          it('returns null', () => {
            const call = lastCall(parseProgram("it('moves the tab', (context) => { context.skip(); });"));

            expect(testBlockKind(call)).toBeNull();
          });
        });

        context('but a variable declared around the call shadows it', () => {
          it('returns null', () => {
            const call = lastCall(parseProgram("const test = buildFakeRunner(); test('moves the tab');"));

            expect(testBlockKind(call)).toBeNull();
          });
        });

        context('but a variable declared in an enclosing block shadows it', () => {
          it('returns null', () => {
            const call = lastCall(parseProgram("it('moves', () => { const test = fakeRunner(); test('opens'); });"));

            expect(testBlockKind(call)).toBeNull();
          });
        });

        context('but a function declared around the call shadows it', () => {
          it('returns null', () => {
            const call = lastCall(parseProgram("function test() {} test('moves the tab');"));

            expect(testBlockKind(call)).toBeNull();
          });
        });

        context('but a parameter of an enclosing function declaration shadows it', () => {
          it('returns null', () => {
            const call = lastCall(parseProgram("function runWith(test) { test('moves the tab'); }"));

            expect(testBlockKind(call)).toBeNull();
          });
        });

        context('and the callee is the bare identifier', () => {
          context('and the name is describe', () => {
            it('returns describe', () => {
              const call = firstCall(parseProgram("describe('TabPlacer', () => {});"));

              expect(testBlockKind(call)).toBe('describe');
            });
          });

          context('and the name is suite', () => {
            it('returns describe', () => {
              const call = firstCall(parseProgram("suite('TabPlacer', () => {});"));

              expect(testBlockKind(call)).toBe('describe');
            });
          });

          context('and the name is context', () => {
            it('returns context', () => {
              const call = firstCall(parseProgram("context('when the tab is new', () => {});"));

              expect(testBlockKind(call)).toBe('context');
            });
          });

          context('and the name is it', () => {
            it('returns example', () => {
              const call = firstCall(parseProgram("it('moves the tab', () => {});"));

              expect(testBlockKind(call)).toBe('example');
            });
          });

          context('and the name is test', () => {
            it('returns example', () => {
              const call = firstCall(parseProgram("test('moves the tab', () => {});"));

              expect(testBlockKind(call)).toBe('example');
            });
          });

          context('and the name is beforeEach', () => {
            it('returns hook', () => {
              const call = firstCall(parseProgram('beforeEach(() => {});'));

              expect(testBlockKind(call)).toBe('hook');
            });
          });

          context('and the name is afterEach', () => {
            it('returns hook', () => {
              const call = firstCall(parseProgram('afterEach(() => {});'));

              expect(testBlockKind(call)).toBe('hook');
            });
          });

          context('and the name is beforeAll', () => {
            it('returns hook', () => {
              const call = firstCall(parseProgram('beforeAll(() => {});'));

              expect(testBlockKind(call)).toBe('hook');
            });
          });

          context('and the name is afterAll', () => {
            it('returns hook', () => {
              const call = firstCall(parseProgram('afterAll(() => {});'));

              expect(testBlockKind(call)).toBe('hook');
            });
          });
        });

        context('and the callee is a member chain on it', () => {
          context('but a member of the chain is not a test-block modifier', () => {
            it('returns null', () => {
              const call = firstCall(parseProgram('context.onTestFinished(() => {});'));

              expect(testBlockKind(call)).toBeNull();
            });
          });

          context('and the chain has one modifier', () => {
            it('returns the kind of the root', () => {
              const call = firstCall(parseProgram("context.skip('when the tab is new', () => {});"));

              expect(testBlockKind(call)).toBe('context');
            });
          });

          context('and the chain has several modifiers', () => {
            it('returns the kind of the root', () => {
              const call = firstCall(parseProgram("describe.skip.concurrent('TabPlacer', () => {});"));

              expect(testBlockKind(call)).toBe('describe');
            });
          });

          context('but the modifier is read with a computed variable', () => {
            it('returns null', () => {
              const call = firstCall(parseProgram("it[modifier]('moves the tab', () => {});"));

              expect(testBlockKind(call)).toBeNull();
            });
          });

          context('but the modifier is read with a computed expression', () => {
            it('returns null', () => {
              const call = firstCall(parseProgram("it[pickModifier()]('moves the tab', () => {});"));

              expect(testBlockKind(call)).toBeNull();
            });
          });

          context('and the modifier is read with a computed key', () => {
            it('returns the kind of the root', () => {
              const call = firstCall(parseProgram("it['only']('moves the tab', () => {});"));

              expect(testBlockKind(call)).toBe('example');
            });
          });
        });

        context('and the callee is itself a call on it', () => {
          context('but the inner call applies neither a table nor a condition', () => {
            it('returns null', () => {
              const call = firstCall(parseProgram("test.extend({})('moves the tab', () => {});"));

              expect(testBlockKind(call)).toBeNull();
            });
          });

          context('and the inner call applies a table', () => {
            it('returns the kind of the root', () => {
              const call = firstCall(parseProgram("describe.each([1, 2])('TabPlacer %s', () => {});"));

              expect(testBlockKind(call)).toBe('describe');
            });
          });

          context('and the inner call applies a condition', () => {
            it('returns the kind of the root', () => {
              const call = firstCall(parseProgram("it.skipIf(isCi)('moves the tab', () => {});"));

              expect(testBlockKind(call)).toBe('example');
            });
          });
        });

        context('and the callee is a tagged template on it', () => {
          context('but the tag is not a table', () => {
            it('returns null', () => {
              const call = firstCall(parseProgram("it.skip`placement`('moves the tab', () => {});"));

              expect(testBlockKind(call)).toBeNull();
            });
          });

          context('and the tag is a table', () => {
            it('returns the kind of the root', () => {
              const call = firstCall(parseProgram("it.each`placement\n${'endOfWindow'}`('moves the tab', () => {});"));

              expect(testBlockKind(call)).toBe('example');
            });
          });
        });
      });
    });
  });

  describe('callbackOf', () => {
    context('when no argument is a function', () => {
      it('returns null', () => {
        const call = firstCall(parseProgram("it.todo('moves the tab');"));

        expect(callbackOf(call)).toBeNull();
      });
    });

    context('when an argument is a function', () => {
      context('and it is an arrow function right after the title', () => {
        it('returns that arrow function', () => {
          const call = firstCall(parseProgram("describe('TabPlacer', () => {});"));

          expect(callbackOf(call)).toBe(call.arguments[1]);
        });
      });

      context('and it is a function expression right after the title', () => {
        it('returns that function expression', () => {
          const call = firstCall(parseProgram("describe('TabPlacer', function () {});"));

          expect(callbackOf(call)).toBe(call.arguments[1]);
        });
      });

      context('and it comes after an options object', () => {
        it('returns that function', () => {
          const call = firstCall(parseProgram("describe('TabPlacer', { timeout: 100 }, () => {});"));

          expect(callbackOf(call)).toBe(call.arguments[2]);
        });
      });
    });
  });

  describe('enclosingGroup', () => {
    context('when the node is at module scope', () => {
      it('returns null', () => {
        const target = callNamed(parseProgram('target();'), 'target');

        expect(enclosingGroup(target)).toBeNull();
      });
    });

    context('when the node is inside a call', () => {
      context('but only in the title argument of a test group', () => {
        it('returns null', () => {
          const target = callNamed(parseProgram('context(String(target()), () => {});'), 'target');

          expect(enclosingGroup(target)).toBeNull();
        });
      });

      context('and in the callback of a test group', () => {
        it('returns that group', () => {
          const program = parseProgram(`
          context('when the tab is new', () => {
            target();
          });
          `);

          expect(enclosingGroup(callNamed(program, 'target'))).toBe(callTitled(program, 'when the tab is new'));
        });
      });

      context('and in a non-group function inside a test group', () => {
        it('returns that group', () => {
          const program = parseProgram(`
          describe('TabPlacer', () => {
            it('moves the tab', () => {
              target();
            });
          });
          `);

          expect(enclosingGroup(callNamed(program, 'target'))).toBe(callTitled(program, 'TabPlacer'));
        });
      });

      context('and in a function that is not a call argument, inside a test group', () => {
        it('returns that group', () => {
          const program = parseProgram(`
          context('when the tab is new', () => {
            const buildSuite = () => target();
          });
          `);

          expect(enclosingGroup(callNamed(program, 'target'))).toBe(callTitled(program, 'when the tab is new'));
        });
      });

      context('and several groups deep', () => {
        it('returns the closest group', () => {
          const program = parseProgram(`
          describe('TabPlacer', () => {
            context('when the tab is new', () => {
              target();
            });
          });
          `);

          expect(enclosingGroup(callNamed(program, 'target'))).toBe(callTitled(program, 'when the tab is new'));
        });
      });
    });
  });

  describe('isTableHead', () => {
    context('when the call is not the callee of another call', () => {
      context('and its parent is not a call', () => {
        it('returns false', () => {
          const call = firstCall(parseProgram("describe('TabPlacer', () => {});"));

          expect(isTableHead(call)).toBe(false);
        });
      });

      context('and it is an argument of another call', () => {
        it('returns false', () => {
          const call = callNamed(parseProgram("String(describe('TabPlacer', () => {}));"), 'describe');

          expect(isTableHead(call)).toBe(false);
        });
      });
    });

    context('when the call is the callee of another call', () => {
      it('returns true', () => {
        const tableHead = calleeCall(firstCall(parseProgram("describe.each([1, 2])('TabPlacer %s', () => {});")));

        expect(isTableHead(tableHead)).toBe(true);
      });
    });
  });

  describe('enclosingExample', () => {
    context('when no example callback contains the node', () => {
      context('and the node is at module scope', () => {
        it('returns null', () => {
          const target = callNamed(parseProgram('target();'), 'target');

          expect(enclosingExample(target)).toBeNull();
        });
      });

      context('and the node is in a function not passed to a call', () => {
        it('returns null', () => {
          const target = callNamed(parseProgram('const buildTab = () => target();'), 'target');

          expect(enclosingExample(target)).toBeNull();
        });
      });

      context('and the node is in the callback of a group', () => {
        it('returns null', () => {
          const target = callNamed(parseProgram("describe('TabPlacer', () => { target(); });"), 'target');

          expect(enclosingExample(target)).toBeNull();
        });
      });

      context('and the node is in the callback of a hook', () => {
        it('returns null', () => {
          const target = callNamed(parseProgram('beforeEach(() => { target(); });'), 'target');

          expect(enclosingExample(target)).toBeNull();
        });
      });

      context('and the node is in the callback of a call that is not a test block', () => {
        it('returns null', () => {
          const target = callNamed(parseProgram('[1, 2].forEach(() => { target(); });'), 'target');

          expect(enclosingExample(target)).toBeNull();
        });
      });

      context('and the node is in the title argument of an example', () => {
        it('returns null', () => {
          const target = callNamed(parseProgram('it(String(target()), () => {});'), 'target');

          expect(enclosingExample(target)).toBeNull();
        });
      });
    });

    context('when an example callback contains the node', () => {
      context('and the node is directly in that callback', () => {
        it('returns that call', () => {
          const program = parseProgram("it('moves the tab', () => { target(); });");

          expect(enclosingExample(callNamed(program, 'target'))).toBe(callTitled(program, 'moves the tab'));
        });
      });

      context('and the node is in a plain function within that callback', () => {
        it('returns that call', () => {
          const program = parseProgram(`
          it('moves the tab', () => {
            [1, 2].forEach(() => target());
          });
          `);

          expect(enclosingExample(callNamed(program, 'target'))).toBe(callTitled(program, 'moves the tab'));
        });
      });

      context('and the node is in a group within that callback', () => {
        it('returns that call', () => {
          const program = parseProgram(`
          it('moves the tab', () => {
            describe('TabPlacer', () => { target(); });
          });
          `);

          expect(enclosingExample(callNamed(program, 'target'))).toBe(callTitled(program, 'moves the tab'));
        });
      });

      context('and the node is in another example within that callback', () => {
        it('returns the closest example', () => {
          const program = parseProgram(`
          it('moves the tab', () => {
            it('keeps the group', () => { target(); });
          });
          `);

          expect(enclosingExample(callNamed(program, 'target'))).toBe(callTitled(program, 'keeps the group'));
        });
      });
    });
  });
});
