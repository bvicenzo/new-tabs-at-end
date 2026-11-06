// SPDX-License-Identifier: GPL-3.0-or-later
import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule';
import { nameLocation } from '../utils/names';

const DEFAULT_PREFERRED_NAME = 'error';

type SourceCode = Readonly<TSESLint.SourceCode>;

// Only the outermost catch clause is held to the name: a nested one cannot reuse it without shadowing the outer error.
function isInsideCatchClause(clause: TSESTree.CatchClause, sourceCode: SourceCode): boolean {
  return sourceCode.getAncestors(clause).some((ancestor) => ancestor.type === AST_NODE_TYPES.CatchClause);
}

function scopesWithin(scope: TSESLint.Scope.Scope): TSESLint.Scope.Scope[] {
  return [scope, ...scope.childScopes.flatMap(scopesWithin)];
}

function declaresOrReads(scope: TSESLint.Scope.Scope, name: string): boolean {
  const declares = scope.variables.some((variable) => variable.name === name);

  return declares || scope.references.some(({ identifier }) => identifier.name === name);
}

// Renaming the error to a name the clause already uses — read from outside, declared or taken as a parameter inside —
// would redeclare it or shadow one of them.
function usesName(clause: TSESTree.CatchClause, name: string, sourceCode: SourceCode): boolean {
  return scopesWithin(sourceCode.getScope(clause)).some((scope) => declaresOrReads(scope, name));
}

export default createRule<[{ preferredName: string }], 'catchErrorName'>({
  name: 'catch-error-name',
  meta: {
    type: 'suggestion',
    docs: { description: 'Require the error bound by a catch clause to have the preferred name.' },
    messages: { catchErrorName: 'Use `{{preferred}}` instead of `{{bad}}`.' },
    schema: [
      { type: 'object', properties: { preferredName: { type: 'string', minLength: 1 } }, additionalProperties: false }
    ]
  },
  defaultOptions: [{ preferredName: DEFAULT_PREFERRED_NAME }],
  create(context, [{ preferredName }]) {
    const { sourceCode } = context;

    return {
      CatchClause(clause) {
        const { param } = clause;

        if (param?.type !== AST_NODE_TYPES.Identifier || isInsideCatchClause(clause, sourceCode)) return;

        const preferred = param.name.startsWith('_') ? `_${preferredName}` : preferredName;

        if (param.name === preferred || usesName(clause, preferred, sourceCode)) return;

        const data = { preferred, bad: param.name };

        context.report({ loc: nameLocation(param), messageId: 'catchErrorName', data });
      }
    };
  }
});
