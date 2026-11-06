# 0007 — CI checks are advisory while the repository is private

- **Status:** superseded by [0011](0011-ci-checks-are-required.md)
- **Date:** 2026-11-05

## Context

The CI workflow (`.github/workflows/ci.yml`) runs the lint, the type check and the test suite with full coverage on
every pull request, and checks that the PR title is a Conventional Commit. Making those checks required needs branch
protection or a ruleset on `master`, and GitHub answers both with 403 for a private repository on the Free plan.

## Decision

The repository stays private for now and the checks are advisory: a red check marks the pull request, but does not
block the merge.

## Consequences

- Whoever merges reads the checks first; a red check is not merged.
- **Revisit when** the repository becomes public for the Chrome Web Store (plan 07): protect `master` requiring the
  `checks` and `pr-title` jobs, with squash merge only and no direct pushes, and supersede this decision.
