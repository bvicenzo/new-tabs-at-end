import { AST_NODE_TYPES, TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import { isAnonymous, nameLocation, spelledLength } from '../utils/names';

const DEFAULT_MIN_NAME_LENGTH = 3;

const SHORT_NAME_MESSAGE = 'Name `{{name}}` spells {{length}} letter(s); at least {{minimum}} are required. '
  + 'A letter or an abbreviation carries no meaning to the next reader — write the whole word, '
  + 'in the language of the domain (`waitingTime`), not a shapeless label (`key`, `value`, `item`).';

const { DefinitionType } = TSESLint.Scope;
const CHECKED_DEFINITIONS = new Set<TSESLint.Scope.Definition['type']>([
  DefinitionType.Parameter,
  DefinitionType.Variable
]);

// `{ id }` — in an object or a destructuring, with or without a default — takes its name from the property.
function isShorthand(identifier: TSESTree.Identifier): boolean {
  const { parent } = identifier;
  const property = parent.type === AST_NODE_TYPES.AssignmentPattern ? parent.parent : parent;

  return property.type === AST_NODE_TYPES.Property && property.shorthand;
}

// `declare const $`, `declare global { var z }`, `declare function f(x)`: the environment chose the name, not this code.
function isAmbient(name: TSESTree.Identifier): boolean {
  for (let node: TSESTree.Node | undefined = name.parent; node; node = node.parent) {
    if ('declare' in node && node.declare) return true;
  }

  return false;
}

// A name imposed by a property it is read into or destructured from was not chosen; the property's owner was.
function isImposed(variable: TSESLint.Scope.Variable, name: TSESTree.Identifier): boolean {
  const isReadByShorthand = variable.references
    .some(({ identifier }) => isShorthand(identifier as TSESTree.Identifier));

  return isShorthand(name) || isReadByShorthand || isAmbient(name);
}

export default createRule<[{ minNameLength: number }], 'shortName'>({
  name: 'short-name',
  meta: {
    type: 'suggestion',
    docs: { description: 'Require variable and parameter names to spell at least a minimum of letters.' },
    messages: { shortName: SHORT_NAME_MESSAGE },
    schema: [
      { type: 'object', properties: { minNameLength: { type: 'integer', minimum: 1 } }, additionalProperties: false }
    ]
  },
  defaultOptions: [{ minNameLength: DEFAULT_MIN_NAME_LENGTH }],
  create(context, [{ minNameLength }]) {
    function check(variable: TSESLint.Scope.Variable, name: TSESTree.Identifier): void {
      const length = spelledLength(name.name);

      if (isAnonymous(name.name) || length >= minNameLength || isImposed(variable, name)) return;

      const data = { name: name.name, length, minimum: minNameLength };

      context.report({ loc: nameLocation(name), messageId: 'shortName', data });
    }

    return {
      'Program:exit'() {
        context.sourceCode.scopeManager?.scopes
          .flatMap((scope) => scope.variables)
          .forEach((variable) => {
            variable.defs
              .filter((definition) => CHECKED_DEFINITIONS.has(definition.type))
              .forEach((definition) => check(variable, definition.name as TSESTree.Identifier));
          });
      }
    };
  }
});
