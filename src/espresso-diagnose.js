/* Siebträger-Guide: Espresso-Diagnose (v14). Liest Ursache und Lösung aus den Abschnitten der Seite. Zeit-Richtwerte aus den Sage-Anleitungen, Quellen auf /espresso-diagnose. Ohne Framework. */
(function () {
  'use strict';

  var form = document.getElementById('dg-tool');
  var out = document.getElementById('dg-ergebnis');
  if (!form || !out) { return; }

  var gewaehlt = '';

  var TEXT = {
    gering: 'spricht laut Sage für eine zu geringe Extraktion',
    zwischen: 'liegt zwischen den Werten von Sage',
    gut: 'passt laut Sage zu einer ausgewogenen Extraktion',
    stark: 'spricht laut Sage für eine zu starke Extraktion'
  };

  function leeren(el) {
    while (el.firstChild) { el.removeChild(el.firstChild); }
  }

  function absatz(text) {
    var p = document.createElement('p');
    p.textContent = text;
    return p;
  }

  function sprung(id, text) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn small ghost';
    b.setAttribute('data-scroll-target', id);
    b.textContent = text;
    return b;
  }

  function zahl(id) {
    var el = document.getElementById(id);
    var s = el ? String(el.value).replace(/\s/g, '').replace(',', '.') : '';
    var v = s === '' ? NaN : Number(s);
    return isFinite(v) && v >= 0 ? v : NaN;
  }

  function komma(x) {
    return String(Math.round(x * 10) / 10).replace('.', ',');
  }

  // Sage (Barista Express S. 11, Bambino Plus S. 15): Kaffeefluss nach 1 bis 6 s zu gering, 8 bis 12 s ausgewogen, nach 12 s zu stark.
  function stufeTropfen(s) {
    if (s <= 6) { return 'gering'; }
    if (s < 8) { return 'zwischen'; }
    if (s <= 12) { return 'gut'; }
    return 'stark';
  }

  // Sage (Barista Express S. 11 und 12): bis 20 s zu gering, 25 bis 30 s ausgewogen, über 35 s zu stark.
  function stufeDauer(s) {
    if (s <= 20) { return 'gering'; }
    if (s < 25) { return 'zwischen'; }
    if (s <= 30) { return 'gut'; }
    if (s <= 35) { return 'zwischen'; }
    return 'stark';
  }

  function problemTeil() {
    var sec = gewaehlt ? document.getElementById(gewaehlt) : null;
    if (!sec) { return false; }
    var h = sec.querySelector('h2');
    var kurz = sec.querySelector('.dg-kurz');
    var t = document.createElement('h3');
    t.textContent = h ? h.textContent : '';
    out.appendChild(t);
    if (kurz) { out.appendChild(absatz(kurz.textContent)); }
    out.appendChild(sprung(gewaehlt, 'Alle Ursachen und Lösungen'));
    return true;
  }

  function zeitTeil() {
    var t1 = zahl('dg-tropfen');
    var t2 = zahl('dg-dauer');
    var st = [];
    if (!isNaN(t1)) {
      st.push(stufeTropfen(t1));
      out.appendChild(absatz('Erster Tropfen nach ' + komma(t1) + ' s: ' + TEXT[stufeTropfen(t1)] + '.'));
    }
    if (!isNaN(t2)) {
      st.push(stufeDauer(t2));
      out.appendChild(absatz('Bezug insgesamt ' + komma(t2) + ' s: ' + TEXT[stufeDauer(t2)] + '.'));
    }
    if (!st.length) { return false; }
    var gering = st.indexOf('gering') >= 0;
    var stark = st.indexOf('stark') >= 0;
    if (gering && stark) {
      out.appendChild(absatz('Die beiden Zeiten passen nicht zusammen. Miss beim nächsten Bezug beide noch einmal.'));
    } else if (gering) {
      out.appendChild(sprung('problem-zu-schnell', 'Was bei zu schnellem Bezug hilft'));
    } else if (stark) {
      out.appendChild(sprung('problem-tropft', 'Was bei zu langsamem Bezug hilft'));
    }
    return true;
  }

  function zeigen() {
    leeren(out);
    var a = problemTeil();
    var b = zeitTeil();
    if (!a && !b) {
      out.appendChild(absatz('Wähle ein Problem oder trag deine Zeiten ein.'));
    }
  }

  form.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.dg-btn') : null;
    if (!btn) { return; }
    e.preventDefault();
    var id = btn.getAttribute('data-problem') || '';
    gewaehlt = gewaehlt === id ? '' : id;
    var alle = form.querySelectorAll('.dg-btn');
    for (var i = 0; i < alle.length; i++) {
      alle[i].setAttribute('aria-pressed', alle[i] === btn && gewaehlt ? 'true' : 'false');
    }
    zeigen();
  });
  form.addEventListener('input', zeigen);
  form.addEventListener('submit', function (e) { e.preventDefault(); zeigen(); });

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-scroll-target]') : null;
    if (!b) { return; }
    var ziel = document.getElementById(b.getAttribute('data-scroll-target'));
    if (!ziel) { return; }
    e.preventDefault();
    var ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ziel.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' });
    var h = ziel.querySelector('h2');
    if (h && h.focus) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  });

  zeigen();
})();
