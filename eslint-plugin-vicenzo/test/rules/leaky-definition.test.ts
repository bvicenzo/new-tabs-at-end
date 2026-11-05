import leakyDefinition from '../../rules/leaky-definition';
import { lintWithRule } from '../support/lint';

describe('vicenzo/leaky-definition', () => {
  describe('offense detection', () => {
    context('when the code has no declaration', () => {
      it('reports nothing', () => {
        const messages = lintWithRule(leakyDefinition, "it('moves the tab', () => {});");

        expect(messages).toEqual([]);
      });
    });

    context('when the declaration is an import declaration', () => {
      it('reports nothing', () => {
        const messages = lintWithRule(leakyDefinition, "import { buildTab } from './support/builders';");

        expect(messages).toEqual([]);
      });
    });

    context('when the declaration is a function declaration', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            function buildTab() {}
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is inside the factory of a vi.doMock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.doMock('./tabs', () => {
            function buildTab() {}
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              function buildTab() {}
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          context('and it is inside the callback of an example', () => {
            context('and directly in it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  function buildTab() {}
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
              });
            });

            context('and nested in a variable declaration of it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  const buildTabs = () => {
                    function buildTab() {}
                  };
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 4 })]);
              });
            });
          });

          context('and it is inside the factory of a vi.hoisted call', () => {
            it('reports the declaration', () => {
              const messages = lintWithRule(leakyDefinition, `
              vi.hoisted(() => {
                function buildTab() {}
              });
              `);

              expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
            });
          });

          context('and it is outside any example callback', () => {
            it('reports the declaration', () => {
              const messages = lintWithRule(leakyDefinition, `
              describe('TabPlacer', () => {
                function buildTab() {}
              });
              `);

              expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
            });
          });
        });
      });
    });

    context('when the declaration is a class declaration', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            class TabFake {}
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              class TabFake {}
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          context('and it is inside the callback of an example', () => {
            context('and directly in it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  class TabFake {}
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
              });
            });

            context('and nested in a variable declaration of it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  const buildTabs = () => {
                    class TabFake {}
                  };
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 4 })]);
              });
            });
          });

          context('and it is outside any example callback', () => {
            it('reports the declaration', () => {
              const messages = lintWithRule(leakyDefinition, `
              describe('TabPlacer', () => {
                class TabFake {}
              });
              `);

              expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
            });
          });
        });
      });
    });

    context('when the declaration is a type alias', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            type TabId = number;
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              type TabId = number;
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          context('and it is inside the callback of an example', () => {
            context('and directly in it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  type TabId = number;
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
              });
            });

            context('and nested in a variable declaration of it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  const buildTabs = () => {
                    type TabId = number;
                  };
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 4 })]);
              });
            });
          });

          context('and it is outside any example callback', () => {
            it('reports the declaration', () => {
              const messages = lintWithRule(leakyDefinition, `
              describe('TabPlacer', () => {
                type TabId = number;
              });
              `);

              expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
            });
          });
        });
      });
    });

    context('when the declaration is an interface', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            interface TabShape { id: number }
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              interface TabShape { id: number }
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          context('and it is inside the callback of an example', () => {
            context('and directly in it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  interface TabShape { id: number }
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
              });
            });

            context('and nested in a variable declaration of it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  const buildTabs = () => {
                    interface TabShape { id: number }
                  };
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 4 })]);
              });
            });
          });

          context('and it is outside any example callback', () => {
            it('reports the declaration', () => {
              const messages = lintWithRule(leakyDefinition, `
              describe('TabPlacer', () => {
                interface TabShape { id: number }
              });
              `);

              expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
            });
          });
        });
      });
    });

    context('when the declaration is an enum', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            enum Placement { End }
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              enum Placement { End }
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          context('and it is inside the callback of an example', () => {
            context('and directly in it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  enum Placement { End }
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
              });
            });

            context('and nested in a variable declaration of it', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  const buildTabs = () => {
                    enum Placement { End }
                  };
                });
                `);

                expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 4 })]);
              });
            });
          });

          context('and it is outside any example callback', () => {
            it('reports the declaration', () => {
              const messages = lintWithRule(leakyDefinition, `
              describe('TabPlacer', () => {
                enum Placement { End }
              });
              `);

              expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
            });
          });
        });
      });
    });

    context('when the declaration is a function signature without a body', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            function buildTab(tabId: number): void;
            function buildTab(tabId: unknown) {}
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              function buildTab(tabId: number): void;
              function buildTab(tabId: unknown) {}
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          context('and it is inside the callback of an example', () => {
            context('and directly in it', () => {
              it('reports each signature and the implementation', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  function buildTab(tabId: number): void;
                  function buildTab(tabId: unknown) {}
                });
                `);

                const signatureReport = { messageId: 'leakyDefinition', line: 3 };
                const implementationReport = { messageId: 'leakyDefinition', line: 4 };

                expect(messages).toMatchObject([signatureReport, implementationReport]);
              });
            });

            context('and nested in a variable declaration of it', () => {
              it('reports each signature and the implementation', () => {
                const messages = lintWithRule(leakyDefinition, `
                it('moves the tab', () => {
                  const buildTabs = () => {
                    function buildTab(tabId: number): void;
                    function buildTab(tabId: unknown) {}
                  };
                });
                `);

                const signatureReport = { messageId: 'leakyDefinition', line: 4 };
                const implementationReport = { messageId: 'leakyDefinition', line: 5 };

                expect(messages).toMatchObject([signatureReport, implementationReport]);
              });
            });
          });

          context('and it is outside any example callback', () => {
            context('and it is ambient', () => {
              it('reports the declaration', () => {
                const messages = lintWithRule(leakyDefinition, 'declare function buildTab(): void;');

                expect(messages)
                  .toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
              });
            });

            context('and it overloads a function declaration', () => {
              it('reports each signature and the implementation', () => {
                const messages = lintWithRule(leakyDefinition, `
                describe('TabPlacer', () => {
                  function buildTab(tabId: number): void;
                  function buildTab(tabId: unknown) {}
                });
                `);

                const signatureReport = { messageId: 'leakyDefinition', line: 3 };
                const implementationReport = { messageId: 'leakyDefinition', line: 4 };

                expect(messages).toMatchObject([signatureReport, implementationReport]);
              });
            });
          });
        });
      });
    });

    context('when the declaration is a const declaration', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            const tabId = 1;
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is inside the callback of an example', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          it('moves the tab', () => {
            const tabId = 1;
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any example callback or vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              const tabId = 1;
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          it('reports the declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            describe('TabPlacer', () => {
              const tabId = 1;
            });
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
          });
        });
      });
    });

    context('when the declaration is a let declaration', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            let tabId = 1;
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is inside the callback of an example', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          it('moves the tab', () => {
            let tabId = 1;
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any example callback or vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              let tabId = 1;
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          it('reports the declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            describe('TabPlacer', () => {
              let tabId = 1;
            });
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
          });
        });
      });
    });

    context('when the declaration is a var declaration', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            var tabId = 1;
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is inside the callback of an example', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          it('moves the tab', () => {
            var tabId = 1;
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any example callback or vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              var tabId = 1;
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          it('reports the declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            describe('TabPlacer', () => {
              var tabId = 1;
            });
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
          });
        });
      });
    });

    context('when the declaration is a using declaration', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', () => {
            using openedTab = openTab();
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is inside the callback of an example', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          it('moves the tab', () => {
            using openedTab = openTab();
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any example callback or vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            function buildTabs() {
              using openedTab = openTab();
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          it('reports the declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            describe('TabPlacer', () => {
              using openedTab = openTab();
            });
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
          });
        });
      });
    });

    context('when the declaration is an await using declaration', () => {
      context('and it is inside the factory of a vi.mock call', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          vi.mock('./tabs', async () => {
            await using openedTab = openTab();
            return {};
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is inside the callback of an example', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, `
          it('moves the tab', async () => {
            await using openedTab = openTab();
          });
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is outside any example callback or vi.mock factory', () => {
        context('but it is nested in a leaking function declaration', () => {
          it('reports only the outer declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            async function buildTabs() {
              await using openedTab = openTab();
            }
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
          });
        });

        context('and it is not nested in a leaking declaration', () => {
          it('reports the declaration', () => {
            const messages = lintWithRule(leakyDefinition, `
            describe('TabPlacer', async () => {
              await using openedTab = openTab();
            });
            `);

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 3 })]);
          });
        });
      });
    });

    context('when the declaration is a namespace', () => {
      context('and its body is empty', () => {
        it('reports the declaration', () => {
          const messages = lintWithRule(leakyDefinition, 'namespace Tabs {}');

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
        });
      });

      context('and its body contains declarations', () => {
        it('reports only the namespace', () => {
          const messages = lintWithRule(leakyDefinition, `
          namespace Tabs {
            const tabId = 1;
          }
          `);

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
        });
      });
    });

    context('when the declaration is a module augmentation', () => {
      context('and it has no body', () => {
        it('reports the declaration', () => {
          const messages = lintWithRule(leakyDefinition, "declare module './tabs';");

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
        });
      });

      context('and its body contains declarations', () => {
        it('reports only the augmentation', () => {
          const messages = lintWithRule(leakyDefinition, `
          declare module './tabs' {
            interface Tab { pinned: boolean }
          }
          `);

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
        });
      });
    });

    context('when the declaration is a global augmentation', () => {
      context('and its body is empty', () => {
        it('reports the declaration', () => {
          const messages = lintWithRule(leakyDefinition, 'declare global {}');

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
        });
      });

      context('and its body contains declarations', () => {
        it('reports only the augmentation', () => {
          const messages = lintWithRule(leakyDefinition, `
          declare global {
            interface Window { tabId: number }
          }
          `);

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
        });
      });
    });

    context('when the statement exports without declaring', () => {
      context('and it re-exports from another module', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, "export { buildTab } from './support/builders';");

          expect(messages).toEqual([]);
        });
      });

      context('and it exports an expression as default', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(leakyDefinition, 'export default { tabId: 1 };');

          expect(messages).toEqual([]);
        });
      });

      context('and it exports names declared in the file', () => {
        it('reports only their declarations', () => {
          const messages = lintWithRule(leakyDefinition, `
          const tabId = 1;
          export { tabId };
          `);

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
        });
      });
    });

    context('when the declaration is exported', () => {
      context('and it is a named export', () => {
        context('and it exports a function declaration', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export function buildTab() {}');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports a class declaration', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export class TabFake {}');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports a type alias', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export type TabId = number;');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports an interface', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export interface TabShape { id: number }');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports an enum', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export enum Placement { End }');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports a const declaration', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export const tabId = 1;');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports a let declaration', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export let tabId = 1;');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports a var declaration', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export var tabId = 1;');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports a function signature without a body', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export declare function buildTab(): void;');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports a namespace', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export namespace Tabs {}');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });
      });

      context('and it is a default export', () => {
        context('and it exports a named function declaration', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export default function buildTab() {}');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports an anonymous function declaration', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export default function () {}');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports a named class declaration', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export default class TabFake {}');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports an anonymous class declaration', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export default class {}');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });

        context('and it exports an interface', () => {
          it('reports the export statement', () => {
            const messages = lintWithRule(leakyDefinition, 'export default interface TabShape { id: number }');

            expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
          });
        });
      });
    });

    context('when a leaking declaration holds further definitions', () => {
      context('and it declares several variables', () => {
        it('reports the declaration as one problem', () => {
          const messages = lintWithRule(leakyDefinition, 'const tabId = 1, windowId = 2;');

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
        });
      });

      context('and it is a variable initialized with an arrow function', () => {
        it('reports only the variable declaration', () => {
          const messages = lintWithRule(leakyDefinition, 'const buildTab = () => ({ id: 1 });');

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
        });
      });

      context('and it is a variable initialized with a class expression', () => {
        it('reports only the variable declaration', () => {
          const messages = lintWithRule(leakyDefinition, 'const TabFake = class {};');

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 1, column: 1 })]);
        });
      });

      context('and it is a variable whose arrow function declares a variable', () => {
        it('reports only the variable declaration', () => {
          const messages = lintWithRule(leakyDefinition, `
          const buildTab = () => {
            const tabId = 1;
          };
          `);

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
        });
      });

      context('and it is a variable whose class expression declares a variable in a method', () => {
        it('reports only the variable declaration', () => {
          const messages = lintWithRule(leakyDefinition, `
          const TabFake = class {
            move() {
              const tabIndex = 1;
            }
          };
          `);

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
        });
      });

      context('and it is a class declaration whose method declares a variable', () => {
        it('reports only the class declaration', () => {
          const messages = lintWithRule(leakyDefinition, `
          class TabFake {
            move() {
              const tabIndex = 1;
            }
          }
          `);

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
        });
      });

      context('and it is a function declaration whose inner callback declares a variable', () => {
        it('reports only the function declaration', () => {
          const messages = lintWithRule(leakyDefinition, `
          function buildTabs() {
            [1, 2].forEach(() => {
              const tabId = 1;
            });
          }
          `);

          expect(messages).toEqual([expect.objectContaining({ messageId: 'leakyDefinition', line: 2 })]);
        });
      });
    });
  });
});
