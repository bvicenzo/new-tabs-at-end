import { createRule } from '../utils/create-rule';
import { isTableHead, testBlockKind } from '../utils/test-blocks';
import { isAtTopLevel } from '../utils/top-level';

const TOP_LEVEL_CONTEXT_MESSAGE = 'This context is declared at module scope or straight in the outermost group, so it '
  + 'is a scenario for every example in the file. Nest it in the group whose behaviour it is a scenario of.';

export default createRule({
  name: 'top-level-context',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow a `context` at module scope or straight in the outermost group.' },
    messages: { topLevelContext: TOP_LEVEL_CONTEXT_MESSAGE },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(call) {
        if (testBlockKind(call) !== 'context' || isTableHead(call)) return;

        if (isAtTopLevel(call)) context.report({ node: call, messageId: 'topLevelContext' });
      }
    };
  }
});
