# 0005 — TypeScript is pinned to 6.0 while typescript-eslint does not support 7

- **Status:** accepted
- **Date:** 2026-11-04

## Context

TypeScript 7 is the native (Go) compiler. `typescript-eslint` — the parser and the type-aware rules this project's
lint depends on — reads code through TypeScript's JavaScript API, and as of version 8.72.1 (and its canary) it
declares `typescript: ">=4.8.4 <6.1.0"`. TypeScript 6.0 is the last JavaScript-based release, published as the
bridge to 7.

Running both versions side by side (6 for lint, 7 for type-checking through an npm alias) works, but both packages
ship a `tsc` binary and two compilers have to be kept aligned. Dropping type-aware rules does not help: the parser
itself requires a supported `typescript`.

## Decision

`typescript` is pinned to `~6.0.3` and is the only TypeScript in the project, used both by the lint and by
`npm run typecheck`.

## Consequences

- No feature of the language is given up: 6.0 was released to match 7.0's semantics and defaults. Only the native
  compiler's speed is, which does not matter at this project's size.
- Vitest does not use the TypeScript compiler to run tests, so the pin does not affect them.
- **Revisit when** `typescript-eslint` accepts `typescript@7`: bump `typescript`, run `npm run typecheck` and
  `npm run lint`, and supersede this decision.
