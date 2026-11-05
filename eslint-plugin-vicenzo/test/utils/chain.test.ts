import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { isLink, nextLink, unwrapped } from '../../utils/chain';
import { callNamed, firstCall, firstExpression, lastCall, parseProgram } from '../support/parse';

describe('utils/chain', () => {
  describe('isLink', () => {
    context('when the node is not a call', () => {
      it('returns false', () => {
        expect(isLink(firstExpression(parseProgram('tabs.length;')))).toBe(false);
      });
    });

    context('when the node is a call', () => {
      context('but its callee is an identifier', () => {
        it('returns false', () => {
          expect(isLink(firstCall(parseProgram('move(tab);')))).toBe(false);
        });
      });

      context('but its callee is a computed member', () => {
        it('returns false', () => {
          expect(isLink(firstCall(parseProgram('handlers[kind](tab);')))).toBe(false);
        });
      });

      context('and its callee is a member named by a property', () => {
        it('returns true', () => {
          expect(isLink(firstCall(parseProgram('tabs.map(toIndex);')))).toBe(true);
        });
      });
    });
  });

  describe('unwrapped', () => {
    context('when nothing wraps the expression', () => {
      it('returns the expression', () => {
        const expression = firstExpression(parseProgram('tab;'));

        expect(unwrapped(expression)).toBe(expression);
      });
    });

    context('when a non-null assertion wraps the expression', () => {
      it('returns the expression under it', () => {
        expect(unwrapped(firstExpression(parseProgram('tab!;')))).toMatchObject({ name: 'tab' });
      });
    });

    context('when a type assertion wraps the expression', () => {
      it('returns the expression under it', () => {
        expect(unwrapped(firstExpression(parseProgram('tab as Tab;')))).toMatchObject({ name: 'tab' });
      });
    });

    context('when a satisfies check wraps the expression', () => {
      it('returns the expression under it', () => {
        expect(unwrapped(firstExpression(parseProgram('tab satisfies Tab;')))).toMatchObject({ name: 'tab' });
      });
    });

    context('when the expression is an optional chain', () => {
      it('returns the member access under it', () => {
        const optionalAccess = { type: AST_NODE_TYPES.MemberExpression, optional: true };

        expect(unwrapped(firstExpression(parseProgram('tab?.groupId;')))).toMatchObject(optionalAccess);
      });
    });

    context('when wrappers are nested', () => {
      it('returns the expression under all of them', () => {
        expect(unwrapped(firstExpression(parseProgram('(tab as Tab)!;')))).toMatchObject({ name: 'tab' });
      });
    });
  });

  describe('nextLink', () => {
    context('when the node has no parent', () => {
      it('returns null', () => {
        expect(nextLink(parseProgram('move(tab);'))).toBeNull();
      });
    });

    context('when the node is not the receiver of a member access', () => {
      it('returns null', () => {
        const program = parseProgram('move(tab);');

        expect(nextLink(callNamed(program, 'move'))).toBeNull();
      });
    });

    context('when the node is the receiver of a member access', () => {
      context('but the access is not called', () => {
        it('returns null', () => {
          const program = parseProgram('move(tab).id;');

          expect(nextLink(callNamed(program, 'move'))).toBeNull();
        });
      });

      context('but the access is computed', () => {
        it('returns null', () => {
          const program = parseProgram('move(tab)[kind]();');

          expect(nextLink(callNamed(program, 'move'))).toBeNull();
        });
      });

      context('and the access is called', () => {
        it('returns the call on the access', () => {
          const program = parseProgram('move(tab).then(place);');

          expect(nextLink(callNamed(program, 'move'))).toBe(firstCall(program));
        });
      });

      context('and property accesses come before the call', () => {
        it('returns the call after them', () => {
          const program = parseProgram('expect(move).not.toHaveBeenCalled();');

          expect(nextLink(callNamed(program, 'expect'))).toBe(firstCall(program));
        });
      });

      context('and a non-null assertion comes before the access', () => {
        it('returns the call on the access', () => {
          const program = parseProgram('tabsById.get(id)!.discard();');

          expect(nextLink(lastCall(program))).toBe(firstCall(program));
        });
      });

      context('and a type assertion wraps the node', () => {
        it('returns the call on the access', () => {
          const program = parseProgram('(response.json() as Promise<Tab>).then(place);');

          expect(nextLink(lastCall(program))).toBe(firstCall(program));
        });
      });
    });
  });
});
