import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

type MockFactory = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

// The `vi` methods whose factory builds the replacement of a module.
const MOCK_METHODS: ReadonlySet<string> = new Set(['mock', 'doMock']);

function isMockFactory(node: TSESTree.Node): node is MockFactory {
  return node.type === AST_NODE_TYPES.ArrowFunctionExpression || node.type === AST_NODE_TYPES.FunctionExpression;
}

// `vi.mock(…)` or `vi.doMock(…)`, written with a dot: `vi['mock']` is not recognized.
function isMockCall({ callee }: TSESTree.CallExpression): boolean {
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.computed) return false;

  const isOnVi = callee.object.type === AST_NODE_TYPES.Identifier && callee.object.name === 'vi';

  return isOnVi && MOCK_METHODS.has(callee.property.name);
}

// The mock call that `factory` is passed to, if any.
function mockCallRunning(factory: MockFactory): TSESTree.CallExpression | null {
  const { parent: call } = factory;

  return call.type === AST_NODE_TYPES.CallExpression && isMockCall(call) ? call : null;
}

// The closest `vi.mock` or `vi.doMock` call whose factory contains `node`; its path argument is not inside it.
export function enclosingMockFactory(node: TSESTree.Node): TSESTree.CallExpression | null {
  const { parent } = node;

  if (!parent) return null;

  const call = isMockFactory(parent) ? mockCallRunning(parent) : null;

  return call ?? enclosingMockFactory(parent);
}
