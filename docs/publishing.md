# Publishing

How a version reaches users: release-please cuts it, CI packages it, and the package goes to the Chrome Web Store by
hand.

## Cutting a release

1. Merge pull requests with Conventional Commit titles. release-please keeps a pull request named
   `chore(master): release <version>` up to date with the next version and the `CHANGELOG.md` entries: `feat` bumps the
   minor version, `fix` the patch, and `!` or a `BREAKING CHANGE:` footer the major.
2. Merge that pull request once its checks pass. release-please opens it with the `RELEASE_PLEASE_TOKEN` secret, so
   the CI runs on it like on any other pull request ([0011](decisions/0011-ci-checks-are-required.md)).
3. The `Release` workflow tags the version, creates the GitHub release and attaches `new-tabs-at-end-<version>.zip`.
   The version in `static/manifest.json` follows the one in `package.json`.

To force a specific version, add `"release-as": "<version>"` to the package in `release-please-config.json` and remove
it right after that version is released, or every later release pull request will propose it again. The first release,
1.0.0, was cut that way.

## Uploading to the Chrome Web Store

Once, before the first upload:

- create a developer account at the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole),
  pay the one-time registration fee and turn on two-step verification for the Google account;
- verify the contact email of the account.

For every release, download the zip from the GitHub release and upload it as a new package of the item. For the first
one, fill the listing:

| Field | Value |
| --- | --- |
| Package | `new-tabs-at-end-<version>.zip` from the GitHub release |
| Store icon | `static/icons/icon-128.png` |
| Screenshot | `brand/store/screenshot-1.png` (1280×800) |
| Small promo tile | `brand/store/promo-small.png` (440×280) |
| Marquee promo tile | `brand/store/marquee.png` (1400×560) |
| Category | Productivity (Workflow & Planning, if offered) |
| Language | English, with Brazilian Portuguese added as a second listing language |
| Homepage | `https://bvicenzo.github.io/new-tabs-at-end/` |
| Support | `https://github.com/bvicenzo/new-tabs-at-end/issues` |
| Privacy policy | `https://bvicenzo.github.io/new-tabs-at-end/privacy.html` |

### Listing text

**Summary (English):** Moves only genuinely new tabs to the end of the window, leaving restored tabs and their groups
alone.

**Summary (Português):** Move só as abas realmente novas para o fim da janela, sem mexer nas abas restauradas nem nos
seus grupos.

**Description (English):**

> New tabs go to the end. Everything else stays put.
>
> Other "new tabs last" extensions push every tab Chrome creates to the end, including the ones it is bringing back:
> reopen the browser with "Continue where you left off" and your tab groups come apart; bring a tab back with
> Ctrl+Shift+T and it lands at the end instead of where it was.
>
> New Tabs at End moves only the tabs you open — Ctrl+T, links opened in a new tab, bookmarks, Alt+Enter, links from
> other applications — and leaves restored and duplicated tabs exactly where Chrome puts them.
>
> • Choose where a link opened from a grouped tab goes: the end of the window (default) or the end of its group.
> • Alt+Shift+G moves the last placed tab to the other place, even while it is in the background.
> • English and Brazilian Portuguese.
> • No data collected, no network requests, no remote code. Open source under the GPL-3.0.

**Description (Português):**

> Abas novas vão para o fim. O resto fica onde está.
>
> Outras extensões do tipo "abas novas no fim" empurram para o fim toda aba que o Chrome cria, inclusive as que ele
> está restaurando: ao reabrir o navegador com "Continuar de onde parou", seus grupos de abas se desmancham; ao trazer
> uma aba de volta com Ctrl+Shift+T, ela vai para o fim em vez de voltar para onde estava.
>
> O New Tabs at End move só as abas que você abre — Ctrl+T, links abertos em nova aba, favoritos, Alt+Enter, links
> vindos de outros aplicativos — e deixa abas restauradas e duplicadas exatamente onde o Chrome as coloca.
>
> • Escolha para onde vai um link aberto de uma aba agrupada: o fim da janela (padrão) ou o fim do grupo.
> • Alt+Shift+G leva a última aba posicionada para o outro lugar, mesmo em segundo plano.
> • Em inglês e português do Brasil.
> • Nenhum dado coletado, nenhuma requisição de rede, nenhum código remoto. Código aberto sob a GPL-3.0.

### Privacy practices tab

**Single purpose:** Moves the tabs the user opens to the end of the window (or of their tab group), leaving restored
and duplicated tabs where Chrome places them.

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| `tabs` | To notice when a tab is created, tell a tab the user opened (created with an empty URL) from one Chrome restored (created with its URL), and move it. The URL is only compared with an empty string; it is never stored or sent. |
| `tabGroups` | To read the group a new tab was opened in, and to keep it in that group or take it out, according to the user's setting and shortcut. |
| `storage` | To keep the user's placement setting (`chrome.storage.sync`) and the id of the last tab the extension placed, for the shortcut (`chrome.storage.session`). |

**Remote code:** No, the extension does not use remote code.

**Data usage:** tick none of the data categories — the extension collects no user data — and certify the three
disclosures (no selling, no use unrelated to the single purpose, no use for creditworthiness or lending).

## The listing

The extension is live at <https://chromewebstore.google.com/detail/new-tabs-at-end/dklpgjdablbamieaplnbelccojdflhdi>, item id `dklpgjdablbamieaplnbelccojdflhdi`. The website and the README link to it;
later releases are uploaded to the same item as new packages.
