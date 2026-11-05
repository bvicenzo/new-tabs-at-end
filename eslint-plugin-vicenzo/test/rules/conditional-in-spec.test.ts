import conditionalInSpec from '../../rules/conditional-in-spec';
import { lintWithRule } from '../support/lint';

describe('vicenzo/conditional-in-spec', () => {
  describe('offense detection', () => {
    context('when the code has no conditional', () => {
      context('and it combines values with &&', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, 'const isReady = tab.active && tab.loaded;');

          expect(messages).toEqual([]);
        });
      });

      context('and it combines values with ||', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, "const title = tab.title || 'New tab';");

          expect(messages).toEqual([]);
        });
      });

      context('and it combines values with ??', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, "const title = tab.title ?? 'New tab';");

          expect(messages).toEqual([]);
        });
      });

      context('and it declares a conditional type', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, 'type TabIdOf<T> = T extends Tab ? number : never;');

          expect(messages).toEqual([]);
        });
      });

      context('and it reads a property through optional chaining', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, 'const title = tab?.title;');

          expect(messages).toEqual([]);
        });
      });

      context('and it assigns through &&=', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, "tab.title &&= 'Pinned';");

          expect(messages).toEqual([]);
        });
      });

      context('and it assigns through ||=', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, "tab.title ||= 'New tab';");

          expect(messages).toEqual([]);
        });
      });

      context('and it assigns through ??=', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, "tab.title ??= 'New tab';");

          expect(messages).toEqual([]);
        });
      });

      context('and it catches an error with try/catch', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, 'try { close(tab); } catch (error) { log(error); }');

          expect(messages).toEqual([]);
        });
      });

      context('and it calls skipIf on something that is not a test block', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, "flags.skipIf(isCi)('moves the tab', () => {});");

          expect(messages).toEqual([]);
        });
      });

      context('and it calls skipIf on a test block through a computed member', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(conditionalInSpec, "it['skipIf'](isCi)('moves the tab', () => {});");

          expect(messages).toEqual([]);
        });
      });
    });

    context('when the code has a conditional', () => {
      context('and it is an if statement', () => {
        context('and it is at module scope', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, 'if (ready) start();');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 1 })]);
          });
        });

        context('and it is in the callback of a group', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "describe('TabPlacer', () => { if (ready) start(); });");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 31 })]);
          });
        });

        context('and it is in the callback of an example', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "it('moves the tab', () => { if (ready) start(); });");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 29 })]);
          });
        });

        context('and it is in the callback of a hook', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, 'beforeEach(() => { if (ready) start(); });');

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 20 })]);
          });
        });

        context('and it is in a function declared outside any test block', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, 'function prepare() { if (ready) start(); }');

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 22 })]);
          });
        });
      });

      context('and it is a ternary', () => {
        context('and it is at module scope', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "const title = ready ? 'Ready' : 'Loading';");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 15 })]);
          });
        });

        context('and it is in the title argument of an example', () => {
          it('reports the conditional', () => {
            const testSource = "it(ready ? 'moves the tab' : 'keeps the tab', () => {});";
            const messages = lintWithRule(conditionalInSpec, testSource);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 4 })]);
          });
        });

        context('and it is in the callback of a group', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "describe('TabPlacer', () => ready ? start() : stop());");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 29 })]);
          });
        });

        context('and it is in the callback of an example', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "it('moves the tab', () => ready ? start() : stop());");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 27 })]);
          });
        });

        context('and it is in the callback of a hook', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, 'beforeEach(() => ready ? start() : stop());');

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 18 })]);
          });
        });

        context('and it is in a function declared outside any test block', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, 'function prepare() { return ready ? start() : stop(); }');

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 29 })]);
          });
        });
      });

      context('and it is a switch statement', () => {
        context('and it is at module scope', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "switch (state) { case 'ready': start(); }");

            expect(messages).toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 1 })]);
          });
        });

        context('and it is in the callback of a group', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "describe('TabPlacer', () => { switch (state) {} });");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 31 })]);
          });
        });

        context('and it is in the callback of an example', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "it('moves the tab', () => { switch (state) {} });");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 29 })]);
          });
        });

        context('and it is in the callback of a hook', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, 'beforeEach(() => { switch (state) {} });');

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 20 })]);
          });
        });

        context('and it is in a function declared outside any test block', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, 'function prepare() { switch (state) {} }');

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 22 })]);
          });
        });
      });

      context('and it is a skipIf on a test block', () => {
        context('and it is at module scope', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "it.skipIf(isCi)('moves the tab', () => {});");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 1 })]);
          });
        });

        context('and it is in the callback of a group', () => {
          it('reports the conditional', () => {
            const skippedInGroup = "describe('TabPlacer', () => { it.skipIf(isCi)('moves', () => {}); });";
            const messages = lintWithRule(conditionalInSpec, skippedInGroup);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 31 })]);
          });
        });

        context('and it is in the callback of an example', () => {
          it('reports the conditional', () => {
            const skippedInExample = "it('moves the tab', () => { it.skipIf(isCi)('moves', () => {}); });";
            const messages = lintWithRule(conditionalInSpec, skippedInExample);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 29 })]);
          });
        });

        context('and it is in the callback of a hook', () => {
          it('reports the conditional', () => {
            const skippedInHook = "beforeEach(() => { it.skipIf(isCi)('moves', () => {}); });";
            const messages = lintWithRule(conditionalInSpec, skippedInHook);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 20 })]);
          });
        });

        context('and it is in a function declared outside any test block', () => {
          it('reports the conditional', () => {
            const skippedInFunction = "function register() { it.skipIf(isCi)('moves', () => {}); }";
            const messages = lintWithRule(conditionalInSpec, skippedInFunction);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 23 })]);
          });
        });
      });

      context('and it is a runIf on a test block', () => {
        context('and it is at module scope', () => {
          it('reports the conditional', () => {
            const messages = lintWithRule(conditionalInSpec, "describe.runIf(isCi)('TabPlacer', () => {});");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 1 })]);
          });
        });

        context('and it is in the callback of a group', () => {
          it('reports the conditional', () => {
            const runOnlyInGroup = "describe('TabPlacer', () => { it.runIf(isCi)('moves', () => {}); });";
            const messages = lintWithRule(conditionalInSpec, runOnlyInGroup);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 31 })]);
          });
        });

        context('and it is in the callback of an example', () => {
          it('reports the conditional', () => {
            const runOnlyInExample = "it('moves the tab', () => { it.runIf(isCi)('moves', () => {}); });";
            const messages = lintWithRule(conditionalInSpec, runOnlyInExample);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 29 })]);
          });
        });

        context('and it is in the callback of a hook', () => {
          it('reports the conditional', () => {
            const testSource = "beforeEach(() => { it.runIf(isCi)('moves', () => {}); });";
            const messages = lintWithRule(conditionalInSpec, testSource);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 20 })]);
          });
        });

        context('and it is in a function declared outside any test block', () => {
          it('reports the conditional', () => {
            const runOnlyInFunction = "function register() { it.runIf(isCi)('moves', () => {}); }";
            const messages = lintWithRule(conditionalInSpec, runOnlyInFunction);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 23 })]);
          });
        });
      });
    });

    context('when conditionals are combined', () => {
      context('and an if has an else branch', () => {
        it('reports one problem', () => {
          const messages = lintWithRule(conditionalInSpec, 'if (ready) start(); else stop();');

          expect(messages).toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 1 })]);
        });
      });

      context('and an if has an else if branch', () => {
        it('reports each conditional', () => {
          const messages = lintWithRule(conditionalInSpec, 'if (ready) start(); else if (loading) wait();');

          const ifReport = { messageId: 'conditionalInSpec', line: 1, column: 1 };
          const elseIfReport = { messageId: 'conditionalInSpec', line: 1, column: 26 };

          expect(messages).toMatchObject([ifReport, elseIfReport]);
        });
      });

      context('and a ternary is nested in another ternary', () => {
        it('reports each conditional', () => {
          const nestedTernary = "const title = ready ? 'Ready' : loading ? 'Loading' : 'Idle';";
          const messages = lintWithRule(conditionalInSpec, nestedTernary);

          const outerTernaryReport = { messageId: 'conditionalInSpec', line: 1, column: 15 };
          const innerTernaryReport = { messageId: 'conditionalInSpec', line: 1, column: 33 };

          expect(messages).toMatchObject([outerTernaryReport, innerTernaryReport]);
        });
      });

      context('and a ternary is inside an if', () => {
        it('reports each conditional', () => {
          const messages = lintWithRule(conditionalInSpec, 'if (ready) open(pinned ? first : last);');

          const ifReport = { messageId: 'conditionalInSpec', line: 1, column: 1 };
          const ternaryReport = { messageId: 'conditionalInSpec', line: 1, column: 17 };

          expect(messages).toMatchObject([ifReport, ternaryReport]);
        });
      });

      context('and a switch has several cases', () => {
        it('reports one problem', () => {
          const switchWithCases = "switch (state) { case 'ready': start(); break; default: stop(); }";
          const messages = lintWithRule(conditionalInSpec, switchWithCases);

          expect(messages).toEqual([expect.objectContaining({ messageId: 'conditionalInSpec', line: 1, column: 1 })]);
        });
      });

      context('and a modifier precedes skipIf', () => {
        it('reports one problem', () => {
          const messages = lintWithRule(conditionalInSpec, "it.concurrent.skipIf(isCi)('moves the tab', () => {});");

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 1 })]);
        });
      });

      context('and a table follows skipIf', () => {
        it('reports one problem', () => {
          const messages = lintWithRule(conditionalInSpec, "it.skipIf(isCi).each([1, 2])('moves tab %s', () => {});");

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'conditionalRegistration', line: 1, column: 1 })]);
        });
      });
    });
  });
});
