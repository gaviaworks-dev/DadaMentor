/* Video Mutfağı — sayfa JS (video-mutfagi-v1.html satır 2769-3218 kaynak-transfer,
   dinamikleştirilmiş). Kabuk JS'i (lg-gate/drawer/dil-seçici/drag-scroll/footer-
   reveal/çerez-onayı/mentor-panel/bottom-nav) zaten portal.js/ui.js'te — burada
   YALNIZ bu sayfaya özel: pro-gate (Foundation F1, sitede İLK kez gerçek
   entitlement'a bağlanıyor), video modal, filtre çipleri, Dada Akış dikey
   overlay. Hub↔Seri JS-toggle'ı PORT EDİLMEDİ — seri detayı artık gerçek route
   (video.seri), tarif-liste/tarif-detay ayrımıyla aynı desen (kapanış raporu
   notu). Şef "Abone Ol" artık gerçek <form> POST (follow.toggle) — bu dosyada
   JS toggle YOK. */

function csrfToken() {
  var meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : '';
}

function trackWatch(videoId) {
  if (!videoId) return;
  fetch('/video-mutfagi/videolar/' + videoId + '/izlendi', {
    method: 'POST',
    headers: { 'X-CSRF-TOKEN': csrfToken(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({}),
  }).catch(function () { /* ağ hatası — sessiz, izlenme sayacı bir dahaki denemede artar */ });
}

// ---- PRO-GATE (Foundation F1) — [data-pro-gate] açar ----
(function () {
  var gate = document.getElementById('proGate'); if (!gate) return;
  var overlay = document.getElementById('pgOverlay'),
    closeBtn = document.getElementById('pgClose'),
    later = document.getElementById('pgLater'),
    title = document.getElementById('pgTitle'),
    desc = document.getElementById('pgDesc');
  function open(t, d) { if (t) title.textContent = t; if (d) desc.textContent = d; overlay.classList.add('show'); gate.classList.add('show'); }
  function close() { overlay.classList.remove('show'); gate.classList.remove('show'); }
  closeBtn.addEventListener('click', close);
  if (later) later.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && gate.classList.contains('show')) close(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-pro-gate]'); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    open(t.getAttribute('data-pro-title'), t.getAttribute('data-pro-desc'));
  }, true);
})();

// ---- VİDEO MODAL — data-video-src'ten gerçek kaynak, açılışta izlenme takip ----
(function () {
  var modal = document.getElementById('videoModal');
  if (!modal) return;
  var vid = document.getElementById('vmVideo');
  var title = document.getElementById('vmTitle');
  function open(name, src, videoId) {
    title.textContent = name || 'Video';
    if (src) vid.src = src;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    vid.currentTime = 0;
    var p = vid.play(); if (p && p.catch) p.catch(function () {});
    trackWatch(videoId);
  }
  function close() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    vid.pause();
  }
  // Delegasyon: load-more ile SONRADAN append edilen kartlar da modalı açsın
  // (per-element bind append'i kapsamazdı). data-play-featured ayrı listener'da,
  // stopPropagation ile bu handler'a düşmez.
  document.addEventListener('click', function (e) {
    if (e.target.closest('a')) return; // "Tarife Git" linki modal açmasın
    if (e.target.closest('[data-play-featured]')) return;
    var el = e.target.closest('[data-video-title]');
    if (!el) return;
    e.preventDefault();
    open(el.getAttribute('data-video-title'), el.getAttribute('data-video-src'), el.getAttribute('data-video-id'));
  });
  var featBtn = document.querySelector('[data-play-featured]');
  if (featBtn) featBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var feat = document.querySelector('.vh-feat');
    if (feat) open(feat.getAttribute('data-video-title'), feat.getAttribute('data-video-src'), feat.getAttribute('data-video-id'));
  });
  modal.addEventListener('click', function (e) { if (!e.target.closest('.vm-frame')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
})();

// ---- FİLTRE ÇİPLERİ — gerçek data-count-* etiketleri (sabit toplam tablosu YOK) ----
(function () {
  var filterBar = document.getElementById('vFilter');
  if (!filterBar) return;
  var chips = filterBar.querySelectorAll('.chip');
  var count = document.getElementById('vfCount');
  function activeFilter() {
    var a = filterBar.querySelector('.chip.active');
    return a ? a.getAttribute('data-vf') : 'all';
  }
  // #vidGrid'i CANLI sorgular ki load-more ile append edilen kartlar da aktif
  // filtreye uysun; load-more append sonrası window.applyVideoFilter() çağırır.
  window.applyVideoFilter = function () {
    var f = activeFilter();
    if (f === 'kisa') return; // kısa = akış overlay'i, grid'i etkilemez
    document.querySelectorAll('#vidGrid .vid-card').forEach(function (card) {
      card.style.display = (f === 'all' || card.getAttribute('data-vf') === f) ? '' : 'none';
    });
  };
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.getAttribute('data-vf');
      if (f === 'kisa') {
        if (window.dadaAkisOpen) window.dadaAkisOpen(0);
        return;
      }
      chips.forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
      window.applyVideoFilter();
      if (count) count.textContent = filterBar.getAttribute('data-count-' + f) || filterBar.getAttribute('data-count-all');
    });
  });
})();

// ---- vgrid "Daha Fazla Video" load-more (VAKA2/#60) — GERÇEK sayfalama/append ----
(function () {
  var more = document.querySelector('.vgrid-more');
  if (!more) return;
  var btn = more.querySelector('button');
  var grid = document.getElementById('vidGrid');
  var url = more.getAttribute('data-grid-url');
  if (!btn || !grid || !url) return;
  var page = 1;
  var busy = false;
  btn.addEventListener('click', function () {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    var next = page + 1;
    fetch(url + '?page=' + next, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.html) {
          var tmp = document.createElement('div');
          tmp.innerHTML = data.html;
          while (tmp.firstElementChild) grid.appendChild(tmp.firstElementChild);
          if (window.applyVideoFilter) window.applyVideoFilter();
        }
        page = next;
        if (!data || !data.hasMore) more.style.display = 'none';
      })
      .catch(function () { /* ağ hatası — buton kalır, tekrar denenebilir */ })
      .then(function () { busy = false; btn.disabled = false; });
  });
})();

// ---- DADA AKIŞ — dikey 9:16 overlay, GERÇEK $shorts verisi (window.__dakisShorts) ----
(function () {
  var shorts = window.__dakisShorts || [];
  if (!shorts.length) return;
  var idx = 0;
  var dakis = document.getElementById('dakis');
  var media = document.getElementById('dkMedia');
  var video = document.getElementById('dkVideo');
  var segs = document.getElementById('dkSegs');
  var elCat = document.getElementById('dkCat'), elTitle = document.getElementById('dkTitle'),
    elChef = document.getElementById('dkChef'), elAv = document.getElementById('dkAv'),
    elViews = document.getElementById('dkViews'), elLike = document.getElementById('dkLike'),
    elLikeCount = document.getElementById('dkLikeCount'), elSave = document.getElementById('dkSave'),
    elFollow = document.getElementById('dkFollow'), elCount = document.getElementById('dkCount'),
    btnPrev = document.getElementById('dkPrev'), btnNext = document.getElementById('dkNext'),
    btnPlay = document.getElementById('dkPlay'), elLock = document.getElementById('dkLock');
  shorts.forEach(function () { segs.appendChild(document.createElement('i')); });
  function stopVideo() {
    video.pause(); video.style.display = 'none'; media.style.opacity = '1';
    dakis.classList.remove('playing');
    btnPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
  function render(i) {
    idx = (i + shorts.length) % shorts.length;
    var s = shorts[idx];
    stopVideo();
    media.style.backgroundImage = s.img ? "url('" + s.img + "')" : 'none';
    elCat.textContent = s.cat;
    elTitle.textContent = s.title;
    elChef.textContent = s.chef || '—';
    elAv.style.backgroundImage = s.av ? "url('" + s.av + "')" : 'none';
    elAv.textContent = s.av ? '' : (s.avInitial || '');
    elViews.textContent = s.views;
    elLikeCount.textContent = s.likes;
    elLike.classList.remove('liked');
    elSave.classList.remove('saved');
    elSave.querySelector('i').className = 'fa-regular fa-bookmark';
    elFollow.classList.remove('on'); elFollow.textContent = 'Takip Et';
    elCount.textContent = (idx + 1) + ' / ' + shorts.length;
    segs.querySelectorAll('i').forEach(function (seg, k) { seg.classList.toggle('on', k <= idx); });
    btnPrev.disabled = idx === 0;
    btnNext.disabled = idx === shorts.length - 1;
    dakis.classList.toggle('locked', !!s.locked);
    if (s.locked && elLock) {
      if (s.proTitle) elLock.setAttribute('data-pro-title', s.proTitle);
      if (s.proDesc) elLock.setAttribute('data-pro-desc', s.proDesc);
    }
    if (video) video.src = s.src || '';
    // NOT: kısa videolar (VideoShort) trackWatch'a BAĞLI DEĞİL — o uç Video
    // id-uzayına göre çalışıyor (VideoController::trackWatch), aynı id'yle
    // yanlış kayda yazma riski var. Kısa video izlenme sayacı bu dilimde
    // statik (seed) kalır — vanity metrik, r-save/p-fav ile aynı önceliksizlik.
  }
  function open(i) {
    render(i || 0);
    dakis.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    dakis.classList.remove('open');
    document.body.style.overflow = '';
    stopVideo();
  }
  window.dadaAkisOpen = open;
  document.querySelectorAll('[data-open-short]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      open(parseInt(el.getAttribute('data-open-short'), 10) || 0);
    });
  });
  document.getElementById('dkClose').addEventListener('click', close);
  btnPrev.addEventListener('click', function () { if (idx > 0) render(idx - 1); });
  btnNext.addEventListener('click', function () { if (idx < shorts.length - 1) render(idx + 1); });
  btnPlay.addEventListener('click', function () {
    if (dakis.classList.contains('playing')) { stopVideo(); return; }
    if (!video.src) return;
    video.style.display = 'block'; media.style.opacity = '0';
    dakis.classList.add('playing');
    btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
    var p = video.play(); if (p && p.catch) p.catch(function () {});
  });
  // beğen/kaydet/takip: sitedeki .r-save/.p-fav ile aynı optimistik-toggle
  // konvansiyonu (gerçek kalıcılık yok — bkz. portal.js).
  elLike.addEventListener('click', function () {
    var on = elLike.classList.toggle('liked');
    elLikeCount.textContent = on ? shorts[idx].likes + ' +1' : shorts[idx].likes;
  });
  elSave.addEventListener('click', function () {
    var on = elSave.classList.toggle('saved');
    elSave.querySelector('i').className = on ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
  });
  elFollow.addEventListener('click', function () {
    var on = elFollow.classList.toggle('on');
    elFollow.textContent = on ? 'Takiptesin' : 'Takip Et';
  });
  document.addEventListener('keydown', function (e) {
    if (!dakis.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowUp') { e.preventDefault(); if (idx > 0) render(idx - 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (idx < shorts.length - 1) render(idx + 1); }
  });
  (function () {
    var sx = 0, sy = 0, st = 0;
    dakis.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    }, { passive: true });
    dakis.addEventListener('touchend', function (e) {
      if (!dakis.classList.contains('open')) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Date.now() - st > 700) return;
      if (Math.abs(dy) < 60 || Math.abs(dy) < Math.abs(dx)) return;
      if (dy < 0 && idx < shorts.length - 1) render(idx + 1);
      if (dy > 0 && idx > 0) render(idx - 1);
    }, { passive: true });
  })();
})();

/* ═══ AJAN-D-P2-BAS ═══ */
/* =====================================================================
   AJAN D · PARTİ 2 — ÜRETİLİR (scripts/gastro-p2-ajan-d.mjs). Damgalar
   arası her koşumda yenilenir; elle düzenleme kaybolur.
   ===================================================================== */

/* D1 · Seri bandının buğu katmanlarına kapak görselini ver.
   Donörün yöntemi (FIT: '.cp-banner'dan okuyup '--cp-bg'ye yazar).
   🔴 'getComputedStyle().backgroundImage' MUTLAK URL döndürür — özel
   özellikteki göreli 'url()'in stil dosyasına göre çözülmesi tuzağı
   burada oluşmaz (bu depoda ölçülmüş kusur sınıfı). */
(function () {
  var band = document.querySelector('[data-sd-band]');
  if (!band || band.getAttribute('data-sd-bg') === '1') return;
  var kapak = band.querySelector('.sd-cover');
  if (!kapak) return;
  var g = getComputedStyle(kapak).backgroundImage;
  if (!g || g === 'none') return;
  band.style.setProperty('--sd-bg', g);
  band.setAttribute('data-sd-bg', '1');
})();

/* D2 · Reels: tekerlekle sonraki/önceki.
   Dokunmatik kaydırma sayfanın kendi kodunda ZATEN var (touchstart/
   touchend, 60px eşik); masaüstünde karşılığı yoktu. Kendi durumunu
   TUTMUYOR — sayfanın kendi #dkPrev/#dkNext düğmelerini tıklıyor, yani
   sınır/kilit mantığı tek yerde kalıyor. */
(function () {
  var d = document.getElementById('dakis');
  if (!d || d.getAttribute('data-d-teker') === '1') return;
  d.setAttribute('data-d-teker', '1');
  var son = 0;
  d.addEventListener('wheel', function (e) {
    if (!d.classList.contains('open')) return;
    e.preventDefault();
    if (Math.abs(e.deltaY) < 12) return;
    var t = Date.now();
    if (t - son < 420) return;                 /* bir jestte tek geçiş */
    son = t;
    var b = document.getElementById(e.deltaY > 0 ? 'dkNext' : 'dkPrev');
    if (b && !b.disabled) b.click();
  }, { passive: false });
})();
/* ═══ AJAN-D-P2-SON ═══ */
