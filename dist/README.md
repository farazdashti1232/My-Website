# farazdashti1232.github.io

Portfolio of **Faraz Malang Jan** — frontend developer. Pure static HTML, CSS and JavaScript; no build step, no bundler, no server.

## What's in here

| Path | What it is |
| --- | --- |
| `/index.html` | The portfolio: work, about, notes, contact |
| `/css/`, `/js/`, `/assets/` | Design tokens, interaction script, portrait |
| `/focus-flow/` | Personal project — tasks + pomodoro timer |
| `/skyline/` | Personal project — weather dashboard |
| `/palazzo/` | Personal project — restaurant microsite (fictional brand) |
| `/react-demo/` | Personal project — Splitzy, bill splitting built with React 18 |

The demo folders are personal work, not client deliverables, and are labelled that way on the site. `/react-demo/` loads React 18 and Babel from a CDN so the repo stays build-free — fine for a demo, not what I'd ship to a client.

## Deploy

This folder is the whole site, so it works as-is on GitHub Pages:

1. Create a **public** repo named `farazdashti1232.github.io` (exact case).
2. From this directory:
   ```bash
   git remote add origin https://github.com/farazdashti1232/farazdashti1232.github.io.git
   git push -u origin main
   ```
3. GitHub provisions Pages automatically for a `username.username.github.io` repo — no branch-settings step needed. Wait a minute, then open https://farazdashti1232.github.io/.

`.nojekyll` is committed so Jekyll processing stays off.

## Before you publish for real

- Replace `hello@example.com` in `index.html` **and** the `FORM_TO` constant in `js/main.js` — the contact form opens a pre-filled mail in the visitor's mail client; it sends nothing on its own.
- Testimonials are empty placeholders on purpose. Add only real quotes you have permission to use.
- Swap the AI-generated portrait in `assets/` for a real photo when you have one.
- `og:image` is a relative path; make it absolute (`https://farazdashti1232.github.io/assets/faraz-portrait.jpg`) if link previews on social matter to you.

## Where the photographs come from

Every `.jpg` under the four demo folders is a CC0 stock photograph found through Openverse, restricted to the StockSnap.io and WordPress Photos collections. CC0 needs no attribution, but each page credits title, creator and source in its footer anyway.

Two honesty limits worth keeping if you edit further:

- The photographs are atmosphere. They do not show this developer's real users, and in `palazzo/` they are generic café and pasta imagery, not the invented venue or dishes. The Skyline city cards stay hand-drawn illustrations because no CC0 photo of Reykjavík, Tokyo, Marrakesh or Singapore was verified — swapping a London or San Francisco photo into a card labelled Tokyo would misrepresent it.
- In `palazzo/` the dish names were changed to match the photos that illustrate them (tomato spaghetti, tiramisu). If you rename a dish again, check the image still depicts it.
