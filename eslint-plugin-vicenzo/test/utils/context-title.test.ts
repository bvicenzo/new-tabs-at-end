import { firstWord, literalTitle } from '../../utils/context-title';
import { firstCall, parseProgram } from '../support/parse';

describe('utils/context-title', () => {
  describe('literalTitle', () => {
    context('when the call has no argument', () => {
      it('returns null', () => {
        const call = firstCall(parseProgram('context();'));

        expect(literalTitle(call)).toBeNull();
      });
    });

    context('when the call has a first argument', () => {
      context('but it is an identifier', () => {
        it('returns null', () => {
          const call = firstCall(parseProgram('context(title, () => {});'));

          expect(literalTitle(call)).toBeNull();
        });
      });

      context('but it is a template literal with expressions', () => {
        it('returns null', () => {
          const call = firstCall(parseProgram('context(`and ${state}`, () => {});'));

          expect(literalTitle(call)).toBeNull();
        });
      });

      context('but it is a non-string literal', () => {
        it('returns null', () => {
          const call = firstCall(parseProgram('context(42, () => {});'));

          expect(literalTitle(call)).toBeNull();
        });
      });

      context('and it is a string literal', () => {
        it('returns its text', () => {
          const call = firstCall(parseProgram("context('when the tab is new', () => {});"));

          expect(literalTitle(call)).toBe('when the tab is new');
        });
      });

      context('and it is a template literal without expressions', () => {
        it('returns its text', () => {
          const call = firstCall(parseProgram('context(`with a pinned tab`, () => {});'));

          expect(literalTitle(call)).toBe('with a pinned tab');
        });
      });
    });
  });

  describe('firstWord', () => {
    context('when the text is empty', () => {
      it('returns an empty word', () => {
        expect(firstWord('')).toBe('');
      });
    });

    context('when the text has only whitespace', () => {
      it('returns an empty word', () => {
        expect(firstWord('   ')).toBe('');
      });
    });

    context('when the text has a visible character', () => {
      context('but the first one is not a letter', () => {
        it('returns an empty word', () => {
          expect(firstWord('#onTabCreated')).toBe('');
        });
      });

      context('and the first one is a letter', () => {
        context('and whitespace precedes it', () => {
          it('returns only the letters', () => {
            expect(firstWord('  and the tab is pinned')).toBe('and');
          });
        });

        context('and nothing precedes it', () => {
          context('and the letters are lowercase', () => {
            context('and the letters run to the end', () => {
              it('returns the whole text', () => {
                expect(firstWord('when')).toBe('when');
              });
            });

            context('and a space follows them', () => {
              it('returns only the letters', () => {
                expect(firstWord('with a pinned tab')).toBe('with');
              });
            });

            context('and a punctuation mark follows them', () => {
              it('returns only the letters', () => {
                expect(firstWord('when: the tab is new')).toBe('when');
              });
            });

            context('and an underscore follows them', () => {
              it('returns only the letters', () => {
                expect(firstWord('with_pinned_tab')).toBe('with');
              });
            });

            context('and a digit follows them', () => {
              it('returns only the letters', () => {
                expect(firstWord('with2 tabs')).toBe('with');
              });
            });

            context('and a non-ASCII letter continues them', () => {
              it('returns only the letters', () => {
                expect(firstWord('butão is a country')).toBe('butão');
              });
            });
          });

          context('and some letters are capitals', () => {
            it('returns them lowercased', () => {
              expect(firstWord('When the tab is new')).toBe('when');
            });
          });
        });
      });
    });
  });
});
