# New Tabs at End

A Chrome extension that moves **only genuinely new tabs** to the end of the window — and leaves restored tabs,
and the tab groups they belong to, exactly where Chrome puts them.

> **Status:** in development. Nothing to install yet.

## Why

Extensions that push every created tab to the end also push tabs that Chrome is *restoring*: reopening the browser
with "Continue where you left off" scatters every tab out of its group, and a tab brought back with Ctrl+Shift+T lands
at the end instead of where it was.

## What counts as a new tab

| Moved to the end | Left alone |
| --- | --- |
| Ctrl+T / the "+" button | Reopening the browser with a saved session |
| A link opened in a new tab (middle click, Ctrl+click, `target=_blank`, `window.open`) | Ctrl+Shift+T on a tab or a window |
| A bookmark opened in a new tab | Duplicating a tab (stays next to the original) |
| Alt+Enter in the address bar | |
| A link opened from another application | |

How the difference is detected, and the evidence behind it, is in
[docs/decisions/0001](docs/decisions/0001-detect-new-tabs-by-empty-url.md).

## Development

Requires Node 26 (see `.node-version`). `npm install` also enables the repository's git hooks, which enforce
Conventional Commits on the commit subject.

```sh
npm install
npm run lint           # ESLint, with the rules ported from rubocop-vicenzo
npm run typecheck      # tsc --noEmit
npm test               # Vitest
npm run test:coverage  # Vitest with v8 coverage, 100% per file required
```

CI runs `lint`, `typecheck` and `test:coverage` on every pull request and checks that its title is a Conventional
Commit. While the repository is private the checks do not block the merge
([0007](docs/decisions/0007-ci-checks-are-advisory-while-private.md)).

Architecture decisions live in [`docs/decisions/`](docs/decisions/); the lint rules and where each comes from are in
[0006](docs/decisions/0006-lint-mapping-from-rubocop-vicenzo.md).
