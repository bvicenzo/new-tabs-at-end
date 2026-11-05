import type { TSESLint } from '@typescript-eslint/utils';
import { type Rule, Linter } from 'eslint';
import { parser } from 'typescript-eslint';

type NamedRule = TSESLint.RuleModule<string, readonly unknown[]> & { name: string };

// Lints `code` as a Vitest file with only `rule` on, registered as `vicenzo/<its name>`.
export function lintWithRule(rule: NamedRule, code: string, ruleOptions: unknown[] = []): Linter.LintMessage[] {
  const linter = new Linter({ configType: 'flat' });
  const config: Linter.Config = {
    files: ['**/*.ts'],
    languageOptions: { parser },
    plugins: { vicenzo: { rules: { [rule.name]: rule as unknown as Rule.RuleModule } } },
    rules: { [`vicenzo/${rule.name}`]: ['error', ...ruleOptions] }
  };

  return linter.verify(code, config, { filename: 'example.test.ts' });
}
