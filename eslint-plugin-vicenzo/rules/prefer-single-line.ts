import { AST_NODE_TYPES, AST_TOKEN_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { isLink, nextLink } from '../utils/chain';
import { createRule } from '../utils/create-rule';
import { joinTokens } from '../utils/one-line';

const DEFAULT_MAX = 120;

// The constructs the rule weighs: calls (and so chains), arrays, objects and conditions.
const CANDIDATES = [
  AST_NODE_TYPES.ArrayExpression,
  AST_NODE_TYPES.BinaryExpression,
  AST_NODE_TYPES.CallExpression,
  AST_NODE_TYPES.ConditionalExpression,
  AST_NODE_TYPES.LogicalExpression,
  AST_NODE_TYPES.NewExpression,
  AST_NODE_TYPES.ObjectExpression
];

// Statements stay on their own lines, so a construct holding any is never joined.
const STATEMENT_CONTAINERS = [AST_NODE_TYPES.BlockStatement, AST_NODE_TYPES.ClassBody];

type SourceCode = Readonly<TSESLint.SourceCode>;

// An empty block (`() => {}`) holds no statement.
function holdsStatements(container: TSESTree.Node): boolean {
  return container.type !== AST_NODE_TYPES.BlockStatement || container.body.length > 0;
}

function holds(outer: TSESTree.Node, inner: TSESTree.Node): boolean {
  return outer.range[0] <= inner.range[0] && inner.range[1] <= outer.range[1];
}

function spansLines({ loc }: TSESTree.Node | TSESTree.Token): boolean {
  return loc.start.line !== loc.end.line;
}

// A template literal that spans lines would change its value if joined; a comment would be lost.
function changesWhenJoined(node: TSESTree.Node, sourceCode: SourceCode): boolean {
  const spansTemplate = sourceCode
    .getTokens(node)
    .some((token) => token.type === AST_TOKEN_TYPES.Template && spansLines(token));

  return spansTemplate || sourceCode.getCommentsInside(node).length > 0;
}

// The whole line the construct would sit on: the text before it, the construct joined, and the code after it — a
// trailing comment is exempt from the line length, so it does not count.
function singleLineLength(node: TSESTree.Node, sourceCode: SourceCode): number {
  const lineEnd = sourceCode.text.indexOf('\n', node.range[1]);
  const trailingComment = sourceCode
    .getAllComments()
    .find((comment) => comment.range[0] >= node.range[1] && comment.loc.start.line === node.loc.end.line);
  const codeEnd = trailingComment?.range[0] ?? (lineEnd === -1 ? sourceCode.text.length : lineEnd);
  const codeAfter = sourceCode.text.slice(node.range[1], codeEnd).trimEnd();

  return node.loc.start.column + joinTokens(sourceCode.getTokens(node)).length + codeAfter.length;
}

type Operation = TSESTree.BinaryExpression | TSESTree.LogicalExpression;

function isOperation(node: TSESTree.Node | undefined): node is Operation {
  return node?.type === AST_NODE_TYPES.BinaryExpression || node?.type === AST_NODE_TYPES.LogicalExpression;
}

// `a && b && c` is one run of `&&`, joined whole or not at all, like a chain; `a && b` alone is not a construct.
function continuesOperatorRun(node: TSESTree.Node): boolean {
  const { parent } = node;

  return isOperation(node) && isOperation(parent) && parent.left === node && parent.operator === node.operator;
}

interface Weighing {
  sourceCode: SourceCode;
  containers: TSESTree.Node[];
  reported: TSESTree.Node[];
}

// A link inside a longer chain is joined with its chain or not at all (vicenzo/multiline-method-call-line-breaks);
// the chain's head is not a link, and may be joined on its own.
function isInnerLink(node: TSESTree.Node): boolean {
  return isLink(node) && nextLink(node) !== null;
}

function isWeighable(node: TSESTree.Node, { sourceCode, containers, reported }: Weighing): boolean {
  return spansLines(node)
    && !isInnerLink(node)
    && !continuesOperatorRun(node)
    && !reported.some((outer) => holds(outer, node))
    && !containers.some((container) => holdsStatements(container) && holds(node, container))
    && !changesWhenJoined(node, sourceCode);
}

function collectorOf(types: AST_NODE_TYPES[], collected: TSESTree.Node[]): TSESLint.RuleListener {
  return Object.fromEntries(types.map((type) => [type, (node: TSESTree.Node) => collected.push(node)]));
}

export default createRule<[{ max: number }], 'preferSingleLine'>({
  name: 'prefer-single-line',
  meta: {
    type: 'layout',
    docs: { description: 'Require a construct broken over several lines to be on one line when it fits.' },
    messages: { preferSingleLine: 'Fits on one line ({{length}}/{{max}} columns): write it on one line.' },
    schema: [{ type: 'object', properties: { max: { type: 'integer', minimum: 1 } }, additionalProperties: false }]
  },
  defaultOptions: [{ max: DEFAULT_MAX }],
  create(context, [{ max }]) {
    const { sourceCode } = context;
    const candidates: TSESTree.Node[] = [];
    const containers: TSESTree.Node[] = [];

    // Constructs are weighed outermost first, so a construct inside a reported one is never reported again.
    function reportIfFits(reported: TSESTree.Node[], node: TSESTree.Node): TSESTree.Node[] {
      if (!isWeighable(node, { sourceCode, containers, reported })) return reported;

      const length = singleLineLength(node, sourceCode);

      if (length > max) return reported;

      context.report({ node, messageId: 'preferSingleLine', data: { length, max } });

      return [...reported, node];
    }

    return {
      ...collectorOf(CANDIDATES, candidates),
      ...collectorOf(STATEMENT_CONTAINERS, containers),
      'Program:exit': () => candidates.reduce(reportIfFits, [])
    };
  }
});
