// SPDX-License-Identifier: GPL-3.0-or-later
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

type FunctionNode = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

interface LineTally {
  readonly codeLines: Set<number>;
  readonly hiddenLines: Set<number>;
  readonly keptLines: Set<number>;
}

// RuboCop's CountAsOne (array, hash, heredoc, method_call): each counts as one line however many it spans.
const FOLDABLE_TYPES: ReadonlySet<AST_NODE_TYPES> = new Set([
  AST_NODE_TYPES.ArrayExpression,
  AST_NODE_TYPES.ObjectExpression,
  AST_NODE_TYPES.CallExpression,
  AST_NODE_TYPES.NewExpression,
  AST_NODE_TYPES.TemplateLiteral
]);

function isNode(candidate: unknown): candidate is TSESTree.Node {
  return typeof candidate === 'object' && candidate !== null && 'type' in candidate;
}

function isFunction(node: TSESTree.Node): node is FunctionNode {
  return node.type === AST_NODE_TYPES.ArrowFunctionExpression || node.type === AST_NODE_TYPES.FunctionExpression;
}

// Every node right below `node`, whatever key holds it, except the link back to its parent.
function childrenOf(node: TSESTree.Node): TSESTree.Node[] {
  return Object
    .entries(node as unknown as Record<string, unknown>)
    .filter(([property]) => property !== 'parent')
    .flatMap(([, child]) => (Array.isArray(child) ? (child as unknown[]) : [child]))
    .filter(isNode);
}

// The block bodies of the functions passed to a call within `node` — the counterpart of a Ruby block, never folded.
function callbackBodiesWithin(node: TSESTree.Node): TSESTree.BlockStatement[] {
  if (!isFunction(node)) return childrenOf(node).flatMap(callbackBodiesWithin);

  const isPassedToCall = node.parent.type === AST_NODE_TYPES.CallExpression
    || node.parent.type === AST_NODE_TYPES.NewExpression;

  return isPassedToCall && node.body.type === AST_NODE_TYPES.BlockStatement ? [node.body] : [];
}

function linesAfter(firstLine: number, lastLine: number): number[] {
  return Array.from({ length: lastLine - firstLine }, (_element, offset) => firstLine + offset + 1);
}

// A foldable construct keeps its first line only; the bodies of the functions it is given count on their own.
function fold(tally: LineTally, construct: TSESTree.Node): void {
  const { start, end } = construct.loc;
  const callbackLines = callbackBodiesWithin(construct).flatMap(({ body }) => [...linesOf(body)]);

  [start.line, ...callbackLines].forEach((line) => tally.keptLines.add(line));
  linesAfter(start.line, end.line).forEach((line) => tally.hiddenLines.add(line));
}

function tallyNode(tally: LineTally, node: TSESTree.Node): void {
  if (FOLDABLE_TYPES.has(node.type)) return fold(tally, node);

  tally.codeLines.add(node.loc.start.line);
  tally.codeLines.add(node.loc.end.line);
  childrenOf(node).forEach((child) => tallyNode(tally, child));
}

// The lines `nodes` hold code on: a line is counted once, however many constructs share it.
function linesOf(nodes: readonly TSESTree.Node[]): Set<number> {
  const tally: LineTally = { codeLines: new Set(), hiddenLines: new Set(), keptLines: new Set() };

  nodes.forEach((node) => tallyNode(tally, node));

  const visibleLines = [...tally.codeLines].filter((line) => !tally.hiddenLines.has(line));

  return new Set([...visibleLines, ...tally.keptLines]);
}

// The lines of a function body as RSpec/ExampleLength counts them: the lines its statements occupy (or its expression),
// leaving out blank and comment-only lines, with each array, object, call, `new` and template literal as one line.
export function countedLines(node: TSESTree.Node): number {
  const statements = node.type === AST_NODE_TYPES.BlockStatement ? node.body : [node];

  return linesOf(statements).size;
}
