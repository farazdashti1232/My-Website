# Faraz Malang Jan — Portfolio & Demo Projects

Four self-contained static sites, ready for GitHub Pages:

| Folder | Project | Type |
|---|---|---|
| `portfolio/` | Main portfolio site | The showcase itself |
| `focus-flow/` | Pomodoro + task app | Personal demo |
| `skyline/` | Live weather dashboard (Open-Meteo API) | Personal demo |
| `palazzo/` | Fictional trattoria microsite | Personal demo (concept) |

All sites: vanilla HTML/CSS/JS, no build step, relative asset paths — they work at
`https://farazdashti1232.github.io/<repo-name>/` with zero config changes.

## Deploy to GitHub Pages (per site)

1. On github.com (logged in as **farazdashti1232**), create a new **public** repository.
   Use these exact names — the portfolio links to them:
   - `portfolio`
   - `focus-flow`
   - `skyline`
   - `palazzo`
2. In each repo, upload the *contents* of the matching folder (not the folder itself)
   via the web UI ("Add file → Upload files"), or with git:
   ```bash
   cd portfolio            # or focus-flow / skyline / palazzo
   git init && git add . && git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/farazdashti1232/portfolio.git
   git push -u origin main
   ```
3. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` /
   `/ (root)` → Save. The site goes live at
   `https://farazdashti1232.github.io/<repo-name>/` within a minute or two.

**Do NOT rename the demo repos** without also updating the links in
`portfolio/index.html` (search for `github.io`).

## Before you publish — replace the placeholders (search for `EDIT-ME`)

0. **Portrait** — your photo lives at `portfolio/assets/faraz-portrait.jpg`
   (used in the hero, the About avatar, and as the social share image).
   After deploying, make `og:image` in `portfolio/index.html` an absolute URL:
   `https://farazdashti1232.github.io/portfolio/assets/faraz-portrait.jpg`.
   Note: it's an AI-generated headshot — fine for a portfolio, but swap in a
   real photo when you have one you're happy with.
1. **Email address** — `portfolio/index.html` (contact section) and
   `FORM_TO` in `portfolio/js/main.js`. Currently `hello@example.com`.
2. **About section facts** — your real background (education, years coding,
   location, freelance history). The copy is deliberately claim-free until you add it.
3. **Testimonials** — the section is intentionally empty. Ask past clients/colleagues:
   > "Hi — I'm putting together my portfolio and would love to include a sentence or
   > two from you about working together. A direct quote with your name and role is
   > perfect, if you're comfortable. Anything you'd want changed beforehand, just say."
   Only publish quotes you actually received, with permission.
4. **Kamash metrics** — if you have real numbers (load time, conversion, client
   feedback), add them to the Kamash case study. Never invent them.
5. **Blog drafts** — two "draft in progress" cards in Notes; replace or delete them
   when you have real posts.

## Local preview

Any static server works, e.g. from each folder:
```bash
python -m http.server 8080
```
Then open http://localhost:8080/. (Or open `index.html` directly — all four sites
work from `file://` too; only Skyline needs internet for its API.)

## Honesty rules baked into these sites

- Demo projects are labeled "personal project"; Palazzo explicitly states the brand
  is fictional and its form sends nothing.
- The contact form composes a `mailto:` in the visitor's own email app — no data is
  collected or stored.
- Skills are rated Expert/Proficient — keep that ladder truthful as you grow.
