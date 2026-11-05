import topLevelExample from '../../rules/top-level-example';
import { lintWithRule } from '../support/lint';

describe('vicenzo/top-level-example', () => {
  describe('offense detection', () => {
    context('when the call is not an example', () => {
      context('and it is a describe', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(topLevelExample, `
          describe('TabPlacer', () => {
            describe('#onTabCreated', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is a context', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(topLevelExample, `
          describe('TabPlacer', () => {
            context('when the tab is new', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is a hook', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(topLevelExample, `
          describe('TabPlacer', () => {
            beforeEach(() => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is not a test block', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(topLevelExample, `
          describe('TabPlacer', () => {
            vi.useFakeTimers();
          });
          `);

          expect(messages).toEqual([]);
        });
      });
    });

    context('when the call is an example', () => {
      context('but it is the head of a table call', () => {
        it('reports only the table call', () => {
          const messages = lintWithRule(topLevelExample, `
          describe('TabPlacer', () => {
            it.each([1, 2])('moves tab %i', () => {});
          });
          `);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'topLevelExample', line: 3, column: 13, endColumn: 54 })]);
        });
      });

      context('and it is not the head of a table call', () => {
        context('but it is not at top level', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(topLevelExample, `
            describe('TabPlacer', () => {
              describe('#onTabCreated', () => {
                it('moves the tab', () => {});
              });
            });
            `);

            expect(messages).toEqual([]);
          });
        });

        context('and it is at top level', () => {
          context('and it is directly in the outermost group', () => {
            it('reports the example', () => {
              const messages = lintWithRule(topLevelExample, `
              describe('TabPlacer', () => {
                it('moves the tab', () => {});
              });
              `);

              expect(messages).toMatchObject([{ messageId: 'topLevelExample', line: 3, column: 17 }]);
            });
          });

          context('and it is in a function declared at module scope', () => {
            it('reports the example', () => {
              const messages = lintWithRule(topLevelExample, `
              function registerScenarios() {
                it('moves the tab', () => {});
              }
              `);

              expect(messages).toMatchObject([{ messageId: 'topLevelExample', line: 3, column: 17 }]);
            });
          });
        });
      });
    });
  });
});
