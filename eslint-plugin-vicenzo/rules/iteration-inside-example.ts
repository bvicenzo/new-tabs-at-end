import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import { containsCall, iterationBody } from '../utils/iteration';
import { enclosingExample } from '../utils/test-blocks';

const ITERATION_INSIDE_EXAMPLE_MESSAGE = 'Do not call `expect` inside an iteration. Write explicit assertions instead.';

// `filter`, `find` and `reduce` are left out on purpose: they build data rather than walk every element.
const ITERATION_METHODS: readonly string[] = ['forEach', 'map', 'flatMap', 'every', 'some'];

// `expect.soft` and `expect.poll` assert; the other members of `expect` (`objectContaining`, `assertions`) do not.
const ASSERTING_MEMBERS: readonly string[] = ['soft', 'poll'];

function isExpect(node: TSESTree.Node): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === 'expect';
}

// `expect(…)`, `expect.soft(…)` or `expect.poll(…)`: the calls a matcher chain hangs from.
function isAssertionCall({ callee }: TSESTree.CallExpression): boolean {
  if (isExpect(callee)) return true;

  return callee.type === AST_NODE_TYPES.MemberExpression
    && !callee.computed
    && isExpect(callee.object)
    && ASSERTING_MEMBERS.includes(callee.property.name);
}

export default createRule({
  name: 'iteration-inside-example',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow `expect` inside an iteration within an example.' },
    messages: { iterationInsideExample: ITERATION_INSIDE_EXAMPLE_MESSAGE },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    function checkIteration(iteration: TSESTree.Node): void {
      const body = iterationBody(iteration, ITERATION_METHODS);

      if (body === null || enclosingExample(iteration) === null) return;
      if (containsCall(body, isAssertionCall)) context.report({ node: iteration, messageId: 'iterationInsideExample' });
    }

    return {
      CallExpression: checkIteration,
      DoWhileStatement: checkIteration,
      ForInStatement: checkIteration,
      ForOfStatement: checkIteration,
      ForStatement: checkIteration,
      WhileStatement: checkIteration
    };
  }
});
