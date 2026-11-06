// SPDX-License-Identifier: GPL-3.0-or-later
import { createRule } from '../utils/create-rule';
import { enclosingGroup, isTableHead, testBlockKind } from '../utils/test-blocks';

const DESCRIBE_INSIDE_CONTEXT_MESSAGE = 'Do not nest `describe` in a `context`: '
  + '`describe` names what is tested, `context` a state of it.';

export default createRule({
  name: 'describe-inside-context',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow a `describe` whose closest enclosing group is a `context`.' },
    messages: { describeInsideContext: DESCRIBE_INSIDE_CONTEXT_MESSAGE },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(call) {
        if (testBlockKind(call) !== 'describe' || isTableHead(call)) return;

        const group = enclosingGroup(call);
        const isInsideContext = group !== null && testBlockKind(group) === 'context';

        if (isInsideContext) context.report({ node: call, messageId: 'describeInsideContext' });
      }
    };
  }
});
