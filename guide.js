// =====================================================================
// Siebtraeger-Guide - UI-Helfer: Gutschein-Codes kopieren, Teilen, Merken
// =====================================================================
(function () {
  'use strict';

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    if (done) { done(); }
  }

  // --- Gutschein-Code per Klick kopieren -----------------------------
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.js-copy-code') : null;
    if (!btn) { return; }
    e.preventDefault();
    var code = btn.getAttribute('data-code') || '';
    copyText(code, function () {
      var hint = btn.querySelector('.copy-hint');
      var old = hint ? hint.textContent : '';
      btn.classList.add('copied');
      if (hint) { hint.textContent = 'Kopiert \u2713'; }
      setTimeout(function () {
        btn.classList.remove('copied');
        if (hint) { hint.textContent = old || 'Code kopieren'; }
      }, 2000);
    });
  });

  // --- Seite teilen ---------------------------------------------------
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.js-share') : null;
    if (!btn) { return; }
    e.preventDefault();
    var data = { title: document.title, url: location.href };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else {
      copyText(location.href, function () {
        var old = btn.textContent;
        btn.textContent = 'Link kopiert \u2713';
        setTimeout(function () { btn.textContent = old; }, 2000);
      });
    }
  });

  // --- Seite merken (Link kopieren + Lesezeichen-Hinweis) -------------
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.js-save') : null;
    if (!btn) { return; }
    e.preventDefault();
    copyText(location.href, function () {
      var old = btn.textContent;
      var isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
      btn.textContent = 'Link kopiert \u2013 ' + (isMac ? '\u2318+D' : 'Strg+D') + ' f\u00fcr Lesezeichen';
      setTimeout(function () { btn.textContent = old; }, 3500);
    });
  });
})();
