# 0011 — CI checks are required on master

- **Status:** accepted
- **Date:** 2026-11-06
- **Supersedes:** [0007](0007-ci-checks-are-advisory-while-private.md)

## Context

The repository became public, so a ruleset can protect `master` on the Free plan. Releases are cut by release-please,
which opens a pull request with the next version. Opened with the workflow's `GITHUB_TOKEN`, that pull request does not
start the CI on its own: GitHub holds the runs as `action_required` until someone approves them by hand.

## Decision

A ruleset named `master` protects the default branch:

- every change arrives through a pull request, merged by squash only; the branch is deleted after the merge;
- the `Lint, typecheck and coverage` and `Conventional Commit title` checks must pass;
- force pushes and deleting the branch are blocked.

release-please runs with a personal access token stored as the `RELEASE_PLEASE_TOKEN` secret, so its pull requests
are opened by a user and the CI runs on them like on any other pull request.

Repository admins may still bypass the ruleset, but only when merging a pull request — never by pushing to `master`.

## Consequences

- A red check blocks the merge for everyone but an admin, and an admin who bypasses does it on purpose, in the merge
  dialog. Release pull requests need no bypass.
- The token belongs to a person and expires: when it does, the `Release` workflow fails until the secret is renewed.
  It needs read and write access to the contents and the pull requests of this repository.
