import { endOfGroupIndex } from '../src/destination';
import { buildTab } from './support/builders';

describe('destination', () => {
  describe('endOfGroupIndex', () => {
    context('when the group lists no tabs', () => {
      it('is nothing', () => {
        expect(endOfGroupIndex(7, [])).toBeNull();
      });
    });

    context('when the group lists tabs', () => {
      context('but the tab is not among them', () => {
        it('is nothing', () => {
          const groupTabs = [buildTab({ id: 4, index: 2 }), buildTab({ id: 5, index: 3 })];

          expect(endOfGroupIndex(7, groupTabs)).toBeNull();
        });
      });

      context('and the tab is among them', () => {
        context('but it is the only one', () => {
          it('is nothing', () => {
            const groupTabs = [buildTab({ id: 7, index: 2 })];

            expect(endOfGroupIndex(7, groupTabs)).toBeNull();
          });
        });

        context('but it holds the highest index', () => {
          it('is nothing', () => {
            const groupTabs = [buildTab({ id: 4, index: 2 }), buildTab({ id: 7, index: 3 })];

            expect(endOfGroupIndex(7, groupTabs)).toBeNull();
          });
        });

        context('and another tab holds the highest index', () => {
          context('and that tab is listed last', () => {
            it('is that index', () => {
              const groupTabs = [buildTab({ id: 7, index: 2 }), buildTab({ id: 4, index: 3 })];

              expect(endOfGroupIndex(7, groupTabs)).toBe(3);
            });
          });

          context('but that tab is not listed last', () => {
            it('is the highest index', () => {
              const lastOfGroup = buildTab({ id: 4, index: 4 });
              const createdTab = buildTab({ id: 7, index: 2 });
              const middleOfGroup = buildTab({ id: 5, index: 3 });
              const groupTabs = [lastOfGroup, createdTab, middleOfGroup];

              expect(endOfGroupIndex(7, groupTabs)).toBe(4);
            });
          });
        });
      });
    });
  });
});
