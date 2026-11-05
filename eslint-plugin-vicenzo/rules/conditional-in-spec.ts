import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import { testBlockKind } from '../utils/test-blocks';

const CONDITIONAL_IN_SPEC_MESSAGE = 'Do not use conditional logic in specs. '
  + 'Extract each branch into an explicit context instead.';
const CONDITIONAL_REGISTRATION_MESSAGE = 'Do not register test blocks conditionally with `skipIf` or `runIf`. '
  + 'Write an explicit context for each case instead.';

const CONDITION_MODIFIERS: readonly string[] = ['skipIf', 'runIf'];

// `it.skipIf(condition)`: the call that applies a condition to a test block, named plainly (never `it['skipIf']`).
function isConditionalRegistration(call: TSESTree.CallExpression): boolean {
  const { callee } = call;
  const appliesCondition = callee.type === AST_NODE_TYPES.MemberExpression
    && !callee.computed
    && callee.property.type === AST_NODE_TYPES.Identifier
    && CONDITION_MODIFIERS.includes(callee.property.name);

  return appliesCondition && testBlockKind(call) !== null;
}

export default createRule({
  name: 'conditional-in-spec',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow `if`, ternaries, `switch` and conditional test-block registration in test files.' },
    messages: {
      conditionalInSpec: CONDITIONAL_IN_SPEC_MESSAGE,
      conditionalRegistration: CONDITIONAL_REGISTRATION_MESSAGE
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    const reportConditional = (node: TSESTree.Node): void => context.report({ node, messageId: 'conditionalInSpec' });

    return {
      IfStatement: reportConditional,
      ConditionalExpression: reportConditional,
      SwitchStatement: reportConditional,
      CallExpression(call) {
        if (isConditionalRegistration(call)) context.report({ node: call, messageId: 'conditionalRegistration' });
      }
    };
  }
});
