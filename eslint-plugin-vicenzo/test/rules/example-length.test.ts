import exampleLength from '../../rules/example-length';
import { lintWithRule } from '../support/lint';

describe('vicenzo/example-length', () => {
  describe('offense detection', () => {
    context('when the options are invalid', () => {
      context('and max is negative', () => {
        it('throws a configuration error', () => {
          const code = "it('moves the tab', () => {});";

          expect(() => lintWithRule(exampleLength, code, [{ max: -1 }])).toThrow(/should be >= 0/);
        });
      });

      context('and max is not an integer', () => {
        it('throws a configuration error', () => {
          const code = "it('moves the tab', () => {});";

          expect(() => lintWithRule(exampleLength, code, [{ max: 2.5 }])).toThrow(/should be integer/);
        });
      });

      context('and an unknown option is given', () => {
        it('throws a configuration error', () => {
          const code = "it('moves the tab', () => {});";

          expect(() => lintWithRule(exampleLength, code, [{ max: 3, countComments: true }]))
            .toThrow(/should NOT have additional properties/);
        });
      });
    });

    context('when the options are valid', () => {
      context('but the call is not an example', () => {
        context('and it is a group', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(exampleLength, `
            describe('TabPlacer', () => {
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
            });
            `);

            expect(messages).toEqual([]);
          });
        });

        context('and it is a hook', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(exampleLength, `
            beforeEach(() => {
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
            });
            `);

            expect(messages).toEqual([]);
          });
        });

        context('and it is not a test block', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(exampleLength, `
            runAll(() => {
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
              moveTab();
            });
            `);

            expect(messages).toEqual([]);
          });
        });
      });

      context('and the call is an example', () => {
        context('but it has no callback', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(exampleLength, "it.todo('moves the tab');");

            expect(messages).toEqual([]);
          });
        });

        context('and it has a callback', () => {
          context('and no max is configured', () => {
            context('and the callback has a block body', () => {
              context('and the body counts 19 lines', () => {
                it('reports nothing', () => {
                  const messages = lintWithRule(exampleLength, `
                  it('moves the tab', () => {
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                  });
                  `);

                  expect(messages).toEqual([]);
                });
              });

              context('and the body counts 20 lines', () => {
                it('reports nothing', () => {
                  const messages = lintWithRule(exampleLength, `
                  it('moves the tab', () => {
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                  });
                  `);

                  expect(messages).toEqual([]);
                });
              });

              context('and the body counts 21 lines', () => {
                it('reports the example', () => {
                  const messages = lintWithRule(exampleLength, `
                  it('moves the tab', () => {
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                    moveTab();
                  });
                  `);

                  const tooLongExample = { message: 'Example has too many lines [21/20].', line: 2, column: 19 };

                  expect(messages).toEqual([expect.objectContaining(tooLongExample)]);
                });
              });
            });

            context('and the callback has an expression body', () => {
              context('and the body counts 19 lines', () => {
                it('reports nothing', () => {
                  const messages = lintWithRule(exampleLength, `
                  it('moves the tab', () => isNew
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isPinned);
                  `);

                  expect(messages).toEqual([]);
                });
              });

              context('and the body counts 20 lines', () => {
                it('reports nothing', () => {
                  const messages = lintWithRule(exampleLength, `
                  it('moves the tab', () => isNew
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isPinned);
                  `);

                  expect(messages).toEqual([]);
                });
              });

              context('and the body counts 21 lines', () => {
                it('reports the example', () => {
                  const messages = lintWithRule(exampleLength, `
                  it('moves the tab', () => isNew
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isGrouped
                    && isPinned);
                  `);

                  const tooLongExample = { message: 'Example has too many lines [21/20].', line: 2, column: 19 };

                  expect(messages).toEqual([expect.objectContaining(tooLongExample)]);
                });
              });
            });
          });

          context('and a max is configured', () => {
            context('and it is zero', () => {
              context('and the callback has a block body', () => {
                context('and the body counts no lines', () => {
                  it('reports nothing', () => {
                    const messages = lintWithRule(exampleLength, "it('moves the tab', () => {});", [{ max: 0 }]);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the body counts one line', () => {
                  it('reports the example', () => {
                    const code = "it('moves the tab', () => { moveTab(); });";

                    const messages = lintWithRule(exampleLength, code, [{ max: 0 }]);

                    const tooLongExample = { message: 'Example has too many lines [1/0].', line: 1, column: 1 };

                    expect(messages).toEqual([expect.objectContaining(tooLongExample)]);
                  });
                });
              });

              context('and the callback has an expression body', () => {
                context('and the body counts one line', () => {
                  it('reports the example', () => {
                    const messages = lintWithRule(exampleLength, "it('moves the tab', () => moveTab());", [{ max: 0 }]);

                    const tooLongExample = { message: 'Example has too many lines [1/0].', line: 1, column: 1 };

                    expect(messages).toEqual([expect.objectContaining(tooLongExample)]);
                  });
                });
              });
            });

            context('and it is positive', () => {
              context('and the callback has a block body', () => {
                context('and the body counts one line less than max', () => {
                  it('reports nothing', () => {
                    const messages = lintWithRule(exampleLength, `
                    it('moves the tab', () => {
                      moveTab();
                      moveTab();
                    });
                    `, [{ max: 3 }]);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the body counts exactly max lines', () => {
                  it('reports nothing', () => {
                    const messages = lintWithRule(exampleLength, `
                    it('moves the tab', () => {
                      moveTab();
                      moveTab();
                      moveTab();
                    });
                    `, [{ max: 3 }]);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the body counts one line more than max', () => {
                  it('reports the example', () => {
                    const messages = lintWithRule(exampleLength, `
                    it('moves the tab', () => {
                      moveTab();
                      moveTab();
                      moveTab();
                      moveTab();
                    });
                    `, [{ max: 3 }]);

                    const tooLongExample = { message: 'Example has too many lines [4/3].', line: 2, column: 21 };

                    expect(messages).toEqual([expect.objectContaining(tooLongExample)]);
                  });
                });
              });

              context('and the callback has an expression body', () => {
                context('and the body counts one line less than max', () => {
                  it('reports nothing', () => {
                    const messages = lintWithRule(exampleLength, `
                    it('moves the tab', () => isNew
                      && isPinned);
                    `, [{ max: 3 }]);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the body counts exactly max lines', () => {
                  it('reports nothing', () => {
                    const messages = lintWithRule(exampleLength, `
                    it('moves the tab', () => isNew
                      && isGrouped
                      && isPinned);
                    `, [{ max: 3 }]);

                    expect(messages).toEqual([]);
                  });
                });

                context('and the body counts one line more than max', () => {
                  it('reports the example', () => {
                    const messages = lintWithRule(exampleLength, `
                    it('moves the tab', () => isNew
                      && isGrouped
                      && isGrouped
                      && isPinned);
                    `, [{ max: 3 }]);

                    const tooLongExample = { message: 'Example has too many lines [4/3].', line: 2, column: 21 };

                    expect(messages).toEqual([expect.objectContaining(tooLongExample)]);
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
