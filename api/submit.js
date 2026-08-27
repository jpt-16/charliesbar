/* Receives the contact, employment and gift-card forms.
 *
 * Delivery is via Resend. Set these in the Vercel project's environment:
 *   RESEND_API_KEY   your Resend API key
 *   MAIL_TO          where submissions land, e.g. info@charliesbar.com
 *   MAIL_FROM        a verified sender on your domain, e.g. site@charliesbar.com
 *
 * Without those the endpoint returns 503 and the form tells the visitor to
 * ring the bar instead, so the page degrades honestly rather than silently
 * swallowing an application.
 */

const FORMS = {
  contact: {
    subject: 'Website contact form',
    fields: ['firstName', 'lastName', 'email', 'phone', 'message']
  },
  employment: {
    subject: 'Job application',
    fields: ['name', 'phone', 'email', 'street', 'city', 'state', 'zip', 'position',
             'salary', 'hours', 'experience', 'essentialFunctions', 'transport']
  },
  'gift-cards': {
    subject: "Charlie's Bucks request",
    fields: ['total', 'breakdown', 'firstName', 'lastName', 'email', 'phone',
             'street', 'street2', 'city', 'state', 'zip']
  }
};

const LABELS = {
  firstName: 'First name', lastName: 'Last name', name: 'Name', email: 'Email',
  phone: 'Phone', message: 'Message', street: 'Street', street2: 'Address line 2',
  city: 'City', state: 'State', zip: 'Zip', position: 'Position', salary: 'Salary requirement',
  hours: 'Hours wanted', experience: 'Prior experience',
  essentialFunctions: 'Can perform essential functions', transport: 'Reliable transport',
  total: 'Total amount', breakdown: 'Denominations'
};

const escape = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { RESEND_API_KEY, MAIL_TO, MAIL_FROM } = process.env;
  if (!RESEND_API_KEY || !MAIL_TO || !MAIL_FROM) {
    return res.status(503).json({
      ok: false,
      error: 'The form isn’t connected yet. Please call the bar on (609) 927-3663.'
    });
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return res.status(400).json({ ok: false, error: 'Could not read the form.' });
  }

  /* Bots fill hidden fields; people don't. Answer 200 so they don't retry. */
  if (form.get('company')) return res.status(200).json({ ok: true });

  const kind = String(form.get('form') || '');
  const spec = FORMS[kind];
  if (!spec) return res.status(400).json({ ok: false, error: 'Unknown form.' });

  const rows = spec.fields
    .map((f) => [LABELS[f] ?? f, String(form.get(f) ?? '').trim()])
    .filter(([, v]) => v !== '');

  if (!rows.length) return res.status(400).json({ ok: false, error: 'The form was empty.' });

  const attachments = [];
  const resume = form.get('resume');
  if (resume && typeof resume === 'object' && resume.size > 0) {
    if (resume.size > 5 * 1024 * 1024) {
      return res.status(413).json({ ok: false, error: 'That resume is over 5MB — please send a smaller file.' });
    }
    const buf = Buffer.from(await resume.arrayBuffer());
    attachments.push({ filename: resume.name || 'resume', content: buf.toString('base64') });
  }

  const html = `<h2>${escape(spec.subject)}</h2><table>` +
    rows.map(([k, v]) => `<tr><td><strong>${escape(k)}</strong></td><td>${escape(v).replace(/\n/g, '<br>')}</td></tr>`).join('') +
    '</table>';

  const reply = String(form.get('email') || '').trim();

  try {
    const send = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [MAIL_TO],
        subject: `${spec.subject} — charliesbar.com`,
        html,
        ...(reply ? { reply_to: reply } : {}),
        ...(attachments.length ? { attachments } : {})
      })
    });

    if (!send.ok) {
      console.error('resend rejected the send', send.status, await send.text());
      return res.status(502).json({
        ok: false,
        error: 'We couldn’t send that. Please call the bar on (609) 927-3663.'
      });
    }
  } catch (err) {
    console.error('resend request failed', err);
    return res.status(502).json({
      ok: false,
      error: 'We couldn’t send that. Please call the bar on (609) 927-3663.'
    });
  }

  return res.status(200).json({ ok: true });
}
