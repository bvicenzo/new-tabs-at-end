import { createRule } from '../utils/create-rule';
import { firstWord, literalTitle, SCENARIO_CONTINUERS } from '../utils/context-title';
import { enclosingGroup, isTableHead, testBlockKind } from '../utils/test-blocks';

type Options = [{ forbiddenPrefixes: string[] }];

const PREFIXES_SCHEMA = { type: 'array', items: { type: 'string' }, minItems: 1 } as const;

export default createRule<Options, 'unnestedContextImproperStart'>({
  name: 'unnested-context-improper-start',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow a `context` with no enclosing `context` from starting with a conjunction.' },
    messages: {
      unnestedContextImproperStart: 'Start an unnested `context` with `when`, `with` or `without`, not `{{ prefix }}`.'
    },
    schema: [{ type: 'object', properties: { forbiddenPrefixes: PREFIXES_SCHEMA }, additionalProperties: false }]
  },
  defaultOptions: [{ forbiddenPrefixes: [...SCENARIO_CONTINUERS] }],
  create(context, [{ forbiddenPrefixes }]) {
    const normalizedPrefixes = forbiddenPrefixes.map((prefix) => prefix.toLowerCase());

    return {
      CallExpression(call) {
        if (testBlockKind(call) !== 'context' || isTableHead(call)) return;

        const group = enclosingGroup(call);
        const isInsideContext = group !== null && testBlockKind(group) === 'context';
        const title = literalTitle(call);

        if (isInsideContext || title === null) return;

        const prefix = firstWord(title);

        if (!normalizedPrefixes.includes(prefix)) return;

        context.report({ node: call, messageId: 'unnestedContextImproperStart', data: { prefix } });
      }
    };
  }
});
