# 0003 — Ported lint rules live in this repository, on purpose

- **Status:** accepted
- **Date:** 2026-11-04

## Context

This project is also the proving ground for porting the rules of
[rubocop-vicenzo](https://github.com/bvicenzo/rubocop-vicenzo) (its cops and its `config/style.yml`) to TypeScript.
Some map to existing ESLint and `@stylistic` rules; others need custom rules.

## Decision

The ESLint configuration and the custom rules are written **inside this repository**, as a local plugin, instead of
starting as a separate package.

## Consequences

- Rules are shaped against real code and tests while they are being written; changing them costs one commit.
- The local plugin is kept self-contained (no imports from the extension's source) so that it can be extracted.
- Once the rules are mature, they are extracted into a standalone `eslint-plugin-vicenzo` package and this project
  becomes its first consumer. That extraction will be recorded as a new decision superseding this one.
- Cops that only exist because of RSpec's `let` and `subject` helpers are **not** ported (see
  [0004](0004-test-style.md)): with premises declared inside each example, they have nothing to check.
