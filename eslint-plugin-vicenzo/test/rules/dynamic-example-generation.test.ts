import dynamicExampleGeneration from '../../rules/dynamic-example-generation';
import { lintWithRule } from '../support/lint';

describe('vicenzo/dynamic-example-generation', () => {
  describe('offense detection', () => {
    context('when the call is not table-driven', () => {
      context('and it is a plain test block', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "it('moves the tab', () => {});");

          expect(messages).toEqual([]);
        });
      });

      context('and it is a test block with a modifier', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "it.skip('moves the tab', () => {});");

          expect(messages).toEqual([]);
        });
      });

      context('and it applies a table through a computed member', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "it['each']([1, 2])('moves tab %s', () => {});");

          expect(messages).toEqual([]);
        });
      });

      context('and it calls the result of a tagged template that is not a table', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "css`color: red`('moves the tab', () => {});");

          expect(messages).toEqual([]);
        });
      });
    });

    context('when a table is applied to something that is not a test block', () => {
      context('and the table is an array', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "rows.each([1, 2])('moves tab %s', () => {});");

          expect(messages).toEqual([]);
        });
      });

      context('and the table is a tagged template', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "rows.each`tab ${1}`('moves tab $tab', () => {});");

          expect(messages).toEqual([]);
        });
      });
    });

    context('when a callback goes to a method that does not iterate', () => {
      context('and the callback registers a test block', () => {
        it('reports nothing', () => {
          const testSource = "tabs.every((tab) => it('opens the tab', () => {}));";
          const messages = lintWithRule(dynamicExampleGeneration, testSource);

          expect(messages).toEqual([]);
        });
      });
    });

    context('when a table is applied to a test block', () => {
      context('and the table is an array given to each', () => {
        context('and the test block is a describe', () => {
          it('reports the table call', () => {
            const messages = lintWithRule(dynamicExampleGeneration, "describe.each([1, 2])('TabPlacer %s', () => {});");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'tableDrivenTestBlock', line: 1, column: 1 })]);
          });
        });

        context('and the test block is a context', () => {
          it('reports the table call', () => {
            const contextTable = "context.each([1, 2])('when tab %s is new', () => {});";
            const messages = lintWithRule(dynamicExampleGeneration, contextTable);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'tableDrivenTestBlock', line: 1, column: 1 })]);
          });
        });

        context('and the test block is an example', () => {
          it('reports the table call', () => {
            const messages = lintWithRule(dynamicExampleGeneration, "it.each([1, 2])('moves tab %s', () => {});");

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'tableDrivenTestBlock', line: 1, column: 1 })]);
          });
        });
      });

      context('and the table is a tagged template given to each', () => {
        it('reports the table call', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "it.each`tab ${1}`('moves tab $tab', () => {});");

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'tableDrivenTestBlock', line: 1, column: 1 })]);
        });
      });

      context('and the table is an array given to for', () => {
        it('reports the table call', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "it.for([1, 2])('moves tab %s', () => {});");

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'tableDrivenTestBlock', line: 1, column: 1 })]);
        });
      });

      context('and the table is a tagged template given to for', () => {
        it('reports the table call', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "it.for`tab ${1}`('moves tab $tab', () => {});");

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'tableDrivenTestBlock', line: 1, column: 1 })]);
        });
      });

      context('and a modifier precedes each', () => {
        it('reports the table call', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "it.skip.each([1, 2])('moves tab %s', () => {});");

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'tableDrivenTestBlock', line: 1, column: 1 })]);
        });
      });

      context('and the applied array table is stored before being called', () => {
        it('reports the table call', () => {
          const storedTable = "const moveTab = it.each([1, 2]); moveTab('moves tab %s', () => {});";
          const messages = lintWithRule(dynamicExampleGeneration, storedTable);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'tableDrivenTestBlock', line: 1, column: 17 })]);
        });
      });

      context('and the applied tagged-template table is stored before being called', () => {
        // Pending: `testBlockKind` only classifies calls, and a stored `it.each`…`` is not called where it is applied.
        it.todo('reports the table call');
      });
    });

    context('when the code iterates', () => {
      context('and the iteration is a forEach call', () => {
        context('but its callback registers no test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(dynamicExampleGeneration, 'tabs.forEach((tab) => close(tab));');

            expect(messages).toEqual([]);
          });
        });

        context('and its callback registers a test block', () => {
          it('reports the iteration', () => {
            const generatedExamples = "describe('TabPlacer', () => { tabs.forEach((tab) => it('opens', () => {})); });";
            const messages = lintWithRule(dynamicExampleGeneration, generatedExamples);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 31 })]);
          });
        });
      });

      context('and the iteration is a map call', () => {
        context('but its callback registers no test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(dynamicExampleGeneration, 'const tabIds = tabs.map((tab) => tab.id);');

            expect(messages).toEqual([]);
          });
        });

        context('and its callback registers a test block', () => {
          it('reports the iteration', () => {
            const generatedExamples = "describe('TabPlacer', () => { tabs.map((tab) => it('opens', () => {})); });";
            const messages = lintWithRule(dynamicExampleGeneration, generatedExamples);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 31 })]);
          });
        });
      });

      context('and the iteration is a flatMap call', () => {
        context('but its callback registers no test block', () => {
          it('reports nothing', () => {
            const flattenedTabs = 'const tabs = groups.flatMap((group) => group.tabs);';
            const messages = lintWithRule(dynamicExampleGeneration, flattenedTabs);

            expect(messages).toEqual([]);
          });
        });

        context('and its callback registers a test block', () => {
          it('reports the iteration', () => {
            const generatedExamples = "describe('TabPlacer', () => { "
              + "groups.flatMap((group) => it('opens', () => {})); });";
            const messages = lintWithRule(dynamicExampleGeneration, generatedExamples);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 31 })]);
          });
        });
      });

      context('and the iteration is a for statement', () => {
        context('but its body registers no test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(dynamicExampleGeneration, 'for (;;) close(tab);');

            expect(messages).toEqual([]);
          });
        });

        context('and its body registers a test block', () => {
          it('reports the iteration', () => {
            const generatedExamples = "describe('TabPlacer', () => { for (;;) it('opens', () => {}); });";
            const messages = lintWithRule(dynamicExampleGeneration, generatedExamples);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 31 })]);
          });
        });
      });

      context('and the iteration is a for…of statement', () => {
        context('but its body registers no test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(dynamicExampleGeneration, 'for (const tab of tabs) close(tab);');

            expect(messages).toEqual([]);
          });
        });

        context('and its body registers a test block', () => {
          it('reports the iteration', () => {
            const generatedExamples = "describe('TabPlacer', () => { "
              + "for (const tab of tabs) it('opens', () => {}); });";
            const messages = lintWithRule(dynamicExampleGeneration, generatedExamples);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 31 })]);
          });
        });
      });

      context('and the iteration is a for…in statement', () => {
        context('but its body registers no test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(dynamicExampleGeneration, 'for (const tabId in tabsById) close(tabId);');

            expect(messages).toEqual([]);
          });
        });

        context('and its body registers a test block', () => {
          it('reports the iteration', () => {
            const generatedExamples = "describe('TabPlacer', () => { "
              + "for (const tabId in tabsById) it('opens', () => {}); });";
            const messages = lintWithRule(dynamicExampleGeneration, generatedExamples);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 31 })]);
          });
        });
      });

      context('and the iteration is a while statement', () => {
        context('but its body registers no test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(dynamicExampleGeneration, 'while (pending) close(tab);');

            expect(messages).toEqual([]);
          });
        });

        context('and its body registers a test block', () => {
          it('reports the iteration', () => {
            const generatedExamples = "describe('TabPlacer', () => { while (pending) it('opens', () => {}); });";
            const messages = lintWithRule(dynamicExampleGeneration, generatedExamples);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 31 })]);
          });
        });
      });

      context('and the iteration is a do…while statement', () => {
        context('but its body registers no test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(dynamicExampleGeneration, 'do close(tab); while (pending);');

            expect(messages).toEqual([]);
          });
        });

        context('and its body registers a test block', () => {
          it('reports the iteration', () => {
            const generatedExamples = "describe('TabPlacer', () => { do it('opens', () => {}); while (pending); });";
            const messages = lintWithRule(dynamicExampleGeneration, generatedExamples);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 31 })]);
          });
        });
      });
    });

    context('when a forEach callback registers a test block', () => {
      context('and the test block is a describe', () => {
        it('reports the iteration', () => {
          const messages = lintWithRule(dynamicExampleGeneration, "tabs.forEach((tab) => describe('Tab', () => {}));");

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 1 })]);
        });
      });

      context('and the test block is a context', () => {
        it('reports the iteration', () => {
          const generatedContexts = "tabs.forEach((tab) => context('when it is new', () => {}));";
          const messages = lintWithRule(dynamicExampleGeneration, generatedContexts);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 1 })]);
        });
      });

      context('and the test block is an example', () => {
        it('reports the iteration', () => {
          const generatedExamples = "tabs.forEach((tab) => it('opens the tab', () => {}));";
          const messages = lintWithRule(dynamicExampleGeneration, generatedExamples);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 1 })]);
        });
      });

      context('and the test block is a hook', () => {
        it('reports the iteration', () => {
          const testSource = 'tabs.forEach((tab) => beforeEach(() => close(tab)));';
          const messages = lintWithRule(dynamicExampleGeneration, testSource);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 1 })]);
        });
      });
    });

    context('when iterations that register test blocks are nested', () => {
      context('but only the outer iteration registers in its own body', () => {
        it('reports one problem', () => {
          const outerRegistering = `
          groups.forEach((group) => {
            const tabIds = group.tabs.map((tab) => tab.id);
            it('opens the group', () => {});
          });
          `;
          const messages = lintWithRule(dynamicExampleGeneration, outerRegistering);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 2, column: 11 })]);
        });
      });

      context('and the inner iteration registers a test block', () => {
        it('reports two problems', () => {
          const innerRegistering = `
          groups.forEach((group) => {
            group.tabs.forEach((tab) => it('opens the tab', () => {}));
          });
          `;
          const messages = lintWithRule(dynamicExampleGeneration, innerRegistering);

          const outerIterationReport = { messageId: 'iterationRegistersTestBlocks', line: 2, column: 11 };
          const innerIterationReport = { messageId: 'iterationRegistersTestBlocks', line: 3, column: 13 };

          expect(messages).toMatchObject([outerIterationReport, innerIterationReport]);
        });
      });
    });

    context('when an iteration registers a table', () => {
      it('reports two problems', () => {
        const iteratedTable = "tabs.forEach(() => it.each([1])('opens %s', () => {}));";
        const messages = lintWithRule(dynamicExampleGeneration, iteratedTable);

        const iterationReport = { messageId: 'iterationRegistersTestBlocks', line: 1, column: 1 };
        const tableReport = { messageId: 'tableDrivenTestBlock', line: 1, column: 20 };

        expect(messages).toMatchObject([iterationReport, tableReport]);
      });
    });

    context('when an iteration registers several test blocks', () => {
      it('reports one problem', () => {
        const severalBlocks = "tabs.forEach((tab) => describe('Tab', () => { "
          + "it('opens', () => {}); it('closes', () => {}); }));";
        const messages = lintWithRule(dynamicExampleGeneration, severalBlocks);

        expect(messages)
          .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 1 })]);
      });
    });

    context('when the registering iteration is in the callback of an example', () => {
      it('reports the iteration', () => {
        const nestedRegistration = "it('opens', () => { tabs.forEach((tab) => it('closes', () => {})); });";
        const messages = lintWithRule(dynamicExampleGeneration, nestedRegistration);

        expect(messages)
          .toEqual([expect.objectContaining({ messageId: 'iterationRegistersTestBlocks', line: 1, column: 21 })]);
      });
    });
  });
});
