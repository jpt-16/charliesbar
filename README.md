# Charlie's Bar & Restaurant — website

Static site for Charlie's Bar & Restaurant, 800 Shore Rd, Somers Point, NJ.
Built from the approved `Charlies Bar.dc.html` design canvas. No build step,
no framework — plain HTML, one stylesheet, one small progressive-enhancement
script.

```
index.html      the page
styles.css      all styles (palette + type live in :root)
main.js         mobile nav, open/closed status, scroll reveal
assets/         logos + favicon
vercel.json     headers, clean URLs, asset caching
```

## Design is locked

The typeface and the green palette are carried over from the design canvas
unchanged and should stay that way. Both are declared once at the top of
`styles.css`:

- **Type** — `Georgia, "Times New Roman", Times, serif` (`--serif`)
- **Greens** — `#22301f` deep, `#2b3d2b` primary, `#486048` mid, `#8fbf8d` accent
- **Paper** — `#fbfaf5` cream, `#f4f2ea` sand

Change a colour in one place and it changes everywhere. Don't hard-code hex
values in the markup.

## What was added on top of the design

- Responsive down to 320px (the canvas was fixed-column) with a mobile nav
- A live **open / closed** line in the hero, computed from the bar hours in
  `main.js` against `America/New_York`, plus today's row bolded in the hours table
- Real customer quotes replacing the placeholder review cards
- A Parties & Entertainment section, so every nav item lands somewhere
- SEO: title/description, Open Graph + Twitter cards, canonical, `robots.txt`,
  `sitemap.xml`, and `BarOrPub` JSON-LD with address, phone and opening hours
- Accessibility: skip link, focus-visible rings, labelled nav, `aria-expanded`
  on the toggle, `prefers-reduced-motion` honoured
- Directions links for Google and Apple Maps

## Before this goes live

Two things still need real content from the owners:

1. **Photos.** The two striped tiles under the menu section are placeholders —
   drop in a shot of the bar and a shot of the wings, then replace
   `.gallery .tile` with `<img>` tags.
2. **Social URLs.** The Facebook / Instagram / Snapchat / Twitter links in the
   footer are marked `data-todo="set real URL"` and currently point at `#top`.

The review quotes are sourced from public Tripadvisor reviews and attributed as
such. If you'd rather run Google reviews, swap the text and change the `<cite>`
line — don't relabel Tripadvisor quotes as Google ones.

Hours, phone, address and the cash-only policy come straight from the design
canvas. If any of them have changed, update `index.html` **and** the matching
values in the JSON-LD block and `BAR_HOURS` in `main.js`.

## Local preview

```sh
python3 -m http.server 8899
# → http://127.0.0.1:8899
```

## Deploy

Vercel, static — no framework preset, no build command, output is the repo root.
