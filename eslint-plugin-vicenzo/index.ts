import type { TSESLint } from '@typescript-eslint/utils';

const plugin = {
  meta: { name: 'eslint-plugin-vicenzo', version: '0.0.0' },
  rules: {}
} satisfies TSESLint.FlatConfig.Plugin;

export default plugin;
