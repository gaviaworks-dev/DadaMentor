// tarif-detay.js — tarif-detay-v1.html kaynak-transfer (W2-A), yalnız SALT-UI
// etkileşimler (veri bağımlı olmayan, gerçek backend gerektirmeyen davranışlar).
// TAŞINMADI (rapor'da gerekçeli): login-state mock, audio player, video modal,
// ing-sponsor "Sipariş Et" popover'ı, satır-bazlı localStorage alışveriş listesi —
// bunların gerçek backend karşılığı yok. Yorum beğen/bildir/düzenle-sil/gönder/
// yanıtla + client-filtre GERÇEK backend'e bağlandı (Topluluk/Yorumlar dilimi,
// kararlar.md §4.4 FB4, dosya sonu): beğen ui.js data-engagement-toggle kontratı
// (JSON, sayfa yenilenmez), diğerleri gerçek <form> POST/redirect. Kaydet/favori/
// alkışla/denedim, porsiyon ölçekleme, takip zaten ui.js veya gerçek <form>
// POST'ları üzerinden çalışıyor, burada TEKRAR bağlanmadı (çift-dinleyici tuzağı).

(function () {
  // ---- R7: YAZI ÖLÇEĞİ (A− / A+) — tarif metni + malzemeler ----
  (function () {
    var scales = [0.9, 1, 1.1, 1.2], si = 1;
    var cols = document.querySelector('.rd-cols');
    var dn = document.getElementById('rdFontDown'), up = document.getElementById('rdFontUp');
    if (!cols || !dn || !up) return;
    function apply() {
      cols.style.setProperty('--ts', scales[si]);
      dn.disabled = si === 0; up.disabled = si === scales.length - 1;
    }
    dn.addEventListener('click', function () { if (si > 0) { si--; apply(); } });
    up.addEventListener('click', function () { if (si < scales.length - 1) { si++; apply(); } });
    apply();
  })();

  // ---- CHIP MARQUEE: künye chip satırları + alternatif tarifler yavaşça oto-kayar ----
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.kc-chips .chip-row, .alt-links').forEach(function (row) {
      if (row.scrollWidth <= row.clientWidth + 4) return;
      [].slice.call(row.children).forEach(function (c) {
        var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1; row.appendChild(k);
      });
      var half = row.scrollWidth / 2, paused = false, idleT = null, x = row.scrollLeft;
      function hold(ms) { paused = true; clearTimeout(idleT); idleT = setTimeout(function () { paused = false; x = row.scrollLeft; }, ms); }
      row.addEventListener('mouseenter', function () { paused = true; clearTimeout(idleT); });
      row.addEventListener('mouseleave', function () { clearTimeout(idleT); paused = false; x = row.scrollLeft; });
      row.addEventListener('wheel', function () { hold(2000); }, { passive: true });
      row.addEventListener('touchstart', function () { hold(2500); }, { passive: true });
      row.addEventListener('pointerdown', function () { hold(2500); });
      window.addEventListener('resize', function () { half = row.scrollWidth / 2; });
      (function tick() {
        if (!paused) { x += 0.3; if (x >= half) x -= half; row.scrollLeft = x; }
        requestAnimationFrame(tick);
      })();
    });
  })();

  // ---- MALZEME: işaretle (üstü çizili) + ikame popover ----
  document.querySelectorAll('.ing-row input[type=checkbox]').forEach(function (c) {
    c.addEventListener('change', function () { c.closest('.ing-row').classList.toggle('checked', c.checked); });
  });
  document.querySelectorAll('.ing-swap').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var row = b.closest('.ing-row');
      var wasOpen = row.classList.contains('swap-open');
      document.querySelectorAll('.ing-row.swap-open').forEach(function (o) { o.classList.remove('swap-open'); });
      document.querySelectorAll('.ing-row.conv-open').forEach(function (o) { o.classList.remove('conv-open'); });
      if (!wasOpen) row.classList.add('swap-open');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.ing-row')) document.querySelectorAll('.ing-row.swap-open').forEach(function (o) { o.classList.remove('swap-open'); });
  });

  // ---- ÖLÇÜ BİRİMİ DÖNÜŞÜM POPOVER'I — miktara tıkla (yalnız gerçek birim
  //      anahtarları için; gastro.units slug'larına göre — sahte birim yok) ----
  (function () {
    var UNITS = {
      'su-bardagi': [['1 su bardağı', '≈ 200 ml'], ['Un ile', '≈ 130 g'], ['Sıvı ile', '≈ 200 g']],
      'cay-bardagi': [['1 çay bardağı', '≈ 100 ml']],
      'cay-kasigi': [['1 çay kaşığı', '≈ 5 ml'], ['Tuz ile', '≈ 6 g']],
      'tatli-kasigi': [['1 tatlı kaşığı', '≈ 10 ml'], ['Toz baharat ile', '≈ 7 g']],
      'yemek-kasigi': [['1 yemek kaşığı', '≈ 15 ml']],
    };
    document.querySelectorAll('#ingList .iq[data-u]').forEach(function (q) {
      var u = q.getAttribute('data-u');
      if (!UNITS[u]) return;
      q.classList.add('has-conv');
      var pop = document.createElement('div');
      pop.className = 'conv-pop';
      pop.innerHTML = '<span class="cp-title"><i class="fa-solid fa-scale-balanced"></i> ' + (window.__i18nOlcuKarsiligi || 'Ölçü karşılığı') + '</span>' +
        UNITS[u].map(function (r) { return '<div class="cp-row"><i class="fa-solid fa-circle"></i><span><b>' + r[0] + '</b> ' + r[1] + '</span></div>'; }).join('') +
        '<div class="cp-foot">' + (window.__i18nOlcuKaynak || 'Kaynak: DadaGastro Ölçü Birimleri rehberi') + '</div>';
      q.closest('.ing-row').appendChild(pop);
      q.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var row = q.closest('.ing-row');
        var was = row.classList.contains('conv-open');
        document.querySelectorAll('.ing-row.conv-open').forEach(function (o) { o.classList.remove('conv-open'); });
        document.querySelectorAll('.ing-row.swap-open').forEach(function (o) { o.classList.remove('swap-open'); });
        if (!was) row.classList.add('conv-open');
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.ing-row')) document.querySelectorAll('.ing-row.conv-open').forEach(function (o) { o.classList.remove('conv-open'); });
    });
  })();

  // ---- ADIM KARTLARI: numara rozetine tıkla → tamamlandı (yalnız görsel durum) ----
  document.querySelectorAll('.step-card .sc-num').forEach(function (n) {
    n.setAttribute('role', 'button');
    n.addEventListener('click', function () { n.closest('.step-card').classList.toggle('done'); });
  });

  // ---- LIGHTBOX: galeri sahnesi + adım görselleri + "ben de yaptım" + yorum fotoları ----
  (function () {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var img = document.getElementById('lbImg');
    var cap = document.getElementById('lbCap');
    var count = document.getElementById('lbCount');
    var group = [], idx = 0;
    function bgUrl(el) {
      var m = (el.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
      return m ? m[1] : null;
    }
    function render() {
      img.src = group[idx].src;
      cap.textContent = group[idx].cap || '';
      count.textContent = (idx + 1) + ' / ' + group.length;
      lb.classList.toggle('single', group.length < 2);
    }
    function open(g, i) { group = g; idx = i; render(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    window.openLightbox = open;
    document.getElementById('lbClose').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.getElementById('lbPrev').addEventListener('click', function () { idx = (idx - 1 + group.length) % group.length; render(); });
    document.getElementById('lbNext').addEventListener('click', function () { idx = (idx + 1) % group.length; render(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') { idx = (idx + 1) % group.length; render(); }
      if (e.key === 'ArrowLeft') { idx = (idx - 1 + group.length) % group.length; render(); }
    });
    var stage = document.getElementById('rdStage');
    if (stage) {
      stage.addEventListener('click', function (e) {
        if (e.target.closest('a,button')) return;
        var cap = stage.getAttribute('data-cap') || '';
        // Galeri grubu (Task #4, Beyar kararı 2026-07-14): kapak + galeri görselleri
        // data-gallery'de (JSON URL listesi, admin'de yönetilen sırayla). Galeri
        // boşsa/öznitelik yoksa sahnenin KENDİ arka plan görseline düşer (tek görsel,
        // eski davranış — regresyon yok).
        var galleryAttr = stage.getAttribute('data-gallery');
        var urls = null;
        if (galleryAttr) { try { urls = JSON.parse(galleryAttr); } catch (err) { urls = null; } }
        if (urls && urls.length) {
          open(urls.map(function (src) { return { src: src, cap: cap }; }), 0);
          return;
        }
        var m = (stage.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
        if (!m) return;
        open([{ src: m[1], cap: cap }], 0);
      });
    }
    document.querySelectorAll('.step-card').forEach(function (card) {
      var figs = [].slice.call(card.querySelectorAll('.step-img'));
      if (!figs.length) return;
      var numEl = card.querySelector('.sc-num');
      var cap = numEl ? numEl.getAttribute('data-step-label') || '' : '';
      figs.forEach(function (f, i) {
        f.addEventListener('click', function () {
          var g = figs.map(function (x) { return { src: bgUrl(x), cap: cap }; });
          open(g, i);
        });
      });
    });
    var mwGrid = document.getElementById('mwGrid');
    if (mwGrid) {
      mwGrid.querySelectorAll('.mw-item').forEach(function (it) {
        it.addEventListener('click', function (e) {
          e.preventDefault();
          var items = [].slice.call(mwGrid.querySelectorAll('.mw-item'));
          var g = items.map(function (x) { return { src: bgUrl(x), cap: x.getAttribute('data-cap') || '' }; });
          open(g, items.indexOf(it));
        });
      });
    }
    document.querySelectorAll('.c-photos').forEach(function (box) {
      var phs = [].slice.call(box.querySelectorAll('.c-ph'));
      phs.forEach(function (p, i) {
        p.addEventListener('click', function () {
          var g = phs.map(function (x) { return { src: bgUrl(x), cap: x.getAttribute('data-cap') || '' }; });
          open(g, i);
        });
      });
    });
  })();

  // ---- STICKY AKSİYON BARI: başlık bandı geçilince görünür (kaydet/denedim/
  //      alkışla gerçek data-engagement-toggle — ui.js zaten bağlıyor, burada
  //      yalnız görünürlük + yorumlar/paylaş kısayolları) ----
  (function () {
    var bar = document.getElementById('rdActbar');
    var head = document.querySelector('.rd-head');
    if (!bar || !head) return;
    function onScroll() {
      var past = head.getBoundingClientRect().bottom < 0;
      var nearEnd = (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 220;
      bar.classList.toggle('show', past && !nearEnd);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var commentsBtn = bar.querySelector('[data-act="comments"]');
    if (commentsBtn) commentsBtn.addEventListener('click', function () {
      var y = document.getElementById('yorumlar');
      if (y) y.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // Paylaş: TEK hedef #rdSharePop popover'ı (Beyar 2026-08-11). Native
    // paylaşım sayfası (navigator.share) dalı KALDIRILDI — masaüstünde
    // işletim sisteminin kendi listesini açıyordu ve düğme üstüne gelince
    // uygulamanın kanal setini, tıklayınca bambaşka bir listeyi gösteriyordu.
    // (M3-a/r1 turlarının navigator.share reddi + mikrotask tuzağı kaydı git
    // geçmişinde.) Popover da yoksa
    // #paylas bölümüne kaydırma eski fallback. RV1 (2026-07-26, Beyar kararı):
    // tek tetikleyici (#rdActbar içindeki [data-act="share"]) yerine BİRDEN
    // FAZLA tetikleyici desteklenir — _tagshare.blade.php'nin ≤640px'te
    // .ts-tags'i sıkışmaktan kurtaran tek "Paylaş" düğmesi (data-share-toggle)
    // de AYNI popover'ı açar. Konumlandırma tıklanan butona göre hesaplanır
    // (kapalı closure değişkeni değil).
    var shareTriggers = document.querySelectorAll('[data-act="share"], [data-share-toggle]');
    var sharePop = document.getElementById('rdSharePop');
    function closeSharePop() {
      if (sharePop) { sharePop.classList.remove('show'); shareTriggers.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }
    }
    function openSharePopFallback(btn, e) {
      if (!sharePop) { var t = document.getElementById('paylas'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (e) e.stopPropagation();
      var willOpen = !sharePop.classList.contains('show');
      if (willOpen) {
        var r = btn.getBoundingClientRect();
        sharePop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - sharePop.offsetWidth - 8)) + 'px';
        sharePop.style.bottom = (window.innerHeight - r.top + 10) + 'px';
      }
      sharePop.classList.toggle('show', willOpen);
      shareTriggers.forEach(function (b) { b.setAttribute('aria-expanded', willOpen ? 'true' : 'false'); });
    }
    // Beyar 2026-08-11 — TIKLAMA ARTIK NATIVE SHEET AÇMAZ.
    // Eskiden `navigator.share` varsa işletim sisteminin kendi paylaşım
    // sayfası açılıyordu (macOS'ta "AirDrop / Mail / Mesajlar / Okuma
    // Listesi…") — yani üstüne gelince uygulamanın kendi kanal seti,
    // tıklayınca bambaşka bir liste çıkıyordu. Aynı düğme iki farklı şey
    // yapmaz: her iki etkileşim de #rdSharePop'u açar, kanal seti tek.
    // (navigator.share dalı tamamen kaldırıldı; ona bağlı mikrotask/
    // stopPropagation tuzağının kaydı git geçmişinde duruyor.)
    shareTriggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        openSharePopFallback(btn, e);
      });
      // Üstüne gelince de AYNI popover — tıklamayla birebir aynı içerik.
      btn.addEventListener('mouseenter', function (e) {
        if (sharePop.classList.contains('show')) return;
        openSharePopFallback(btn, e);
      });
    });
    if (sharePop) {
      document.addEventListener('click', function (e) { if (!e.target.closest('#rdSharePop')) closeSharePop(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSharePop(); });
      window.addEventListener('scroll', closeSharePop, { passive: true });
    }
  })();

  // ---- BAĞLANTI KOPYALA (paylaşım rayı + sticky bar paylaş popover'ı —
  //      aynı davranış, birden fazla kopyalama tetikleyicisi olabilir) ----
  document.querySelectorAll('#shareCopy, [data-share-copy]').forEach(function (b) {
    var icon = b.innerHTML;
    b.addEventListener('click', function () {
      try { navigator.clipboard.writeText(location.href); } catch (e) {}
      b.classList.add('ok'); b.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(function () { b.classList.remove('ok'); b.innerHTML = icon; }, 1600);
    });
  });

  // ---- YORUM FORMU: kapalı başlar, tıkla/odaklan → genişler (gerçek <form>,
  //      submit engellenmez) ----
  (function () {
    var rform = document.getElementById('revForm');
    if (!rform) return;
    rform.addEventListener('click', function () { rform.classList.add('open'); });
    rform.addEventListener('focusin', function () { rform.classList.add('open'); });
  })();

  // ---- YANITLA: gerçek yanıt formunu aç/kapa (form kendisi gerçek POST) ----
  document.querySelectorAll('[data-reply-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.closest('.c-main').querySelector('.c-reply-form');
      if (!f) return;
      f.hidden = !f.hidden;
      if (!f.hidden) { var ta = f.querySelector('textarea'); if (ta) ta.focus(); }
    });
  });
  document.querySelectorAll('[data-reply-cancel]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('.c-reply-form').hidden = true; });
  });

  // ---- YORUM FORMU: yıldız girişi (ZORUNLU) + fotoğraf yükleme (gerçek AJAX
  //      media.store — admin galeri widget'ıyla aynı kontrat) + kendi yorumunu
  //      düzenle (aynı form, farklı hedef — Topluluk/Yorumlar dilimi) ----
  (function () {
    var form = document.getElementById('revForm');
    if (!form) return;
    var starsWrap = document.getElementById('rfStars');
    var hint = document.getElementById('rfHint');
    var ratingInput = document.getElementById('rfRatingInput');
    var textarea = form.querySelector('.rf-text');
    var chips = document.getElementById('rfChips');
    var fileInput = document.getElementById('rfFile');
    var photoBtn = document.getElementById('rfPhotoBtn');
    var uploadUrl = form.getAttribute('data-upload-url');
    var rating = parseInt(ratingInput.value, 10) || 0;
    var btns = [].slice.call(starsWrap.querySelectorAll('button'));

    function paint(n) { btns.forEach(function (b, i) { b.classList.toggle('on', i < n); }); }
    function csrfToken() {
      var meta = document.querySelector('meta[name="csrf-token"]');
      return meta ? meta.content : '';
    }

    btns.forEach(function (b, i) {
      b.addEventListener('mouseenter', function () { paint(i + 1); });
      b.addEventListener('click', function () {
        rating = i + 1; ratingInput.value = rating; paint(rating);
        hint.textContent = 'Puanın: ' + rating + '/5';
        hint.classList.remove('err'); hint.classList.add('ok');
      });
    });
    starsWrap.addEventListener('mouseleave', function () { paint(rating); });

    if (photoBtn && fileInput && chips) {
      photoBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var files = [].slice.call(fileInput.files).slice(0, Math.max(0, 3 - chips.children.length));
        files.forEach(function (f) {
          var fd = new FormData();
          fd.append('file', f);
          fetch(uploadUrl, { method: 'POST', headers: { 'X-CSRF-TOKEN': csrfToken(), Accept: 'application/json' }, body: fd })
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
              if (!data) return;
              var d = document.createElement('span');
              d.className = 'rf-ph';
              d.style.backgroundImage = "url('" + data.thumb_url + "')";
              d.innerHTML = '<button type="button" aria-label="Fotoğrafı kaldır"><i class="fa-solid fa-xmark"></i></button>' +
                '<input type="hidden" name="media_ids[]" value="' + data.id + '">';
              d.querySelector('button').addEventListener('click', function () { d.remove(); });
              chips.appendChild(d);
            });
        });
        fileInput.value = '';
      });
    }

    form.addEventListener('submit', function (e) {
      if (!rating) {
        e.preventDefault();
        hint.textContent = 'Puan vermeden yorum gönderilemez';
        hint.classList.remove('ok'); hint.classList.add('err');
        starsWrap.classList.add('shake');
        setTimeout(function () { starsWrap.classList.remove('shake'); }, 450);
      }
    });

    document.querySelectorAll('[data-review-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        rating = parseInt(btn.getAttribute('data-rating'), 10) || 0;
        ratingInput.value = rating; paint(rating);
        textarea.value = btn.getAttribute('data-body') || '';
        form.action = btn.getAttribute('data-update-url');
        var methodInput = form.querySelector('input[name="_method"]');
        if (!methodInput) {
          methodInput = document.createElement('input');
          methodInput.type = 'hidden';
          methodInput.name = '_method';
          form.appendChild(methodInput);
        }
        methodInput.value = 'PATCH';
        form.classList.add('open');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textarea.focus();
      });
    });
  })();

  // ---- YORUM FİLTRE ÇİPLERİ (yalnız ilk sayfada yüklenen yorumlar üzerinde,
  //      referans deseni birebir — gerçek sayfalama bu dilimin kapsamı dışı) ----
  (function () {
    var chips = document.querySelectorAll('#revFilter .chip');
    if (!chips.length) return;
    var items = document.querySelectorAll('#revList > .c-item');
    var empty = document.getElementById('revEmpty');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        var k = c.getAttribute('data-f'), visible = 0;
        items.forEach(function (it) {
          var s = it.getAttribute('data-stars');
          var show = k === 'all' || (k === 'photo' && it.hasAttribute('data-photo')) || k === s || (k === 'low' && parseInt(s, 10) <= 3);
          it.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        if (empty) empty.hidden = visible > 0;
      });
    });
  })();
})();
