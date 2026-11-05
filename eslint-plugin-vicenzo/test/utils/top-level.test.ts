import { isAtTopLevel } from '../../utils/top-level';
import { callNamed, parseProgram } from '../support/parse';

describe('utils/top-level', () => {
  describe('isAtTopLevel', () => {
    context('when the call has no enclosing group', () => {
      it('returns true', () => {
        const target = callNamed(parseProgram('target();'), 'target');

        expect(isAtTopLevel(target)).toBe(true);
      });
    });

    context('when the call has an enclosing group', () => {
      context('but that group is nested in another group', () => {
        it('returns false', () => {
          const program = parseProgram(`
          describe('TabPlacer', () => {
            context('when the tab is new', () => {
              target();
            });
          });
          `);

          expect(isAtTopLevel(callNamed(program, 'target'))).toBe(false);
        });
      });

      context('and that group is the outermost group', () => {
        it('returns true', () => {
          const program = parseProgram(`
          describe('TabPlacer', () => {
            target();
          });
          `);

          expect(isAtTopLevel(callNamed(program, 'target'))).toBe(true);
        });
      });
    });
  });
});
