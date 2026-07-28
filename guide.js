// =====================================================================
// Siebtraeger-Guide - UI-Helfer: Gutschein-Codes, Teilen, Merken, Lightbox
// Stand 28.07.2026
// =====================================================================
(function () {
  'use strict';

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else { fallbackCopy(text, done); }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    if (done) { done(); }
  }
  // Label-Helfer: Icon im Button bleibt erhalten, nur der Text wechselt
  function getLabel(btn) { var l = btn.querySelector('.lbl'); return l ? l.textContent : btn.textContent; }
  function setLabel(btn, txt) { var l = btn.querySelector('.lbl'); if (l) { l.textContent = txt; } else { btn.textContent = txt; } }

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
        var old = getLabel(btn);
        setLabel(btn, 'Link kopiert \u2713');
        setTimeout(function () { setLabel(btn, old); }, 2000);
      });
    }
  });

  // --- Seite merken ---------------------------------------------------
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.js-save') : null;
    if (!btn) { return; }
    e.preventDefault();
    copyText(location.href, function () {
      var old = getLabel(btn);
      var isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
      setLabel(btn, 'Link kopiert \u2013 ' + (isMac ? '\u2318+D' : 'Strg+D'));
      setTimeout(function () { setLabel(btn, old); }, 3500);
    });
  });

  // --- Produktbild-Lightbox (gleicher Tab) ----------------------------
  var lb = null, lastFocus = null;

  function onKey(e) { if (e.key === 'Escape' || e.keyCode === 27) { closeLightbox(); } }

  function closeLightbox() {
    if (!lb) { return; }
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('lb-open');
    if (lb.parentNode) { lb.parentNode.removeChild(lb); }
    lb = null;
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  function openLightbox(url, caption, trigger) {
    if (!url) { return; }
    closeLightbox();
    lastFocus = trigger || null;

    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', caption || 'Produktbild');

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'lb-close';
    close.setAttribute('aria-label', 'Bild schlie\u00dfen');
    close.innerHTML = '\u00d7';

    var img = document.createElement('img');
    img.src = url;
    img.alt = caption || '';

    lb.appendChild(close);
    lb.appendChild(img);
    if (caption) {
      var cap = document.createElement('div');
      cap.className = 'lb-cap';
      cap.textContent = caption;
      lb.appendChild(cap);
    }

    // Klick auf Hintergrund oder X schliesst
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target === close) { closeLightbox(); }
    });

    document.body.appendChild(lb);
    document.body.classList.add('lb-open');
    document.addEventListener('keydown', onKey);
    close.focus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.js-zoom') : null;
    if (!t) { return; }
    e.preventDefault();
    openLightbox(t.getAttribute('data-full'), t.getAttribute('data-caption') || '', t);
  });
})();
