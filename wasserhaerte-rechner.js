/* Siebträger-Guide: Wasserhärte-Rechner (v14). Nur Angaben aus den Herstelleranleitungen, Quellen auf /siebtraeger-entkalken. Ohne Framework. */
(function () {
  'use strict';

  // Stand der Anleitungen: Oktober 2026. Details in data/pflege-fakten.md.
  var M = {
    'bambino-plus': {n: 'Sage Bambino Plus', typ: 'sage', erinnert: true, seite: '/pflege-sage-bambino-plus'},
    'barista-express': {n: 'Sage Barista Express', typ: 'sage', erinnert: false, seite: '/pflege-sage-barista-express'},
    'profitec-go': {n: 'Profitec GO (erste Version)', typ: 'go1', seite: '/pflege-profitec-go'},
    'profitec-go-2': {n: 'Profitec GO 2.0', typ: 'go2', seite: '/pflege-profitec-go'},
    'lelit-bianca': {n: 'Lelit Bianca V3', typ: 'bianca', seite: '/pflege-lelit-bianca'}
  };

  var form = document.getElementById('wh-rechner');
  var out = document.getElementById('wh-ergebnis');
  if (!form || !out) { return; }

  function zahl(id) {
    var el = document.getElementById(id);
    var s = el ? String(el.value).replace(/\s/g, '').replace(',', '.') : '';
    var v = s === '' ? NaN : Number(s);
    return isFinite(v) && v >= 0 ? v : NaN;
  }

  function komma(x, stellen) {
    var f = Math.pow(10, stellen);
    return (Math.round(x * f) / f).toFixed(stellen).replace('.', ',');
  }

  function datum(id) {
    var el = document.getElementById(id);
    var m = el ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(el.value)) : null;
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }

  function plusTage(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  function plusMonate(d, n) {
    var letzter = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
    return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), letzter));
  }

  function zwei(x) {
    return (x < 10 ? '0' : '') + x;
  }

  function tag(d) {
    return zwei(d.getDate()) + '.' + zwei(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  // Härtebereich nach § 9 WRMG, 1 mmol/l Calciumcarbonat = 5,6 °dH.
  function bereich(dh) {
    var mmol = Math.round(dh / 5.6 * 100) / 100;
    var name = mmol < 1.5 ? 'weich' : (mmol <= 2.5 ? 'mittel' : 'hart');
    return name + ' (ca.&nbsp;' + komma(mmol, 2) + '&nbsp;mmol/l)';
  }

  function kachel(titel, text) {
    return '<div><dt>' + titel + '</dt><dd>' + text + '</dd></div>';
  }

  function rechne() {
    var sel = document.getElementById('wh-maschine');
    var m = sel ? M[sel.value] : null;
    if (!m) { return; }
    var dh = zahl('wh-dh');
    var stufe = zahl('wh-stufe');
    var kh = zahl('wh-kh');
    var zuletzt = datum('wh-datum');
    var k = [];
    var h = [];

    if (m.typ === 'sage') {
      var tage = null;
      var s = isFinite(stufe) ? Math.round(stufe) : null;
      if (s !== null) {
        tage = s <= 4 ? 90 : 60;
        if (s === 4 || s === 6) {
          h.push('Sage nennt für Stufe&nbsp;' + s + ' alle ' + tage + '&nbsp;Tage.');
        } else if (s < 4) {
          h.push('Sage nennt nur Stufe&nbsp;4 und&nbsp;6. Für Stufe&nbsp;' + s + ' zeigen wir den Wert von Stufe&nbsp;4 (Annahme).');
        } else if (s === 5) {
          h.push('Sage nennt nur Stufe&nbsp;4 und&nbsp;6. Für Stufe&nbsp;5 zeigen wir den Wert von Stufe&nbsp;6 (Annahme).');
        } else {
          h.push('Für Stufen über&nbsp;6 nennt Sage keinen Wert. Wir zeigen den Wert von Stufe&nbsp;6 (Annahme).');
        }
      } else {
        h.push('Trag die Stufe vom Sage-Teststreifen ein. Sage nennt alle 90&nbsp;Tage bei Stufe&nbsp;4 und alle 60&nbsp;Tage bei Stufe&nbsp;6. Einen Wert in °dH nennt Sage dazu nicht.');
      }
      k.push(kachel('Entkalken', tage ? 'alle ' + tage + '&nbsp;Tage' : 'Stufe fehlt'));
      if (tage && zuletzt) { k.push(kachel('Nächster Termin', tag(plusTage(zuletzt, tage)))); }
      k.push(kachel('Wer entkalkt', 'du selbst, mit dem Programm der Maschine'));
      if (m.erinnert) {
        k.push(kachel('Wasserfilter', 'nach 3&nbsp;Monaten wechseln'));
        h.push('Die Bambino Plus zeigt das Entkalken an: Die Tasten für eine Tasse, zwei Tassen und Dampf leuchten 15&nbsp;Sekunden abwechselnd.');
      } else {
        k.push(kachel('Wasserfilter', s === 2 ? 'nach 3&nbsp;Monaten oder 60&nbsp;Litern' : 'nach 3&nbsp;Monaten oder 40&nbsp;Litern'));
        h.push('Die Barista Express erinnert nicht ans Entkalken. Trag dir den Termin selbst ein.');
      }
    } else if (m.typ === 'go1') {
      k.push(kachel('Entkalken', 'kein festes Intervall'));
      k.push(kachel('Wer entkalkt', 'vorbeugend nur nach Rücksprache mit dem Fachhändler'));
      k.push(kachel('Wasser laut Profitec', 'höchstens 4&nbsp;°dH'));
      if (isFinite(dh)) {
        h.push(dh <= 4 ? 'Mit ' + komma(dh, 1) + '&nbsp;°dH liegt dein Wasser im Rahmen von Profitec.' :
          'Mit ' + komma(dh, 1) + '&nbsp;°dH liegt dein Wasser über der Grenze von Profitec. Profitec empfiehlt dann einen Enthärter oder eine Filterpatrone.');
      }
      h.push('Eine schon verkalkte GO entkalkt nur der Fachhändler. Laut Profitec können gelöste Kalkreste sonst das System blockieren.');
    } else if (m.typ === 'go2') {
      k.push(kachel('Entkalken', 'nur vorbeugend, ohne festes Intervall'));
      k.push(kachel('Wer entkalkt', 'du selbst, mit dem Menü „Descaling Process“'));
      k.push(kachel('Wasser laut Profitec', '2 bis 6&nbsp;°dH Karbonathärte'));
      if (isFinite(kh)) {
        if (kh > 6) {
          h.push('Mit ' + komma(kh, 1) + '&nbsp;°dH Karbonathärte liegt dein Wasser über dem Bereich. Profitec empfiehlt dann den mitgelieferten Wasserfilter.');
        } else if (kh < 2) {
          h.push('Mit ' + komma(kh, 1) + '&nbsp;°dH Karbonathärte liegt dein Wasser unter dem Bereich. Laut Profitec kann der Espresso dann säurebetont schmecken.');
        } else {
          h.push('Mit ' + komma(kh, 1) + '&nbsp;°dH Karbonathärte liegt dein Wasser im Bereich von Profitec.');
        }
      } else if (isFinite(dh)) {
        h.push('Profitec nennt für die GO&nbsp;2.0 die Karbonathärte. Sie ist nicht dasselbe wie die Gesamthärte. Miss sie mit den Teststäbchen, die der Maschine beiliegen.');
      }
      h.push('Ist die Maschine schon verkalkt, wende dich an den Fachhändler. Profitec erlaubt nur den originalen Profitec-Entkalker.');
    } else {
      k.push(kachel('Entkalken', 'einmal im Jahr'));
      if (zuletzt) { k.push(kachel('Nächster Termin', tag(plusMonate(zuletzt, 12)))); }
      k.push(kachel('Wer entkalkt', 'ein Techniker, nach Prüfung durch den Händler'));
      k.push(kachel('Harzfilter', 'nach 28 vollen Tankfüllungen oder spätestens 4&nbsp;Monaten'));
      h.push('Lelit nennt keinen Grenzwert in °dH und empfiehlt den mitgelieferten Harzfilter gegen Kalk.');
    }

    if (isFinite(dh)) { k.unshift(kachel('Härtebereich', bereich(dh))); }
    out.innerHTML = '<dl>' + k.join('') + '</dl><p>' + h.join(' ') +
      ' Alle Schritte: <a href="' + m.seite + '">Pflege der ' + m.n + '</a>.</p>';
  }

  form.addEventListener('input', rechne);
  form.addEventListener('change', rechne);
  form.addEventListener('submit', function (e) { e.preventDefault(); rechne(); });
  rechne();
})();
