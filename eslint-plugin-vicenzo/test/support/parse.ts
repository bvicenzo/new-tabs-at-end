import { parse, simpleTraverse } from '@typescript-eslint/typescript-estree';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

// The tokens of `code`, with the locations ESLint gives them.
export function tokensOf(code: string): TSESTree.Token[] {
  return parse(code, { loc: true, range: true, tokens: true }).tokens;
}

// Parses `code` with parent links set, as ESLint hands nodes to a rule.
export function parseProgram(code: string): TSESTree.Program {
  const program = parse(code, { loc: true, range: true });

  simpleTraverse(program, { enter: () => undefined }, true);

  return program;
}

function callsOf(program: TSESTree.Program): TSESTree.CallExpression[] {
  const calls: TSESTree.CallExpression[] = [];

  simpleTraverse(program, { visitors: { CallExpression: (call) => calls.push(call as TSESTree.CallExpression) } });

  return calls;
}

// The first call expression in source order (the outermost one, for nested calls).
export function firstCall(program: TSESTree.Program): TSESTree.CallExpression {
  const [call] = callsOf(program);

  if (!call) throw new Error('The program has no call expression');

  return call;
}

// The last call expression in source order (the innermost one, for nested calls).
export function lastCall(program: TSESTree.Program): TSESTree.CallExpression {
  const call = callsOf(program).at(-1);

  if (!call) throw new Error('The program has no call expression');

  return call;
}

function titleOf({ arguments: [firstArgument] }: TSESTree.CallExpression): unknown {
  return firstArgument?.type === AST_NODE_TYPES.Literal ? firstArgument.value : undefined;
}

// The first call whose first argument is the string literal `title`.
export function callTitled(program: TSESTree.Program, title: string): TSESTree.CallExpression {
  const call = callsOf(program).find((candidate) => titleOf(candidate) === title);

  if (!call) throw new Error(`The program has no call titled '${title}'`);

  return call;
}

// The first call to the identifier `name`.
export function callNamed(program: TSESTree.Program, name: string): TSESTree.CallExpression {
  const call = callsOf(program).find(({ callee }) => callee.type === AST_NODE_TYPES.Identifier && callee.name === name);

  if (!call) throw new Error(`The program has no call to '${name}'`);

  return call;
}

// The call a call is made on, as `describe.each(table)` in `describe.each(table)('title', fn)`.
export function calleeCall(call: TSESTree.CallExpression): TSESTree.CallExpression {
  if (call.callee.type !== AST_NODE_TYPES.CallExpression) throw new Error('The callee is not a call');

  return call.callee;
}

// The identifier declared by the program's first statement, as `tab` in `const tab = buildTab();`.
export function firstDeclaredIdentifier(program: TSESTree.Program): TSESTree.Identifier {
  const [statement] = program.body;
  const declarator = statement?.type === AST_NODE_TYPES.VariableDeclaration ? statement.declarations[0] : undefined;

  if (declarator?.id.type !== AST_NODE_TYPES.Identifier) throw new Error('The program does not start declaring a name');

  return declarator.id;
}

// The expression of the program's first statement, as `tabs.length` in `tabs.length;`.
export function firstExpression(program: TSESTree.Program): TSESTree.Expression {
  const [statement] = program.body;
  const startsWithExpression = statement?.type === AST_NODE_TYPES.ExpressionStatement;

  if (!startsWithExpression) throw new Error('The program does not start with an expression');

  return statement.expression;
}
