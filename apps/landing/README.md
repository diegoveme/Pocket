# Pocket landing

Marketing landing page for Pocket: six full-screen sections with snap scrolling, built with Next.js 16 (App Router), Tailwind CSS 4, Motion and Lenis.

## Running it

From the repository root:

```bash
bun install
cd apps/landing
bun run dev    # http://localhost:3002
```

The API listens on port 3000 and its default CORS origin is 3001 (the web client), so the landing uses 3002. `bun run fresh` frees that port and then starts the dev server.

Other scripts: `bun run build`, `bun run start` and `bun run lint`.

## Structure

| Path                          | What it holds                                                                |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `app/`                        | Root layout (fonts, metadata), the page and the global styles                |
| `sections/`                   | The six sections: Hero, Concept, How it works, Difference, Two sides and CTA |
| `components/`                 | Shared UI: `AssetImage`, buttons, dot navigation, reveal and scroll helpers  |
| `lib/`                        | The section list and constants, such as the early-access link                |
| `public/assets/`              | The 3D brand renders, as transparent PNGs                                    |
| `public/assets/placeholders/` | SVG stand-ins used while a final PNG is missing                              |
| `scripts/`                    | `fresh.sh` and `strip-bg.py`                                                 |

## Assets

`AssetImage` loads the final PNG and falls back to the matching SVG in `public/assets/placeholders/` when it is missing. Four final files are not in the repo yet:

- `logo-pocket.png` and `icon-pro.png` fall back to their placeholders.
- `favicon.png` has an SVG alternate in the page metadata.
- `og-image.png`, and the Apple touch icon (which reuses `favicon.png`), have no fallback and will return 404 until the files are added.

To turn a render with a flat navy background into a transparent PNG:

```bash
python3 scripts/strip-bg.py public/assets/icon-shield.png
```

It needs Python 3 with `numpy` and `Pillow`. Pass `--clear-holes` when an enclosed navy area is a real see-through gap, like a padlock shackle.
