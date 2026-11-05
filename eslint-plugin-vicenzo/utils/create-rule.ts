import { ESLintUtils } from '@typescript-eslint/utils';

const RULES_DOCUMENTATION = 'https://github.com/bvicenzo/new-tabs-at-end/blob/master/eslint-plugin-vicenzo/README.md';

export const createRule = ESLintUtils.RuleCreator((name) => `${RULES_DOCUMENTATION}#${name}`);
