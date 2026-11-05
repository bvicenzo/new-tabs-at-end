import anonymousUnusedName from '../../rules/anonymous-unused-name';
import { lintWithRule } from '../support/lint';

describe('vicenzo/anonymous-unused-name', () => {
  describe('offense detection', () => {
    context('when a destructuring skips a value with an array hole', () => {
      it('reports nothing', () => {
        const messages = lintWithRule(anonymousUnusedName, "const [, author] = line.split(';');");

        expect(messages).toEqual([]);
      });
    });

    context('when the name is not a variable, a parameter or a caught error', () => {
      context('and it is a function name', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(anonymousUnusedName, 'function _() {}');

          expect(messages).toEqual([]);
        });
      });

      context('and it is an import binding', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(anonymousUnusedName, "import { strict as _ } from 'node:assert';");

          expect(messages).toEqual([]);
        });
      });
    });

    context('when the name is a variable, a parameter or a caught error', () => {
      context('but it has a character other than an underscore', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(anonymousUnusedName, "const [_isbn, copies] = line.split(';');");

          expect(messages).toEqual([]);
        });
      });

      context('and it is made only of underscores', () => {
        context('and it is a parameter', () => {
          context('and it is a function parameter', () => {
            it('reports the name as a parameter', () => {
              const anonymousParameterMessage = 'Name this parameter: an unused value still means something, '
                + 'and `_` hides what. Name it after what it stands for in the domain (`_previousOwner`), '
                + 'not after its shape (`_value`, `_key`, `_item`) — that tells the next reader nothing.';

              const messages = lintWithRule(anonymousUnusedName, 'function notify(reader, _) {}');
              const parameterReport = { message: anonymousParameterMessage, line: 1, column: 25, endColumn: 26 };

              expect(messages).toMatchObject([parameterReport]);
            });
          });

          context('and it is an arrow function parameter', () => {
            it('reports the name', () => {
              const code = 'copiesByIsbn.forEach((copies, _) => reserve(copies));';

              const messages = lintWithRule(anonymousUnusedName, code);

              expect(messages).toMatchObject([{ messageId: 'anonymousUnusedName', line: 1, column: 31 }]);
            });
          });

          context('and it is an element of a destructured parameter', () => {
            it('reports the name', () => {
              const messages = lintWithRule(anonymousUnusedName, 'entries.forEach(([_, id]) => track(id));');

              expect(messages).toMatchObject([{ messageId: 'anonymousUnusedName', line: 1, column: 19 }]);
            });
          });

          context('and it is a rest parameter', () => {
            it('reports the name', () => {
              const messages = lintWithRule(anonymousUnusedName, 'function notify(..._) {}');

              expect(messages).toMatchObject([{ messageId: 'anonymousUnusedName', line: 1, column: 20 }]);
            });
          });

          context('and it is a parameter with a default', () => {
            it('reports the name', () => {
              const messages = lintWithRule(anonymousUnusedName, 'function notify(_ = channel) {}');
              const defaultReport = { messageId: 'anonymousUnusedName', line: 1, column: 17, endColumn: 18 };

              expect(messages).toMatchObject([defaultReport]);
            });
          });

          context('and it is a constructor parameter property', () => {
            it('reports the name', () => {
              const code = 'class Notifier { constructor(private _: Channel) {} }';

              const messages = lintWithRule(anonymousUnusedName, code);
              const propertyReport = { messageId: 'anonymousUnusedName', line: 1, column: 38, endColumn: 39 };

              expect(messages).toMatchObject([propertyReport]);
            });
          });

          context('and it is a parameter of a function type', () => {
            it('reports the name', () => {
              const messages = lintWithRule(anonymousUnusedName, 'type Notify = (_: Reader) => void;');
              const signatureReport = { messageId: 'anonymousUnusedName', line: 1, column: 16, endColumn: 17 };

              expect(messages).toMatchObject([signatureReport]);
            });
          });
        });

        context('and it is a variable', () => {
          context('and it is an array destructuring element', () => {
            it('reports the name as a discarded value', () => {
              const anonymousValueMessage = 'Name this discarded value: an unused value still means something, '
                + 'and `_` hides what. Name it after what it stands for in the domain (`_previousOwner`), '
                + 'not after its shape (`_value`, `_key`, `_item`) — that tells the next reader nothing.';

              const messages = lintWithRule(anonymousUnusedName, "const [title, _] = line.split(';');");
              const valueReport = { message: anonymousValueMessage, line: 1, column: 15, endColumn: 16 };

              expect(messages).toMatchObject([valueReport]);
            });
          });

          context('and it is a renamed destructured property', () => {
            it('reports the name', () => {
              const messages = lintWithRule(anonymousUnusedName, 'const { author: _, title } = book;');

              expect(messages).toMatchObject([{ messageId: 'anonymousUnusedName', line: 1, column: 17 }]);
            });
          });

          context('and it is several underscores', () => {
            it('reports the name', () => {
              const messages = lintWithRule(anonymousUnusedName, "const [__, author] = line.split(';');");

              expect(messages).toMatchObject([{ messageId: 'anonymousUnusedName', line: 1, column: 8, endColumn: 10 }]);
            });
          });

          context('and it is not destructured', () => {
            it('reports the name', () => {
              const messages = lintWithRule(anonymousUnusedName, 'const _ = shelf.reorder();');

              expect(messages).toMatchObject([{ messageId: 'anonymousUnusedName', line: 1, column: 7 }]);
            });
          });
        });

        context('and it is a caught error', () => {
          context('and the error is bound whole', () => {
            it('reports the name as a caught error', () => {
              const anonymousErrorMessage = 'Name this caught error: an unused value still means something, '
                + 'and `_` hides what. Name it after what it stands for in the domain (`_previousOwner`), '
                + 'not after its shape (`_value`, `_key`, `_item`) — that tells the next reader nothing.';

              const messages = lintWithRule(anonymousUnusedName, 'try { reorder(); } catch (_) { skip(); }');
              const errorReport = { message: anonymousErrorMessage, line: 1, column: 27, endColumn: 28 };

              expect(messages).toMatchObject([errorReport]);
            });
          });

          context('and the error is destructured', () => {
            it('reports the name as a caught error', () => {
              const anonymousErrorMessage = 'Name this caught error: an unused value still means something, '
                + 'and `_` hides what. Name it after what it stands for in the domain (`_previousOwner`), '
                + 'not after its shape (`_value`, `_key`, `_item`) — that tells the next reader nothing.';
              const code = 'try { reorder(); } catch ({ message: _ }) { skip(); }';

              const messages = lintWithRule(anonymousUnusedName, code);

              expect(messages).toMatchObject([{ message: anonymousErrorMessage, line: 1, column: 38 }]);
            });
          });
        });
      });
    });
  });
});
