# 0011 — CI checks are required on master

- **Status:** accepted
- **Date:** 2026-11-06
- **Supersedes:** [0007](0007-ci-checks-are-advisory-while-private.md)

## Context

The repository became public, so a ruleset can protect `master` on the Free plan. Releases are cut by release-please,
whose pull requests are opened with the workflow's `GITHUB_TOKEN`; GitHub does not start workflows for events caused
by that token, so the CI never runs on them.

## Decision

A ruleset named `master` protects the default branch:

- every change arrives through a pull request, merged by squash only; the branch is deleted after the merge;
- the `Lint, typecheck and coverage` and `Conventional Commit title` checks must pass;
- force pushes and deleting the branch are blocked.

Repository admins may bypass the ruleset, but only when merging a pull request — never by pushing to `master`. That
bypass is how a release-please pull request, which carries no checks, gets merged.

## Consequences

- A red check blocks the merge for everyone but an admin, and an admin who bypasses does it on purpose, in the merge
  dialog.
- A release pull request only changes the version and the changelog, so merging it without checks risks nothing the
  CI would have caught; the push to `master` that follows runs the CI anyway.
- If release pull requests ever need checks, release-please gets a GitHub App token instead of `GITHUB_TOKEN`, and the
  bypass can go.
