import nestedContextImproperStart from '../../rules/nested-context-improper-start';
import { lintWithRule } from '../support/lint';

describe('vicenzo/nested-context-improper-start', () => {
  describe('offense detection', () => {
    context('when the call is not a context', () => {
      context('and it is a describe inside a context', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(nestedContextImproperStart, `
          context('when the tab is new', () => {
            describe('when it is grouped', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is an example inside a context', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(nestedContextImproperStart, `
          context('when the tab is new', () => {
            it('when it is grouped, moves the tab', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is not a test block inside a context', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(nestedContextImproperStart, `
          context('when the tab is new', () => {
            vi.mock('when the tab module loads', () => ({}));
          });
          `);

          expect(messages).toEqual([]);
        });
      });
    });

    context('when the call is a context', () => {
      context('but it is the head of a table call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(nestedContextImproperStart, `
          context('when the tab is new', () => {
            context.each('when the tabs')('and %s is grouped', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('but it has no enclosing group', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(nestedContextImproperStart, "context('when the tab is new', () => {});");

          expect(messages).toEqual([]);
        });
      });

      context('but its closest group is a describe', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(nestedContextImproperStart, `
          context('when the tab is new', () => {
            describe('#place', () => {
              context('when it is grouped', () => {});
            });
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and its closest group is a context', () => {
        context('but its title is not a literal', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(nestedContextImproperStart, `
            context('when the tab is new', () => {
              context(\`when \${tabState}\`, () => {});
            });
            `);

            expect(messages).toEqual([]);
          });
        });

        context('and its title is a literal', () => {
          context('but the title has no leading word', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(nestedContextImproperStart, `
              context('when the tab is new', () => {
                context('#place', () => {});
              });
              `);

              expect(messages).toEqual([]);
            });
          });

          context('and the title has a leading word', () => {
            context('but the word is not when, with or without', () => {
              it('reports nothing', () => {
                const messages = lintWithRule(nestedContextImproperStart, `
                context('when the tab is new', () => {
                  context('and it is grouped', () => {});
                });
                `);

                expect(messages).toEqual([]);
              });
            });

            context('and the word is when', () => {
              context('and its enclosing context is the outermost group', () => {
                it('reports the context call suggesting and or but', () => {
                  const messages = lintWithRule(nestedContextImproperStart, `
                  context('when the tab is new', () => {
                    context('when it is grouped', () => {});
                  });
                  `);

                  expect(messages).toMatchObject([{
                    messageId: 'nestedContextImproperStart',
                    message: 'Start a nested `context` with `and` or `but`, not `when`, `with` or `without`.',
                    line: 3,
                    column: 21
                  }]);
                });
              });

              context('and its enclosing context is itself an offending nested context', () => {
                it('reports both contexts', () => {
                  const messages = lintWithRule(nestedContextImproperStart, `
                  context('when the tab is new', () => {
                    context('when it is grouped', () => {
                      context('when it is pinned', () => {});
                    });
                  });
                  `);

                  expect(messages).toMatchObject([
                    { messageId: 'nestedContextImproperStart', line: 3, column: 21 },
                    { messageId: 'nestedContextImproperStart', line: 4, column: 23 }
                  ]);
                });
              });
            });

            context('and the word is with', () => {
              context('and its enclosing context is the outermost group', () => {
                it('reports the context call suggesting and or but', () => {
                  const messages = lintWithRule(nestedContextImproperStart, `
                  context('when the tab is new', () => {
                    context('with a group', () => {});
                  });
                  `);

                  expect(messages).toMatchObject([{
                    messageId: 'nestedContextImproperStart',
                    message: 'Start a nested `context` with `and` or `but`, not `when`, `with` or `without`.',
                    line: 3,
                    column: 21
                  }]);
                });
              });

              context('and its enclosing context is itself an offending nested context', () => {
                it('reports both contexts', () => {
                  const messages = lintWithRule(nestedContextImproperStart, `
                  context('when the tab is new', () => {
                    context('with a group', () => {
                      context('with a pinned tab', () => {});
                    });
                  });
                  `);

                  expect(messages).toMatchObject([
                    { messageId: 'nestedContextImproperStart', line: 3, column: 21 },
                    { messageId: 'nestedContextImproperStart', line: 4, column: 23 }
                  ]);
                });
              });
            });

            context('and the word is without', () => {
              context('and its enclosing context is the outermost group', () => {
                it('reports the context call suggesting and or but', () => {
                  const messages = lintWithRule(nestedContextImproperStart, `
                  context('when the tab is new', () => {
                    context('without a group', () => {});
                  });
                  `);

                  expect(messages).toMatchObject([{
                    messageId: 'nestedContextImproperStart',
                    message: 'Start a nested `context` with `and` or `but`, not `when`, `with` or `without`.',
                    line: 3,
                    column: 21
                  }]);
                });
              });

              context('and its enclosing context is itself an offending nested context', () => {
                it('reports both contexts', () => {
                  const messages = lintWithRule(nestedContextImproperStart, `
                  context('when the tab is new', () => {
                    context('without a group', () => {
                      context('without a pin', () => {});
                    });
                  });
                  `);

                  expect(messages).toMatchObject([
                    { messageId: 'nestedContextImproperStart', line: 3, column: 21 },
                    { messageId: 'nestedContextImproperStart', line: 4, column: 23 }
                  ]);
                });
              });
            });
          });
        });
      });
    });
  });
});
