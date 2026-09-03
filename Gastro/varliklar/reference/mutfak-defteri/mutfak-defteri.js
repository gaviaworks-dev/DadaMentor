/* Mutfak Defteri/profil sayfa JS — tab switching + takipçi modalı + koleksiyon
   chip filtresi. Sunucu ?tab= ile başlangıç durumunu render eder (SeflerController);
   bu script yalnız sayfa-yenilemesiz istemci geçişini sağlar (referansın kendi
   davranış kanonu — lessons.md "davranış kanonu da referansın script'idir"). */
(function () {
  var tabs = document.querySelectorAll('.pf-tabs .dt');
  var panes = document.querySelectorAll('.pf-pane');

  function activate(name) {
    tabs.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === name); });
    panes.forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== name; });
    var url = new URL(window.location.href);
    url.searchParams.set('tab', name);
    window.history.replaceState({}, '', url);
  }

  tabs.forEach(function (b) {
    b.addEventListener('click', function () { activate(b.getAttribute('data-tab')); });
  });

  // Kaydedilenler koleksiyon chip filtresi (client-side, tüm veri zaten DOM'da)
  var collChips = document.querySelector('.coll-chips');
  if (collChips) {
    collChips.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      collChips.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      var target = chip.getAttribute('data-coll');
      var pane = document.querySelector('.pf-pane[data-pane="kaydedilenler"] .grid-4');
      if (!pane) return;
      pane.querySelectorAll('.r-card').forEach(function (card) {
        var collId = card.getAttribute('data-collection');
        card.style.display = (target === 'all' || collId === target) ? '' : 'none';
      });
    });
  }

  // Tarifleri durum filtresi (own-mode)
  var statusBar = document.querySelector('[data-status-filter="tarifler"]');
  if (statusBar) {
    statusBar.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      statusBar.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      var status = chip.getAttribute('data-st');
      var pane = document.querySelector('.pf-pane[data-pane="tarifler"] .grid-4');
      if (!pane) return;
      pane.querySelectorAll('.r-card').forEach(function (card) {
        var cardStatus = card.getAttribute('data-status');
        card.style.display = (status === 'all' || cardStatus === status) ? '' : 'none';
      });
    });
  }

  // Takipçi/takip modalı
  var overlay = document.getElementById('flwOverlay');
  var modal = document.getElementById('flwModal');
  var closeBtn = document.getElementById('flwClose');

  function openModal(which) {
    if (!modal) return;
    modal.classList.add('show');
    if (overlay) overlay.classList.add('show');
    if (which) {
      modal.querySelectorAll('.flw-tabs .dt').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-flw') === which);
      });
      modal.querySelectorAll('.flw-list').forEach(function (l) {
        l.hidden = l.getAttribute('data-flw') !== which;
      });
    }
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
  }

  document.querySelectorAll('[data-open-flw]').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn.getAttribute('data-open-flw')); });
  });
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);

  var flwTabs = document.querySelectorAll('.flw-tabs .dt');
  flwTabs.forEach(function (b) {
    b.addEventListener('click', function () { openModal(b.getAttribute('data-flw')); });
  });

  /* Paylaş popover (2026-08-07) — .pf-actions'taki paylaş ikonu bugüne kadar
     çıplak bir <button>'dı, hiçbir listener'ı yoktu. Davranış tarif detayın
     #rdSharePop'uyla aynı: tıkla-aç/kapa, dışarı tıkla ve Esc kapatır.
     Kanal <a>'ları normal bağlantı — JS'e ihtiyaçları yok, script kırılsa
     bile çalışırlar; JS yalnız popover'ı açar ve panoya kopyalamayı yapar. */
  var shareBtn = document.getElementById('pfShareBtn');
  var sharePop = document.getElementById('pfSharePop');

  if (shareBtn && sharePop) {
    var closeShare = function () {
      sharePop.classList.remove('show');
      shareBtn.setAttribute('aria-expanded', 'false');
    };

    shareBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !sharePop.classList.contains('show');
      sharePop.classList.toggle('show', willOpen);
      shareBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    // Popover içine tıklamak kapatmaz (kanal linkleri kendi işini yapar).
    sharePop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', closeShare);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeShare(); });

    var copyBtn = sharePop.querySelector('[data-share-copy]');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        // data-share-url KANONİK profil adresi (Blade'den) — location.href
        // DEĞİL: sayfada ?tab=... gezinme durumu var ve paylaşılan bağlantıya
        // sızmamalı. JS de sayfanın kendi meta verisini kullanır, tahmin etmez.
        var url = copyBtn.getAttribute('data-share-url') || window.location.href;
        var done = function () {
          copyBtn.classList.add('ok');
          var label = copyBtn.getAttribute('data-copied-label');
          if (label) copyBtn.setAttribute('aria-label', label);
          window.setTimeout(function () { copyBtn.classList.remove('ok'); }, 1600);
        };
        // navigator.clipboard yalnız güvenli bağlamda (https/localhost) var —
        // yoksa eski execCommand yoluna düşülür ki http önizlemelerde de çalışsın.
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).then(done).catch(function () { legacyCopy(url, done); });
        } else {
          legacyCopy(url, done);
        }
      });
    }
  }

  function legacyCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (err) { /* sessiz */ }
    document.body.removeChild(ta);
  }
})();
