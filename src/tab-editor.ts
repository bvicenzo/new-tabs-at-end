export type EditOutcome = 'done' | 'closed' | 'gaveUp';
export type TabEdition = () => Promise<unknown>;

type Wait = (milliseconds: number) => Promise<void>;

const DRAG_RETRY_ATTEMPTS = 20;
const DRAG_RETRY_DELAY = 100;
const CLOSED_TAB_ERROR = 'No tab with id';
const DRAG_IN_PROGRESS_ERROR = 'Tabs cannot be edited right now';

// Applies an edition to a tab the way Chrome allows it — a move, an ungroup, a group: retried while the user drags a
// tab, and unnecessary once the tab is closed (docs/decisions/0008). Any other refusal rejects, so it shows in the
// extension's errors.
export class TabEditor {
  constructor(private readonly wait: Wait) {}

  edit(tabId: number, edition: TabEdition): Promise<EditOutcome> {
    return this.attempt(tabId, edition, 1);
  }

  private async attempt(tabId: number, edition: TabEdition, attempt: number): Promise<EditOutcome> {
    try {
      await edition();

      return 'done';
    } catch (error) {
      return this.recover(error, tabId, edition, attempt);
    }
  }

  private async recover(error: unknown, tabId: number, edition: TabEdition, attempt: number): Promise<EditOutcome> {
    const refusal = String(error);

    if (refusal.includes(CLOSED_TAB_ERROR)) return 'closed';
    if (!refusal.includes(DRAG_IN_PROGRESS_ERROR)) throw error;
    if (attempt === DRAG_RETRY_ATTEMPTS) return this.giveUp(tabId);

    await this.wait(DRAG_RETRY_DELAY);

    return this.attempt(tabId, edition, attempt + 1);
  }

  private giveUp(tabId: number): EditOutcome {
    console.warn(`Gave up editing tab ${tabId} after ${DRAG_RETRY_ATTEMPTS} attempts: a tab was being dragged.`);

    return 'gaveUp';
  }
}
