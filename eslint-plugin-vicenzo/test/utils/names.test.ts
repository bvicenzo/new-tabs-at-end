import { isAnonymous, nameLocation, spelledLength } from '../../utils/names';
import { firstDeclaredIdentifier, parseProgram } from '../support/parse';

describe('utils/names', () => {
  describe('isAnonymous', () => {
    context('when the name is made only of underscores', () => {
      context('and it is one underscore', () => {
        it('returns true', () => {
          expect(isAnonymous('_')).toBe(true);
        });
      });

      context('and it is several underscores', () => {
        it('returns true', () => {
          expect(isAnonymous('__')).toBe(true);
        });
      });
    });

    context('when the name has a character other than an underscore', () => {
      it('returns false', () => {
        expect(isAnonymous('_p')).toBe(false);
      });
    });
  });

  describe('spelledLength', () => {
    context('when the name has no underscores', () => {
      it('returns its length', () => {
        expect(spelledLength('tab')).toBe(3);
      });
    });

    context('when underscores lead the name', () => {
      it('counts only the characters after them', () => {
        expect(spelledLength('__p')).toBe(1);
      });
    });

    context('when underscores separate its words', () => {
      it('counts only the characters between them', () => {
        expect(spelledLength('a_b')).toBe(2);
      });
    });

    context('when the name has digits', () => {
      it('counts the digits', () => {
        expect(spelledLength('v12')).toBe(3);
      });
    });
  });

  describe('nameLocation', () => {
    context('when the identifier has no type annotation', () => {
      it('spans the name', () => {
        const identifier = firstDeclaredIdentifier(parseProgram('const tab = buildTab();'));

        expect(nameLocation(identifier)).toEqual({ start: { line: 1, column: 6 }, end: { line: 1, column: 9 } });
      });
    });

    context('when the identifier has a type annotation', () => {
      it('spans only the name', () => {
        const identifier = firstDeclaredIdentifier(parseProgram('const tab: Tab = buildTab();'));

        expect(nameLocation(identifier)).toEqual({ start: { line: 1, column: 6 }, end: { line: 1, column: 9 } });
      });
    });
  });
});
