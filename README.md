<p>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/logo-dark.svg">
    <img src="brand/logo.svg" alt="New Tabs at End" width="360">
  </picture>
</p>

# New Tabs at End

**[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/new-tabs-at-end/dklpgjdablbamieaplnbelccojdflhdi)** ·
[Website](https://bvicenzo.github.io/new-tabs-at-end/) ·
[Privacy policy](https://bvicenzo.github.io/new-tabs-at-end/privacy.html)

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
instead is a setting ([0002](docs/decisions/0002-new-tab-placement-setting.md)). What happens when Chrome refuses a
move is in [0009](docs/decisions/0009-how-placement-handles-failures.md).

## Usage

- **Options:** in `chrome://extensions`, open the extension's **Details** and then **Extension options**. Choose where
  links opened from a tab in a group go: the end of the window (the default) or the end of the group.
- **Shortcut:** `Alt+Shift+G` moves the last tab the extension placed to the other place, even when that tab is in the
  background. It is the way to correct a single tab without changing the option
  ([0010](docs/decisions/0010-the-toggle-acts-on-the-last-placed-tab.md)). Change the keys in
  `chrome://extensions/shortcuts`.
- The interface is in English and Brazilian Portuguese, following the browser's language.

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
Conventional Commit; both checks are required to merge ([0011](docs/decisions/0011-ci-checks-are-required.md)).

The website is plain HTML and CSS in [`site/`](site/), published to GitHub Pages by
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) on every push to `master` that touches it. The icon, the
palette and the Chrome Web Store images live in [`brand/`](brand/README.md).

Architecture decisions live in [`docs/decisions/`](docs/decisions/); the lint rules and where each comes from are in
[0006](docs/decisions/0006-lint-mapping-from-rubocop-vicenzo.md).

## Releasing

release-please turns the Conventional Commits merged into `master` into a release pull request with the next version
and the changelog; merging it tags the release and attaches the extension package (`new-tabs-at-end-<version>.zip`).
The package goes to the Chrome Web Store by hand: the steps and the listing text are in
[`docs/publishing.md`](docs/publishing.md). `master` accepts changes only through pull requests with green checks
([0011](docs/decisions/0011-ci-checks-are-required.md)).

## License

New Tabs at End — Copyright (C) 2026 Bruno Vicenzo

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
version. It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See [`LICENSE`](LICENSE) for the full text.

Redistributions, modified or not, must keep this notice and be released under the same license, with their source.
