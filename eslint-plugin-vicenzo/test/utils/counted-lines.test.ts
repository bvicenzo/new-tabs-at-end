import { countedLines } from '../../utils/counted-lines';
import { callbackOf } from '../../utils/test-blocks';
import { callNamed, parseProgram } from '../support/parse';

describe('utils/counted-lines', () => {
  describe('countedLines', () => {
    context('when the node is a block', () => {
      context('and it has no statements', () => {
        context('and it is empty', () => {
          it('returns zero', () => {
            const callback = callbackOf(callNamed(parseProgram('run(() => {});'), 'run'));

            expect(countedLines(callback!.body)).toBe(0);
          });
        });

        context('and it holds only comments', () => {
          it('returns zero', () => {
            const callback = callbackOf(callNamed(parseProgram(`
            run(() => {
              // the tab is new
              /* and it is grouped */
            });
            `), 'run'));

            expect(countedLines(callback!.body)).toBe(0);
          });
        });
      });

      context('and it has statements', () => {
        context('and they share the line of the braces', () => {
          it('returns one', () => {
            const callback = callbackOf(callNamed(parseProgram('run(() => { openTab(); moveTab(); });'), 'run'));

            expect(countedLines(callback!.body)).toBe(1);
          });
        });

        context('and they sit on their own lines', () => {
          context('and each fits on one line', () => {
            it('counts one line per statement', () => {
              const callback = callbackOf(callNamed(parseProgram(`
              run(() => {
                openTab();
                groupTab();
                moveTab();
              });
              `), 'run'));

              expect(countedLines(callback!.body)).toBe(3);
            });
          });

          context('and blank lines separate them', () => {
            it('does not count those lines', () => {
              const callback = callbackOf(callNamed(parseProgram(`
              run(() => {
                openTab();

                moveTab();
              });
              `), 'run'));

              expect(countedLines(callback!.body)).toBe(2);
            });
          });

          context('and comment-only lines separate them', () => {
            context('and the comments are line comments', () => {
              it('does not count those lines', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  openTab();
                  // the tab is new
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });

            context('and a block comment spans several lines', () => {
              it('does not count those lines', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  openTab();
                  /*
                   * the tab is new
                   */
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });
          });

          context('and a line holds code and a comment', () => {
            context('and the comment follows the code', () => {
              it('counts that line', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  openTab(); // the tab is new
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });

            context('and the comment precedes the code', () => {
              it('counts that line', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  /* the tab is new */ openTab();
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });
          });

          context('and a statement spans several lines', () => {
            context('but it holds no foldable construct', () => {
              it('counts each of its lines', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  if (isNew) {
                    moveTab;
                  }
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(3);
              });
            });

            context('and it holds an array literal', () => {
              it('counts it as one line', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  const tabIds = [
                    1,
                    2
                  ];
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });

            context('and it holds an object literal', () => {
              it('counts it as one line', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  const createdTab = {
                    id: 1,
                    url: ''
                  };
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });

            context('and it holds a call', () => {
              it('counts it as one line', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  openTab(
                    1,
                    2
                  );
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });

            context('and it holds a template literal', () => {
              it('counts it as one line', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  const title = \`
                    New tab
                    at end
                  \`;
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });

            context('and it holds a new expression', () => {
              it('counts it as one line', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  const placer = new TabPlacer(
                    1,
                    2
                  );
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });

            context('and it holds a type literal', () => {
              it('counts each of its lines', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  const createdTab: {
                    id: number;
                  } = buildTab();
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(4);
              });
            });

            context('and a foldable construct sits inside another', () => {
              it('counts only the outer construct, as one line', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  openTabs([
                    {
                      id: 1
                    }
                  ]);
                  moveTab();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });

            context('and a foldable construct sits inside a non-foldable one', () => {
              it('folds the construct and counts the remaining lines', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  if (isNew) {
                    openTab(
                      1
                    );
                  }
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(3);
              });
            });

            context('and a call takes a function with a block body', () => {
              it('folds the call but counts each line of the function body', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  expect(() => {
                    openTab();
                    moveTab();
                  }).toThrow();
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(3);
              });
            });

            context('and a new expression takes a function with a block body', () => {
              it('folds the expression but counts each line of the function body', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  const tabMoved = new Promise((resolve) => {
                    moveTab();
                    resolve();
                  });
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(3);
              });
            });

            context('and a call takes a function with an expression body', () => {
              it('counts it as one line', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  createdTabs.forEach((createdTab) =>
                    moveTab(createdTab));
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(1);
              });
            });

            context('and two foldable constructs share a line', () => {
              it('counts the shared line a single time', () => {
                const callback = callbackOf(callNamed(parseProgram(`
                run(() => {
                  const tabCount = [
                    1
                  ].length + countTabs(
                    2
                  );
                });
                `), 'run'));

                expect(countedLines(callback!.body)).toBe(2);
              });
            });
          });
        });
      });
    });

    context('when the node is an expression', () => {
      context('and it fits on one line', () => {
        it('returns one', () => {
          const callback = callbackOf(callNamed(parseProgram('run(() => isNew && isGrouped);'), 'run'));

          expect(countedLines(callback!.body)).toBe(1);
        });
      });

      context('and it spans several lines', () => {
        context('but it is not foldable', () => {
          it('counts each of its lines', () => {
            const callback = callbackOf(callNamed(parseProgram(`
            run(() => isNew
              && isGrouped
              && isPinned);
            `), 'run'));

            expect(countedLines(callback!.body)).toBe(3);
          });
        });

        context('and it is foldable', () => {
          it('returns one', () => {
            const callback = callbackOf(callNamed(parseProgram(`
            run(() => moveTab(
              1,
              2
            ));
            `), 'run'));

            expect(countedLines(callback!.body)).toBe(1);
          });
        });
      });
    });
  });
});
