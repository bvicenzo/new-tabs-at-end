export type Placement = 'window' | 'group';

const DEFAULT_PLACEMENT: Placement = 'window';
const PLACEMENTS: readonly unknown[] = ['window', 'group'];

function isPlacement(storedPlacement: unknown): storedPlacement is Placement {
  return PLACEMENTS.includes(storedPlacement);
}

// Where a tab opened from a grouped tab goes (docs/decisions/0002). A value this version does not know — written by a
// newer one on another synced device — and a failed read both fall back to the end of the window.
export async function readPlacement(storage: Pick<chrome.storage.StorageArea, 'get'>): Promise<Placement> {
  try {
    const { placement } = await storage.get('placement');

    return isPlacement(placement) ? placement : DEFAULT_PLACEMENT;
  } catch (error) {
    console.warn('Could not read the placement setting; placing at the end of the window.', error);

    return DEFAULT_PLACEMENT;
  }
}
