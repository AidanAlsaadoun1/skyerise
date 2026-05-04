# Skyrise

A mobile-first Next.js web app that predicts how good today's sunrise and
sunset will be at your location, with a transparent 0–100 score and the
weather factors driving it.

Built for the iPhone 14 Pro viewport first (393 × 852), responsive up to
desktop. Static-exported so it deploys cleanly to GitHub Pages.

## Stack

- **Next.js 14** (app router) with `output: "export"` for static hosting
- **Tailwind CSS** + **shadcn/ui** primitives (Button, Card, Input,
  Skeleton, Tabs) wired to a custom warm/dusk theme
- **lucide-react** icons
- **Open-Meteo** for forecast + geocoding + air quality (no key required,
  no rate limit, CORS enabled — perfect for a static site)

## Why no server actions?

You initially asked for server actions, but server actions require a
Node.js runtime and **GitHub Pages only serves static files**. The two
are incompatible. Since GitHub Pages was a hard requirement, the data
fetches run in the browser against Open-Meteo's CORS-friendly API. The
data layer lives in `src/lib/` and is easy to lift into a server action
later if you ever move off Pages.

## How the score works

Each event (sunrise or sunset) gets six weighted sub-scores summed into a
0–100 quality number:

| Factor               | Weight | Sweet spot                          |
| -------------------- | ------ | ----------------------------------- |
| High clouds          | 32 %   | ~50 % cover (cirrus catches colour) |
| Low clouds           | 28 %   | minimal — they block the horizon    |
| Mid clouds           | 12 %   | thin is fine, thick is muting       |
| Humidity             | 10 %   | low → crisp; high → hazy            |
| Visibility           | 10 %   | longer is better                    |
| Air quality (EU AQI) | 8 %    | good to excellent                   |

Rubric and weights live in `src/lib/scoring.ts` and are commented for
easy tuning.

## Running locally

```bash
npm install
npm run dev   # http://localhost:3000
```

## Building the static export

```bash
npm run build   # writes to ./out
```

For local preview of the export: `npx serve out`.

## Deploying to GitHub Pages

1. Push this folder (and `.github/workflows/deploy.yml`) to a GitHub repo.
2. In the repo's **Settings → Pages**, set **Source = GitHub Actions**.
3. Push to `main`. The workflow:
   - Builds with `NEXT_PUBLIC_BASE_PATH=/<repo-name>` (so assets resolve under
     `username.github.io/<repo-name>/`).
   - Adds `.nojekyll` so Pages serves `_next/` assets.
   - Publishes the `out/` directory.

If you serve from a user/organisation page (`<user>.github.io`), the
workflow auto-detects that and leaves `basePath` empty.

### Custom domain

Drop a `CNAME` file into `public/` with your domain, and configure DNS as
GitHub describes. Set `NEXT_PUBLIC_BASE_PATH=` (empty) in that case.

## Project layout

```
src/
  app/              # Next app-router entry (layout, page, globals.css)
  components/
    ui/             # shadcn primitives (button, card, input, skeleton, tabs)
    location-bar.tsx
    score-arc.tsx
    sub-score-bar.tsx
    event-panel.tsx
    sunset-app.tsx  # top-level client component
  lib/
    open-meteo.ts   # forecast + geocoding + air-quality fetchers
    scoring.ts      # 0–100 quality heuristic
    report.ts       # combines the above into a DayReport
    types.ts
    weather-codes.ts
    utils.ts
```
