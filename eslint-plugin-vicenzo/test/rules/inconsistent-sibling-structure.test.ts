import inconsistentSiblingStructure from '../../rules/inconsistent-sibling-structure';
import { lintWithRule } from '../support/lint';

describe('vicenzo/inconsistent-sibling-structure', () => {
  describe('offense detection', () => {
    context('when the test blocks are at module scope', () => {
      context('and they mix examples, describes and contexts', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(inconsistentSiblingStructure, `
          it('moves the tab', () => {});
          describe('#onTabCreated', () => {});
          context('when the tab is new', () => {});
          `);

          expect(messages).toEqual([]);
        });
      });
    });

    context('when the test blocks are in the callback of a test group', () => {
      context('and they are all examples', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(inconsistentSiblingStructure, `
          describe('TabPlacer', () => {
            it('moves the tab', () => {});
            it('keeps the group', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and they are all describes', () => {
        context('and the describes are empty', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(inconsistentSiblingStructure, `
            describe('TabPlacer', () => {
              describe('#onTabCreated', () => {});
              describe('#onTabRemoved', () => {});
            });
            `);

            expect(messages).toEqual([]);
          });
        });

        context('and the describes hold only examples', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(inconsistentSiblingStructure, `
            describe('TabPlacer', () => {
              describe('#onTabCreated', () => {
                it('moves the tab', () => {});
              });
              describe('#onTabRemoved', () => {
                it('keeps the group', () => {});
              });
            });
            `);

            expect(messages).toEqual([]);
          });
        });

        context('but a describe mixes examples and contexts in its own callback', () => {
          it('reports one offense per context of that describe', () => {
            const mixedExamplesAndContexts = 'Do not mix examples with contexts at the same level.';

            const messages = lintWithRule(inconsistentSiblingStructure, `
            describe('TabPlacer', () => {
              describe('#onTabCreated', () => {
                context('when the tab is new', () => {});
                it('moves the tab', () => {});
                context('when the tab is pinned', () => {});
              });
              describe('#onTabRemoved', () => {});
            });
            `);

            expect(messages)
              .toEqual([
                expect.objectContaining({ message: mixedExamplesAndContexts, line: 4, column: 17 }),
                expect.objectContaining({ message: mixedExamplesAndContexts, line: 6, column: 17 })
              ]);
          });
        });
      });

      context('and they are all contexts', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(inconsistentSiblingStructure, `
          describe('TabPlacer', () => {
            context('when the tab is new', () => {});
            context('when the tab is pinned', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and they are of one kind beside hooks', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(inconsistentSiblingStructure, `
          describe('TabPlacer', () => {
            beforeEach(() => {});
            it('moves the tab', () => {});
            it('keeps the group', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and they are of one kind beside calls that are not test blocks', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(inconsistentSiblingStructure, `
          describe('TabPlacer', () => {
            vi.useFakeTimers();
            it('moves the tab', () => {});
            it('keeps the group', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and they mix examples and describes', () => {
        context('and the describes are complete calls', () => {
          it('reports one offense per describe', () => {
            const mixedExamplesAndDescribes = 'Do not mix examples with describes at the same level.';

            const messages = lintWithRule(inconsistentSiblingStructure, `
            describe('TabPlacer', () => {
              describe('#onTabCreated', () => {});
              it('is a placer', () => {});
              describe('#onTabRemoved', () => {});
            });
            `);

            expect(messages)
              .toEqual([
                expect.objectContaining({ message: mixedExamplesAndDescribes, line: 3, column: 15 }),
                expect.objectContaining({ message: mixedExamplesAndDescribes, line: 5, column: 15 })
              ]);
          });
        });

        context('and a describe is a table call', () => {
          it('reports one offense per describe', () => {
            const mixedExamplesAndDescribes = 'Do not mix examples with describes at the same level.';

            const messages = lintWithRule(inconsistentSiblingStructure, `
            describe('TabPlacer', () => {
              it('is a placer', () => {});
              describe.each([1, 2])('#onTabCreated %i', () => {});
              describe('#onTabRemoved', () => {});
            });
            `);

            expect(messages)
              .toEqual([
                expect.objectContaining({ message: mixedExamplesAndDescribes, line: 4, column: 15 }),
                expect.objectContaining({ message: mixedExamplesAndDescribes, line: 5, column: 15 })
              ]);
          });
        });

        context('and a describe mixes examples and contexts in its own callback', () => {
          it('reports one offense per describe and one per nested context', () => {
            const mixedExamplesAndDescribes = 'Do not mix examples with describes at the same level.';
            const mixedExamplesAndContexts = 'Do not mix examples with contexts at the same level.';

            const messages = lintWithRule(inconsistentSiblingStructure, `
            describe('TabPlacer', () => {
              it('is a placer', () => {});
              describe('#onTabCreated', () => {
                it('moves the tab', () => {});
                context('when the tab is new', () => {});
              });
            });
            `);

            expect(messages)
              .toEqual([
                expect.objectContaining({ message: mixedExamplesAndDescribes, line: 4, column: 15 }),
                expect.objectContaining({ message: mixedExamplesAndContexts, line: 6, column: 17 })
              ]);
          });
        });
      });

      context('and they mix examples and contexts', () => {
        context('and the example has a callback', () => {
          it('reports one offense per context', () => {
            const mixedExamplesAndContexts = 'Do not mix examples with contexts at the same level.';

            const messages = lintWithRule(inconsistentSiblingStructure, `
            describe('TabPlacer', () => {
              context('when the tab is new', () => {});
              it('moves the tab', () => {});
              context('when the tab is pinned', () => {});
            });
            `);
            const newTabReport = { message: mixedExamplesAndContexts, line: 3, column: 15 };
            const pinnedTabReport = { message: mixedExamplesAndContexts, line: 5, column: 15 };

            expect(messages).toMatchObject([newTabReport, pinnedTabReport]);
          });
        });

        context('and the example is pending', () => {
          it('reports one offense per context', () => {
            const mixedExamplesAndContexts = 'Do not mix examples with contexts at the same level.';

            const messages = lintWithRule(inconsistentSiblingStructure, `
            describe('TabPlacer', () => {
              context('when the tab is new', () => {});
              it.todo('moves the tab');
              context('when the tab is pinned', () => {});
            });
            `);
            const newTabReport = { message: mixedExamplesAndContexts, line: 3, column: 15 };
            const pinnedTabReport = { message: mixedExamplesAndContexts, line: 5, column: 15 };

            expect(messages).toMatchObject([newTabReport, pinnedTabReport]);
          });
        });
      });

      context('and they mix describes and contexts', () => {
        it('reports one offense per context', () => {
          const mixedDescribesAndContexts = 'Do not mix describes with contexts at the same level.';

          const messages = lintWithRule(inconsistentSiblingStructure, `
          describe('TabPlacer', () => {
            context('when the tab is new', () => {});
            describe('#onTabCreated', () => {});
            context('when the tab is pinned', () => {});
          });
          `);

          expect(messages)
            .toEqual([
              expect.objectContaining({ message: mixedDescribesAndContexts, line: 3, column: 13 }),
              expect.objectContaining({ message: mixedDescribesAndContexts, line: 5, column: 13 })
            ]);
        });
      });

      context('and they mix examples, describes and contexts', () => {
        it('reports one offense per describe and two per context', () => {
          const mixedExamplesAndDescribes = 'Do not mix examples with describes at the same level.';
          const mixedExamplesAndContexts = 'Do not mix examples with contexts at the same level.';
          const mixedDescribesAndContexts = 'Do not mix describes with contexts at the same level.';

          const messages = lintWithRule(inconsistentSiblingStructure, `
          describe('TabPlacer', () => {
            context('when the tab is new', () => {});
            it('moves the tab', () => {});
            describe('#onTabCreated', () => {});
            context('when the tab is pinned', () => {});
          });
          `);

          expect(messages)
            .toEqual([
              expect.objectContaining({ message: mixedExamplesAndContexts, line: 3, column: 13 }),
              expect.objectContaining({ message: mixedDescribesAndContexts, line: 3, column: 13 }),
              expect.objectContaining({ message: mixedExamplesAndDescribes, line: 5, column: 13 }),
              expect.objectContaining({ message: mixedExamplesAndContexts, line: 6, column: 13 }),
              expect.objectContaining({ message: mixedDescribesAndContexts, line: 6, column: 13 })
            ]);
        });
      });
    });
  });
});
