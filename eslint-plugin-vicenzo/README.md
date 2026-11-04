# eslint-plugin-vicenzo

Local ESLint plugin porting the author's Ruby style ([rubocop-vicenzo](https://github.com/bvicenzo/rubocop-vicenzo))
to TypeScript and Vitest. It lives in this repository on purpose and is meant to be extracted once mature
(see `docs/decisions/0003-lint-rules-live-in-this-repository.md`), so it never imports from `src/`.

## Rules

| Rule | Port of | Status |
| --- | --- | --- |
| `context-wording` | `RSpec/ContextWording` | planned |
| `nested-context-improper-start` | `Vicenzo/RSpec/NestedContextImproperStart` | planned |
| `unnested-context-improper-start` | `Vicenzo/RSpec/UnnestedContextImproperStart` | planned |
| `describe-inside-context` | `Vicenzo/RSpec/DescribeInsideContext` | planned |
| `inconsistent-sibling-structure` | `Vicenzo/RSpec/InconsistentSiblingStructure` | planned |
| `top-level-context` | `Vicenzo/RSpec/TopLevelContext` | planned |
| `top-level-example` | `Vicenzo/RSpec/TopLevelExample` | planned |
| `conditional-in-spec` | `Vicenzo/RSpec/ConditionalInSpec` | planned |
| `iteration-inside-example` | `Vicenzo/RSpec/IterationInsideExample` | planned |
| `dynamic-example-generation` | `Vicenzo/RSpec/DynamicExampleGeneration` | planned |
| `leaky-definition` | `Vicenzo/RSpec/LeakyDefinition` | planned |
| `example-length` | `RSpec/ExampleLength` | planned |
| `multiline-method-call-line-breaks` | `Vicenzo/Layout/MultilineMethodCallLineBreaks` | planned |
| `short-name` | `Vicenzo/Naming/ShortName`, `Naming/BlockParameterName` | planned |
| `anonymous-unused-name` | `Vicenzo/Naming/AnonymousUnusedName` | planned |
| `catch-error-name` | `Naming/RescuedExceptionsVariableName` | planned |
| `prefer-single-line` | — new: the one-line rule | planned, experimental |

## Testing a rule

Rules are tested with Vitest in the project's test style — explicit `describe`/`context`/`it`, no `RuleTester`
tables (a table of cases is what `dynamic-example-generation` forbids). `test/support/lint.ts` exposes
`lintWithRule(ruleName, code, ruleOptions)`, which lints a snippet as a `*.test.ts` file with only that rule on and
returns ESLint's messages.
