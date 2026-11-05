import { createRule } from '../utils/create-rule';
import { literalTitle, SCENARIO_CONTINUERS, SCENARIO_OPENERS } from '../utils/context-title';
import { isTableHead, testBlockKind } from '../utils/test-blocks';

type Options = [{ prefixes: string[] }];

const DEFAULT_PREFIXES = [...SCENARIO_CONTINUERS, ...SCENARIO_OPENERS];

const PREFIXES_SCHEMA = { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 1 } as const;

// A prefix opens the title when the title starts with it and the next character does not continue its last word,
// so multi-word prefixes (`in case`) work and `and` does not match `android`.
function opensWith(title: string, prefix: string): boolean {
  const opening = title.trimStart().toLowerCase();

  return opening.startsWith(prefix) && !/^\p{L}/u.test(opening.slice(prefix.length));
}

export default createRule<Options, 'contextWording'>({
  name: 'context-wording',
  meta: {
    type: 'suggestion',
    docs: { description: 'Require a `context` description to start with an allowed prefix.' },
    messages: { contextWording: 'Start the `context` description with one of: {{ prefixes }}.' },
    schema: [{ type: 'object', properties: { prefixes: PREFIXES_SCHEMA }, additionalProperties: false }]
  },
  defaultOptions: [{ prefixes: DEFAULT_PREFIXES }],
  create(context, [{ prefixes }]) {
    const allowedPrefixes = prefixes.map((prefix) => prefix.toLowerCase());
    const listedPrefixes = allowedPrefixes.map((prefix) => `\`${prefix}\``).join(', ');

    return {
      CallExpression(call) {
        if (testBlockKind(call) !== 'context' || isTableHead(call)) return;

        const title = literalTitle(call);

        if (title === null || allowedPrefixes.some((prefix) => opensWith(title, prefix))) return;

        context.report({ node: call, messageId: 'contextWording', data: { prefixes: listedPrefixes } });
      }
    };
  }
});
