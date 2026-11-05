import { isClosedTabError, isDragError, isMissingGroupError } from '../src/chrome-errors';

describe('chrome-errors', () => {
  describe('isClosedTabError', () => {
    context('when the refusal names another problem', () => {
      it('is false', () => {
        expect(isClosedTabError(new Error('No group with id: 3.'))).toBe(false);
      });
    });

    context('when the refusal names a tab that does not exist', () => {
      it('is true', () => {
        expect(isClosedTabError(new Error('No tab with id: 7.'))).toBe(true);
      });
    });
  });

  describe('isMissingGroupError', () => {
    context('when the refusal names another problem', () => {
      it('is false', () => {
        expect(isMissingGroupError(new Error('No tab with id: 7.'))).toBe(false);
      });
    });

    context('when the refusal names a group that does not exist', () => {
      it('is true', () => {
        expect(isMissingGroupError(new Error('No group with id: 3.'))).toBe(true);
      });
    });
  });

  describe('isDragError', () => {
    context('when the refusal names another problem', () => {
      it('is false', () => {
        expect(isDragError(new Error('No tab with id: 7.'))).toBe(false);
      });
    });

    context('when the refusal says the tabs cannot be edited right now', () => {
      it('is true', () => {
        const dragRefusal = new Error('Tabs cannot be edited right now (user may be dragging a tab).');

        expect(isDragError(dragRefusal)).toBe(true);
      });
    });
  });
});
