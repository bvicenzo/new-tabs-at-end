import type { TSESTree } from '@typescript-eslint/utils';

const OPENERS = new Set(['(', '[']);
const CLINGERS = new Set([')', ']', '.', '?.', ',', ';']);

// What a line break between two tokens becomes on one line, in the project's spacing.
function separatorAcrossLines(previous: TSESTree.Token, next: TSESTree.Token): string {
  const isEmptyBraces = previous.value === '{' && next.value === '}';

  return OPENERS.has(previous.value) || CLINGERS.has(next.value) || isEmptyBraces ? '' : ' ';
}

function separator(previous: TSESTree.Token, next: TSESTree.Token): string {
  if (previous.loc.end.line !== next.loc.start.line) return separatorAcrossLines(previous, next);

  return next.range[0] > previous.range[1] ? ' ' : '';
}

// The tokens written on one line: spacing on a line shrinks to one space, line breaks become the spacing the
// style asks for (`foo(a)`, `[1]`, `{ a: 1 }`, `{}`, `tabs.map(…)`, `a && b`).
export function joinTokens(tokens: TSESTree.Token[]): string {
  return tokens
    .map((token, index) => {
      const previous = tokens[index - 1];

      return previous ? separator(previous, token) + token.value : token.value;
    })
    .join('');
}
