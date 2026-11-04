import { Linter } from 'eslint';
import { parser } from 'typescript-eslint';

import plugin from '../../index';

// Lints `code` with a single rule of the plugin enabled, as if it were a Vitest file.
export function lintWithRule(ruleName: string, code: string, ruleOptions: unknown[] = []): Linter.LintMessage[] {
  const linter = new Linter({ configType: 'flat' });
  const config: Linter.Config = {
    files: ['**/*.ts'],
    languageOptions: { parser },
    plugins: { vicenzo: plugin as unknown as NonNullable<Linter.Config['plugins']>[string] },
    rules: { [`vicenzo/${ruleName}`]: ['error', ...ruleOptions] }
  };

  return linter.verify(code, config, { filename: 'example.test.ts' });
}
