import type { ESLint, Rule } from 'eslint';

import conditionalInSpec from './rules/conditional-in-spec';
import contextWording from './rules/context-wording';
import describeInsideContext from './rules/describe-inside-context';
import dynamicExampleGeneration from './rules/dynamic-example-generation';
import exampleLength from './rules/example-length';
import inconsistentSiblingStructure from './rules/inconsistent-sibling-structure';
import iterationInsideExample from './rules/iteration-inside-example';
import leakyDefinition from './rules/leaky-definition';
import nestedContextImproperStart from './rules/nested-context-improper-start';
import topLevelContext from './rules/top-level-context';
import topLevelExample from './rules/top-level-example';
import unnestedContextImproperStart from './rules/unnested-context-improper-start';

const RULE_MODULES = [
  conditionalInSpec,
  contextWording,
  describeInsideContext,
  dynamicExampleGeneration,
  exampleLength,
  inconsistentSiblingStructure,
  iterationInsideExample,
  leakyDefinition,
  nestedContextImproperStart,
  topLevelContext,
  topLevelExample,
  unnestedContextImproperStart
];

// typescript-eslint rule modules are typed for its own RuleContext; ESLint's Plugin type expects its own.
const rulesByName = Object.fromEntries(RULE_MODULES.map((rule) => [rule.name, rule]));
const rules = rulesByName as unknown as Record<string, Rule.RuleModule>;

const plugin: ESLint.Plugin = { meta: { name: 'eslint-plugin-vicenzo', version: '0.0.0' }, rules };

export default plugin;
