import contextWording from '../../rules/context-wording';
import { lintWithRule } from '../support/lint';

describe('vicenzo/context-wording', () => {
  describe('offense detection', () => {
    context('when the prefixes option is an empty list', () => {
      it('rejects the configuration', () => {
        const code = "context('when the tab is new', () => {});";

        expect(() => lintWithRule(contextWording, code, [{ prefixes: [] }])).toThrow(/fewer than 1 items/);
      });
    });

    context('when a prefix entry is an empty string', () => {
      it('rejects the configuration', () => {
        const code = "context('when the tab is new', () => {});";

        expect(() => lintWithRule(contextWording, code, [{ prefixes: [''] }])).toThrow(/shorter than 1 characters/);
      });
    });

    context('when the options are valid', () => {
      context('and the call is not a context', () => {
        context('and it is a describe', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(contextWording, "describe('the tab placer', () => {});");

            expect(messages).toEqual([]);
          });
        });

        context('and it is an example', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(contextWording, "it('moves the tab', () => {});");

            expect(messages).toEqual([]);
          });
        });

        context('and it is not a test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(contextWording, "vi.mock('the tab module', () => ({}));");

            expect(messages).toEqual([]);
          });
        });
      });

      context('and the call is a context', () => {
        context('but it is the head of a table call', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(contextWording, "context.each('the tabs')('when %s is new', () => {});");

            expect(messages).toEqual([]);
          });
        });

        context('but its title is not a literal', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(contextWording, 'context(tabState, () => {});');

            expect(messages).toEqual([]);
          });
        });

        context('and its title is a literal', () => {
          context('and the allowed prefixes are the defaults', () => {
            context('but the title has no leading word', () => {
              it('reports the context call naming the allowed prefixes', () => {
                const wordingMessage = 'Start the `context` description with one of: '
                  + '`and`, `but`, `when`, `with`, `without`.';

                const messages = lintWithRule(contextWording, "context('#onTabCreated', () => {});");

                expect(messages)
                  .toMatchObject([{ messageId: 'contextWording', message: wordingMessage, line: 1, column: 1 }]);
              });
            });

            context('and the title has a leading word', () => {
              context('but the word is not an allowed prefix', () => {
                it('reports the context call naming the allowed prefixes', () => {
                  const wordingMessage = 'Start the `context` description with one of: '
                    + '`and`, `but`, `when`, `with`, `without`.';

                  const messages = lintWithRule(contextWording, `
                  describe('TabPlacer', () => {
                    context('the tab is new', () => {});
                  });
                  `);

                  expect(messages)
                    .toMatchObject([{ messageId: 'contextWording', message: wordingMessage, line: 3, column: 21 }]);
                });
              });

              context('but an allowed prefix is only the start of the word', () => {
                it('reports the context call naming the allowed prefixes', () => {
                  const messages = lintWithRule(contextWording, "context('android tabs', () => {});");

                  expect(messages).toMatchObject([{ messageId: 'contextWording', line: 1, column: 1 }]);
                });
              });

              context('and the word is and', () => {
                it('reports nothing', () => {
                  const messages = lintWithRule(contextWording, "context('and the tab is pinned', () => {});");

                  expect(messages).toEqual([]);
                });
              });

              context('and the word is but', () => {
                it('reports nothing', () => {
                  const messages = lintWithRule(contextWording, "context('but the tab is pinned', () => {});");

                  expect(messages).toEqual([]);
                });
              });

              context('and the word is when', () => {
                it('reports nothing', () => {
                  const messages = lintWithRule(contextWording, "context('when the tab is new', () => {});");

                  expect(messages).toEqual([]);
                });
              });

              context('and the word is with', () => {
                it('reports nothing', () => {
                  const messages = lintWithRule(contextWording, "context('with a pinned tab', () => {});");

                  expect(messages).toEqual([]);
                });
              });

              context('and the word is without', () => {
                it('reports nothing', () => {
                  const messages = lintWithRule(contextWording, "context('without a group', () => {});");

                  expect(messages).toEqual([]);
                });
              });
            });
          });

          context('and the allowed prefixes are configured', () => {
            context('but the title has no leading word', () => {
              it('reports the context call naming the allowed prefixes', () => {
                const wordingMessage = 'Start the `context` description with one of: `for`, `when`.';

                const code = "context('#onTabCreated', () => {});";

                const messages = lintWithRule(contextWording, code, [{ prefixes: ['for', 'when'] }]);

                expect(messages).toMatchObject([{ message: wordingMessage, line: 1, column: 1 }]);
              });
            });

            context('and the title has a leading word', () => {
              context('but the word is a default prefix the list leaves out', () => {
                it('reports the context call naming the allowed prefixes', () => {
                  const wordingMessage = 'Start the `context` description with one of: `for`, `when`.';

                  const code = "context('with a pinned tab', () => {});";

                  const messages = lintWithRule(contextWording, code, [{ prefixes: ['for', 'when'] }]);

                  expect(messages).toMatchObject([{ message: wordingMessage, line: 1, column: 1 }]);
                });
              });

              context('and the word is in the list', () => {
                context('and the entry is lowercase', () => {
                  it('reports nothing', () => {
                    const code = "context('for a pinned tab', () => {});";

                    const messages = lintWithRule(contextWording, code, [{ prefixes: ['for', 'when'] }]);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the entry has capitals', () => {
                  it('reports nothing', () => {
                    const code = "context('for a pinned tab', () => {});";

                    const messages = lintWithRule(contextWording, code, [{ prefixes: ['For', 'when'] }]);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the entry has several words', () => {
                  it('reports nothing', () => {
                    const code = "context('in case the tab is pinned', () => {});";

                    const messages = lintWithRule(contextWording, code, [{ prefixes: ['in case', 'when'] }]);

                    expect(messages).toEqual([]);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
