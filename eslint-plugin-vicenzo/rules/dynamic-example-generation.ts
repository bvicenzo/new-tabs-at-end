// SPDX-License-Identifier: GPL-3.0-or-later
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import { containsCall, iterationBody } from '../utils/iteration';
import { testBlockKind } from '../utils/test-blocks';

const TABLE_DRIVEN_TEST_BLOCK_MESSAGE = 'Do not generate test blocks from a table with `each` or `for`. '
  + 'Write explicit, static contexts instead.';
const ITERATION_REGISTERS_TEST_BLOCKS_MESSAGE = 'Do not use iteration to generate example groups or examples. '
  + 'Write explicit, static contexts instead.';

const ITERATION_METHODS: readonly string[] = ['forEach', 'map', 'flatMap'];
const TABLE_METHODS: readonly string[] = ['each', 'for'];

// `it.each` or `describe.for`, named plainly (never `it['each']`).
function isTableMember(node: TSESTree.Node): boolean {
  return node.type === AST_NODE_TYPES.MemberExpression
    && !node.computed
    && node.property.type === AST_NODE_TYPES.Identifier
    && TABLE_METHODS.includes(node.property.name);
}

// The expression that applies a table: `it.each(table)` itself, or the `it.each`…`` that `call` is made on.
function tableApplication(call: TSESTree.CallExpression): TSESTree.Node | null {
  const { callee } = call;

  if (isTableMember(callee)) return call;

  return callee.type === AST_NODE_TYPES.TaggedTemplateExpression && isTableMember(callee.tag) ? callee : null;
}

function registersTestBlock(call: TSESTree.CallExpression): boolean {
  return testBlockKind(call) !== null;
}

export default createRule({
  name: 'dynamic-example-generation',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow test blocks generated from tables or by iteration.' },
    messages: {
      tableDrivenTestBlock: TABLE_DRIVEN_TEST_BLOCK_MESSAGE,
      iterationRegistersTestBlocks: ITERATION_REGISTERS_TEST_BLOCKS_MESSAGE
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    function checkIteration(iteration: TSESTree.Node): void {
      const body = iterationBody(iteration, ITERATION_METHODS);
      const registersTestBlocks = body !== null && containsCall(body, registersTestBlock);

      if (registersTestBlocks) context.report({ node: iteration, messageId: 'iterationRegistersTestBlocks' });
    }

    return {
      CallExpression(call) {
        const table = tableApplication(call);
        const isTableDrivenTestBlock = table !== null && registersTestBlock(call);

        if (isTableDrivenTestBlock) context.report({ node: table, messageId: 'tableDrivenTestBlock' });

        checkIteration(call);
      },
      DoWhileStatement: checkIteration,
      ForInStatement: checkIteration,
      ForOfStatement: checkIteration,
      ForStatement: checkIteration,
      WhileStatement: checkIteration
    };
  }
});
