import preferSingleLine from '../../rules/prefer-single-line';
import { lintWithRule } from '../support/lint';

describe('vicenzo/prefer-single-line', () => {
  describe('offense detection', () => {
    context('when the maximum is below one', () => {
      it('rejects the configuration', () => {
        expect(() => lintWithRule(preferSingleLine, 'move(tab);', [{ max: 0 }])).toThrow(/should be >= 1/);
      });
    });

    context('when the construct is on a single line', () => {
      it('reports nothing', () => {
        const messages = lintWithRule(preferSingleLine, 'move(tab, { index: -1 });');

        expect(messages).toEqual([]);
      });
    });

    context('when the construct spans several lines', () => {
      context('but it holds a comment', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(preferSingleLine, `
          move(
            tab, // the tab Chrome created
            index
          );
          `);

          expect(messages).toEqual([]);
        });
      });

      context('but it holds a block body', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(preferSingleLine, `
          tabs.forEach((tab) => {
            move(tab);
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('but it holds a class body', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(preferSingleLine, 'register(\n  class { size = 1; }\n);');

          expect(messages).toEqual([]);
        });
      });

      context('but it holds a template literal that spans lines', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(preferSingleLine, 'warn(`Gave up\nmoving the tab`);');

          expect(messages).toEqual([]);
        });
      });

      context('but it is a link inside a longer chain', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(preferSingleLine, `
          groupTabs
            .filter(isPinned)
            .forEach((tab) => {
              move(tab);
            });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('but it starts a longer run of the same logical operator', () => {
        it('reports nothing', () => {
          const code = 'const isPlaceable = isNew\n  && isPending\n  && isGrouped;';

          const messages = lintWithRule(preferSingleLine, code, [{ max: 45 }]);

          expect(messages).toEqual([]);
        });
      });

      context('but it starts a longer run of the same arithmetic operator', () => {
        it('reports nothing', () => {
          const code = "const warning = 'Gave up '\n  + 'moving '\n  + 'the tab';";

          const messages = lintWithRule(preferSingleLine, code, [{ max: 45 }]);

          expect(messages).toEqual([]);
        });
      });

      context('and it is none of them', () => {
        context('but its single-line form is longer than the maximum', () => {
          context('and the maximum is the default', () => {
            it('reports nothing', () => {
              const code = 'placeTab(\n'
                + '  createdTabFromTheWindowThatTheUserJustOpenedWithTheKeyboardShortcut,\n'
                + '  lastIndexOfTheWindowWhereTheTabWasCreated\n'
                + ');';

              const messages = lintWithRule(preferSingleLine, code);

              expect(messages).toEqual([]);
            });
          });

          context('and the maximum is configured', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(preferSingleLine, 'move(\n  tab,\n  index\n);', [{ max: 16 }]);

              expect(messages).toEqual([]);
            });
          });

          context('and only the text before it makes it longer', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(preferSingleLine, 'const placement = move(\n  tab\n);', [{ max: 20 }]);

              expect(messages).toEqual([]);
            });
          });

          context('and only its indentation makes it longer', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(preferSingleLine, '    move(\n      tab\n    );', [{ max: 12 }]);

              expect(messages).toEqual([]);
            });
          });

          context('and only the text after it makes it longer', () => {
            it('reports nothing', () => {
              const code = 'const tab = buildTab({\n  id: 7\n}) as Tab;';

              const messages = lintWithRule(preferSingleLine, code, [{ max: 35 }]);

              expect(messages).toEqual([]);
            });
          });
        });

        context('and its single-line form is exactly the maximum', () => {
          context('and the maximum is the default', () => {
            it('reports the construct', () => {
              const fitsMessage = 'Fits on one line (120/120 columns): write it on one line.';
              const code = 'placeTab(\n'
                + '  createdTabFromTheWindowThatTheUserJustOpenedWithTheKeyboardShortcut,\n'
                + '  lastIndexOfTheWindowWhereTheTabWasOpened\n'
                + ');';

              const messages = lintWithRule(preferSingleLine, code);

              expect(messages).toMatchObject([{ message: fitsMessage, line: 1, column: 1 }]);
            });
          });

          context('and the maximum is configured', () => {
            it('reports the construct', () => {
              const fitsMessage = 'Fits on one line (17/17 columns): write it on one line.';

              const messages = lintWithRule(preferSingleLine, 'move(\n  tab,\n  index\n);', [{ max: 17 }]);

              expect(messages).toMatchObject([{ message: fitsMessage, line: 1, column: 1 }]);
            });
          });
        });

        context('and its single-line form is shorter than the maximum', () => {
          context('and it is a call', () => {
            it('reports the construct', () => {
              const fitsMessage = 'Fits on one line (17/120 columns): write it on one line.';

              const messages = lintWithRule(preferSingleLine, 'move(\n  tab,\n  index\n);');

              expect(messages).toMatchObject([{ message: fitsMessage, line: 1, column: 1 }]);
            });
          });

          context('and it is a constructor call', () => {
            it('reports the construct', () => {
              const messages = lintWithRule(preferSingleLine, 'const tabsById = new Map(\n  entries\n);');

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 18 }]);
            });
          });

          context('and it is a chain', () => {
            it('reports the construct', () => {
              const messages = lintWithRule(preferSingleLine, 'groupTabs\n  .filter(isPinned)\n  .map(toIndex);');

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 1 }]);
            });
          });

          context('and it is an array', () => {
            it('reports the construct', () => {
              const messages = lintWithRule(preferSingleLine, 'const ids = [\n  1,\n  2\n];');

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 13 }]);
            });
          });

          context('and it is an object', () => {
            it('reports the construct', () => {
              const messages = lintWithRule(preferSingleLine, 'const tab = {\n  id: 7\n};');

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 13 }]);
            });
          });

          context('and it is a logical condition', () => {
            it('reports the construct', () => {
              const code = "const isNew = tab.url === ''\n  && tab.pendingUrl !== undefined;";

              const messages = lintWithRule(preferSingleLine, code);

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 15 }]);
            });
          });

          context('and it is a concatenation', () => {
            it('reports the construct', () => {
              const messages = lintWithRule(preferSingleLine, "const warning = 'Gave up '\n  + 'moving the tab';");

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 17 }]);
            });
          });

          context('and it is a ternary', () => {
            it('reports the construct', () => {
              const code = 'const index = isGrouped\n  ? lastOfGroup\n  : lastOfWindow;';

              const messages = lintWithRule(preferSingleLine, code);

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 15 }]);
            });
          });

          context('and it holds another broken construct', () => {
            it('reports only the outer construct', () => {
              const messages = lintWithRule(preferSingleLine, 'move(\n  [\n    tab\n  ]\n);');

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 1 }]);
            });
          });

          context('and it is inside a broken construct that does not fit', () => {
            it('reports only the inner construct', () => {
              const code = 'placeTab(\n'
                + '  createdTabFromTheWindowThatTheUserJustOpenedWithTheKeyboardShortcut, '
                + 'lastIndexOfTheWindowWhereTheTabWasCreated, [\n'
                + '    1\n'
                + '  ]\n'
                + ');';

              const messages = lintWithRule(preferSingleLine, code);

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 2, column: 115 }]);
            });
          });

          context('and it holds a template literal on one line', () => {
            it('reports the construct', () => {
              const messages = lintWithRule(preferSingleLine, 'log(\n  `tab ${tabId}`\n);');

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 1 }]);
            });
          });

          context('and it holds an empty block', () => {
            it('reports the construct', () => {
              const messages = lintWithRule(preferSingleLine, 'onTabCreated(\n  () => {}\n);');

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 1 }]);
            });
          });

          context('and a comment follows it on its last line', () => {
            it('reports the construct', () => {
              const code = 'const tabs = load(\n  first\n); // the tabs Chrome restored with the session, '
                + 'which stay where Chrome put them, inside their groups';

              const messages = lintWithRule(preferSingleLine, code);

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 14 }]);
            });
          });

          context('and it is the head of a chain that does not fit', () => {
            it('reports only the head', () => {
              const code = 'expect(\n  chrome.tabs.move\n)\n'
                + '  .toHaveBeenCalledWith(createdTab.id, { index: lastIndexOfGroup, windowId: createdTab.windowId });';

              const messages = lintWithRule(preferSingleLine, code);

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 1 }]);
            });
          });

          context('and it is the left side of another logical operator', () => {
            it('reports only the left side', () => {
              const code = 'const isPlaceable = isNewTabOpenedByTheUser\n'
                + '  && isPendingNavigationToAnExternalPage\n'
                + '  || isForcedToTheEndOfTheWindowByTheExtensionSettings;';

              const messages = lintWithRule(preferSingleLine, code);

              expect(messages).toMatchObject([{ messageId: 'preferSingleLine', line: 1, column: 21 }]);
            });
          });
        });
      });
    });
  });
});
