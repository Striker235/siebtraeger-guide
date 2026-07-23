// =====================================================================
// Klaro! Consent-Konfiguration - Siebtraeger-Guide.de
// + Google Ads Conversion-Tracking (DSGVO-konform, laedt erst nach Consent)
// =====================================================================

// ---------------------------------------------------------------------
// 1) GOOGLE ADS EINSTELLUNGEN
//    Amazon & Roastmarket sind fertig konfiguriert (echte Labels).
//    De'Longhi bleibt als Platzhalter fuer die Zukunft - solange das
//    Label mit 'LABEL_' beginnt, wird dafuer nichts gesendet.
// ---------------------------------------------------------------------
var GADS_CONVERSION_ID = 'AW-18327569084';

var GADS_CONVERSIONS = {
  amazon: {
    label: 'Y7ArCO3Jp9UcELyFoqNE',   // Affiliate-Klick Amazon
    value: 1.00,                     // durchschnittl. Ertrag pro Klick in EUR
    pattern: /(^|\.)amazon\.(de|com)|amzn\.(to|eu)/i
  },
  roastmarket: {
    label: 'qXirCOjKp9UcELyFoqNE',   // Affiliate-Klick Roastmarket
    value: 1.00,
    // Roastmarket laeuft ueber das Awin-Netzwerk (awinmid=16916)
    pattern: /awin1\.com.*(awinmid=16916|roastmarket)|(^|\.)roastmarket\.de/i
  },
  delonghi: {
    label: 'LABEL_DELONGHI',         // <-- erst ersetzen, wenn du kuenftig
    value: 1.00,                     //     direkte De'Longhi-Links setzt
    pattern: /(^|\.)delonghi\.(de|com)/i
  }
};

// ---------------------------------------------------------------------
// 2) GTAG-LOADER - wird NUR nach Einwilligung ueber Klaro aufgerufen
// ---------------------------------------------------------------------
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

// Consent Mode v2: Standard = alles abgelehnt (bis Einwilligung vorliegt)
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied'
});

var gadsLoaded = false;
function loadGoogleAds() {
  if (gadsLoaded || GADS_CONVERSION_ID.indexOf('XXXXXXXXXX') !== -1) { return; }
  gadsLoaded = true;

  // Einwilligung liegt vor -> Consent-Signale aktualisieren
  gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GADS_CONVERSION_ID;
  document.head.appendChild(s);

  gtag('js', new Date());
  gtag('config', GADS_CONVERSION_ID);
}

// ---------------------------------------------------------------------
// 3) KLICK-TRACKING fuer Affiliate-Links (Amazon / Roastmarket / De'Longhi)
//    Feuert nur, wenn Consent erteilt wurde (gadsLoaded === true).
// ---------------------------------------------------------------------
document.addEventListener('click', function (e) {
  if (!gadsLoaded) { return; }
  var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
  if (!link) { return; }
  var url = link.href || '';

  for (var shop in GADS_CONVERSIONS) {
    var c = GADS_CONVERSIONS[shop];
    if (c.pattern.test(url) && c.label.indexOf('LABEL_') !== 0) {
      gtag('event', 'conversion', {
        send_to: GADS_CONVERSION_ID + '/' + c.label,
        value: c.value,
        currency: 'EUR'
      });
      break; // pro Klick maximal eine Conversion
    }
  }
}, true); // Capture-Phase: greift auch, wenn Link-Inhalte angeklickt werden

// ---------------------------------------------------------------------
// 4) KLARO-KONFIGURATION (Service 'google-ads' aktiv)
// ---------------------------------------------------------------------
var klaroConfig = {
  version: 1,
  elementID: 'klaro',
  styling: { theme: ['light', 'bottom', 'wide'] },
  htmlTexts: true,
  groupByPurpose: true,
  storageMethod: 'cookie',
  cookieName: 'klaro-consent',
  cookieExpiresAfterDays: 180,
  default: false,
  mustConsent: false,
  acceptAll: true,
  hideDeclineAll: false,
  noticeAsModal: false,
  lang: 'de',
  translations: {
    de: {
      privacyPolicyUrl: 'impressum-datenschutz',
      consentNotice: {
        description: 'Wir nutzen Google-Ads-Conversion-Messung, um zu erkennen, ob Besucher \u00fcber unsere Anzeigen zu einem H\u00e4ndler weiterklicken. Das passiert nur mit deiner Einwilligung. Details in der {privacyPolicy}.',
        learnMore: 'Einstellungen'
      },
      consentModal: {
        title: 'Datenschutz-Einstellungen',
        description: 'Hier legst du fest, welche Dienste auf dieser Website verwendet werden d\u00fcrfen. Du kannst deine Auswahl jederzeit \u00fcber \u201eCookie-Einstellungen\u201c im Footer \u00e4ndern.'
      },
      privacyPolicy: {
        name: 'Datenschutzerkl\u00e4rung',
        text: 'Details in unserer {privacyPolicy}.'
      },
      purposes: {
        marketing: {
          title: 'Marketing & Conversion-Messung',
          description: 'Dienste zur Messung, ob Besucher \u00fcber Anzeigen auf diese Website gelangt sind und zu einem Partner-Shop weiterklicken.'
        }
      },
      'google-ads': {
        title: 'Google Ads Conversion-Tracking',
        description: 'Misst, ob ein Besuch \u00fcber eine Google-Anzeige zustande kam und ob anschlie\u00dfend ein Partner-Link (z.\u00a0B. Amazon oder roastmarket) angeklickt wurde. Wird erst nach deiner Einwilligung geladen.'
      },
      ok: 'Alle akzeptieren',
      decline: 'Ablehnen',
      acceptSelected: 'Auswahl speichern',
      save: 'Speichern',
      close: 'Schlie\u00dfen'
    }
  },
  services: [
    {
      name: 'google-ads',
      purposes: ['marketing'],
      default: false,
      cookies: [/^_gcl/, /^_gac/, /^test_cookie/],
      // Wird von Klaro bei jeder Consent-Aenderung aufgerufen:
      callback: function (consent) {
        if (consent) { loadGoogleAds(); }
        // Bei Widerruf laden wir gtag nicht erneut; Cookies loescht Klaro
        // anhand der 'cookies'-Regeln oben.
      }
    }
  ]
};

// Footer-Link "Cookie-Einstellungen" oeffnet den Klaro-Dialog
document.addEventListener('click', function (e) {
  var t = e.target.closest ? e.target.closest('.js-cookie-settings') : null;
  if (t) {
    e.preventDefault();
    if (window.klaro) { window.klaro.show(); }
  }
});
