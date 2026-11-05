## What changed

<!-- What this PR does and why. Link an issue if there is one. -->

## Type of change

<!-- Keep only what applies. It must match the Conventional Commit type in the PR title. -->

- [ ] `feat` — new user-facing capability *(triggers a minor release)*
- [ ] `fix` — bug fix *(triggers a patch release)*
- [ ] `refactor` — behaviour-preserving change *(no release)*
- [ ] `chore` / `ci` / `docs` / `test` / `style` — maintenance *(no release)*
- [ ] breaking change — `!` in the title or a `BREAKING CHANGE:` footer

## Checklist

- [ ] The **PR title** is a valid Conventional Commit (`type: short description`).
      This PR is squash-merged, so the title is the commit release-please reads to
      decide the next version and to write the `CHANGELOG.md`.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test:coverage` (100% per file) and
      `npm run build` pass locally. CI runs the same commands.
- [ ] A decision worth remembering is recorded in `docs/decisions/`.
- [ ] The `CHANGELOG.md` was **not** edited by hand; release-please owns it.
