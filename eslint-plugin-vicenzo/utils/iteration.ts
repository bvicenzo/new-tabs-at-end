// SPDX-License-Identifier: GPL-3.0-or-later
import { simpleTraverse } from '@typescript-eslint/typescript-estree';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

type Loop = TSESTree.DoWhileStatement
  | TSESTree.ForInStatement
  | TSESTree.ForOfStatement
  | TSESTree.ForStatement
  | TSESTree.WhileStatement;

type InlineFunction = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

const LOOP_TYPES: ReadonlySet<AST_NODE_TYPES> = new Set([
  AST_NODE_TYPES.DoWhileStatement,
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.WhileStatement
]);

function isLoop(node: TSESTree.Node): node is Loop {
  return LOOP_TYPES.has(node.type);
}

function isInlineFunction(node: TSESTree.Node | undefined): node is InlineFunction {
  return node?.type === AST_NODE_TYPES.ArrowFunctionExpression || node?.type === AST_NODE_TYPES.FunctionExpression;
}

// `tabs.forEach(…)`: a method named plainly, never `tabs['forEach']` nor a private `#forEach`.
function isMethodNamed(callee: TSESTree.Expression, methodNames: readonly string[]): boolean {
  return callee.type === AST_NODE_TYPES.MemberExpression
    && !callee.computed
    && callee.property.type === AST_NODE_TYPES.Identifier
    && methodNames.includes(callee.property.name);
}

// What runs once per element: a loop's body, or the inline callback of one of `methodNames`; never the head.
export function iterationBody(node: TSESTree.Node, methodNames: readonly string[]): TSESTree.Node | null {
  if (isLoop(node)) return node.body;
  if (node.type !== AST_NODE_TYPES.CallExpression || !isMethodNamed(node.callee, methodNames)) return null;

  const [callback] = node.arguments;

  return isInlineFunction(callback) ? callback : null;
}

function callsWithin(node: TSESTree.Node): TSESTree.CallExpression[] {
  const calls: TSESTree.CallExpression[] = [];

  simpleTraverse(node, { visitors: { CallExpression: (call) => calls.push(call as TSESTree.CallExpression) } });

  return calls;
}

// Whether `node`, or any call nested in it at any depth (nested functions included), satisfies `predicate`.
export function containsCall(node: TSESTree.Node, predicate: (call: TSESTree.CallExpression) => boolean): boolean {
  return callsWithin(node).some(predicate);
}
