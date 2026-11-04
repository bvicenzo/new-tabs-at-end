# 0006 — How rubocop-vicenzo and its style.yml map to ESLint

- **Status:** accepted
- **Date:** 2026-11-04

## Context

This project ports the author's Ruby style — the cops of [rubocop-vicenzo](https://github.com/bvicenzo/rubocop-vicenzo)
and its `config/style.yml` — to TypeScript (see [0003](0003-lint-rules-live-in-this-repository.md)). Some rules have a
ready equivalent in ESLint, `@stylistic/eslint-plugin`, `typescript-eslint` or `@vitest/eslint-plugin`; others are
written as the local plugin `eslint-plugin-vicenzo/`. Everything is configured in `eslint.config.ts`.

## Decision

### Ready-made rules

| Ruby | ESLint |
| --- | --- |
| `Layout/LineLength` 120, comments allowed | `@stylistic/max-len` 120, `ignoreComments`, `ignoreUrls` |
| Fixed, consistent indentation | `@stylistic/indent` 2 |
| Punctuation chosen for TS (code style skill) | `@stylistic/semi` always, `quotes` single (`avoidEscape`), `comma-dangle` never, `operator-linebreak` before, `dot-location` property |
| `Layout/Multiline{MethodArgument,Array,HashKey}LineBreaks`, `First*LineBreak`, `Multiline*BraceLayout` | `@stylistic/function-call-argument-newline` consistent, `function-paren-newline` multiline-arguments, `array-bracket-newline` and `array-element-newline` consistent, `object-curly-newline` consistent, `object-property-newline`, `multiline-ternary` always-multiline |
| Blank line after extracted constants (code style skill) | `@stylistic/padding-line-between-statements` |
| `Style/Lambda` literal | `prefer-arrow-callback`, `arrow-body-style` as-needed |
| `Metrics/MethodLength` 20 | `max-lines-per-function` 20, blank lines and comments skipped, off in test files |
| `Metrics/ClassLength` / `ModuleLength` 200 | `max-lines` 200, blank lines and comments skipped |
| `Metrics/CyclomaticComplexity` (RuboCop default) | `complexity` 7 |
| `Metrics/BlockLength` excluded from specs | `max-lines-per-function` off in `**/*.test.ts` |
| `Vicenzo/RSpec/TopLevelHook` | `vitest/no-hooks` — stricter: no hooks at any level (see [0004](0004-test-style.md)) |
| Unused names prefixed with `_` are allowed (`_isbn`) | `@typescript-eslint/no-unused-vars` ignoring `^_` |

Base sets: `@eslint/js` recommended, `typescript-eslint` `recommendedTypeChecked` (with `no-floating-promises`, which
the asynchronous `chrome.*` API needs), and `@vitest/eslint-plugin` recommended plus `consistent-test-it` (`it`) and
`require-top-level-describe`.

### Rules of the local plugin

| Ruby | `vicenzo/` rule |
| --- | --- |
| `RSpec/ContextWording` (`when`, `with`, `without`, `and`, `but`) | `context-wording` |
| `Vicenzo/RSpec/NestedContextImproperStart` | `nested-context-improper-start` |
| `Vicenzo/RSpec/UnnestedContextImproperStart` | `unnested-context-improper-start` |
| `Vicenzo/RSpec/DescribeInsideContext` | `describe-inside-context` |
| `Vicenzo/RSpec/InconsistentSiblingStructure` | `inconsistent-sibling-structure` |
| `Vicenzo/RSpec/TopLevelContext`, `TopLevelExample` | `top-level-context`, `top-level-example` |
| `Vicenzo/RSpec/ConditionalInSpec` | `conditional-in-spec` |
| `Vicenzo/RSpec/IterationInsideExample` | `iteration-inside-example` |
| `Vicenzo/RSpec/DynamicExampleGeneration` | `dynamic-example-generation` |
| `Vicenzo/RSpec/LeakyDefinition` | `leaky-definition` |
| `RSpec/ExampleLength` 20 | `example-length` |
| `Vicenzo/Layout/MultilineMethodCallLineBreaks` | `multiline-method-call-line-breaks` |
| `Vicenzo/Naming/ShortName`, `Naming/BlockParameterName` 3 | `short-name` |
| `Vicenzo/Naming/AnonymousUnusedName` | `anonymous-unused-name` |
| `Naming/RescuedExceptionsVariableName: error` | `catch-error-name` |
| — (the one-line rule, never enforceable as a cop) | `prefer-single-line` (experimental) |

The plugin's `README.md` tracks which of these exist yet and how each one adapts its cop to Vitest.

## Not ported, on purpose

- Cops about `let`/`subject` — CompetingSubjects, DerivedPremises, LetAliasingSubject, LetIsMethodResult,
  MutatedPremises, NestedLetRedefinition, NestedSubjectRedefinition, SubjectDefinedAsLet, SubjectIsMethodResult,
  TopLevelLet, TopLevelSubject: this project has no `let`/`subject` (see [0004](0004-test-style.md)).
- `Naming/PredicatePrefix` (forbids `is_`/`have_`): Ruby has the `?` suffix; TypeScript does not, and `isX`/`hasX` is
  its idiom.
- `Metrics/AbcSize`: no ESLint equivalent; cyclomatic `complexity` 7 is used instead.
- Ruby-only cops — `Vicenzo/Style/JsonParseSymbolizeNames`, `PreferManyOverSizeComparison`,
  `MultilineMethodCallParentheses`, `Vicenzo/Rails/*`, `Style/SymbolArray`, `Style/WordArray`,
  `Style/PreferredHashMethods`.
- `however` as a context prefix: not part of this vocabulary; `but` covers it.

## Consequences

- ESLint has no `CountAsOne`: arrays, objects and multi-line calls count by their real lines in `max-lines` and
  `max-lines-per-function` (`example-length` implements it for examples).
- Formatting is never fixed automatically for line length (see the code style skill); `eslint --fix` remains
  available for the rules where the fix is unambiguous.
