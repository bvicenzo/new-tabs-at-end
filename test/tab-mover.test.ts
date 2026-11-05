import { TabMover } from '../src/tab-mover';
import { buildTab } from './support/builders';
import { editorReporting, fakeTabs } from './support/fakes';

describe('TabMover', () => {
  describe('#toEndOfWindow', () => {
    context('when the tab is not in a group', () => {
      context('but the move rejects', () => {
        it('rejects with the error', async () => {
          const move = vi.fn().mockRejectedValue(new Error('Invalid tab index: 99.'));
          const subject = new TabMover({ tabs: fakeTabs({ move }), editor: editorReporting('done') });

          await expect(subject.toEndOfWindow(7, -1)).rejects.toThrow('Invalid tab index: 99.');
        });
      });

      context('and the move resolves', () => {
        it('moves it to the end of the window, leaving the groups alone', async () => {
          const move = vi.fn().mockResolvedValue(undefined);
          const ungroup = vi.fn();
          const editor = editorReporting('done');
          const subject = new TabMover({ tabs: fakeTabs({ move, ungroup }), editor });

          await subject.toEndOfWindow(7, -1);

          expect.soft(editor.edit).toHaveBeenCalledExactlyOnceWith(7, expect.any(Function));
          expect.soft(move).toHaveBeenCalledExactlyOnceWith(7, { index: -1 });
          expect(ungroup).not.toHaveBeenCalled();
        });
      });
    });

    context('when the tab is in a group', () => {
      context('but the move rejects', () => {
        it('rejects with the error, leaving it in its group', async () => {
          const move = vi.fn().mockRejectedValue(new Error('Invalid tab index: 99.'));
          const ungroup = vi.fn();
          const subject = new TabMover({ tabs: fakeTabs({ move, ungroup }), editor: editorReporting('done') });

          await expect.soft(subject.toEndOfWindow(7, 3)).rejects.toThrow('Invalid tab index: 99.');
          expect(ungroup).not.toHaveBeenCalled();
        });
      });

      context('but the move finds the tab closed', () => {
        it('does not ungroup it', async () => {
          const ungroup = vi.fn();
          const tabs = fakeTabs({ move: vi.fn().mockResolvedValue(undefined), ungroup });
          const subject = new TabMover({ tabs, editor: editorReporting('closed') });

          await subject.toEndOfWindow(7, 3);

          expect(ungroup).not.toHaveBeenCalled();
        });
      });

      context('but the move gives up', () => {
        it('does not ungroup it', async () => {
          const ungroup = vi.fn();
          const tabs = fakeTabs({ move: vi.fn().mockResolvedValue(undefined), ungroup });
          const subject = new TabMover({ tabs, editor: editorReporting('gaveUp') });

          await subject.toEndOfWindow(7, 3);

          expect(ungroup).not.toHaveBeenCalled();
        });
      });

      context('and the move is done', () => {
        context('but the ungroup rejects', () => {
          it('rejects with the error', async () => {
            const ungroup = vi.fn().mockRejectedValue(new Error('Tab 7 is not in a group.'));
            const tabs = fakeTabs({ move: vi.fn().mockResolvedValue(undefined), ungroup });
            const subject = new TabMover({ tabs, editor: editorReporting('done') });

            await expect(subject.toEndOfWindow(7, 3)).rejects.toThrow('Tab 7 is not in a group.');
          });
        });

        context('and the ungroup resolves', () => {
          it('moves it to the end of the window, then out of its group', async () => {
            const move = vi.fn().mockResolvedValue(undefined);
            const ungroup = vi.fn().mockResolvedValue(undefined);
            const editor = editorReporting('done');
            const subject = new TabMover({ tabs: fakeTabs({ move, ungroup }), editor });

            await subject.toEndOfWindow(7, 3);

            expect.soft(editor.edit).toHaveBeenCalledTimes(2);
            expect.soft(move).toHaveBeenCalledExactlyOnceWith(7, { index: -1 });
            expect.soft(ungroup).toHaveBeenCalledExactlyOnceWith(7);
            expect(move).toHaveBeenCalledBefore(ungroup);
          });
        });
      });
    });
  });

  describe('#toEndOfGroup', () => {
    context('when the group cannot be listed', () => {
      it('rejects with the error, leaving the tab in place', async () => {
        const query = vi.fn().mockRejectedValue(new Error('No group with id: 3.'));
        const move = vi.fn();
        const subject = new TabMover({ tabs: fakeTabs({ query, move }), editor: editorReporting('done') });

        await expect.soft(subject.toEndOfGroup(7, 3)).rejects.toThrow('No group with id: 3.');
        expect(move).not.toHaveBeenCalled();
      });
    });

    context('when the group is listed', () => {
      context('but it gives the tab no end-of-group index', () => {
        it('leaves the tab in place', async () => {
          const groupTabs = [buildTab({ id: 4, index: 3 }), buildTab({ id: 7, index: 4 })];
          const query = vi.fn().mockResolvedValue(groupTabs);
          const move = vi.fn();
          const subject = new TabMover({ tabs: fakeTabs({ query, move }), editor: editorReporting('done') });

          await subject.toEndOfGroup(7, 3);

          expect.soft(query).toHaveBeenCalledExactlyOnceWith({ groupId: 3 });
          expect(move).not.toHaveBeenCalled();
        });
      });

      context('and it gives the tab an end-of-group index', () => {
        context('but the move rejects', () => {
          it('rejects with the error', async () => {
            const groupTabs = [buildTab({ id: 7, index: 3 }), buildTab({ id: 4, index: 4 })];
            const query = vi.fn().mockResolvedValue(groupTabs);
            const move = vi.fn().mockRejectedValue(new Error('Invalid tab index: 4.'));
            const subject = new TabMover({ tabs: fakeTabs({ query, move }), editor: editorReporting('done') });

            await expect(subject.toEndOfGroup(7, 3)).rejects.toThrow('Invalid tab index: 4.');
          });
        });

        context('and the move resolves', () => {
          it('moves it to the end of the group', async () => {
            const groupTabs = [buildTab({ id: 7, index: 3 }), buildTab({ id: 4, index: 4 })];
            const query = vi.fn().mockResolvedValue(groupTabs);
            const move = vi.fn().mockResolvedValue(undefined);
            const editor = editorReporting('done');
            const subject = new TabMover({ tabs: fakeTabs({ query, move }), editor });

            await subject.toEndOfGroup(7, 3);

            expect.soft(editor.edit).toHaveBeenCalledExactlyOnceWith(7, expect.any(Function));
            expect(move).toHaveBeenCalledExactlyOnceWith(7, { index: 4 });
          });
        });
      });
    });
  });

  describe('#intoGroup', () => {
    context('when joining the group rejects', () => {
      it('rejects with the error', async () => {
        const group = vi.fn().mockRejectedValue(new Error('Cannot group tabs in a popup window.'));
        const subject = new TabMover({ tabs: fakeTabs({ group }), editor: editorReporting('done') });

        await expect(subject.intoGroup(7, 3)).rejects.toThrow('Cannot group tabs in a popup window.');
      });
    });

    context('when joining the group finds the tab closed', () => {
      it('does not move it within the group', async () => {
        const query = vi.fn();
        const tabs = fakeTabs({ group: vi.fn().mockResolvedValue(3), query });
        const subject = new TabMover({ tabs, editor: editorReporting('closed') });

        await subject.intoGroup(7, 3);

        expect(query).not.toHaveBeenCalled();
      });
    });

    context('when joining the group gives up', () => {
      it('does not move it within the group', async () => {
        const query = vi.fn();
        const tabs = fakeTabs({ group: vi.fn().mockResolvedValue(3), query });
        const subject = new TabMover({ tabs, editor: editorReporting('gaveUp') });

        await subject.intoGroup(7, 3);

        expect(query).not.toHaveBeenCalled();
      });
    });

    context('when the tab joins the group', () => {
      context('but the group cannot be listed', () => {
        it('rejects with the error', async () => {
          const query = vi.fn().mockRejectedValue(new Error('No group with id: 3.'));
          const tabs = fakeTabs({ group: vi.fn().mockResolvedValue(3), query });
          const subject = new TabMover({ tabs, editor: editorReporting('done') });

          await expect(subject.intoGroup(7, 3)).rejects.toThrow('No group with id: 3.');
        });
      });

      context('and the group is listed', () => {
        context('but it gives the tab no end-of-group index', () => {
          it('leaves the tab where it joined', async () => {
            const group = vi.fn().mockResolvedValue(3);
            const groupTabs = [buildTab({ id: 4, index: 3 }), buildTab({ id: 7, index: 4 })];
            const move = vi.fn();
            const tabs = fakeTabs({ group, query: vi.fn().mockResolvedValue(groupTabs), move });
            const subject = new TabMover({ tabs, editor: editorReporting('done') });

            await subject.intoGroup(7, 3);

            expect.soft(group).toHaveBeenCalledExactlyOnceWith({ tabIds: 7, groupId: 3 });
            expect(move).not.toHaveBeenCalled();
          });
        });

        context('and it gives the tab an end-of-group index', () => {
          context('but the move rejects', () => {
            it('rejects with the error', async () => {
              const groupTabs = [buildTab({ id: 7, index: 2 }), buildTab({ id: 4, index: 4 })];
              const query = vi.fn().mockResolvedValue(groupTabs);
              const move = vi.fn().mockRejectedValue(new Error('Invalid tab index: 4.'));
              const tabs = fakeTabs({ group: vi.fn().mockResolvedValue(3), query, move });
              const subject = new TabMover({ tabs, editor: editorReporting('done') });

              await expect(subject.intoGroup(7, 3)).rejects.toThrow('Invalid tab index: 4.');
            });
          });

          context('and the move resolves', () => {
            it('moves it into the group, then to its end', async () => {
              const group = vi.fn().mockResolvedValue(3);
              const groupTabs = [buildTab({ id: 7, index: 2 }), buildTab({ id: 4, index: 4 })];
              const move = vi.fn().mockResolvedValue(undefined);
              const tabs = fakeTabs({ group, query: vi.fn().mockResolvedValue(groupTabs), move });
              const subject = new TabMover({ tabs, editor: editorReporting('done') });

              await subject.intoGroup(7, 3);

              expect.soft(group).toHaveBeenCalledExactlyOnceWith({ tabIds: 7, groupId: 3 });
              expect.soft(move).toHaveBeenCalledExactlyOnceWith(7, { index: 4 });
              expect(group).toHaveBeenCalledBefore(move);
            });
          });
        });
      });
    });
  });
});
