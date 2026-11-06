// SPDX-License-Identifier: GPL-3.0-or-later
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

// A method call on a member — `.query(…)`, `?.then(…)` — the unit a chain is broken into.
export type Link = TSESTree.CallExpression & { callee: TSESTree.MemberExpressionNonComputedName };

const WRAPPERS = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ChainExpression,
  AST_NODE_TYPES.TSAsExpression,
  AST_NODE_TYPES.TSNonNullExpression,
  AST_NODE_TYPES.TSSatisfiesExpression
]);

export function isLink(node: TSESTree.Node | undefined): node is Link {
  return node?.type === AST_NODE_TYPES.CallExpression
    && node.callee.type === AST_NODE_TYPES.MemberExpression
    && !node.callee.computed;
}

function isWrapper(node: TSESTree.Node): node is TSESTree.Node & { expression: TSESTree.Expression } {
  return WRAPPERS.has(node.type);
}

// The expression under `!`, `as`, `satisfies` and a parenthesised optional chain, which do not break a chain.
export function unwrapped(node: TSESTree.Expression): TSESTree.Expression {
  return isWrapper(node) ? unwrapped(node.expression) : node;
}

function continuesChain(node: TSESTree.Node, parent: TSESTree.Node): boolean {
  return isWrapper(parent) || (parent.type === AST_NODE_TYPES.MemberExpression && parent.object === node);
}

// The link `node` is the receiver of, reached through property accesses, `!`, `as` and optional chains.
export function nextLink(node: TSESTree.Node): Link | null {
  const { parent } = node;

  if (!parent || !continuesChain(node, parent)) return null;

  return isLink(parent.parent) && parent.parent.callee === parent ? parent.parent : nextLink(parent);
}
