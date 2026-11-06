// SPDX-License-Identifier: GPL-3.0-or-later
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import { enclosingMockFactory } from '../utils/mock-factory';
import { enclosingExample } from '../utils/test-blocks';

type Definition = TSESTree.FunctionDeclaration
  | TSESTree.TSDeclareFunction
  | TSESTree.ClassDeclaration
  | TSESTree.TSTypeAliasDeclaration
  | TSESTree.TSInterfaceDeclaration
  | TSESTree.TSEnumDeclaration
  | TSESTree.TSModuleDeclaration
  | TSESTree.VariableDeclaration;

const DEFINITION_TYPES: ReadonlySet<AST_NODE_TYPES> = new Set([
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.TSDeclareFunction,
  AST_NODE_TYPES.ClassDeclaration,
  AST_NODE_TYPES.TSTypeAliasDeclaration,
  AST_NODE_TYPES.TSInterfaceDeclaration,
  AST_NODE_TYPES.TSEnumDeclaration,
  AST_NODE_TYPES.TSModuleDeclaration,
  AST_NODE_TYPES.VariableDeclaration
]);

const DEFINITION_SELECTOR = [...DEFINITION_TYPES].join(', ');

const LEAKY_DEFINITION_MESSAGE = 'Do not define functions, classes, types or shared values in a test file: '
  + 'move them to `test/support/`, or declare the value inside the example that reads it.';

function isDefinition(node: TSESTree.Node): node is Definition {
  return DEFINITION_TYPES.has(node.type);
}

// A mock factory builds a module's replacement, and an example may declare the values it reads.
function isExempt(definition: Definition): boolean {
  if (enclosingMockFactory(definition)) return true;

  return definition.type === AST_NODE_TYPES.VariableDeclaration && enclosingExample(definition) !== null;
}

// A definition inside a leaking one is part of it: only the outermost is reported.
function isInsideLeakingDefinition(node: TSESTree.Node): boolean {
  const { parent } = node;

  if (!parent) return false;
  if (isDefinition(parent) && !isExempt(parent)) return true;

  return isInsideLeakingDefinition(parent);
}

// An exported definition is reported at its `export` statement.
function reportedNode(definition: Definition): TSESTree.Node {
  const { parent } = definition;
  const isExported = parent.type === AST_NODE_TYPES.ExportNamedDeclaration
    || parent.type === AST_NODE_TYPES.ExportDefaultDeclaration;

  return isExported ? parent : definition;
}

export default createRule({
  name: 'leaky-definition',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow definitions in test files outside the variables of an example or a mock factory.' },
    messages: { leakyDefinition: LEAKY_DEFINITION_MESSAGE },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    return {
      [DEFINITION_SELECTOR](definition: Definition) {
        if (isExempt(definition) || isInsideLeakingDefinition(definition)) return;

        context.report({ node: reportedNode(definition), messageId: 'leakyDefinition' });
      }
    };
  }
});
