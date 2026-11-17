/* Siebträger-Guide: Geschmacksrad (v14). Liest Beschreibung, Röststufe und Bohnen aus den Abschnitten der Seite. Quellen auf /geschmacksrad. Ohne Framework. */
(function () {
  'use strict';

  var tool = document.getElementById('gr-tool');
  var out = document.getElementById('gr-ergebnis');
  if (!tool || !out) { return; }

  var rad = document.getElementById('gr-rad');
  var mitte = document.getElementById('gr-mitte');
  var filter = document.getElementById('gr-filter');
  var tabelle = document.getElementById('gr-bohnen');
  var zeilen = tabelle ? tabelle.querySelectorAll('tbody tr') : [];
  var MAX_LINKS = 4;
  var gewaehlt = '';

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

  function name(id) {
    var sec = id ? document.getElementById(id) : null;
    var h = sec ? sec.querySelector('h3') : null;
    return h ? h.textContent : '';
  }

  function passende() {
    var r = [];
    for (var i = 0; i < zeilen.length; i++) {
      var g = (zeilen[i].getAttribute('data-gruppen') || '').split(' ');
      if (!gewaehlt || g.indexOf(gewaehlt) >= 0) { r.push(zeilen[i]); }
    }
    return r;
  }

  function tabelleFiltern(treffer) {
    for (var i = 0; i < zeilen.length; i++) {
      zeilen[i].hidden = treffer.indexOf(zeilen[i]) < 0;
    }
    if (!filter) { return; }
    if (!gewaehlt) {
      filter.textContent = 'Alle ' + zeilen.length + ' Bohnen.';
    } else {
      filter.textContent = (treffer.length === 1 ? '1 Bohne' : treffer.length + ' Bohnen') + ' mit dem Aroma ' + name(gewaehlt) + '.';
    }
  }

  function markieren() {
    var knoepfe = tool.querySelectorAll('.gr-btn');
    for (var i = 0; i < knoepfe.length; i++) {
      knoepfe[i].setAttribute('aria-pressed', knoepfe[i].getAttribute('data-gruppe') === gewaehlt ? 'true' : 'false');
    }
    if (rad) {
      var gs = rad.querySelectorAll('.gr-gruppe');
      for (var j = 0; j < gs.length; j++) {
        var zusatz = '';
        if (gewaehlt) { zusatz = gs[j].getAttribute('data-gruppe') === gewaehlt ? ' aktiv' : ' gedimmt'; }
        gs[j].setAttribute('class', 'gr-gruppe' + zusatz);
      }
    }
    if (mitte) { mitte.textContent = gewaehlt ? name(gewaehlt) : 'Aromarad'; }
  }

  function bohnenListe(treffer) {
    out.appendChild(absatz('Bohnen für den Siebträger mit diesem Aroma:'));
    var ul = document.createElement('ul');
    for (var i = 0; i < treffer.length && i < MAX_LINKS; i++) {
      var quelle = treffer[i].querySelector('a');
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = quelle ? quelle.getAttribute('href') : '#bohnen';
      a.target = '_blank';
      a.rel = 'sponsored nofollow noopener';
      a.textContent = treffer[i].cells[0].textContent + ' bei Amazon*';
      li.appendChild(a);
      li.appendChild(document.createTextNode(', Röststufe ' + treffer[i].cells[2].textContent));
      ul.appendChild(li);
    }
    out.appendChild(ul);
    if (treffer.length > MAX_LINKS) {
      var rest = treffer.length - MAX_LINKS;
      out.appendChild(absatz('Dazu ' + (rest === 1 ? '1 weitere Bohne' : rest + ' weitere Bohnen') + ' in der Tabelle.'));
    }
  }

  function zeigen() {
    leeren(out);
    var treffer = passende();
    tabelleFiltern(treffer);
    markieren();
    var sec = gewaehlt ? document.getElementById(gewaehlt) : null;
    if (!sec) {
      out.appendChild(absatz('Wähle eine Aromagruppe im Rad oder in der Liste.'));
      return;
    }
    var t = document.createElement('h3');
    t.textContent = name(gewaehlt);
    out.appendChild(t);
    var kurz = sec.querySelector('.gr-kurz');
    var roest = sec.querySelector('.gr-roest');
    if (kurz) { out.appendChild(absatz(kurz.textContent)); }
    if (roest) { out.appendChild(absatz(roest.textContent)); }
    if (treffer.length) { bohnenListe(treffer); }
    out.appendChild(sprung(gewaehlt, 'Mehr zu ' + name(gewaehlt)));
    out.appendChild(sprung('bohnen', 'Passende Bohnen in der Tabelle'));
  }

  function waehlen(id) {
    if (!id || !document.getElementById(id)) { return; }
    gewaehlt = gewaehlt === id ? '' : id;
    zeigen();
  }

  tool.addEventListener('click', function (e) {
    if (!e.target.closest) { return; }
    var ziel = e.target.closest('.gr-btn') || e.target.closest('.gr-gruppe');
    if (!ziel) { return; }
    e.preventDefault();
    waehlen(ziel.getAttribute('data-gruppe'));
  });

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
