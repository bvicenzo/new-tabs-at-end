import { joinTokens } from '../../utils/one-line';
import { tokensOf } from '../support/parse';

describe('utils/one-line', () => {
  describe('joinTokens', () => {
    context('when two tokens share a line', () => {
      context('and nothing separates them in the source', () => {
        it('joins them with nothing', () => {
          expect(joinTokens(tokensOf('move(tab);'))).toBe('move(tab);');
        });
      });

      context('and spaces separate them in the source', () => {
        it('joins them with one space', () => {
          expect(joinTokens(tokensOf('isNew  &&  isGrouped;'))).toBe('isNew && isGrouped;');
        });
      });
    });

    context('when a line break separates two tokens', () => {
      context('and the first opens a parenthesis', () => {
        it('joins them with nothing', () => {
          expect(joinTokens(tokensOf('move(\ntab);'))).toBe('move(tab);');
        });
      });

      context('and the first opens a bracket', () => {
        it('joins them with nothing', () => {
          expect(joinTokens(tokensOf('ids = [\n1];'))).toBe('ids = [1];');
        });
      });

      context('and the second closes a parenthesis', () => {
        it('joins them with nothing', () => {
          expect(joinTokens(tokensOf('move(tab\n);'))).toBe('move(tab);');
        });
      });

      context('and the second closes a bracket', () => {
        it('joins them with nothing', () => {
          expect(joinTokens(tokensOf('ids = [1\n];'))).toBe('ids = [1];');
        });
      });

      context('and the first opens a brace', () => {
        context('and the second closes it', () => {
          it('joins them with nothing', () => {
            expect(joinTokens(tokensOf('tab = {\n};'))).toBe('tab = {};');
          });
        });

        context('and the second does not close it', () => {
          it('joins them with one space', () => {
            expect(joinTokens(tokensOf('tab = {\nid: 7 };'))).toBe('tab = { id: 7 };');
          });
        });
      });

      context('and the second closes a brace', () => {
        it('joins them with one space', () => {
          expect(joinTokens(tokensOf('tab = { id: 7\n};'))).toBe('tab = { id: 7 };');
        });
      });

      context('and the second is a dot', () => {
        it('joins them with nothing', () => {
          expect(joinTokens(tokensOf('tabs\n.map(toIndex);'))).toBe('tabs.map(toIndex);');
        });
      });

      context('and the second is an optional chaining dot', () => {
        it('joins them with nothing', () => {
          expect(joinTokens(tokensOf('tab\n?.discard();'))).toBe('tab?.discard();');
        });
      });

      context('and the second is a comma', () => {
        it('joins them with nothing', () => {
          expect(joinTokens(tokensOf('move(tab\n, index);'))).toBe('move(tab, index);');
        });
      });

      context('and the second is a semicolon', () => {
        it('joins them with nothing', () => {
          expect(joinTokens(tokensOf('move(tab)\n;'))).toBe('move(tab);');
        });
      });

      context('and neither is a bracket, a dot, a comma or a semicolon', () => {
        it('joins them with one space', () => {
          expect(joinTokens(tokensOf('isNew\n&& isGrouped;'))).toBe('isNew && isGrouped;');
        });
      });
    });
  });
});
