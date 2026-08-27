/* Assembles src/ into dist/.
   Pages are content fragments; the shell, nav and footer live in one place, and
   the menu / spirits / party data lives in JSON so nobody has to photograph a
   printed sheet to change a price. */
import { readFile, writeFile, mkdir, readdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = 'src';
const OUT = 'dist';
const SITE = 'https://charliesbar.com';

const NAV = [
  ['/menus', 'Menus'],
  ['/spirits', 'Spirits'],
  ['/entertainment', 'Entertainment'],
  ['/parties', 'Parties'],
  ['/gift-cards', 'Gift Cards'],
  ['/shop', 'Shop'],
  ['/gallery', 'Gallery'],
  ['/directions', 'Directions']
];

const UTILITY = [
  ['/about', 'About'],
  ['/employment', 'Employment'],
  ['/contact', 'Contact']
];

/* Page file -> output path. Everything else becomes /<name>. */
const ROUTES = { index: '/' };

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const money = (v) => (v == null ? '' : typeof v === 'number' ? `$${v.toFixed(2).replace(/\.00$/, '')}` : String(v));

/* ------------------------------------------------------------------ helpers */

function readMeta(raw) {
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error('page is missing its <!--meta {...} --> block');
  return { meta: JSON.parse(m[1]), body: raw.slice(m[0].length) };
}

function navHtml(current) {
  return NAV.map(([href, label]) => {
    const active = href === current ? ' aria-current="page"' : '';
    return `    <a href="${href}"${active}>${label}</a>`;
  }).join('\n');
}

function utilityHtml(current) {
  return UTILITY.map(([href, label]) => {
    const active = href === current ? ' aria-current="page"' : '';
    return `<a href="${href}"${active}>${label}</a>`;
  }).join('\n      ');
}

function footerNavHtml() {
  return [['/', 'Home'], ...UTILITY, ...NAV]
    .map(([href, label]) => `      <a href="${href}">${label}</a>`)
    .join('\n');
}

/* -------------------------------------------------------------- data blocks */

function renderLunch(data) {
  const rows = data.days.map((d) => `
        <tr>
          <th scope="row">${esc(d.day)}</th>
          <td>
            <span class="dish">${esc(d.worker.name)}</span>
            <span class="note">${esc(d.worker.detail)}</span>
          </td>
          <td class="price">${money(d.worker.price)}</td>
          <td>
            <span class="dish">${esc(d.chef.name)}</span>
            <span class="note">${esc(d.chef.detail)}</span>
          </td>
          <td class="price">${money(d.chef.price)}</td>
        </tr>`).join('');

  return `<div class="table-scroll">
      <table class="menu-table">
        <caption>${esc(data.caption)}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col" colspan="2">Workperson Special</th>
            <th scope="col" colspan="2">Chef's Choice</th>
          </tr>
        </thead>
        <tbody>${rows}
        </tbody>
      </table>
    </div>`;
}

function renderCourses(groups) {
  return groups.map((g) => `<div class="course">
      <h3>${esc(g.group)}</h3>
      <dl class="dishes">
${g.items.map((i) => `        <div class="dish-row">
          <dt>${esc(i.name)}${i.price != null ? `<span class="dots" aria-hidden="true"></span><b>${money(i.price)}</b>` : ''}</dt>
          ${i.detail ? `<dd>${esc(i.detail)}</dd>` : ''}
        </div>`).join('\n')}
      </dl>
    </div>`).join('\n    ');
}

function renderColumns(title, items, cls = '') {
  return `<div class="listing ${cls}">
      <h3>${esc(title)}</h3>
      <ul class="cols">
${items.map((i) => `        <li>${typeof i === 'string' ? esc(i) : `<b>${esc(i.name)}</b>${i.detail ? ` <span>${esc(i.detail)}</span>` : ''}${i.abv ? ` <em>${esc(i.abv)}</em>` : ''}`}</li>`).join('\n')}
      </ul>
    </div>`;
}

/* ------------------------------------------------------------------- render */

async function main() {
  if (existsSync(OUT)) await rm(OUT, { recursive: true });
  await mkdir(OUT, { recursive: true });

  const layout = await readFile(path.join(SRC, 'layout.html'), 'utf8');
  const data = {};
  for (const f of await readdir(path.join(SRC, 'data'))) {
    data[path.basename(f, '.json')] = JSON.parse(await readFile(path.join(SRC, 'data', f), 'utf8'));
  }

  const blocks = {
    LUNCH: renderLunch(data.menus.lunch),
    WEEKNIGHT: renderCourses(data.menus.weeknight),
    WEEKEND: renderCourses(data.menus.weekend),
    BREAKFAST: renderCourses(data.menus.breakfast),
    COCKTAILS: renderCourses([{ group: "Charlie's drink specials", items: data.spirits.cocktails }]),
    TAPS: renderColumns('On tap', data.spirits.taps),
    WINES: renderColumns('Wines by the glass', data.spirits.wines),
    SHOOTERS: renderColumns('Shooters', data.spirits.shooters, 'listing--wide'),
    BOTTLES: renderColumns('Bottles & cans', data.spirits.bottles),
    PARTY_COLD: renderCourses([data.party.cold]),
    PARTY_HOT: renderCourses([data.party.hot]),
    PARTY_PLATED: renderCourses(data.party.plated),
    PARTY_BUFFETS: data.party.buffets.map((b) => `<div class="buffet">
      <h3>${esc(b.name)} <b>${money(b.price)} <span>per person</span></b></h3>
      <p class="buffet-min">${esc(b.minimum)}</p>
      ${b.choices.map((c) => `<p class="buffet-choice"><strong>${esc(c.label)}</strong> ${esc(c.options.join(' · '))}</p>`).join('\n      ')}
    </div>`).join('\n    ')
  };

  const pages = (await readdir(path.join(SRC, 'pages'))).filter((f) => f.endsWith('.html'));
  const sitemap = [];

  for (const file of pages) {
    const name = path.basename(file, '.html');
    const route = ROUTES[name] ?? `/${name}`;
    const raw = await readFile(path.join(SRC, 'pages', file), 'utf8');
    const { meta, body } = readMeta(raw);

    let content = body;
    for (const [key, html] of Object.entries(blocks)) {
      content = content.replaceAll(`{{${key}}}`, html);
    }

    const leftover = content.match(/\{\{[A-Z_]+\}\}/);
    if (leftover) throw new Error(`${file}: unresolved placeholder ${leftover[0]}`);

    const html = layout
      .replaceAll('{{TITLE}}', esc(meta.title))
      .replaceAll('{{DESCRIPTION}}', esc(meta.description))
      .replaceAll('{{CANONICAL}}', SITE + route)
      .replaceAll('{{BODY_CLASS}}', meta.bodyClass ?? '')
      .replaceAll('{{NAV}}', navHtml(route))
      .replaceAll('{{UTILITY_NAV}}', utilityHtml(route))
      .replaceAll('{{FOOTER_NAV}}', footerNavHtml())
      .replaceAll('{{YEAR}}', String(new Date().getFullYear()))
      .replaceAll('{{CONTENT}}', content);

    const dest = route === '/' ? path.join(OUT, 'index.html') : path.join(OUT, `${name}.html`);
    await writeFile(dest, html);
    sitemap.push({ route, priority: route === '/' ? '1.0' : '0.7' });
  }

  await cp('assets', path.join(OUT, 'assets'), { recursive: true });
  await cp(path.join(SRC, 'styles.css'), path.join(OUT, 'styles.css'));
  await cp(path.join(SRC, 'main.js'), path.join(OUT, 'main.js'));
  await cp(path.join(SRC, 'robots.txt'), path.join(OUT, 'robots.txt'));

  await writeFile(path.join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemap.map((s) => `  <url>\n    <loc>${SITE}${s.route}</loc>\n    <priority>${s.priority}</priority>\n  </url>`).join('\n') +
    `\n</urlset>\n`);

  console.log(`built ${pages.length} pages -> ${OUT}/`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
