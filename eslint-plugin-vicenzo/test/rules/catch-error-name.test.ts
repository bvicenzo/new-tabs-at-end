import catchErrorName from '../../rules/catch-error-name';
import { lintWithRule } from '../support/lint';

describe('vicenzo/catch-error-name', () => {
  describe('offense detection', () => {
    context('when the preferred name is empty', () => {
      it('rejects the configuration', () => {
        const code = 'try { reorder(); } catch (error) { skip(error); }';

        expect(() => lintWithRule(catchErrorName, code, [{ preferredName: '' }])).toThrow(/shorter than 1 characters/);
      });
    });

    context('when the catch clause binds nothing', () => {
      it('reports nothing', () => {
        const messages = lintWithRule(catchErrorName, 'try { reorder(); } catch { skip(); }');

        expect(messages).toEqual([]);
      });
    });

    context('when the catch clause destructures the error', () => {
      it('reports nothing', () => {
        const messages = lintWithRule(catchErrorName, 'try { reorder(); } catch ({ message }) { skip(message); }');

        expect(messages).toEqual([]);
      });
    });

    context('when the catch clause binds the error to a name', () => {
      context('but it is nested in the body of another catch clause', () => {
        it('reports nothing', () => {
          const messages = lintWithRule(catchErrorName, `
          try {
            reorder();
          } catch (error) {
            try { retry(error); } catch (retryFailure) { skip(retryFailure); }
          }
          `);

          expect(messages).toEqual([]);
        });
      });

      context('and it is nested in the try block of another catch clause', () => {
        it('reports the name', () => {
          const messages = lintWithRule(catchErrorName, `
          try {
            try { reorder(); } catch (failure) { skip(failure); }
          } catch (error) {
            log(error);
          }
          `);

          expect(messages).toMatchObject([{ message: 'Use `error` instead of `failure`.', line: 3, column: 39 }]);
        });
      });

      context('and it is not nested in another catch clause', () => {
        context('and the preferred name is configured', () => {
          context('and the name is the configured one', () => {
            it('reports nothing', () => {
              const code = 'try { reorder(); } catch (failure) { skip(failure); }';

              const messages = lintWithRule(catchErrorName, code, [{ preferredName: 'failure' }]);

              expect(messages).toEqual([]);
            });
          });

          context('but the name is the default one', () => {
            it('reports the name suggesting the configured one', () => {
              const code = 'try { reorder(); } catch (error) { skip(error); }';

              const messages = lintWithRule(catchErrorName, code, [{ preferredName: 'failure' }]);

              expect(messages).toMatchObject([{ message: 'Use `failure` instead of `error`.', line: 1, column: 27 }]);
            });
          });
        });

        context('and the preferred name is the default', () => {
          context('and the name is the preferred one', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(catchErrorName, 'try { reorder(); } catch (error) { skip(error); }');

              expect(messages).toEqual([]);
            });
          });

          context('and the name is the unused form of the preferred one', () => {
            it('reports nothing', () => {
              const messages = lintWithRule(catchErrorName, 'try { reorder(); } catch (_error) { skip(); }');

              expect(messages).toEqual([]);
            });
          });

          context('but the name is another one', () => {
            context('but the body reads an outer variable with the preferred name', () => {
              it('reports nothing', () => {
                const messages = lintWithRule(catchErrorName, `
                const error = lastError();
                try { reorder(); } catch (failure) { compare(error, failure); }
                `);

                expect(messages).toEqual([]);
              });
            });

            context('but the body declares a variable with the preferred name', () => {
              it('reports nothing', () => {
                const code = 'try { reorder(); } catch (failure) { const error = wrap(failure); throw error; }';

                const messages = lintWithRule(catchErrorName, code);

                expect(messages).toEqual([]);
              });
            });

            context('but a function in the body takes a parameter with the preferred name', () => {
              it('reports nothing', () => {
                const code = 'try { reorder(); } catch (failure) { report((error) => log(error, failure)); }';

                const messages = lintWithRule(catchErrorName, code);

                expect(messages).toEqual([]);
              });
            });

            context('and the body uses no variable with the preferred name', () => {
              context('and the name has no leading underscore', () => {
                it('reports the name suggesting the preferred one', () => {
                  const messages = lintWithRule(catchErrorName, 'try { reorder(); } catch (e) { skip(e); }');
                  const errorReport = { message: 'Use `error` instead of `e`.', line: 1, column: 27, endColumn: 28 };

                  expect(messages).toMatchObject([errorReport]);
                });
              });

              context('and the name has a type annotation', () => {
                it('reports only the name', () => {
                  const messages = lintWithRule(catchErrorName, 'try { reorder(); } catch (e: unknown) { skip(e); }');

                  expect(messages).toMatchObject([{ line: 1, column: 27, endColumn: 28 }]);
                });
              });

              context('and the name has a leading underscore', () => {
                it('reports the name suggesting the unused form of the preferred one', () => {
                  const messages = lintWithRule(catchErrorName, 'try { reorder(); } catch (_e) { skip(); }');

                  expect(messages).toMatchObject([{ message: 'Use `_error` instead of `_e`.', line: 1, column: 27 }]);
                });
              });
            });
          });
        });
      });
    });
  });
});
