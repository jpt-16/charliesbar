# Charlie's Bar & Restaurant — website

The site for Charlie's Bar & Restaurant, 800 Shore Rd, Somers Point, NJ.
Twelve pages, no framework: plain HTML and CSS assembled by a ~150-line Node
script, plus one serverless function for the forms.

```
build.mjs          assembles src/ into dist/
src/layout.html    the shell — head, header, nav, footer, JSON-LD
src/pages/*.html   one content fragment per page
src/data/*.json    food, menus, spirits, party menu and gallery, as structured data
src/styles.css     all styles (palette + type live in :root)
src/main.js        mobile nav, open/closed status, forms, scroll reveal
api/submit.js      form handler (Resend)
assets/photos/     real photography, resized and compressed
assets/pdf/        printable party menu and gift-card form
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
| Full standing menu only readable as two JPEGs | 67 dishes across 12 courses in `food.json` |
| 48 unlabelled gallery images | 40 curated, grouped and captioned, with a keyboard-navigable lightbox |
| Shop page: "coming soon" | Merch page built around the Top Gun artwork that was orphaned on the server |
| Entertainment: mascot graphics only | Trivia, live music, game day, and an honest "call us for this week" |

Also added: SEO meta and `BarOrPub` JSON-LD on every page, a generated
`sitemap.xml`, skip links and focus rings, `prefers-reduced-motion` support, a
live open/closed indicator computed from the bar hours, and a `Good to know`
section answering the complaints that recur in the Google reviews (cash only,
paid soda refills, the tight lot).

## Updating content

**Food, drinks, party menu** — edit the JSON in `src/data/` and rebuild. No
Photoshop, no re-photographing a printed sheet. Prices are numbers; `null` means
"market price". `food.json` is the standing menu, `menus.json` the rotating
specials, `spirits.json` the bar, `party.json` the catering menu.

**Photographs** — `gallery.json` lists them by slug, grouped and captioned. Each
slug needs a matching pair under `assets/photos/gallery/thumb/` (600px) and
`full/` (1600px).

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

## Photography

Every image is self-hosted, pulled from the old site and re-encoded — nothing
hotlinks back to `charliesbar.com`, so the new site doesn't depend on the old
server staying up. The 48 gallery originals came to 19MB; resized to a 600px
thumbnail and a 1600px lightbox copy each, the whole set is 8MB.

Eleven near-duplicate table spreads were held back rather than shipped
(`dsc05287`, `dsc05384`, `dsc05391`, `dsc05399`, `dsc05415`, `dsc05418`,
`dsc05420`, `dsc05434`, `dsc05451`, `dsc05473`, `dsc05513`). They're still on
the old server if you want any of them back.

Captions were written from the photographs themselves, but nobody here knows
these rooms — worth a read-through by someone who does, particularly the five
historical shots.

## Still needed before launch

1. **Merch photographs.** The Shop page runs on the Top Gun artwork; it wants
   actual shots of the hats and tees.
2. **Entertainment schedule.** The page says "call us for this week", which is
   honest but weak. If trivia has a fixed night, put the day on it.
3. **Menu prices.** Transcribed from the boards dated Aug 2026 and from the two
   standing-menu scans — verify before launch, and remember specials rotate.
4. **The Google rating.** 4.6 across 2,385 reviews is a point-in-time snapshot.
   Re-check it at launch and when you refresh the quotes.

The three review quotes are real Google reviews, quoted with the reviewer's
display name and attributed as such.

## Accessibility

Audited with axe-core against WCAG 2.1 A and AA across all 13 pages at 1280px
and 390px: **no violations**. On top of what axe can check automatically:

- Colour contrast is computed, not eyeballed. `--ink-faint` was 3.44:1 on sand
  and failed AA; it is now `#686f62`, which clears 4.5:1 on both backgrounds.
- Links inside body text are underlined, since green on grey can't reach the
  3:1 required to distinguish them by colour alone.
- The gallery lightbox is a proper `role="dialog"` with `aria-modal`, cycles
  focus through its own controls (previous, next, close) in both directions, is
  operable with arrow keys and Escape, and returns focus to the photograph you
  opened.
- The horizontally scrolling menu table is keyboard focusable, with a focus ring.
- Reflows at 320px and at 200% zoom without horizontal scrolling.
- Heading levels never skip; every page has exactly one `h1`.
- Skip link is the first tab stop.

`npm run build` does not run these checks — re-run the audit after layout
changes. Two things automated tooling can't judge, worth a human pass before
launch: whether the photo captions describe what actually matters in each image,
and whether the site works with a real screen reader.

## Privacy

`/privacy` covers the three forms and is linked from the footer and from each
form. It is written to match what the site actually does — no analytics, no
cookies, no tracking, no database, submissions relayed to email. **If you add
analytics, a booking widget, a pixel, or anything that sets a cookie, the policy
stops being accurate and needs updating.**

It is not legal advice and has not been reviewed by a lawyer. If you take online
payments later, or start collecting anything beyond these three forms, have
someone qualified look at it.

## Deploy

Vercel, from this repo. `vercel.json` sets the build command and output
directory; the serverless function under `api/` is picked up automatically.
