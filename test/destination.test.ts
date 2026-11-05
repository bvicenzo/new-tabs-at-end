import { groupDestination, windowDestination } from '../src/destination';
import { buildTab } from './support/builders';

describe('destination', () => {
  describe('windowDestination', () => {
    context('when the tab is not in a group', () => {
      it('is the end of the window, with no group to leave', () => {
        const ungroupedTab = buildTab({ groupId: -1 });

        expect(windowDestination(ungroupedTab)).toEqual({ index: -1, leaveGroup: false });
      });
    });

    context('when the tab is in a group', () => {
      it('is the end of the window, leaving the group', () => {
        const groupedTab = buildTab({ groupId: 3 });

        expect(windowDestination(groupedTab)).toEqual({ index: -1, leaveGroup: true });
      });
    });
  });

  describe('groupDestination', () => {
    context('when the group lists no tabs', () => {
      it('is nothing', () => {
        expect(groupDestination(7, [])).toBeNull();
      });
    });

    context('when the group lists tabs', () => {
      context('but the tab is not among them', () => {
        it('is nothing', () => {
          const groupTabs = [buildTab({ id: 4, index: 2 }), buildTab({ id: 5, index: 3 })];

          expect(groupDestination(7, groupTabs)).toBeNull();
        });
      });

      context('and the tab is among them', () => {
        context('but it is the only one', () => {
          it('is nothing', () => {
            const groupTabs = [buildTab({ id: 7, index: 2 })];

            expect(groupDestination(7, groupTabs)).toBeNull();
          });
        });

        context('but it holds the highest index', () => {
          it('is nothing', () => {
            const groupTabs = [buildTab({ id: 4, index: 2 }), buildTab({ id: 7, index: 3 })];

            expect(groupDestination(7, groupTabs)).toBeNull();
          });
        });

        context('and another tab holds the highest index', () => {
          context('and that tab is listed last', () => {
            it('is that index, keeping the group', () => {
              const groupTabs = [buildTab({ id: 7, index: 2 }), buildTab({ id: 4, index: 3 })];

              expect(groupDestination(7, groupTabs)).toEqual({ index: 3, leaveGroup: false });
            });
          });

          context('but that tab is not listed last', () => {
            it('is the highest index, keeping the group', () => {
              const lastOfGroup = buildTab({ id: 4, index: 4 });
              const createdTab = buildTab({ id: 7, index: 2 });
              const middleOfGroup = buildTab({ id: 5, index: 3 });
              const groupTabs = [lastOfGroup, createdTab, middleOfGroup];

              expect(groupDestination(7, groupTabs)).toEqual({ index: 4, leaveGroup: false });
            });
          });
        });
      });
    });
  });
});
