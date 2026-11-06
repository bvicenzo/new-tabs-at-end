// SPDX-License-Identifier: GPL-3.0-or-later
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

export type TestBlockKind = 'describe' | 'context' | 'example' | 'hook';

type TestCallback = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

const KIND_BY_NAME: ReadonlyMap<string, TestBlockKind> = new Map([
  ['describe', 'describe'],
  ['suite', 'describe'],
  ['context', 'context'],
  ['it', 'example'],
  ['test', 'example'],
  ['beforeEach', 'hook'],
  ['afterEach', 'hook'],
  ['beforeAll', 'hook'],
  ['afterAll', 'hook']
]);

const MODIFIERS = new Set(['skip', 'only', 'todo', 'concurrent', 'sequential', 'fails', 'shuffle']);
const TABLES = new Set(['each', 'for']);
const APPLIERS = new Set([...TABLES, 'skipIf', 'runIf']);
const CHAIN_MEMBERS = new Set([...MODIFIERS, ...APPLIERS]);

type FunctionNode = TestCallback | TSESTree.FunctionDeclaration;

function memberName({ computed, property }: TSESTree.MemberExpression): string | null {
  if (property.type === AST_NODE_TYPES.Identifier) return computed ? null : property.name;

  return property.type === AST_NODE_TYPES.Literal ? String(property.value) : null;
}

function isMemberIn(node: TSESTree.Node, names: Set<string>): node is TSESTree.MemberExpression {
  return node.type === AST_NODE_TYPES.MemberExpression && names.has(memberName(node) ?? '');
}

// The identifier a test-block callee is built on: modifiers (`describe.skip`, `it['only']`), tables
// (`describe.each(table)`, `it.each`…``) and conditions (`it.skipIf(cond)`) keep it; any other member hides it.
function rootOf(callee: TSESTree.Node): TSESTree.Identifier | null {
  if (callee.type === AST_NODE_TYPES.Identifier) return callee;
  if (isMemberIn(callee, CHAIN_MEMBERS)) return rootOf(callee.object);

  const isAppliedCall = callee.type === AST_NODE_TYPES.CallExpression && isMemberIn(callee.callee, APPLIERS);
  const isTaggedTable = callee.type === AST_NODE_TYPES.TaggedTemplateExpression && isMemberIn(callee.tag, TABLES);

  if (isAppliedCall) return rootOf(callee.callee);

  return isTaggedTable ? rootOf(callee.tag) : null;
}

function isFunctionNode(node: TSESTree.Node): node is FunctionNode {
  return isTestCallback(node) || node.type === AST_NODE_TYPES.FunctionDeclaration;
}

function isIdentifierNamed(node: TSESTree.Node, name: string): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === name;
}

function statementDeclares(statement: TSESTree.Node, name: string): boolean {
  if (statement.type === AST_NODE_TYPES.FunctionDeclaration) return statement.id?.name === name;

  const declarations = statement.type === AST_NODE_TYPES.VariableDeclaration ? statement.declarations : [];

  return declarations.some(({ id }) => isIdentifierNamed(id, name));
}

function scopeDeclares(node: TSESTree.Node, name: string): boolean {
  if (isFunctionNode(node)) return node.params.some((parameter) => isIdentifierNamed(parameter, name));

  const isBlock = node.type === AST_NODE_TYPES.BlockStatement || node.type === AST_NODE_TYPES.Program;

  return isBlock && node.body.some((statement) => statementDeclares(statement, name));
}

// True when a parameter or a local declaration between `identifier` and the module hides the global of that name.
function isShadowed(identifier: TSESTree.Identifier): boolean {
  const scopes: TSESTree.Node[] = [];

  for (let node: TSESTree.Node | undefined = identifier.parent; node; node = node.parent) scopes.push(node);

  return scopes.some((scope) => scopeDeclares(scope, identifier.name));
}

export function testBlockKind(call: TSESTree.CallExpression): TestBlockKind | null {
  const root = rootOf(call.callee);

  if (!root || isShadowed(root)) return null;

  return KIND_BY_NAME.get(root.name) ?? null;
}

function isTestCallback(node: TSESTree.Node): node is TestCallback {
  return node.type === AST_NODE_TYPES.ArrowFunctionExpression || node.type === AST_NODE_TYPES.FunctionExpression;
}

// The function a test block runs: the first function argument, which may follow an options object.
export function callbackOf(call: TSESTree.CallExpression): TestCallback | null {
  return call.arguments.find(isTestCallback) ?? null;
}

// `describe.each(table)` in `describe.each(table)('title', fn)`: the inner call a table call is made on.
export function isTableHead(call: TSESTree.CallExpression): boolean {
  return call.parent.type === AST_NODE_TYPES.CallExpression && call.parent.callee === call;
}

// The test block of one of `kinds` that `callback` is passed to, if any.
function blockRunning(callback: TestCallback, kinds: readonly TestBlockKind[]): TSESTree.CallExpression | null {
  const { parent: call } = callback;

  if (call.type !== AST_NODE_TYPES.CallExpression) return null;

  const kind = testBlockKind(call);

  return kind !== null && kinds.includes(kind) ? call : null;
}

// The closest test block of one of `kinds` whose callback contains `node`; a title argument is not inside its block.
function enclosingBlock(node: TSESTree.Node, kinds: readonly TestBlockKind[]): TSESTree.CallExpression | null {
  const { parent } = node;

  if (!parent) return null;

  const block = isTestCallback(parent) ? blockRunning(parent, kinds) : null;

  return block ?? enclosingBlock(parent, kinds);
}

const GROUP_KINDS: readonly TestBlockKind[] = ['describe', 'context'];
const EXAMPLE_KINDS: readonly TestBlockKind[] = ['example'];

// The closest describe or context whose callback contains `node`.
export function enclosingGroup(node: TSESTree.Node): TSESTree.CallExpression | null {
  return enclosingBlock(node, GROUP_KINDS);
}

// The closest example (it/test) whose callback contains `node`.
export function enclosingExample(node: TSESTree.Node): TSESTree.CallExpression | null {
  return enclosingBlock(node, EXAMPLE_KINDS);
}
