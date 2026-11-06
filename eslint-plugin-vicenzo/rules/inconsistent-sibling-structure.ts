// SPDX-License-Identifier: GPL-3.0-or-later
import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import { enclosingGroup, isTableHead, testBlockKind, type TestBlockKind } from '../utils/test-blocks';

type SiblingKind = Exclude<TestBlockKind, 'hook'>;
type SiblingsByKind = Record<SiblingKind, TSESTree.CallExpression[]>;
type SiblingsByGroup = Map<TSESTree.CallExpression, SiblingsByKind>;
type SiblingPair = readonly [SiblingKind, SiblingKind];

interface MixedSibling {
  call: TSESTree.CallExpression;
  data: { kind: string; otherKind: string };
}

const PLURAL_NAMES: Readonly<Record<SiblingKind, string>> = {
  example: 'examples',
  describe: 'describes',
  context: 'contexts'
};

// In each pair, the siblings of the second kind are reported for sitting beside siblings of the first one.
const MIXED_PAIRS: readonly SiblingPair[] = [['example', 'describe'], ['example', 'context'], ['describe', 'context']];

function isSiblingKind(kind: TestBlockKind | null): kind is SiblingKind {
  return kind !== null && kind !== 'hook';
}

function siblingsIn(siblingsByGroup: SiblingsByGroup, group: TSESTree.CallExpression): SiblingsByKind {
  const knownSiblings = siblingsByGroup.get(group);

  if (knownSiblings) return knownSiblings;

  const newSiblings: SiblingsByKind = { example: [], describe: [], context: [] };

  siblingsByGroup.set(group, newSiblings);

  return newSiblings;
}

function isMixed(siblings: SiblingsByKind, [kind, otherKind]: SiblingPair): boolean {
  return siblings[kind].length > 0 && siblings[otherKind].length > 0;
}

function offensesOf(siblings: SiblingsByKind, [kind, otherKind]: SiblingPair): MixedSibling[] {
  const kindNames = { kind: PLURAL_NAMES[kind], otherKind: PLURAL_NAMES[otherKind] };

  return siblings[otherKind].map((call) => ({ call, data: kindNames }));
}

function mixedSiblingsOf(siblings: SiblingsByKind): MixedSibling[] {
  return MIXED_PAIRS.filter((pair) => isMixed(siblings, pair)).flatMap((pair) => offensesOf(siblings, pair));
}

export default createRule({
  name: 'inconsistent-sibling-structure',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow mixing examples, describes and contexts as children of the same test group.' },
    messages: { mixedSiblings: 'Do not mix {{kind}} with {{otherKind}} at the same level.' },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    const siblingsByGroup: SiblingsByGroup = new Map();

    return {
      CallExpression(call) {
        const kind = testBlockKind(call);

        if (!isSiblingKind(kind) || isTableHead(call)) return;

        const group = enclosingGroup(call);

        if (group) siblingsIn(siblingsByGroup, group)[kind].push(call);
      },
      'Program:exit'() {
        [...siblingsByGroup.values()]
          .flatMap(mixedSiblingsOf)
          .forEach(({ call, data }) => context.report({ node: call, messageId: 'mixedSiblings', data }));
      }
    };
  }
});
