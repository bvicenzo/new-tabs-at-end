# Brand

The visual identity of New Tabs at End: one idea, drawn once and reused everywhere — **a row of tabs where the new one
is the last, the brightest and the one with the plus.**

<img src="icon.svg" width="96" alt="The New Tabs at End icon">

## Files

| File | What it is | Where it goes |
| --- | --- | --- |
| `icon.svg` | The full icon, 128×128 | 32, 48 and 128 px extension icons, site favicon |
| `icon-small.svg` | The icon redrawn on a 16 px grid: two tabs, no plus | 16 px extension icon (toolbar, menus) |
| `logo.svg` / `logo-dark.svg` | Icon and name, for light and dark backgrounds | README, slides, anywhere the name appears |
| `og-image.svg` | 1200×630 social preview | `site/assets/og-image.png` |
| `store/promo-small.svg` | 440×280 small promo tile | Chrome Web Store |
| `store/marquee.svg` | 1400×560 marquee | Chrome Web Store |
| `store/screenshot-1.svg` | 1280×800 illustrated screenshot | Chrome Web Store |

The SVGs are the sources. `sh brand/render.sh` turns them into the PNGs in `static/icons/`, `brand/store/` and
`site/assets/` (it needs `rsvg-convert` and ImageMagick 7). The PNGs are committed, so building the extension needs
neither. Run it again after changing any SVG.

The Web Store's 128 px icon is the artwork at 96 px centred in a transparent 128 px canvas, as the store asks.

## Palette

| Name | Hex | Use |
| --- | --- | --- |
| Ink | `#0F172A` | The icon's background, dark surfaces, text on light |
| Ink 2 | `#1E293B` | Raised surfaces on ink |
| Slate 1 · 2 · 3 | `#334155` · `#475569` · `#64748B` | The other tabs, getting lighter toward the end |
| Mint | `#2DD4BF` | **The new tab.** Accents on dark, primary buttons |
| Teal | `#0F766E` | Mint's stand-in for text and links on light backgrounds (mint fails contrast there) |
| Teal 600 | `#0D9488` | Mint's stand-in for large text and controls on light backgrounds: the name in `logo.svg`, the options page's radio buttons. Too light for body text |
| Violet | `#A78BFA` | Tab groups in illustrations — never the brand accent |
| Snow | `#F8FAFC` | Text on ink, light surfaces |

Mint marks one thing only: what is new. Keep it to one bright element per composition.

## Type

The site and the store images use **Inter**, falling back to the system's sans-serif
(`Inter, "Adwaita Sans", ui-sans-serif, system-ui, …`). Headlines are bold with tight tracking (−2 to −3.5 %); body
text is regular. Code and key names use the system's monospace.

The site loads no web fonts, so it makes no third-party request — in line with the privacy promise.

## Voice

Plain, specific and calm. Say what the extension does and what it leaves alone; show the evidence instead of
claiming it. The name stays in English in every language.

## Do and don't

- Do keep the tab silhouettes and their order: darker on the left, mint last.
- Do use `icon-small.svg` below 24 px; the full icon's plus turns to mush there.
- Don't recolour the new tab, or add a second mint element next to the icon.
- Don't put the icon on mint or on a busy photo; it is designed for neutral backgrounds.
- Don't use Google's Chrome logo in our materials; say "Chrome" in words.
