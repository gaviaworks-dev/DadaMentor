/* Püf noktası detayı — sayfa-özel JS (tarif-detay.js deseni, puf-noktasi-detay-v1.html
 * satır 2328-2373 kaynak-transfer). Kaydet artık ui.js data-engagement-toggle
 * kontratıyla GERÇEK (bu dosya dokunmuyor); burada actbar scroll-show,
 * yorumlar/paylaş kısayolları, etiket rayı okları, paylaş popover'ı VE
 * yorum formu (yıldız zorunlu + fotoğraf yükleme + düzenle + filtre çipleri —
 * QA punch 2026-07-15: tarif-detay.js satır 234-365'ten BİREBİR taşındı,
 * puf/_reviews.blade.php zaten aynı #rfStars/#rfRatingInput/#rfChips/
 * #rfFile/data-review-edit/data-reply-toggle markup'ını kullanıyordu ama
 * bağlayan JS hiç yazılmamıştı — gerçek <form> POST'u engellenmiyor, yalnız
 * puansız gönderimi istemci tarafında engelliyor). */
window.__bottomStrips = (window.__bottomStrips || []).concat(['#actbar']);

(function () {
  // ETİKET RAYI OKLARI (.ptr .row-nav)
  document.querySelectorAll('.ptr .row-nav button').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.getAttribute('data-track'));
      if (t) t.scrollBy({ left: b.getAttribute('data-dir') === 'prev' ? -220 : 220, behavior: 'smooth' });
    });
  });

  // PAYLAŞ POPOVER (tıkla-aç/kapat — dokunmatik uyumlu)
  (function () {
    var sh = document.getElementById('ptrShare');
    if (!sh) return;
    var btn = document.getElementById('pshBtn');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var open = sh.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#ptrShare')) {
        sh.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    var cp = document.getElementById('pshCopy');
    if (cp) {
      cp.addEventListener('click', function (e) {
        e.preventDefault();
        var url = cp.getAttribute('data-copy') || location.href;
        try { navigator.clipboard.writeText(url); } catch (err) { /* pano erişimi yok — sessiz */ }
        cp.classList.add('ok');
        var icon = cp.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-check';
        setTimeout(function () {
          cp.classList.remove('ok');
          if (icon) icon.className = 'fa-solid fa-link';
        }, 1500);
      });
    }
  })();

  // BÖLÜM PAYLAŞ RAYI ⋯ DAHA FAZLA (rev-sweep MADDE 2, 2026-07-20): ptr-share
  // tıkla-aç/kapat desenini izler — ilk 3 ağ her zaman görünür, kalanı bu
  // grup içinde; dışa tıklama VE Escape kapatır (birden çok .mod-share olabilir).
  (function () {
    var groups = [].slice.call(document.querySelectorAll('.ms-more'));
    if (!groups.length) return;
    groups.forEach(function (group) {
      var btn = group.querySelector('.ms-btn.more');
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var willOpen = !group.classList.contains('open');
        groups.forEach(function (g) {
          g.classList.remove('open');
          var b = g.querySelector('.ms-btn.more');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          group.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('.ms-more')) return;
      groups.forEach(function (g) {
        g.classList.remove('open');
        var b = g.querySelector('.ms-btn.more');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      groups.forEach(function (g) {
        g.classList.remove('open');
        var b = g.querySelector('.ms-btn.more');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    });
  })();

  // ACTBAR — scroll-show + Yorumlar/Paylaş kısayolları (Kaydet ui.js'e ait)
  (function () {
    var bar = document.getElementById('actbar');
    if (!bar) return;
    // Ortak partial (partials/_content-actbar) davranisi zaten bagladiysa cik —
    // aksi halde Paylas iki kez ateslenir (madde 11, tek kaynak).
    if (bar.dataset.abBound) return;
    bar.dataset.abBound = '1';
    function onScroll() {
      if ((window.scrollY || 0) > 460) bar.classList.add('show');
      else bar.classList.remove('show');
      if (window.__bnUpdate) window.__bnUpdate();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    bar.querySelectorAll('.ab-act').forEach(function (b) {
      var act = b.getAttribute('data-act');
      if (act === 'save' || act === 'useful') return; // data-engagement-toggle / data-lg-gate zaten bağlı
      b.addEventListener('click', function () {
        if (act === 'comments') {
          var y = document.getElementById('yorumlar');
          if (y) y.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        if (act === 'share') {
          if (navigator.share) {
            navigator.share({ title: document.title, url: location.href }).catch(function () {});
          } else {
            var p = document.getElementById('ptrShare');
            if (p) {
              p.scrollIntoView({ behavior: 'smooth', block: 'center' });
              p.classList.add('open');
            }
          }
        }
      });
    });
  })();

  // YORUM FORMU: kapalı başlar, tıkla/odaklan → genişler (gerçek <form>, submit engellenmez)
  (function () {
    var rform = document.getElementById('revForm');
    if (!rform) return;
    rform.addEventListener('click', function () { rform.classList.add('open'); });
    rform.addEventListener('focusin', function () { rform.classList.add('open'); });
  })();

  // YANITLA: gerçek yanıt formunu aç/kapa (form kendisi gerçek POST)
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

  // YORUM FORMU: yıldız girişi (ZORUNLU) + fotoğraf yükleme (gerçek AJAX media.store) + düzenle
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

  // YORUM FİLTRE ÇİPLERİ (yalnız ilk sayfada yüklenen yorumlar üzerinde)
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
