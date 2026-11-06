// SPDX-License-Identifier: GPL-3.0-or-later
import type { TSESTree } from '@typescript-eslint/utils';

const ANONYMOUS_NAME = /^_+$/;

// A name made only of underscores: it marks a value as ignored without saying what the value is.
export function isAnonymous(name: string): boolean {
  return ANONYMOUS_NAME.test(name);
}

// Underscores separate words, they do not spell any: `a_b` spells two characters.
export function spelledLength(name: string): number {
  return name.replaceAll('_', '').length;
}

// Where an identifier's name is written — without the type annotation typescript-estree includes in its location.
export function nameLocation({ loc, name }: TSESTree.Identifier): TSESTree.SourceLocation {
  return { start: loc.start, end: { line: loc.start.line, column: loc.start.column + name.length } };
}
