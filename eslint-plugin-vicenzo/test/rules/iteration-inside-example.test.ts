import iterationInsideExample from '../../rules/iteration-inside-example';
import { lintWithRule } from '../support/lint';

describe('vicenzo/iteration-inside-example', () => {
  describe('offense detection', () => {
    context('when the iteration is not inside an example', () => {
      context('and it iterates in the callback of a group', () => {
        it('reports nothing', () => {
          const groupIteration = "describe('TabPlacer', () => { tabs.forEach((tab) => expect(tab).toBeDefined()); });";
          const messages = lintWithRule(iterationInsideExample, groupIteration);

          expect(messages).toEqual([]);
        });
      });

      context('and the expect is in an example the iteration registers', () => {
        it('reports nothing', () => {
          const generatedExamples = "tabs.forEach((tab) => it('opens the tab', () => expect(tab).toBeDefined()));";
          const messages = lintWithRule(iterationInsideExample, generatedExamples);

          expect(messages).toEqual([]);
        });
      });
    });

    context('when the iteration is inside an example', () => {
      context('but its method is not one that iterates', () => {
        it('reports nothing', () => {
          const filterAsserting = "it('moves', () => { tabs.filter((tab) => expect(tab).toBeDefined()); });";
          const messages = lintWithRule(iterationInsideExample, filterAsserting);

          expect(messages).toEqual([]);
        });
      });

      context('and it is a forEach call', () => {
        context('but its callback calls no assertion', () => {
          it('reports nothing', () => {
            const forEachClosing = "it('moves', () => { tabs.forEach((tab) => close(tab)); });";
            const messages = lintWithRule(iterationInsideExample, forEachClosing);

            expect(messages).toEqual([]);
          });
        });

        context('and its callback calls an assertion', () => {
          it('reports the iteration', () => {
            const forEachAsserting = "it('moves', () => { tabs.forEach((tab) => expect(tab).toBeDefined()); });";
            const messages = lintWithRule(iterationInsideExample, forEachAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it is a map call', () => {
        context('but its callback calls no assertion', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(iterationInsideExample, "it('moves', () => { tabs.map((tab) => tab.id); });");

            expect(messages).toEqual([]);
          });
        });

        context('and its callback calls an assertion', () => {
          it('reports the iteration', () => {
            const mapAsserting = "it('moves', () => { tabs.map((tab) => expect(tab).toBeDefined()); });";
            const messages = lintWithRule(iterationInsideExample, mapAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it is a flatMap call', () => {
        context('but its callback calls no assertion', () => {
          it('reports nothing', () => {
            const flatMapCollecting = "it('moves', () => { groups.flatMap((group) => group.tabs); });";
            const messages = lintWithRule(iterationInsideExample, flatMapCollecting);

            expect(messages).toEqual([]);
          });
        });

        context('and its callback calls an assertion', () => {
          it('reports the iteration', () => {
            const flatMapAsserting = "it('moves', () => { groups.flatMap((group) => expect(group).toBeDefined()); });";
            const messages = lintWithRule(iterationInsideExample, flatMapAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it is an every call', () => {
        context('but its callback calls no assertion', () => {
          it('reports nothing', () => {
            const everyChecking = "it('moves', () => { tabs.every((tab) => tab.pinned); });";
            const messages = lintWithRule(iterationInsideExample, everyChecking);

            expect(messages).toEqual([]);
          });
        });

        context('and its callback calls an assertion', () => {
          it('reports the iteration', () => {
            const everyAsserting = "it('moves', () => { tabs.every((tab) => expect(tab).toBeDefined()); });";
            const messages = lintWithRule(iterationInsideExample, everyAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it is a some call', () => {
        context('but its callback calls no assertion', () => {
          it('reports nothing', () => {
            const someChecking = "it('moves', () => { tabs.some((tab) => tab.pinned); });";
            const messages = lintWithRule(iterationInsideExample, someChecking);

            expect(messages).toEqual([]);
          });
        });

        context('and its callback calls an assertion', () => {
          it('reports the iteration', () => {
            const someAsserting = "it('moves', () => { tabs.some((tab) => expect(tab).toBeDefined()); });";
            const messages = lintWithRule(iterationInsideExample, someAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it is a for statement', () => {
        context('but its body calls no assertion', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(iterationInsideExample, "it('moves', () => { for (;;) close(tab); });");

            expect(messages).toEqual([]);
          });
        });

        context('and its body calls an assertion', () => {
          it('reports the iteration', () => {
            const forClosing = "it('moves', () => { for (;;) expect(tab).toBeDefined(); });";
            const messages = lintWithRule(iterationInsideExample, forClosing);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it is a for…of statement', () => {
        context('but its body calls no assertion', () => {
          it('reports nothing', () => {
            const forAsserting = "it('moves', () => { for (const tab of tabs) close(tab); });";
            const messages = lintWithRule(iterationInsideExample, forAsserting);

            expect(messages).toEqual([]);
          });
        });

        context('and its body calls an assertion', () => {
          it('reports the iteration', () => {
            const forOfAsserting = "it('moves', () => { for (const tab of tabs) expect(tab).toBeDefined(); });";
            const messages = lintWithRule(iterationInsideExample, forOfAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it is a for…in statement', () => {
        context('but its body calls no assertion', () => {
          it('reports nothing', () => {
            const forOfClosing = "it('moves', () => { for (const tabId in tabsById) close(tabId); });";
            const messages = lintWithRule(iterationInsideExample, forOfClosing);

            expect(messages).toEqual([]);
          });
        });

        context('and its body calls an assertion', () => {
          it('reports the iteration', () => {
            const forInAsserting = "it('moves', () => { for (const tabId in tabsById) expect(tabId).toBeDefined(); });";
            const messages = lintWithRule(iterationInsideExample, forInAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it is a while statement', () => {
        context('but its body calls no assertion', () => {
          it('reports nothing', () => {
            const testSource = "it('moves', () => { while (pending) close(tab); });";
            const messages = lintWithRule(iterationInsideExample, testSource);

            expect(messages).toEqual([]);
          });
        });

        context('and its body calls an assertion', () => {
          it('reports the iteration', () => {
            const whileAsserting = "it('moves', () => { while (pending) expect(tab).toBeDefined(); });";
            const messages = lintWithRule(iterationInsideExample, whileAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it is a do…while statement', () => {
        context('but its body calls no assertion', () => {
          it('reports nothing', () => {
            const whileClosing = "it('moves', () => { do close(tab); while (pending); });";
            const messages = lintWithRule(iterationInsideExample, whileClosing);

            expect(messages).toEqual([]);
          });
        });

        context('and its body calls an assertion', () => {
          it('reports the iteration', () => {
            const doWhileAsserting = "it('moves', () => { do expect(tab).toBeDefined(); while (pending); });";
            const messages = lintWithRule(iterationInsideExample, doWhileAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
          });
        });
      });

      context('and it nests iterations', () => {
        context('but only the outer iteration calls an assertion', () => {
          it('reports one problem', () => {
            const outerAsserting = `
            it('moves', () => {
              groups.forEach((group) => {
                group.tabs.map((tab) => tab.id);
                expect(group).toBeDefined();
              });
            });
            `;
            const messages = lintWithRule(iterationInsideExample, outerAsserting);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 3, column: 15 })]);
          });
        });

        context('and the inner iteration calls an assertion', () => {
          it('reports two problems', () => {
            const innerAsserting = `
            it('moves', () => {
              groups.forEach((group) => {
                group.tabs.forEach((tab) => expect(tab).toBeDefined());
              });
            });
            `;
            const messages = lintWithRule(iterationInsideExample, innerAsserting);

            const outerIterationReport = { messageId: 'iterationInsideExample', line: 3, column: 15 };
            const innerIterationReport = { messageId: 'iterationInsideExample', line: 4, column: 17 };

            expect(messages).toMatchObject([outerIterationReport, innerIterationReport]);
          });
        });
      });

      context('and its iteration calls several assertions', () => {
        it('reports one problem', () => {
          const severalAssertions = `
          it('moves', () => {
            tabs.forEach((tab) => {
              expect(tab).toBeDefined();
              expect.soft(tab.index).toBe(0);
            });
          });
          `;
          const messages = lintWithRule(iterationInsideExample, severalAssertions);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 3, column: 13 })]);
        });
      });
    });

    context('when an iteration inside an example makes a call', () => {
      context('but the call is assert', () => {
        it('reports nothing', () => {
          const assertCalling = "it('moves', () => { tabs.forEach((tab) => assert(tab)); });";
          const messages = lintWithRule(iterationInsideExample, assertCalling);

          expect(messages).toEqual([]);
        });
      });

      context('but the call is expectTypeOf', () => {
        it('reports nothing', () => {
          const typeAssertion = "it('moves', () => { tabs.forEach((tab) => expectTypeOf(tab).toBeObject()); });";
          const messages = lintWithRule(iterationInsideExample, typeAssertion);

          expect(messages).toEqual([]);
        });
      });

      context('but the call is an asymmetric matcher of expect', () => {
        it('reports nothing', () => {
          const matcherBuilding = "it('moves', () => { tabs.forEach((tab) => expect.objectContaining(tab)); });";
          const messages = lintWithRule(iterationInsideExample, matcherBuilding);

          expect(messages).toEqual([]);
        });
      });

      context('but the call is expect.assertions', () => {
        it('reports nothing', () => {
          const assertionCount = "it('moves', () => { tabs.forEach(() => expect.assertions(1)); });";
          const messages = lintWithRule(iterationInsideExample, assertionCount);

          expect(messages).toEqual([]);
        });
      });

      context('but the call reaches a member of expect through a computed key', () => {
        it('reports nothing', () => {
          const computedSoft = "it('moves', () => { tabs.forEach((tab) => expect['soft'](tab).toBeDefined()); });";
          const messages = lintWithRule(iterationInsideExample, computedSoft);

          expect(messages).toEqual([]);
        });
      });

      context('but the call is a method of another object', () => {
        it('reports nothing', () => {
          const pushCalling = "it('moves', () => { tabs.forEach((tab) => ids.push(tab.id)); });";
          const messages = lintWithRule(iterationInsideExample, pushCalling);

          expect(messages).toEqual([]);
        });
      });

      context('and the call is a matcher on expect', () => {
        it('reports the iteration', () => {
          const matcherAsserting = "it('moves', () => { tabs.forEach((tab) => expect(tab).toBeDefined()); });";
          const messages = lintWithRule(iterationInsideExample, matcherAsserting);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
        });
      });

      context('and the call is expect.soft', () => {
        it('reports the iteration', () => {
          const softAsserting = "it('moves', () => { tabs.forEach((tab) => expect.soft(tab).toBeDefined()); });";
          const messages = lintWithRule(iterationInsideExample, softAsserting);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
        });
      });

      context('and the call is expect.poll', () => {
        it('reports the iteration', () => {
          const pollAsserting = "it('moves', () => { tabs.forEach((tab) => expect.poll(() => tab).toBeDefined()); });";
          const messages = lintWithRule(iterationInsideExample, pollAsserting);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'iterationInsideExample', line: 1, column: 21 })]);
        });
      });
    });
  });
});
