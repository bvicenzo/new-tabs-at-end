// SPDX-License-Identifier: GPL-3.0-or-later
import { TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import { isAnonymous, nameLocation } from '../utils/names';

const ANONYMOUS_UNUSED_NAME_MESSAGE = 'Name this {{subject}}: an unused value still means something, '
  + 'and `_` hides what. Name it after what it stands for in the domain (`_previousOwner`), '
  + 'not after its shape (`_value`, `_key`, `_item`) — that tells the next reader nothing.';

const { DefinitionType } = TSESLint.Scope;
const SUBJECT_BY_DEFINITION = new Map<TSESLint.Scope.Definition['type'], string>([
  [DefinitionType.CatchClause, 'caught error'],
  [DefinitionType.Parameter, 'parameter'],
  [DefinitionType.Variable, 'discarded value']
]);

export default createRule({
  name: 'anonymous-unused-name',
  meta: {
    type: 'suggestion',
    docs: { description: 'Require a name made of more than underscores for variables, parameters and caught errors.' },
    messages: { anonymousUnusedName: ANONYMOUS_UNUSED_NAME_MESSAGE },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    function check(definition: TSESLint.Scope.Definition): void {
      const subject = SUBJECT_BY_DEFINITION.get(definition.type);
      const name = definition.name as TSESTree.Identifier;

      if (!subject || !isAnonymous(name.name)) return;

      context.report({ loc: nameLocation(name), messageId: 'anonymousUnusedName', data: { subject } });
    }

    return {
      'Program:exit'() {
        context.sourceCode.scopeManager?.scopes
          .flatMap((scope) => scope.variables)
          .flatMap((variable) => variable.defs)
          .forEach(check);
      }
    };
  }
});
