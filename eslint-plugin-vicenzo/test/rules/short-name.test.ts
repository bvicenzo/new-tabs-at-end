import shortName from '../../rules/short-name';
import { lintWithRule } from '../support/lint';

describe('vicenzo/short-name', () => {
  describe('offense detection', () => {
    context('when the minimum is below one', () => {
      it('rejects the configuration', () => {
        const code = 'const tab = buildTab();';

        expect(() => lintWithRule(shortName, code, [{ minNameLength: 0 }])).toThrow(/should be >= 1/);
      });
    });

    context('when the minimum is configured', () => {
      context('and the name spells fewer letters than it', () => {
        it('reports the name naming the configured minimum', () => {
          const shortNameMessage = 'Name `book` spells 4 letter(s); at least 5 are required. '
            + 'A letter or an abbreviation carries no meaning to the next reader — write the whole word, '
            + 'in the language of the domain (`waitingTime`), not a shapeless label (`key`, `value`, `item`).';

          const messages = lintWithRule(shortName, 'const book = build();', [{ minNameLength: 5 }]);

          expect(messages).toMatchObject([{ messageId: 'shortName', message: shortNameMessage }]);
        });
      });

      context('and the name spells exactly that many', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(shortName, 'const title = build();', [{ minNameLength: 5 }]);

          expect(messages).toEqual([]);
        });
      });
    });

    context('when the minimum is the default', () => {
      context('and the name is not a variable or a parameter', () => {
        context('and it is a function name', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(shortName, 'function go() {}');

            expect(messages).toEqual([]);
          });
        });

        context('and it is a class name', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(shortName, 'class Id {}');

            expect(messages).toEqual([]);
          });
        });

        context('and it is an enum name', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(shortName, 'enum Ui { Dark }');

            expect(messages).toEqual([]);
          });
        });

        context('and it is a type parameter', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(shortName, 'function first<T>(items: T[]) {}');

            expect(messages).toEqual([]);
          });
        });

        context('and it is an import binding', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(shortName, "import { ok } from 'node:assert';");

            expect(messages).toEqual([]);
          });
        });

        context('and it is a caught error', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(shortName, 'try { move(); } catch (e) { log(); }');

            expect(messages).toEqual([]);
          });
        });

        context('and it is destructured from a caught error', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(shortName, 'try { move(); } catch ({ message: m }) { log(); }');

            expect(messages).toEqual([]);
          });
        });
      });

      context('and the name is a variable or a parameter', () => {
        context('but it is made only of underscores', () => {
          it('reports nothing', () => {
            const messages = lintWithRule(shortName, 'const [_, column] = coordinates;');

            expect(messages).toEqual([]);
          });
        });

        context('and it spells at least the minimum', () => {
          context('and it spells exactly the minimum', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'const tab = buildTab();');

              expect(messages).toEqual([]);
            });
          });

          context('and it spells more letters than the minimum', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'const tabs = queryTabs();');

              expect(messages).toEqual([]);
            });
          });

          context('and digits make up part of it', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'const v12 = readVersion();');

              expect(messages).toEqual([]);
            });
          });
        });

        context('but it spells fewer letters than the minimum', () => {
          context('but an object shorthand in its scope reads it', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'const id = 7; move({ id });');

              expect(messages).toEqual([]);
            });
          });

          context('but a destructuring shorthand binds it', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'const { id } = tab;');

              expect(messages).toEqual([]);
            });
          });

          context('but a destructuring shorthand with a default binds it', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'const { id = 0 } = tab;');

              expect(messages).toEqual([]);
            });
          });

          context('but a destructuring shorthand of a parameter binds it', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'function place({ id }) {}');

              expect(messages).toEqual([]);
            });
          });

          context('but an ambient declaration declares it', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'declare const $: unknown;');

              expect(messages).toEqual([]);
            });
          });

          context('but it is declared inside an ambient block', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'declare global { var z: number; }');

              expect(messages).toEqual([]);
            });
          });

          context('but it is a parameter of an ambient function', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(shortName, 'declare function place(t: Tab): void;');

              expect(messages).toEqual([]);
            });
          });

          context('and only another variable of the same name is read by an object shorthand', () => {
            it('reports the variable no shorthand reads', () => {
              const messages = lintWithRule(shortName, `
              function track() { const id = 7; }
              function place(id) { return { id }; }
              `);

              expect(messages).toMatchObject([{ messageId: 'shortName', line: 2, column: 40 }]);
            });
          });

          context('and nothing imposes it', () => {
            context('and it is a const', () => {
              it('reports the name naming its letters and the minimum', () => {
                const shortNameMessage = 'Name `t` spells 1 letter(s); at least 3 are required. '
                  + 'A letter or an abbreviation carries no meaning to the next reader — write the whole word, '
                  + 'in the language of the domain (`waitingTime`), not a shapeless label (`key`, `value`, `item`).';

                const messages = lintWithRule(shortName, 'const t = tab;');
                const constReport = { messageId: 'shortName', message: shortNameMessage, line: 1, column: 7 };

                expect(messages).toMatchObject([constReport]);
              });
            });

            context('and it is a let', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'let t = tab;');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 5, endColumn: 6 }]);
              });
            });

            context('and it is a var', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'var t = tab;');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 5, endColumn: 6 }]);
              });
            });

            context('and it has a type annotation', () => {
              it('reports only the name', () => {
                const messages = lintWithRule(shortName, 'const t: Tab = tab;');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 7, endColumn: 8 }]);
              });
            });

            context('and it is an array destructuring element', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'const [x, row] = coordinates;');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 8, endColumn: 9 }]);
              });
            });

            context('and it is a renamed destructured property', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'const { index: ix } = tab;');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 16, endColumn: 18 }]);
              });
            });

            context('and it is a destructured rest element', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'const { id: tabId, ...xs } = tab;');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 23, endColumn: 25 }]);
              });
            });

            context('and it is a function parameter', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'function place(t) {}');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 16, endColumn: 17 }]);
              });
            });

            context('and it is an arrow function parameter', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'tabs.map((t) => t.id);');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 11, endColumn: 12 }]);
              });
            });

            context('and it is a method parameter', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'class Placer { place(t) {} }');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 22, endColumn: 23 }]);
              });
            });

            context('and it is a parameter with a default', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'function place(t = tab) {}');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 16, endColumn: 17 }]);
              });
            });

            context('and it is a rest parameter', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'function place(...ts) {}');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 19, endColumn: 21 }]);
              });
            });

            context('and it is a renamed property of a destructured parameter', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'function place({ index: ix }) {}');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 25, endColumn: 27 }]);
              });
            });

            context('and it is a constructor parameter property', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'class Placer { constructor(private db: Db) {} }');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 36, endColumn: 38 }]);
              });
            });

            context('and it is a parameter of a function type', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'type Place = (t: Tab) => void;');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 15, endColumn: 16 }]);
              });
            });

            context('and it is a parameter of a method signature', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'interface Placer { place(t: Tab): void }');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 26, endColumn: 27 }]);
              });
            });

            context('and it is a parameter of an overload signature', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'function place(t: Tab): void;');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 16, endColumn: 17 }]);
              });
            });

            context('and it is the variable of a classic for', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'for (let i = 0; i < 3; i += 1) {}');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 10, endColumn: 11 }]);
              });
            });

            context('and it is the variable of a for…of', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'for (const t of tabs) {}');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 12, endColumn: 13 }]);
              });
            });

            context('and it is the variable of a for…in', () => {
              it('reports the name', () => {
                const messages = lintWithRule(shortName, 'for (const k in tabsById) {}');

                expect(messages).toMatchObject([{ messageId: 'shortName', line: 1, column: 12, endColumn: 13 }]);
              });
            });

            context('and it has a leading underscore', () => {
              it('reports the name counting only its letters', () => {
                const shortNameMessage = 'Name `_p` spells 1 letter(s); at least 3 are required. '
                  + 'A letter or an abbreviation carries no meaning to the next reader — write the whole word, '
                  + 'in the language of the domain (`waitingTime`), not a shapeless label (`key`, `value`, `item`).';

                const messages = lintWithRule(shortName, 'const _p = tab;');

                expect(messages).toMatchObject([{ messageId: 'shortName', message: shortNameMessage }]);
              });
            });

            context('and underscores separate its letters', () => {
              it('reports the name counting only its letters', () => {
                const shortNameMessage = 'Name `a_b` spells 2 letter(s); at least 3 are required. '
                  + 'A letter or an abbreviation carries no meaning to the next reader — write the whole word, '
                  + 'in the language of the domain (`waitingTime`), not a shapeless label (`key`, `value`, `item`).';

                const messages = lintWithRule(shortName, 'const a_b = tab;');

                expect(messages).toMatchObject([{ messageId: 'shortName', message: shortNameMessage }]);
              });
            });
          });
        });
      });
    });
  });
});
