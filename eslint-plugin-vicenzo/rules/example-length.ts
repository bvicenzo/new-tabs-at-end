// SPDX-License-Identifier: GPL-3.0-or-later
import { createRule } from '../utils/create-rule';
import { countedLines } from '../utils/counted-lines';
import { callbackOf, testBlockKind } from '../utils/test-blocks';

const DEFAULT_MAX = 20;

export default createRule<[{ max: number }], 'exampleLength'>({
  name: 'example-length',
  meta: {
    type: 'suggestion',
    docs: { description: 'Limit the lines of an example, counting each array, object, call and template as one.' },
    messages: { exampleLength: 'Example has too many lines [{{length}}/{{max}}].' },
    schema: [{ type: 'object', properties: { max: { type: 'integer', minimum: 0 } }, additionalProperties: false }]
  },
  defaultOptions: [{ max: DEFAULT_MAX }],
  create(context, [{ max }]) {
    return {
      CallExpression(call) {
        const callback = testBlockKind(call) === 'example' ? callbackOf(call) : null;

        if (!callback) return;

        const length = countedLines(callback.body);

        if (length > max) context.report({ node: call, messageId: 'exampleLength', data: { length, max } });
      }
    };
  }
});
