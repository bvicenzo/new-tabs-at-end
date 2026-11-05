# eslint-plugin-vicenzo

Local ESLint plugin porting the author's Ruby style ([rubocop-vicenzo](https://github.com/bvicenzo/rubocop-vicenzo))
to TypeScript and Vitest. It lives in this repository on purpose and is meant to be extracted once mature
(see `docs/decisions/0003-lint-rules-live-in-this-repository.md`), so it never imports from `src/`.

## Rules

| Rule | Port of | Status |
| --- | --- | --- |
| `context-wording` | `RSpec/ContextWording` | done |
| `nested-context-improper-start` | `Vicenzo/RSpec/NestedContextImproperStart` | done |
| `unnested-context-improper-start` | `Vicenzo/RSpec/UnnestedContextImproperStart` | done |
| `describe-inside-context` | `Vicenzo/RSpec/DescribeInsideContext` | done |
| `inconsistent-sibling-structure` | `Vicenzo/RSpec/InconsistentSiblingStructure` | done |
| `top-level-context` | `Vicenzo/RSpec/TopLevelContext` | done |
| `top-level-example` | `Vicenzo/RSpec/TopLevelExample` | done |
| `conditional-in-spec` | `Vicenzo/RSpec/ConditionalInSpec` | done |
| `iteration-inside-example` | `Vicenzo/RSpec/IterationInsideExample` | done |
| `dynamic-example-generation` | `Vicenzo/RSpec/DynamicExampleGeneration` | done |
| `leaky-definition` | `Vicenzo/RSpec/LeakyDefinition` | done |
| `example-length` | `RSpec/ExampleLength` | done |
| `multiline-method-call-line-breaks` | `Vicenzo/Layout/MultilineMethodCallLineBreaks` | planned |
| `short-name` | `Vicenzo/Naming/ShortName`, `Naming/BlockParameterName` | planned |
| `anonymous-unused-name` | `Vicenzo/Naming/AnonymousUnusedName` | planned |
| `catch-error-name` | `Naming/RescuedExceptionsVariableName` | planned |
| `prefer-single-line` | — new: the one-line rule | planned, experimental |

## How each rule adapts its cop

Shared ground, from `utils/test-blocks.ts`: a call's kind (describe, context, example, hook) is decided by the
identifier at the root of its callee, so Vitest's modifiers (`skip`, `only`, `todo`, `concurrent`, `sequential`,
`fails`, `shuffle`, also read as `['only']`), tables (`each`, `for`, array or tagged template) and conditions
(`skipIf`, `runIf`) keep the root's kind; `suite` is a describe and `test` an example. Any other member breaks the
chain — `context.onTestFinished(…)`, `context.expect(…)` and `test.extend(…)` are not test blocks — and so does a
root shadowed by a parameter or a local declaration, such as Vitest's test context passed as `(context) => …`. The
callback of a block is its first function argument. A node is inside a group only through the group's callback, never
through its title. The inner call of a table (`describe.each(table)` in `describe.each(table)('title', fn)`) is a
table head and is skipped, so a table counts once.

- **context-wording** — every `context` starts with an allowed prefix (default `when`, `with`, `without`, `and`,
  `but`; option `prefixes` replaces them, at least one, none empty, case-insensitive). A prefix opens the title when
  the title starts with it and the next character does not continue its last word, so prefixes may have several
  words (`in case`) and `and` does not match `android`. Only literal titles are checked (a string, or a template
  without expressions) — unlike `RSpec/ContextWording`, an interpolated title is not checked even when its literal
  start would decide it.
- **nested-context-improper-start** — a `context` whose closest group is a `context` must not start with `when`,
  `with` or `without`; the message suggests `and` or `but`. No `however`.
- **unnested-context-improper-start** — a `context` whose closest group is a describe, or that has no group, must not
  start with `and` or `but` (option `forbiddenPrefixes` replaces them).
- **describe-inside-context** — a describe whose closest group is a `context`; a describe inside a non-group function
  (an example callback) within a context counts.
- **inconsistent-sibling-structure** — the direct children of a group (calls whose closest group is that group) mixing
  examples (`it.todo` included), describes and contexts; module scope is not evaluated; hooks are ignored.
- **top-level-context / top-level-example** — a context or example at module scope (including inside a function
  declared there) or directly in the outermost group. Overlaps with `vitest/require-top-level-describe` on purpose: the
  plugin must stand alone once extracted.
- **conditional-in-spec** — every `if`, ternary and `switch`, anywhere in a test file (Ruby's `case` escaped the cop;
  `switch` does not), plus conditional registration through `skipIf` / `runIf`. Not reported: `&&`, `||`, `??`, `?.`,
  logical assignments, `try/catch`, conditional types.
- **iteration-inside-example** — inside an example, an iteration whose body asserts (`expect(…)`, `expect.soft`,
  `expect.poll`). Iterations: `forEach`, `map`, `flatMap`, `every`, `some`, `for`, `for…of`, `for…in`, `while`,
  `do…while` — wider than the cop, which ignores `map`; `every` with an assertion silently checks only the first
  element. Callbacks passed by reference and computed members are not followed.
- **dynamic-example-generation** — any table applied to a test block (`.each` / `.for`, array or tagged template,
  reported once at the table), and any iteration whose body registers a test block or hook. `vitest/prefer-each`
  contradicts this rule and must never be enabled. Known gap: a tagged-template table stored in a variable before
  being called is not detected (see the pending example in its test).
- **leaky-definition** — re-justified for ES modules: a definition in a test file hides a premise outside the example
  that reads it. Reported: functions, classes, type aliases, interfaces, enums, namespaces and global/module
  augmentations anywhere in a test file, and variable declarations outside an example. Exempt: imports, re-exports,
  variables inside an example, and anything inside a `vi.mock` / `vi.doMock` factory (`vi.hoisted` is not exempt).
  Only the outermost leaking declaration is reported. Unlike the cop, which also flags a `def` inside an example,
  only variables are exempt inside one.
- **example-length** — an example body longer than `max` (default 20) counted lines. Blank and comment-only lines do
  not count; an array, object, call, `new` expression or template spanning several lines counts as one line, but the
  block body of a function passed to such a call counts line by line (otherwise `expect(() => { … })` would hide any
  length). A line counts once even when two folded constructs share it. Unlike RuboCop, which counts a block's `end`,
  the closing line of such a function body (`});`) is not counted.

## Testing a rule

Rules are tested with Vitest in the project's test style — explicit `describe`/`context`/`it`, no `RuleTester`
tables (a table of cases is what `dynamic-example-generation` forbids). `test/support/lint.ts` exposes
`lintWithRule(rule, code, ruleOptions)`, which lints a snippet as a `*.test.ts` file with only that rule module on
and returns ESLint's messages; `test/support/parse.ts` parses snippets for testing the shared utilities.

Rules apply to files by configuration (`eslint.config.ts` scopes test rules to `**/*.test.ts`), never by checking
the filename themselves.
