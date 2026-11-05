import multilineMethodCallLineBreaks from '../../rules/multiline-method-call-line-breaks';
import { lintWithRule } from '../support/lint';

describe('vicenzo/multiline-method-call-line-breaks', () => {
  describe('offense detection', () => {
    context('when the call has no receiver', () => {
      it('reports nothing', () => {
        const messages = lintWithRule(multilineMethodCallLineBreaks, `
        placeTab(
          createdTab
        );
        `);

        expect(messages).toEqual([]);
      });
    });

    context('when the call is on a receiver', () => {
      context('and the chain ends on the line where its head ends', () => {
        context('and the head fits on one line', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(multilineMethodCallLineBreaks, 'groupTabs.filter(isPinned).map(toIndex);');

            expect(messages).toEqual([]);
          });
        });

        context('and the head spans several lines', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(multilineMethodCallLineBreaks, `
            expect(() => {
              placer.onTabCreated(createdTab);
            }).toThrow(DragError);
            `);

            expect(messages).toEqual([]);
          });
        });
      });

      context('and the chain ends on a later line than its head', () => {
        context('and every link starts its own line', () => {
          context('and the links are plain member calls', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs
                .filter(isPinned)
                .map(toIndex);
              `);

              expect(messages).toEqual([]);
            });
          });

          context('and a link is an optional call', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              pendingMove
                ?.then(placeTab)
                .catch(reportFailure);
              `);

              expect(messages).toEqual([]);
            });
          });

          context('and a link has a chain of its own in its arguments', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs
                .filter((tab) => tab.url.startsWith(prefix))
                .map(toIndex);
              `);

              expect(messages).toEqual([]);
            });
          });

          context('and the head is a call on a computed member', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              placementsByKind[kind](createdTab)
                .then(logPlacement);
              `);

              expect(messages).toEqual([]);
            });
          });

          context('and an index access follows the previous call', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              queryTabs()[0]
                .focus();
              `);

              expect(messages).toEqual([]);
            });
          });

          context('and a property access inside a link starts its own line', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              expect(move)
                .not
                .toHaveBeenCalled();
              `);

              expect(messages).toEqual([]);
            });
          });
        });

        context('but the first link starts on the line where the head ends', () => {
          context('and an arrow function with a block body among its arguments spans several lines', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs.forEach((tab) => {
                move(tab);
              });
              `);

              expect(messages).toEqual([]);
            });
          });

          context('and a function expression with a block body among its arguments spans several lines', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs.forEach(function placeTab(tab) {
                move(tab);
              });
              `);

              expect(messages).toEqual([]);
            });
          });

          context('but the function with a block body among its arguments fits on one line', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              pendingMove.then((tab) => { place(tab); })
                .catch(reportFailure);
              `);
              const thenReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 26, endColumn: 31 };

              expect(messages).toMatchObject([thenReport]);
            });
          });

          context('but another argument breaks the link beside a function with a block body on one line', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs.reduce((highest, tab) => { return Math.max(highest, tab.index); }, {
                initial: -1
              });
              `);
              const reduceReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 24, endColumn: 31 };

              expect(messages).toMatchObject([reduceReport]);
            });
          });

          context('but its arguments span several lines without a function with a block body', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              chrome.tabs.query({
                windowId: createdTab.windowId,
                pinned: false
              });
              `);
              const queryReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 26, endColumn: 32 };

              expect(messages).toMatchObject([queryReport]);
            });
          });

          context('but a function with an expression body among its arguments spans several lines', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs.map((tab) => (
                tab.index
              ));
              `);
              const mapReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 24, endColumn: 28 };

              expect(messages).toMatchObject([mapReport]);
            });
          });

          context('but the link spans several lines without arguments', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs.reverse(
              )
                .map(toIndex);
              `);
              const reverseReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 24, endColumn: 32 };

              expect(messages).toMatchObject([reverseReport]);
            });
          });

          context('but the link fits on one line', () => {
            context('and the head is an identifier', () => {
              it('reports the link', () => {
                const ownLineMessage = 'Method calls in a multiline chain must each be on their own line.';

                const messages = lintWithRule(multilineMethodCallLineBreaks, `
                groupTabs.filter(isPinned)
                  .map(toIndex);
                `);
                const filterReport = { message: ownLineMessage, line: 2, column: 26, endLine: 2, endColumn: 33 };

                expect(messages).toMatchObject([filterReport]);
              });
            });

            context('and the head is a property path', () => {
              it('reports the link from its own dot', () => {
                const messages = lintWithRule(multilineMethodCallLineBreaks, `
                chrome.tabs.query(filter)
                  .then(placeTabs);
                `);
                const queryReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 28, endColumn: 34 };

                expect(messages).toMatchObject([queryReport]);
              });
            });

            context('and a property access follows the head', () => {
              it('reports the link from the property access', () => {
                const messages = lintWithRule(multilineMethodCallLineBreaks, `
                buildPlacer().settings.read()
                  .then(placeTab);
                `);
                const readReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 30, endColumn: 44 };

                expect(messages).toMatchObject([readReport]);
              });
            });

            context('and the link is an optional call', () => {
              it('reports the link from the optional dot', () => {
                const messages = lintWithRule(multilineMethodCallLineBreaks, `
                pendingMove?.then(placeTab)
                  .catch(reportFailure);
                `);
                const thenReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 28, endColumn: 34 };

                expect(messages).toMatchObject([thenReport]);
              });
            });
          });
        });

        context('but a later link starts on the line where the previous link ends', () => {
          context('and the previous link fits on one line', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs
                .filter(isPinned).map(toIndex);
              `);
              const mapReport = { messageId: 'multilineMethodCallLineBreaks', line: 3, column: 34, endColumn: 38 };

              expect(messages).toMatchObject([mapReport]);
            });
          });

          context('and the arguments of the previous link span several lines', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs.filter((tab) => {
                return tab.pinned;
              }).map(toIndex);
              `);
              const mapReport = { messageId: 'multilineMethodCallLineBreaks', line: 4, column: 17, endColumn: 21 };

              expect(messages).toMatchObject([mapReport]);
            });
          });

          context('and the link has arguments that span several lines', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs
                .filter(isPinned).reduce((highest, tab) => {
                  return Math.max(highest, tab.index);
                }, -1);
              `);
              const reduceReport = { messageId: 'multilineMethodCallLineBreaks', line: 3, column: 34, endColumn: 41 };

              expect(messages).toMatchObject([reduceReport]);
            });
          });

          context('and a non-null assertion follows the previous link', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              tabsByGroup
                .get(groupId)!.push(createdTab);
              `);
              const pushReport = { messageId: 'multilineMethodCallLineBreaks', line: 3, column: 31, endColumn: 36 };

              expect(messages).toMatchObject([pushReport]);
            });
          });

          context('and a type assertion wraps the previous link', () => {
            it('reports the link', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              (response
                .json() as Promise<Tab[]>).then(placeTabs);
              `);
              const thenReport = { messageId: 'multilineMethodCallLineBreaks', line: 3, column: 43, endColumn: 48 };

              expect(messages).toMatchObject([thenReport]);
            });
          });

          context('and the first link also starts on the line where the head ends', () => {
            it('reports both links', () => {
              const messages = lintWithRule(multilineMethodCallLineBreaks, `
              groupTabs.filter(isPinned).map(toIndex)
                .at(-1);
              `);
              const filterReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 24, endColumn: 31 };
              const mapReport = { messageId: 'multilineMethodCallLineBreaks', line: 2, column: 41, endColumn: 45 };

              expect(messages).toMatchObject([filterReport, mapReport]);
            });
          });
        });
      });
    });
  });
});
