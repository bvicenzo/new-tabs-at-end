import describeInsideContext from '../../rules/describe-inside-context';
import { lintWithRule } from '../support/lint';

describe('vicenzo/describe-inside-context', () => {
  describe('offense detection', () => {
    context('when the call is not a describe', () => {
      context('and it is a context inside a context', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(describeInsideContext, `
          context('when the tab is new', () => {
            context('and it is grouped', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is an example inside a context', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(describeInsideContext, `
          context('when the tab is new', () => {
            it('moves the tab', () => {});
          });
          `);

          expect(messages).toEqual([]);
        });
      });
    });

    context('when the call is a describe', () => {
      context('but it is at module scope', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(describeInsideContext, "describe('TabPlacer', () => {});");

          expect(messages).toEqual([]);
        });
      });

      context('and it is inside another call', () => {
        context('but only in the title argument of a context', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(describeInsideContext, `
            context(String(describe('TabPlacer', () => {})), () => {});
            `);

            expect(messages).toEqual([]);
          });
        });

        context('and in the callback of a test group', () => {
          context('but the closest group is a describe', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(describeInsideContext, `
              describe('TabPlacer', () => {
                describe('#onTabCreated', () => {});
              });
              `);

              expect(messages).toEqual([]);
            });
          });

          context('and the closest group is a context', () => {
            context('and the describe is a plain describe', () => {
              it('reports the describe call', () => {
                const messages = lintWithRule(describeInsideContext, `
                context('when the tab is new', () => {
                  describe('#onTabCreated', () => {});
                });
                `);

                expect(messages)
                  .toEqual([expect.objectContaining({ messageId: 'describeInsideContext', line: 3, column: 19 })]);
              });
            });

            context('and the describe is a describe.each', () => {
              it('reports the describe call', () => {
                const messages = lintWithRule(describeInsideContext, `
                context('when the tab is new', () => {
                  describe.each([1, 2])('#onTabCreated %s', () => {});
                });
                `);

                expect(messages)
                  .toEqual([expect.objectContaining({ messageId: 'describeInsideContext', line: 3, column: 19 })]);
              });
            });
          });
        });

        context('and in a non-group function inside a context', () => {
          it('reports the describe call', () => {
            const messages = lintWithRule(describeInsideContext, `
            context('when the tab is new', () => {
              it('moves the tab', () => {
                describe('#onTabCreated', () => {});
              });
            });
            `);

            expect(messages)
              .toEqual([expect.objectContaining({ messageId: 'describeInsideContext', line: 4, column: 17 })]);
          });
        });

        context('and nested several groups deep', () => {
          context('and the groups are context > describe > describe', () => {
            it('reports only the outer describe', () => {
              const messages = lintWithRule(describeInsideContext, `
              context('when the tab is new', () => {
                describe('#onTabCreated', () => {
                  describe('#place', () => {});
                });
              });
              `);

              expect(messages)
                .toEqual([expect.objectContaining({ messageId: 'describeInsideContext', line: 3, column: 17 })]);
            });
          });

          context('and the groups are context > describe > context > describe', () => {
            it('reports both describes', () => {
              const messages = lintWithRule(describeInsideContext, `
              context('when the tab is new', () => {
                describe('#onTabCreated', () => {
                  context('and it is grouped', () => {
                    describe('#place', () => {});
                  });
                });
              });
              `);
              const outerDescribeReport = { messageId: 'describeInsideContext', line: 3, column: 17 };
              const innerDescribeReport = { messageId: 'describeInsideContext', line: 5, column: 21 };

              expect(messages).toMatchObject([outerDescribeReport, innerDescribeReport]);
            });
          });
        });
      });
    });
  });
});
