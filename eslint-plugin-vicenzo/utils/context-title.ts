// SPDX-License-Identifier: GPL-3.0-or-later
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

// Words that open a scenario: a context with no scenario around it starts with one of them.
export const SCENARIO_OPENERS: readonly string[] = ['when', 'with', 'without'];

// Words that continue the scenario of the enclosing context.
export const SCENARIO_CONTINUERS: readonly string[] = ['and', 'but'];

const FROM_FIRST_NON_LETTER = /\P{L}.*/su;

// The text of a call's title when it is written literally: a string, or a template literal without expressions.
export function literalTitle({ arguments: [title] }: TSESTree.CallExpression): string | null {
  if (title?.type === AST_NODE_TYPES.Literal) return typeof title.value === 'string' ? title.value : null;

  const isPlainTemplate = title?.type === AST_NODE_TYPES.TemplateLiteral && title.expressions.length === 0;

  return isPlainTemplate ? title.quasis[0].value.cooked : null;
}

// The leading run of letters of `text`, after any leading whitespace, in lowercase; empty when no letter starts it.
export function firstWord(text: string): string {
  return text.trimStart().replace(FROM_FIRST_NON_LETTER, '').toLowerCase();
}
