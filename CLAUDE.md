# New Tabs at End

Chrome extension (Manifest V3, TypeScript) that moves only genuinely new tabs to the end of the window.

## Conventions

- Code, identifiers, docs, commit messages and PR descriptions are in **English**. Files in `plans/` are in
  **Brazilian Portuguese**.
- Commits and PR titles follow Conventional Commits (enforced by `.githooks/commit-msg`). PRs are squash-merged.
- Never add AI attribution: no `Co-Authored-By` trailer, no "Generated with Claude Code" line.

## Skills to use

- **Every `.ts` file:** if it fits in 120 columns it stays on one line; a longer line is resolved by hand, breaking
  the chain first, then extracting with domain names, and only then breaking the arguments — never with a formatter
  or `--fix`.
- **Tests:** `specify-behavior` for the specification tree, then `write-tests` to fill it (Vitest, RSpec-shaped:
  `context` alias, premises and `subject` inside each `it`, builders in `test/support/`).

## Where things are

- `docs/decisions/` — architecture decisions. Read them before changing detection, placement, lint or test style.
- `brand/` — icon, logo, palette and store images. SVGs are the sources; `brand/render.sh` regenerates the PNGs.
- `site/` — the GitHub Pages website (English at the root, Portuguese in `site/pt-br/`), plain HTML and CSS with no
  JavaScript. Keep both languages in step.
- `plans/` — the work plans, one file per plan, numbered in execution order. `plans/02-test-skills.md` is
  intentionally git-ignored.
