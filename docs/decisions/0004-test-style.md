# 0004 — Test style: Vitest shaped like RSpec, no shared state

- **Status:** accepted
- **Date:** 2026-11-04

## Context

Tests should read like RSpec specs — behaviours described by `describe`, scenarios by `context`, outcomes by `it` —
so that the same specification approach used in Ruby projects applies here. The code is TypeScript.

## Decision

- **Vitest** is the test framework. TypeScript works natively and mocks are built in.
- `context` is provided as an alias of `describe` through a setup file. Hooks keep Vitest's names (`beforeEach`,
  `afterEach`); no RSpec-named aliases.
- There is no `let`/`subject` helper. Every premise is declared **inside the `it`**, so examples share no mutable state.
- `subject` is a naming convention: inside each `it`, the constant holding the object under test — the receiver of the
  calls being tested, never the result of calling them.
- Builders that assemble complete, valid objects (for example `buildTab({ url: '' })`) live in `test/support/`, never
  in a test file — the counterpart of factories and of `Vicenzo/RSpec/LeakyDefinition`.
- **No Prettier.** It breaks argument lists before breaking a method chain, the opposite of the line-breaking rule this
  project follows (break the chain first, then extract with domain names). Formatting is enforced by ESLint rules and
  documented in the code style skill.

## Consequences

- Premises repeat across examples where they are shared; builders keep that repetition to the one attribute each
  example is about.
- Lint rules that depend on `let`/`subject` declarations are not ported (see
  [0003](0003-lint-rules-live-in-this-repository.md)); the structural ones (top-level hooks and examples, context
  wording, conditionals and iteration inside examples, describe inside context) still apply.
