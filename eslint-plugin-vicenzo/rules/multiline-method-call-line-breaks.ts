import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { type Link, isLink, nextLink, unwrapped } from '../utils/chain';
import { createRule } from '../utils/create-rule';

// Where a link starts (its dot, or the dot of the property access glued to it) and where its receiver ends.
interface LinkBoundary {
  link: Link;
  dot: TSESLint.AST.Token;
  receiverEndLine: number;
  previous: TSESTree.Expression;
}

// Property accesses after a call belong to the next link; after an identifier, they belong to the head.
function startMemberOf(link: Link): { start: TSESTree.MemberExpression; previous: TSESTree.Expression } {
  let start = link.callee;
  let previous = unwrapped(link.callee.object);

  while (previous.type === AST_NODE_TYPES.MemberExpression) {
    if (!previous.computed) start = previous;
    previous = unwrapped(previous.object);
  }

  return { start: previous.type === AST_NODE_TYPES.CallExpression ? start : link.callee, previous };
}

function boundaryOf(link: Link, sourceCode: Readonly<TSESLint.SourceCode>): LinkBoundary {
  const { start, previous } = startMemberOf(link);
  const dot = sourceCode.getTokenBefore(start.property) as TSESLint.AST.Token;
  const receiverEnd = sourceCode.getTokenBefore(dot) as TSESLint.AST.Token;

  return { link, dot, receiverEndLine: receiverEnd.loc.end.line, previous };
}

// The boundaries of every link of the chain ending at `last`, from the head outwards.
function chainOf(last: Link, sourceCode: Readonly<TSESLint.SourceCode>): LinkBoundary[] {
  const boundary = boundaryOf(last, sourceCode);

  return isLink(boundary.previous) ? [...chainOf(boundary.previous, sourceCode), boundary] : [boundary];
}

// A callback whose block body spans lines: its statements, not the line's length, are what break the call.
function isBrokenBlockCallback(argument: TSESTree.CallExpressionArgument): boolean {
  const isFunction = argument.type === AST_NODE_TYPES.ArrowFunctionExpression
    || argument.type === AST_NODE_TYPES.FunctionExpression;

  const spansLines = argument.loc.start.line < argument.loc.end.line;

  return isFunction && argument.body.type === AST_NODE_TYPES.BlockStatement && spansLines;
}

// The first link may stay on the head's line when a callback's statements break it (`tabs.forEach((tab) => {`).
// Arguments broken for length are not: the chain breaks before the call does.
function isBrokenByStatements({ link, previous }: LinkBoundary): boolean {
  return !isLink(previous) && link.arguments.some(isBrokenBlockCallback);
}

function isMisplaced(boundary: LinkBoundary): boolean {
  return boundary.dot.loc.start.line === boundary.receiverEndLine && !isBrokenByStatements(boundary);
}

export default createRule({
  name: 'multiline-method-call-line-breaks',
  meta: {
    type: 'layout',
    docs: { description: 'Require every link of a multiline method chain to start its own line.' },
    messages: { multilineMethodCallLineBreaks: 'Method calls in a multiline chain must each be on their own line.' },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    return {
      CallExpression(call) {
        if (!isLink(call) || nextLink(call)) return;

        const chain = chainOf(call, sourceCode);
        const isMultiline = call.loc.end.line > chain[0].receiverEndLine;

        if (!isMultiline) return;

        chain
          .filter(isMisplaced)
          .forEach(({ link, dot }) => {
            const loc = { start: dot.loc.start, end: link.callee.property.loc.end };

            context.report({ loc, messageId: 'multilineMethodCallLineBreaks' });
          });
      }
    };
  }
});
