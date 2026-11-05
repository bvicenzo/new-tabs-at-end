import type { TSESTree } from '@typescript-eslint/utils';

import { containsCall, iterationBody } from '../../utils/iteration';
import { callNamed, firstCall, parseProgram } from '../support/parse';

describe('utils/iteration', () => {
  describe('iterationBody', () => {
    context('when the node is neither a loop nor a call', () => {
      it('returns null', () => {
        const [declaration] = parseProgram('const tabs = [];').body;

        expect(iterationBody(declaration, ['forEach'])).toBeNull();
      });
    });

    context('when the node is a loop', () => {
      context('and it is a for statement', () => {
        it('returns its body', () => {
          const [loop] = parseProgram('for (let position = 0; position < 3; position++) { close(position); }').body;

          expect(iterationBody(loop, ['forEach'])).toBe((loop as TSESTree.ForStatement).body);
        });
      });

      context('and it is a for…of statement', () => {
        it('returns its body', () => {
          const [loop] = parseProgram('for (const tab of tabs) { close(tab); }').body;

          expect(iterationBody(loop, ['forEach'])).toBe((loop as TSESTree.ForOfStatement).body);
        });
      });

      context('and it is a for…in statement', () => {
        it('returns its body', () => {
          const [loop] = parseProgram('for (const tabId in tabsById) { close(tabId); }').body;

          expect(iterationBody(loop, ['forEach'])).toBe((loop as TSESTree.ForInStatement).body);
        });
      });

      context('and it is a while statement', () => {
        it('returns its body', () => {
          const [loop] = parseProgram('while (tabs.length) { close(tabs.pop()); }').body;

          expect(iterationBody(loop, ['forEach'])).toBe((loop as TSESTree.WhileStatement).body);
        });
      });

      context('and it is a do…while statement', () => {
        it('returns its body', () => {
          const [loop] = parseProgram('do { close(tabs.pop()); } while (tabs.length);').body;

          expect(iterationBody(loop, ['forEach'])).toBe((loop as TSESTree.DoWhileStatement).body);
        });
      });
    });

    context('when the node is a call', () => {
      context('but its callee is not a member', () => {
        it('returns null', () => {
          const call = firstCall(parseProgram('forEach((tab) => close(tab));'));

          expect(iterationBody(call, ['forEach'])).toBeNull();
        });
      });

      context('and its callee is a member', () => {
        context('but the member is computed', () => {
          it('returns null', () => {
            const call = firstCall(parseProgram("tabs['forEach']((tab) => close(tab));"));

            expect(iterationBody(call, ['forEach'])).toBeNull();
          });
        });

        context('but the member is private', () => {
          it('returns null', () => {
            const windowClass = 'class Window { #forEach() {} closeAll() { this.#forEach((tab) => close(tab)); } }';
            const call = firstCall(parseProgram(windowClass));

            expect(iterationBody(call, ['forEach'])).toBeNull();
          });
        });

        context('and the member is named', () => {
          context('but the name is not one of the method names', () => {
            it('returns null', () => {
              const call = firstCall(parseProgram('tabs.filter((tab) => close(tab));'));

              expect(iterationBody(call, ['forEach', 'map'])).toBeNull();
            });
          });

          context('and the name is one of the method names', () => {
            context('but the call has no argument', () => {
              it('returns null', () => {
                const call = firstCall(parseProgram('tabs.map();'));

                expect(iterationBody(call, ['forEach', 'map'])).toBeNull();
              });
            });

            context('but its first argument is not an inline function', () => {
              it('returns null', () => {
                const call = firstCall(parseProgram('tabs.map(close);'));

                expect(iterationBody(call, ['forEach', 'map'])).toBeNull();
              });
            });

            context('and its first argument is an arrow function', () => {
              it('returns the argument', () => {
                const call = firstCall(parseProgram('tabs.map((tab) => close(tab));'));
                const [callback] = call.arguments;

                expect(iterationBody(call, ['forEach', 'map'])).toBe(callback);
              });
            });

            context('and its first argument is a function expression', () => {
              it('returns the argument', () => {
                const call = firstCall(parseProgram('tabs.map(function closeTab(tab) { close(tab); });'));
                const [callback] = call.arguments;

                expect(iterationBody(call, ['forEach', 'map'])).toBe(callback);
              });
            });
          });
        });
      });
    });
  });

  describe('containsCall', () => {
    context('when no call in the node satisfies the predicate', () => {
      context('and the node has no call', () => {
        it('returns false', () => {
          const [declaration] = parseProgram('const tabs = [];').body;

          expect(containsCall(declaration, () => true)).toBe(false);
        });
      });

      context('and the node has only calls the predicate rejects', () => {
        it('returns false', () => {
          const [statement] = parseProgram('close(tabs.pop());').body;

          expect(containsCall(statement, () => false)).toBe(false);
        });
      });
    });

    context('when a call in the node satisfies the predicate', () => {
      context('and it is the node itself', () => {
        it('returns true', () => {
          const call = firstCall(parseProgram('close(tab);'));

          expect(containsCall(call, (candidate) => candidate === call)).toBe(true);
        });
      });

      context('and it is nested in a block of the node', () => {
        it('returns true', () => {
          const program = parseProgram('if (ready) { while (pending) { close(tab); } }');
          const closeCall = callNamed(program, 'close');

          expect(containsCall(program, (candidate) => candidate === closeCall)).toBe(true);
        });
      });

      context('and it is inside a function nested in the node', () => {
        it('returns true', () => {
          const program = parseProgram('const closeAll = () => { const closeOne = () => close(tab); };');
          const closeCall = callNamed(program, 'close');

          expect(containsCall(program, (candidate) => candidate === closeCall)).toBe(true);
        });
      });

      context('and it is the receiver of another call', () => {
        it('returns true', () => {
          const program = parseProgram('expect(tab).toBe(createdTab);');
          const expectCall = callNamed(program, 'expect');

          expect(containsCall(firstCall(program), (candidate) => candidate === expectCall)).toBe(true);
        });
      });
    });
  });
});
