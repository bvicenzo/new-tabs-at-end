// SPDX-License-Identifier: GPL-3.0-or-later
import { createRule } from '../utils/create-rule';
import { isTableHead, testBlockKind } from '../utils/test-blocks';
import { isAtTopLevel } from '../utils/top-level';

const TOP_LEVEL_EXAMPLE_MESSAGE = 'This example is declared at module scope or straight in the outermost group, which '
  + 'names no behaviour. Move it into the group describing the behaviour it exercises.';

export default createRule({
  name: 'top-level-example',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow an example (`it`/`test`) at module scope or straight in the outermost group.' },
    messages: { topLevelExample: TOP_LEVEL_EXAMPLE_MESSAGE },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(call) {
        if (testBlockKind(call) !== 'example' || isTableHead(call)) return;

        if (isAtTopLevel(call)) context.report({ node: call, messageId: 'topLevelExample' });
      }
    };
  }
});
