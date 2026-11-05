# New Tabs at End

A Chrome extension that moves **only genuinely new tabs** to the end of the window — and leaves restored tabs,
and the tab groups they belong to, exactly where Chrome puts them.

> **Status:** in development, usable from source (see [Install from source](#install-from-source)). Not on the Chrome
> Web Store yet.

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

A link opened from a tab in a group goes to the end of the window and leaves the group; going to the end of the group
instead is a setting ([0002](docs/decisions/0002-new-tab-placement-setting.md)), whose options page is still to come.
What happens when Chrome refuses a move is in [0009](docs/decisions/0009-how-placement-handles-failures.md).

## Install from source

Requires Node 26 and Chrome 102 or later.

```sh
npm install
npm run build
```

Then open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the `dist/` folder. After
pulling changes, run `npm run build` again and click the reload button on the extension's card.

## Development

Requires Node 26 (see `.node-version`). `npm install` also enables the repository's git hooks, which enforce
Conventional Commits on the commit subject.

```sh
npm install
npm run lint           # ESLint, with the rules ported from rubocop-vicenzo
npm run typecheck      # tsc --noEmit
npm test               # Vitest
npm run test:coverage  # Vitest with v8 coverage, 100% per file required
npm run build          # esbuild bundle and static files into dist/
```

CI runs `lint`, `typecheck`, `test:coverage` and `build` on every pull request and checks that its title is a
Conventional Commit. While the repository is private the checks do not block the merge
([0007](docs/decisions/0007-ci-checks-are-advisory-while-private.md)).

Architecture decisions live in [`docs/decisions/`](docs/decisions/); the lint rules and where each comes from are in
[0006](docs/decisions/0006-lint-mapping-from-rubocop-vicenzo.md).
