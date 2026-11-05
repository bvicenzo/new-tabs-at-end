import { enclosingMockFactory } from '../../utils/mock-factory';
import { callNamed, firstCall, parseProgram } from '../support/parse';

describe('utils/mock-factory', () => {
  describe('enclosingMockFactory', () => {
    context('when the node is not inside a call argument', () => {
      it('returns null', () => {
        const target = callNamed(parseProgram('target();'), 'target');

        expect(enclosingMockFactory(target)).toBeNull();
      });
    });

    context('when the node is inside a call argument', () => {
      context('but the callee is not a member of vi', () => {
        context('and it is a mock method of another object', () => {
          it('returns null', () => {
            const target = callNamed(parseProgram("jest.mock('./tabs', () => { target(); });"), 'target');

            expect(enclosingMockFactory(target)).toBeNull();
          });
        });

        context('and it is a plain function named mock', () => {
          it('returns null', () => {
            const target = callNamed(parseProgram("mock('./tabs', () => { target(); });"), 'target');

            expect(enclosingMockFactory(target)).toBeNull();
          });
        });
      });

      context('and the callee is a member of vi', () => {
        context('but the member is reached by a computed key', () => {
          it('returns null', () => {
            const target = callNamed(parseProgram("vi['mock']('./tabs', () => { target(); });"), 'target');

            expect(enclosingMockFactory(target)).toBeNull();
          });
        });

        context('but the method is hoisted', () => {
          it('returns null', () => {
            const target = callNamed(parseProgram('vi.hoisted(() => { target(); });'), 'target');

            expect(enclosingMockFactory(target)).toBeNull();
          });
        });

        context('but the method is another vi method', () => {
          it('returns null', () => {
            const target = callNamed(parseProgram('vi.fn(() => { target(); });'), 'target');

            expect(enclosingMockFactory(target)).toBeNull();
          });
        });

        context('and the method is doMock', () => {
          context('but the node is in its path argument', () => {
            it('returns null', () => {
              const target = callNamed(parseProgram('vi.doMock(String(target()), () => ({}));'), 'target');

              expect(enclosingMockFactory(target)).toBeNull();
            });
          });

          context('and the node is in its factory', () => {
            context('and directly in it', () => {
              it('returns that call', () => {
                const program = parseProgram("vi.doMock('./tabs', () => { target(); });");

                expect(enclosingMockFactory(callNamed(program, 'target'))).toBe(firstCall(program));
              });
            });

            context('and in a function within it', () => {
              it('returns that call', () => {
                const program = parseProgram("vi.doMock('./tabs', () => ({ query: () => target() }));");

                expect(enclosingMockFactory(callNamed(program, 'target'))).toBe(firstCall(program));
              });
            });
          });
        });

        context('and the method is mock', () => {
          context('but the node is in its path argument', () => {
            it('returns null', () => {
              const target = callNamed(parseProgram('vi.mock(String(target()), () => ({}));'), 'target');

              expect(enclosingMockFactory(target)).toBeNull();
            });
          });

          context('and the node is in its factory', () => {
            context('and directly in it', () => {
              it('returns that call', () => {
                const program = parseProgram("vi.mock('./tabs', () => { target(); });");

                expect(enclosingMockFactory(callNamed(program, 'target'))).toBe(firstCall(program));
              });
            });

            context('and in a function within it', () => {
              it('returns that call', () => {
                const program = parseProgram("vi.mock('./tabs', () => ({ query: () => target() }));");

                expect(enclosingMockFactory(callNamed(program, 'target'))).toBe(firstCall(program));
              });
            });
          });
        });
      });
    });
  });
});
