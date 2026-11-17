/* Siebträger-Guide: Tamper- und Siebgrößen-Finder (v14). Liest Größe, Tamper, Beleg und Links aus der Tabelle und den Abschnitten der Seite. Quellen auf /tamper-groesse. Ohne Framework. */
(function () {
  'use strict';

  var tool = document.getElementById('tf-tool');
  var wahl = document.getElementById('tf-maschine');
  var out = document.getElementById('tf-ergebnis');
  if (!tool || !wahl || !out) { return; }

  var tabelle = document.getElementById('tf-tabelle');
  var zeilen = tabelle ? tabelle.querySelectorAll('tbody tr') : [];

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

  function markieren(zeile) {
    for (var i = 0; i < zeilen.length; i++) {
      if (zeilen[i] === zeile) { zeilen[i].className = 'aktiv'; } else { zeilen[i].removeAttribute('class'); }
    }
  }

  function links(groesse) {
    var sec = document.getElementById('sieb-' + groesse);
    var box = sec ? sec.querySelector('.tf-links') : null;
    if (!box) { return; }
    var quelle = box.querySelectorAll('a');
    if (!quelle.length) { return; }
    var reihe = document.createElement('div');
    reihe.className = 'btn-row';
    for (var i = 0; i < quelle.length; i++) {
      var a = document.createElement('a');
      a.className = quelle[i].className;
      a.href = quelle[i].getAttribute('href');
      a.target = '_blank';
      a.rel = quelle[i].getAttribute('rel') || 'noopener';
      a.textContent = quelle[i].textContent;
      reihe.appendChild(a);
    }
    out.appendChild(absatz('Tamper für ' + groesse + ' mm:'));
    out.appendChild(reihe);
  }

  function zeigen() {
    leeren(out);
    var id = wahl.value;
    var zeile = id ? document.getElementById(id) : null;
    markieren(zeile);
    if (!zeile || !zeile.cells || zeile.cells.length < 4) {
      out.appendChild(absatz('Wähle oben deine Maschine. Alle Maschinen stehen auch in der Tabelle.'));
      return;
    }
    var groesse = zeile.getAttribute('data-groesse');
    var t = document.createElement('h3');
    t.textContent = zeile.cells[0].textContent + ': ' + zeile.cells[1].textContent;
    out.appendChild(t);
    out.appendChild(absatz('Tamper: ' + zeile.cells[2].textContent + '.'));
    var q = absatz('Beleg: ' + zeile.cells[3].textContent + '.');
    q.className = 'dg-quelle';
    out.appendChild(q);
    links(groesse);
    out.appendChild(sprung('sieb-' + groesse, 'Mehr zu ' + groesse + ' mm'));
    if (groesse === '58') { out.appendChild(sprung('genau', '58 oder 58,5 mm?')); }
  }

  wahl.addEventListener('change', zeigen);
  tool.addEventListener('submit', function (e) { e.preventDefault(); });

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-scroll-target]') : null;
    if (!b) { return; }
    var ziel = document.getElementById(b.getAttribute('data-scroll-target'));
    if (!ziel) { return; }
    e.preventDefault();
    var ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ziel.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' });
    var h = ziel.querySelector('h2, h3');
    if (h && h.focus) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  });

  zeigen();
})();
