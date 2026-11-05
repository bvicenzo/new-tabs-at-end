import { createRule } from '../utils/create-rule';
import { firstWord, literalTitle, SCENARIO_OPENERS } from '../utils/context-title';
import { enclosingGroup, isTableHead, testBlockKind } from '../utils/test-blocks';

const NESTED_CONTEXT_IMPROPER_START_MESSAGE = 'Start a nested `context` with `and` or `but`, '
  + 'not `when`, `with` or `without`.';

export default createRule({
  name: 'nested-context-improper-start',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow a `context` nested in a `context` from starting with `when`, `with` or `without`.' },
    messages: { nestedContextImproperStart: NESTED_CONTEXT_IMPROPER_START_MESSAGE },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(call) {
        if (testBlockKind(call) !== 'context' || isTableHead(call)) return;

        const group = enclosingGroup(call);
        const isInsideContext = group !== null && testBlockKind(group) === 'context';
        const title = literalTitle(call);
        const opensAScenario = title !== null && SCENARIO_OPENERS.includes(firstWord(title));

        if (isInsideContext && opensAScenario) context.report({ node: call, messageId: 'nestedContextImproperStart' });
      }
    };
  }
});
