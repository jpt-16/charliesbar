# Charlie's Bar & Restaurant — website

The site for Charlie's Bar & Restaurant, 800 Shore Rd, Somers Point, NJ.
Twelve pages, no framework: plain HTML and CSS assembled by a ~150-line Node
script, plus one serverless function for the forms.

```
build.mjs          assembles src/ into dist/
src/layout.html    the shell — head, header, nav, footer, JSON-LD
src/pages/*.html   one content fragment per page
src/data/*.json    menus, spirits and the party menu, as structured data
src/styles.css     all styles (palette + type live in :root)
src/main.js        mobile nav, open/closed status, forms, scroll reveal
api/submit.js      form handler (Resend)
assets/            logos + favicon
```

```sh
npm run build   # -> dist/
npm run dev     # build, then serve dist/ on :8899
```

## Design is locked

Typeface and palette are carried over from the approved redesign and declared
once at the top of `src/styles.css`:

- **Type** — `Georgia, "Times New Roman", Times, serif` (`--serif`)
- **Greens** — `#22301f` deep, `#2b3d2b` primary, `#486048` mid, `#8fbf8d` accent
- **Paper** — `#fbfaf5` cream, `#f4f2ea` sand

Change a colour in one place and it changes everywhere. Don't hard-code hex
values in the markup.

> Note: the content audit suggests carrying over the old site's **Josefin Sans**.
> That conflicts with the approved redesign, which deliberately moved to Georgia,
> so Georgia is what's here. If you want to switch, it's the one `--serif` line —
> but the whole page is spaced for a serif, so it'll want a second look after.

## What changed from the old site

The old site's problems, and what replaced them:

| Old | Now |
|---|---|
| `<meta viewport content="width=1200">` — fixed desktop layout | Responsive from 320px up, with a mobile nav |
| Nested `<table>` layout | Semantic HTML, CSS grid and flexbox |
| Nav labels baked into PNGs | Real text links — restyleable, searchable, readable by screen readers |
| Menus as photographs of printed sheets | `src/data/*.json`, rendered into real tables and price lists |
| Shop page: "coming soon" | Merch page pointing at the bar, since there's no web store |
| Entertainment: mascot graphics only | Trivia, live music, game day, and an honest "call us for this week" |
| 48 unlabelled gallery images | A responsive grid ready for a curated, captioned set |

Also added: SEO meta and `BarOrPub` JSON-LD on every page, a generated
`sitemap.xml`, skip links and focus rings, `prefers-reduced-motion` support, a
live open/closed indicator computed from the bar hours, and a `Good to know`
section answering the complaints that recur in the Google reviews (cash only,
paid soda refills, the tight lot).

## Updating content

**Menus, drinks, party menu** — edit the JSON in `src/data/` and rebuild. No
Photoshop, no re-photographing a printed sheet. Prices are numbers; `null` means
"market price".

**Everything else** — the page fragments in `src/pages/`. Each starts with a
`<!--meta {...} -->` block carrying its title and meta description.

**Nav** — the `NAV` and `UTILITY` arrays at the top of `build.mjs`. One edit
changes every page.

## Forms

Contact, Employment (with resume upload) and Gift Cards all post to
`/api/submit`, which relays via [Resend](https://resend.com). Set three
environment variables in the Vercel project:

```
RESEND_API_KEY   your Resend API key
MAIL_TO          where submissions land, e.g. info@charliesbar.com
MAIL_FROM        a verified sender on the domain, e.g. site@charliesbar.com
```

Until those exist the endpoint returns 503 and the form tells the visitor to
ring the bar — it fails loudly rather than swallowing a job application. There's
an off-screen honeypot field for bots and a 5MB cap on resumes.

## Still needed before launch

1. **Photographs.** Every striped tile is a placeholder — the hero pair, the
   history photos, the merch shots, and the whole gallery. Pull the originals
   from the old site's `/galleries/`, curate and caption a subset, then swap the
   `.tile` divs for `<img>` tags.
2. **Entertainment schedule.** The page currently says "call us for this week",
   which is honest but weak. If there's a fixed trivia night, put the day on it.
3. **Menu prices.** Transcribed from the specials boards dated Aug 2026 — verify
   before launch, and remember specials rotate.
4. **The Google rating.** 4.6 across 2,385 reviews is a point-in-time snapshot.
   Re-check it at launch and when you refresh the quotes.

The three review quotes are real Google reviews, quoted with the reviewer's
display name and attributed as such.

## Deploy

Vercel, from this repo. `vercel.json` sets the build command and output
directory; the serverless function under `api/` is picked up automatically.
