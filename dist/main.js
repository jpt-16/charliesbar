/* Charlie's Bar & Restaurant — progressive enhancement only.
   Everything on the page works with JavaScript switched off. */
(function () {
  'use strict';

  /* ----------------------------------------------------------- mobile nav */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.textContent = open ? 'Menu' : 'Close';
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.matchMedia('(max-width: 1060px)').matches) {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
        toggle.focus();
      }
    });
  }

  /* --------------------------------------------------- current year in © */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------ open / closed status
     Bar hours, Somers Point local time. Close times past midnight are
     expressed as minutes past the opening day's midnight (e.g. 1:30am = 1530). */
  var BAR_HOURS = {
    0: { open: 9 * 60,  close: 24 * 60 + 90,  label: 'Sunday' },        /* 9am – 1:30am */
    1: { open: 8 * 60,  close: 24 * 60 + 90,  label: 'Monday' },        /* 8am – 1:30am */
    2: { open: 8 * 60,  close: 24 * 60 + 90,  label: 'Tuesday' },
    3: { open: 8 * 60,  close: 24 * 60 + 90,  label: 'Wednesday' },
    4: { open: 8 * 60,  close: 24 * 60 + 90,  label: 'Thursday' },
    5: { open: 8 * 60,  close: 24 * 60 + 120, label: 'Friday' },        /* 8am – 2am */
    6: { open: 8 * 60,  close: 24 * 60 + 120, label: 'Saturday' }
  };

  function shoreTime() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());

      var got = {};
      parts.forEach(function (p) { got[p.type] = p.value; });

      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var day = days[got.weekday];
      var hour = parseInt(got.hour, 10) % 24;
      var minute = parseInt(got.minute, 10);

      if (day === undefined || isNaN(hour) || isNaN(minute)) return null;
      return { day: day, mins: hour * 60 + minute };
    } catch (err) {
      return null;
    }
  }

  function fmt(mins) {
    var m = mins % (24 * 60);
    var h = Math.floor(m / 60);
    var mm = m % 60;
    var suffix = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (mm ? ':' + (mm < 10 ? '0' : '') + mm : '') + suffix;
  }

  var status = document.getElementById('open-status');
  var statusText = document.getElementById('open-status-text');
  var now = shoreTime();

  if (status && statusText && now) {
    var today = BAR_HOURS[now.day];
    var yesterday = BAR_HOURS[(now.day + 6) % 7];

    var inToday = now.mins >= today.open && now.mins < today.close;
    var inOvernight = now.mins + 24 * 60 < yesterday.close;
    var isOpen = inToday || inOvernight;

    status.setAttribute('data-open', String(isOpen));

    if (isOpen) {
      var closesAt = inOvernight ? yesterday.close : today.close;
      statusText.textContent = 'Open now — last call ' + fmt(closesAt) + '. Dine‑in & take out, 7 days a week.';
    } else {
      var next = now.mins < today.open ? today : BAR_HOURS[(now.day + 1) % 7];
      var when = now.mins < today.open ? 'today' : 'tomorrow';
      statusText.textContent = 'Closed right now — back open ' + when + ' at ' + fmt(next.open) + '.';
    }

    /* Bold the row in the hours table that covers today */
    document.querySelectorAll('.hours-grid .row[data-days]').forEach(function (row) {
      var days = row.getAttribute('data-days').split(',');
      if (days.indexOf(String(now.day)) !== -1) row.setAttribute('data-today', 'true');
    });
  }

  /* Keep the jump bar parked directly under the sticky header, whatever
     height the header happens to be at this width. */
  var header = document.querySelector('.site-header');
  if (header && document.querySelector('.jump')) {
    var setHeaderHeight = function () {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    };
    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);
    if ('ResizeObserver' in window) new ResizeObserver(setHeaderHeight).observe(header);
  }

  /* ------------------------------------------------------- reveal on scroll */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('[data-reveal]');

  if (!reduced && 'IntersectionObserver' in window && targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-revealing');
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.06 });

    targets.forEach(function (el) {
      el.classList.add('is-revealing');
      io.observe(el);
    });
  }
})();

/* Form submission — posts without a page reload, and says something useful when
   the mail relay isn't configured yet rather than pretending it worked. */
(function () {
  'use strict';

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var label = button ? button.textContent : '';
      if (button) { button.disabled = true; button.textContent = 'Sending…'; }
      if (status) { status.textContent = ''; status.removeAttribute('data-state'); }

      fetch(form.action, { method: 'POST', body: new FormData(form) })
        .then(function (res) {
          return res.json().catch(function () { return { ok: res.ok }; });
        })
        .then(function (data) {
          if (data && data.ok) {
            form.innerHTML = '<p class="form-sent">Thank you — that\'s come through. ' +
              'Someone will be in touch shortly.</p>';
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
          var err = new Error((data && data.error) || 'Something went wrong.');
          err.fromServer = true;
          throw err;
        })
        .catch(function (err) {
          if (status) {
            /* Server messages are written for the visitor. A network failure
               surfaces as "Failed to fetch", which isn't. */
            var msg = err.fromServer ? err.message : 'We couldn\'t send that just now.';
            if (msg.indexOf('927-3663') === -1) msg += ' Please call us on (609) 927-3663.';
            status.textContent = msg;
            status.setAttribute('data-state', 'error');
          }
          if (button) { button.disabled = false; button.textContent = label; }
        });
    });
  });
})();
