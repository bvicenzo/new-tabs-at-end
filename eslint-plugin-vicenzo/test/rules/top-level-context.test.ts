import topLevelContext from '../../rules/top-level-context';
import { lintWithRule } from '../support/lint';

describe('vicenzo/top-level-context', () => {
  describe('offense detection', () => {
    context('when the call is not a context', () => {
      context('and it is a describe', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(topLevelContext, `
          describe('TabPlacer', () => {
            describe('#onTabCreated', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is an example', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(topLevelContext, `
          describe('TabPlacer', () => {
            it('moves the tab', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is a hook', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(topLevelContext, `
          describe('TabPlacer', () => {
            beforeEach(() => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is not a test block', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(topLevelContext, `
          describe('TabPlacer', () => {
            vi.useFakeTimers();
          });
          `);

          expect(messages).toEqual([]);
        });
      });
    });

    context('when the call is a context', () => {
      context('but it is the head of a table call', () => {
        it('reports only the table call', () => {
          const messages = lintWithRule(topLevelContext, `
          describe('TabPlacer', () => {
            context.each([1, 2])('when %i tabs are open', () => {});
          });
          `);

          expect(messages)
            .toEqual([expect.objectContaining({ messageId: 'topLevelContext', line: 3, column: 13, endColumn: 68 })]);
        });
      });

      context('and it is not the head of a table call', () => {
        context('but it is not at top level', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(topLevelContext, `
            describe('TabPlacer', () => {
              describe('#onTabCreated', () => {
                context('when the tab is new', () => {});
              });
            });
            `);

            expect(messages).toEqual([]);
          });
        });

        context('and it is at top level', () => {
          context('and it is directly in the outermost group', () => {
            it('reports the context', () => {
              const messages = lintWithRule(topLevelContext, `
              describe('TabPlacer', () => {
                context('when the tab is new', () => {});
              });
              `);

              expect(messages).toMatchObject([{ messageId: 'topLevelContext', line: 3, column: 17 }]);
            });
          });

          context('and it is in a function declared at module scope', () => {
            it('reports the context', () => {
              const messages = lintWithRule(topLevelContext, `
              function registerScenarios() {
                context('when the tab is new', () => {});
              }
              `);

              expect(messages).toMatchObject([{ messageId: 'topLevelContext', line: 3, column: 17 }]);
            });
          });
        });
      });
    });
  });
});
