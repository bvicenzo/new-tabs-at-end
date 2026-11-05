import unnestedContextImproperStart from '../../rules/unnested-context-improper-start';
import { lintWithRule } from '../support/lint';

describe('vicenzo/unnested-context-improper-start', () => {
  describe('offense detection', () => {
    context('when the forbiddenPrefixes option is an empty list', () => {
      it('rejects the configuration', () => {
        const code = "context('and the tab is pinned', () => {});";

        expect(() => lintWithRule(unnestedContextImproperStart, code, [{ forbiddenPrefixes: [] }]))
          .toThrow(/fewer than 1 items/);
      });
    });

    context('when the options are valid', () => {
      context('and the call is not a context', () => {
        context('and it is a describe', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(unnestedContextImproperStart, "describe('and the tab placer', () => {});");

            expect(messages).toEqual([]);
          });
        });

        context('and it is an example', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(unnestedContextImproperStart, "it('and moves the tab', () => {});");

            expect(messages).toEqual([]);
          });
        });

        context('and it is not a test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(unnestedContextImproperStart, "vi.mock('and the tab module', () => ({}));");

            expect(messages).toEqual([]);
          });
        });
      });

      context('and the call is a context', () => {
        context('but it is the head of a table call', () => {
          it('reports nothing', () => {
            const code = "context.each('and the tabs')('when %s is new', () => {});";

            const messages = lintWithRule(unnestedContextImproperStart, code);

            expect(messages).toEqual([]);
          });
        });

        context('but its closest group is a context', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(unnestedContextImproperStart, `
            context('when the tab is new', () => {
              context('and it is pinned', () => {});
            });
            `);

            expect(messages).toEqual([]);
          });
        });

        context('and its closest group is a describe', () => {
          context('but its title is not a literal', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(unnestedContextImproperStart, `
              describe('TabPlacer', () => {
                context(\`and \${tabState}\`, () => {});
              });
              `);

              expect(messages).toEqual([]);
            });
          });

          context('and its title is a literal', () => {
            context('but the title has no leading word', () => {
              it('reports nothing', () => {
                const messages = lintWithRule(unnestedContextImproperStart, `
                describe('TabPlacer', () => {
                  context('#place', () => {});
                });
                `);

                expect(messages).toEqual([]);
              });
            });

            context('and the title has a leading word', () => {
              context('and the forbidden prefixes are the defaults', () => {
                context('but the word is however', () => {
                  it('reports nothing', () => {
                    const messages = lintWithRule(unnestedContextImproperStart, `
                    describe('TabPlacer', () => {
                      context('however the tab is pinned', () => {});
                    });
                    `);

                    expect(messages).toEqual([]);
                  });
                });

                context('but the word is another word', () => {
                  it('reports nothing', () => {
                    const messages = lintWithRule(unnestedContextImproperStart, `
                    describe('TabPlacer', () => {
                      context('when the tab is pinned', () => {});
                    });
                    `);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the word is and', () => {
                  it('reports the context call naming the prefix found', () => {
                    const unnestedContextMessage = 'Start an unnested `context` with `when`, `with` or `without`, not '
                      + '`and`.';

                    const messages = lintWithRule(unnestedContextImproperStart, `
                    describe('TabPlacer', () => {
                      context('and the tab is pinned', () => {});
                    });
                    `);

                    expect(messages).toMatchObject([{ message: unnestedContextMessage, line: 3, column: 23 }]);
                  });
                });

                context('and the word is but', () => {
                  it('reports the context call naming the prefix found', () => {
                    const unnestedContextMessage = 'Start an unnested `context` with `when`, `with` or `without`, not '
                      + '`but`.';

                    const messages = lintWithRule(unnestedContextImproperStart, `
                    describe('TabPlacer', () => {
                      context('but the tab is pinned', () => {});
                    });
                    `);

                    expect(messages).toMatchObject([{ message: unnestedContextMessage, line: 3, column: 23 }]);
                  });
                });
              });

              context('and the forbidden prefixes are configured', () => {
                context('but the word is a default prefix the list leaves out', () => {
                  it('reports nothing', () => {
                    const code = `
                    describe('TabPlacer', () => {
                      context('and the tab is pinned', () => {});
                    });
                    `;

                    const ruleOptions = [{ forbiddenPrefixes: ['also'] }];
                    const messages = lintWithRule(unnestedContextImproperStart, code, ruleOptions);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the word is in the list', () => {
                  context('and the entry is lowercase', () => {
                    it('reports the context call naming the prefix found', () => {
                      const unnestedContextMessage = 'Start an unnested `context` with `when`, `with` or `without`, '
                        + 'not `also`.';

                      const code = `
                      describe('TabPlacer', () => {
                        context('also the tab is pinned', () => {});
                      });
                      `;
                      const forbiddenPrefixes = ['also'];

                      const messages = lintWithRule(unnestedContextImproperStart, code, [{ forbiddenPrefixes }]);

                      expect(messages).toMatchObject([{ message: unnestedContextMessage, line: 3, column: 25 }]);
                    });
                  });

                  context('and the entry has capitals', () => {
                    it('reports the context call naming the prefix found', () => {
                      const unnestedContextMessage = 'Start an unnested `context` with `when`, `with` or `without`, '
                        + 'not `also`.';

                      const code = `
                      describe('TabPlacer', () => {
                        context('also the tab is pinned', () => {});
                      });
                      `;
                      const forbiddenPrefixes = ['Also'];

                      const messages = lintWithRule(unnestedContextImproperStart, code, [{ forbiddenPrefixes }]);

                      expect(messages).toMatchObject([{ message: unnestedContextMessage, line: 3, column: 25 }]);
                    });
                  });
                });
              });
            });
          });
        });

        context('and it has no enclosing group', () => {
          context('but its title is not a literal', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(unnestedContextImproperStart, 'context(`and ${tabState}`, () => {});');

              expect(messages).toEqual([]);
            });
          });

          context('and its title is a literal', () => {
            context('but the title has no leading word', () => {
              it('reports nothing', () => {
                const messages = lintWithRule(unnestedContextImproperStart, "context('#place', () => {});");

                expect(messages).toEqual([]);
              });
            });

            context('and the title has a leading word', () => {
              context('and the forbidden prefixes are the defaults', () => {
                context('but the word is however', () => {
                  it('reports nothing', () => {
                    const code = "context('however the tab is pinned', () => {});";

                    const messages = lintWithRule(unnestedContextImproperStart, code);

                    expect(messages).toEqual([]);
                  });
                });

                context('but the word is another word', () => {
                  it('reports nothing', () => {
                    const code = "context('when the tab is pinned', () => {});";

                    const messages = lintWithRule(unnestedContextImproperStart, code);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the word is and', () => {
                  it('reports the context call naming the prefix found', () => {
                    const unnestedContextMessage = 'Start an unnested `context` with `when`, `with` or `without`, not '
                      + '`and`.';

                    const code = "context('and the tab is pinned', () => {});";

                    const messages = lintWithRule(unnestedContextImproperStart, code);

                    expect(messages).toMatchObject([{ message: unnestedContextMessage, line: 1, column: 1 }]);
                  });
                });

                context('and the word is but', () => {
                  it('reports the context call naming the prefix found', () => {
                    const unnestedContextMessage = 'Start an unnested `context` with `when`, `with` or `without`, not '
                      + '`but`.';

                    const code = "context('but the tab is pinned', () => {});";

                    const messages = lintWithRule(unnestedContextImproperStart, code);

                    expect(messages).toMatchObject([{ message: unnestedContextMessage, line: 1, column: 1 }]);
                  });
                });
              });

              context('and the forbidden prefixes are configured', () => {
                context('but the word is a default prefix the list leaves out', () => {
                  it('reports nothing', () => {
                    const code = "context('and the tab is pinned', () => {});";

                    const ruleOptions = [{ forbiddenPrefixes: ['also'] }];
                    const messages = lintWithRule(unnestedContextImproperStart, code, ruleOptions);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the word is in the list', () => {
                  context('and the entry is lowercase', () => {
                    it('reports the context call naming the prefix found', () => {
                      const unnestedContextMessage = 'Start an unnested `context` with `when`, `with` or `without`, '
                        + 'not `also`.';

                      const code = "context('also the tab is pinned', () => {});";
                      const forbiddenPrefixes = ['also'];

                      const messages = lintWithRule(unnestedContextImproperStart, code, [{ forbiddenPrefixes }]);

                      expect(messages).toMatchObject([{ message: unnestedContextMessage, line: 1, column: 1 }]);
                    });
                  });

                  context('and the entry has capitals', () => {
                    it('reports the context call naming the prefix found', () => {
                      const unnestedContextMessage = 'Start an unnested `context` with `when`, `with` or `without`, '
                        + 'not `also`.';

                      const code = "context('also the tab is pinned', () => {});";
                      const forbiddenPrefixes = ['Also'];

                      const messages = lintWithRule(unnestedContextImproperStart, code, [{ forbiddenPrefixes }]);

                      expect(messages).toMatchObject([{ message: unnestedContextMessage, line: 1, column: 1 }]);
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
});
