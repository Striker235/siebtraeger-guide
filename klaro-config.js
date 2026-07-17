// Klaro! Consent-Konfiguration - Siebtraeger-Guide.de
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
      privacyPolicyUrl: 'impressum-datenschutz.html',
      consentNotice: {
        description: 'Diese Website setzt aktuell keine Tracking-Cookies. F\u00fcr k\u00fcnftige Dienste (z.\u00a0B. Google-Ads-Conversion-Messung) bitten wir vorab um deine Einwilligung. Details in der {privacyPolicy}.',
        learnMore: 'Einstellungen'
      },
      consentModal: {
        title: 'Datenschutz-Einstellungen',
        description: 'Hier legst du fest, welche Dienste auf dieser Website verwendet werden d\u00fcrfen. Du kannst deine Auswahl jederzeit \u00fcber \u201eCookie-Einstellungen\u201c im Footer \u00e4ndern.'
      },
      privacyPolicy: { name: 'Datenschutzerkl\u00e4rung', text: 'Details in unserer {privacyPolicy}.' },
      purposes: {
        marketing: {
          title: 'Marketing & Conversion-Messung',
          description: 'Dienste zur Messung, ob Besucher \u00fcber Anzeigen auf diese Website gelangt sind.'
        }
      },
      'google-ads': {
        title: 'Google Ads Conversion-Tracking',
        description: 'Misst, ob ein Besuch \u00fcber eine Google-Anzeige zustande kam. Derzeit nicht aktiv \u2013 wird erst nach Einwilligung und Kampagnenstart geladen.'
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
      cookies: [/^_gcl/, /^_gac/, /^test_cookie/]
    }
  ]
};

// Footer-Link "Cookie-Einstellungen" oeffnet den Klaro-Dialog
document.addEventListener('click', function (e) {
  var t = e.target.closest('.js-cookie-settings');
  if (t) { e.preventDefault(); if (window.klaro) { window.klaro.show(); } }
});
