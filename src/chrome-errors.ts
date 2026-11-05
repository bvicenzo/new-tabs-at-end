// Chrome refuses tab edits with plain messages, measured in docs/decisions/0008; a refusal is read through its text,
// whatever value the rejected promise carries.
const CLOSED_TAB_ERROR = 'No tab with id';
const MISSING_GROUP_ERROR = 'No group with id';
const DRAG_ERROR = 'Tabs cannot be edited right now';

export function isClosedTabError(error: unknown): boolean {
  return String(error).includes(CLOSED_TAB_ERROR);
}

export function isMissingGroupError(error: unknown): boolean {
  return String(error).includes(MISSING_GROUP_ERROR);
}

export function isDragError(error: unknown): boolean {
  return String(error).includes(DRAG_ERROR);
}
