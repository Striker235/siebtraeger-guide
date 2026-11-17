/* Siebträger-Guide · Stromrechner (v14) · Schätzung nach dem Modell auf /stromverbrauch-siebtraeger · ohne Framework */
(function () {
  'use strict';

  // Werte aus data/strom-modell.csv, Stand 21.10.2026. Alle Werte sind Schätzungen.
  // a = Aufheizen (kWh), b = Strom je 10 Minuten in den ersten t Minuten nach dem Aufheizen (kWh),
  // w = Leistung danach (W), e = einfacher Espresso (kWh), c = Cappuccino (kWh), k = Maschine mit Kessel.
  var M = {
    'einsteiger-bambino-plus': {n: "Sage Bambino Plus", a: 0.0013, b: 0.0033, t: 10, w: 20, e: 0.0049, c: 0.0151, k: false},
    'einsteiger-gastroback-piccolo-pro-m': {n: "Gastroback Piccolo Pro M", a: 0.045, b: 0.0033, t: 10, w: 20, e: 0.0049, c: 0.0151, k: false},
    'einsteiger-dedica': {n: "De'Longhi Dedica EC685", a: 0.0161, b: 0.0033, t: 10, w: 20, e: 0.0049, c: 0.0151, k: false},
    'einsteiger-wmf-lumero': {n: "WMF Lumero", a: 0.015, b: 0.0033, t: 10, w: 20, e: 0.0049, c: 0.0151, k: false},
    'einsteiger-solis-perfetta': {n: "Solis Barista Perfetta Plus", a: 0.0283, b: 0.0033, t: 10, w: 20, e: 0.0049, c: 0.0151, k: false},
    'mittelklasse-profitec-go': {n: "Profitec GO", a: 0.0661, b: 0.0205, t: 20, w: 60, e: 0.0035, c: 0.02, k: true},
    'mittelklasse-barista-pro': {n: "Sage Barista Pro", a: 0.0014, b: 0.0033, t: 10, w: 20, e: 0.0049, c: 0.0151, k: false},
    'mittelklasse-lelit-anna': {n: "Lelit Anna PL41TEM", a: 0.037, b: 0.008, t: 20, w: 34, e: 0.0043, c: 0.0238, k: true},
    'mittelklasse-pegaso-pid': {n: "Quick Mill Pegaso PID", a: 0.04, b: 0.0033, t: 10, w: 20, e: 0.0049, c: 0.0151, k: false},
    'mittelklasse-gaggia-classic': {n: "Gaggia Classic Evo Pro", a: 0.0269, b: 0.008, t: 20, w: 34, e: 0.0043, c: 0.0238, k: true},
    'eb-barista-express': {n: "Sage Barista Express", a: 0.0231, b: 0.0033, t: 10, w: 20, e: 0.0049, c: 0.0151, k: false},
    'premium-lelit-bianca': {n: "Lelit Bianca V3", a: 0.261, b: 0.052, t: 15, w: 120, e: 0.0067, c: 0.0183, k: true},
    'premium-linea-mini-r': {n: "La Marzocco Linea Mini R", a: 0.2907, b: 0.0205, t: 20, w: 94, e: 0.0035, c: 0.022, k: true},
    'premium-technika-v': {n: "ECM Technika V Profi PID", a: 0.2694, b: 0.0247, t: 10, w: 148, e: 0.0055, c: 0.028, k: true},
    'premium-silvia-pro-x': {n: "Rancilio Silvia Pro X", a: 0.1198, b: 0.0205, t: 20, w: 94, e: 0.0035, c: 0.022, k: true},
    'premium-appartamento': {n: "Rocket Appartamento TCA", a: 0.242, b: 0.0247, t: 10, w: 148, e: 0.0055, c: 0.028, k: true}
  };

  var form = document.getElementById('strom-rechner');
  var out = document.getElementById('sr-ergebnis');
  if (!form || !out) { return; }

  function wert(id, min, max, std) {
    var el = document.getElementById(id);
    var v = el ? parseFloat(String(el.value).replace(',', '.')) : NaN;
    if (!isFinite(v)) { return std; }
    return Math.min(max, Math.max(min, v));
  }

  function zahl(x, stellen) {
    var f = Math.pow(10, stellen);
    var teile = (Math.round(x * f) / f).toFixed(stellen).split('.');
    var ganz = teile[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return teile.length > 1 ? ganz + ',' + teile[1] : ganz;
  }

  function eingabe(x) {
    return String(Math.round(x * 100) / 100).replace('.', ',');
  }

  function ca(x, einheit, stellen) {
    if (x <= 0) { return '0&nbsp;' + einheit; }
    if (Math.round(x * Math.pow(10, stellen)) === 0) {
      return 'unter ' + zahl(Math.pow(10, -stellen), stellen) + '&nbsp;' + einheit;
    }
    return 'ca.&nbsp;' + zahl(x, stellen) + '&nbsp;' + einheit;
  }

  function kachel(titel, text) {
    return '<div><dt>' + titel + '</dt><dd>' + text + '</dd></div>';
  }

  function rechne() {
    var sel = document.getElementById('sr-maschine');
    var m = sel ? M[sel.value] : null;
    if (!m) { return; }
    var esp = Math.round(wert('sr-espresso', 0, 30, 2));
    var milch = Math.round(wert('sr-milch', 0, 30, 1));
    var starts = Math.round(wert('sr-starts', 1, 12, 1));
    var minuten = wert('sr-minuten', 0, 1440, 10);
    var tage = Math.round(wert('sr-tage', 1, 366, 365));
    var preis = wert('sr-preis', 1, 150, 37);
    var standby = wert('sr-standby', 0, 50, 0);
    var bohnen = wert('sr-bohnen', 0, 200, 20);
    var dosis = wert('sr-dosis', 0, 40, 9);

    var bereit = m.b * Math.min(minuten, m.t) / 10 + m.w * Math.max(0, minuten - m.t) / 60000;
    var kwh = tage * (starts * (m.a + bereit) + esp * m.e + milch * m.c) + standby * 8.76;
    var eur = kwh * preis / 100;
    var getraenke = tage * (esp + milch);
    var bohnenCt = dosis * bohnen / 10;

    var satz = 'Schätzung für ' + m.n + ': ' + esp + ' Espresso und ' + milch + ' Cappuccino pro Tag, ' +
      (starts === 1 ? 'einmal' : starts + '-mal') + ' eingeschaltet, nach ' + (starts === 1 ? 'dem' : 'jedem') + ' Aufheizen ' +
      eingabe(minuten) + (minuten === 1 ? ' Minute' : ' Minuten') + ' an, ' + tage + (tage === 1 ? ' Tag' : ' Tage') + ' im Jahr, ' +
      eingabe(preis) + '&nbsp;ct/kWh, ' +
      (standby > 0 ? 'Standby ' + eingabe(standby) + '&nbsp;W' : 'ohne Standby') + '. Bohnen: ' + eingabe(dosis) +
      '&nbsp;g pro Getränk zu ' + eingabe(bohnen) + '&nbsp;€/kg, ' + ca(getraenke * bohnenCt / 100, '€', 0) + ' im Jahr.';
    if (!m.k && minuten > 10) {
      satz += ' Hinweis: Für Maschinen mit Durchlauferhitzer ist die Leistung in Bereitschaft eine Annahme (20&nbsp;W). ' +
        'Die Ascaso Steel PID Duo brauchte bei DieRöster im Leerlauf ca.&nbsp;100&nbsp;W. ' +
        'Bei langer Laufzeit kann der Verbrauch deshalb deutlich höher sein.';
    }

    out.innerHTML = '<dl>' +
      kachel('Strom pro Jahr', ca(kwh, 'kWh', 0)) +
      kachel('Stromkosten pro Jahr', ca(eur, '€', 0)) +
      kachel('Strom pro Getränk', getraenke > 0 ? ca(eur * 100 / getraenke, 'ct', 1) : '–') +
      kachel('Bohnen pro Getränk', getraenke > 0 ? ca(bohnenCt, 'ct', 0) : '–') +
      '</dl><p>' + satz + '</p>';
  }

  form.addEventListener('input', rechne);
  form.addEventListener('change', rechne);
  form.addEventListener('submit', function (e) { e.preventDefault(); rechne(); });
  rechne();
})();
