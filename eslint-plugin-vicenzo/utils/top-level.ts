// SPDX-License-Identifier: GPL-3.0-or-later
import type { TSESTree } from '@typescript-eslint/utils';

import { enclosingGroup } from './test-blocks';

// Whether `call` reaches the whole file: it sits at module scope, or straight in an outermost group.
export function isAtTopLevel(call: TSESTree.CallExpression): boolean {
  const group = enclosingGroup(call);

  return group === null || enclosingGroup(group) === null;
}
