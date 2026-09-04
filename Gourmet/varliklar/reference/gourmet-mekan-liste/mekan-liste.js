/* Mekan Listesi — sayfa-yerel JS (public/reference/gourmet-mekan-liste/).
 * Facet paneli GERÇEK <form method=GET> submit'i ile çalışır (mock JS YOK) —
 * checkbox değişimi otomatik submit eder, sunucu tarafı VenueListController'da
 * gerçek sorgu/facet/sıralama/sayfalama uygular (tarif-liste.js'in "gerçek
 * <form>, yalnız aç/kapa + auto-submit" deseni, mekan-liste'ye uyarlandı).
 */

// ---- FACET PANELİ: checkbox değişimi → otomatik submit ----
(function () {
  var form = document.getElementById('filterForm');
  if (!form) return;
  form.addEventListener('change', function (e) {
    if (e.target.matches('.fct-row input[type="checkbox"]')) {
      form.submit();
    }
  });
})();

// ---- fct-head accordion (aç/kapa) + fct-more (xtra satırlar) ----
(function () {
  document.querySelectorAll('.fct-head').forEach(function (h) {
    h.addEventListener('click', function () { h.closest('.fct').classList.toggle('open'); });
  });
  document.querySelectorAll('.fct-more').forEach(function (m) {
    m.addEventListener('click', function () {
      var f = m.closest('.fct');
      var open = f.classList.toggle('more-open');
      m.innerHTML = (open ? m.getAttribute('data-less') : m.getAttribute('data-more')) + ' <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
    });
  });
})();

// ---- Sıralama dropdown (linkler GERÇEK — yalnız aç/kapa). RV4/B2: #sortDd
// artık `.lst-main` İÇİNDE (görünüm SPA swap'inde yeniden basılıyor) —
// module başında TEK SEFER getElementById ile yakalanan düğüme bağlı
// dinleyici ilk swap'ta DOM'dan koparılır, ölür (RV4/B1'de etkinlikler.js'te
// AYNI kök nedenle ölçülen bulgu: seg'e bağlı dinleyici). document
// seviyesinde delege edilince swap sayısından bağımsız çalışır (aşağıdaki
// PRO-GATE/karşılaştır dinleyicileriyle AYNI, bu dosyada zaten yerleşik
// desen). ----
document.addEventListener('click', function (e) {
  var btn = e.target.closest('#sortBtn');
  if (btn) {
    e.stopPropagation();
    var dd = btn.closest('#sortDd');
    if (!dd) return;
    var open = dd.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    return;
  }
  if (!e.target.closest('#sortDd')) {
    document.querySelectorAll('#sortDd.open').forEach(function (dd) {
      dd.classList.remove('open');
      var b = dd.querySelector('#sortBtn');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
});

// ---- F2/W2.4 (2026-08-21, ölçüldü) — `Escape` ile kapanma.
// Ölçüm: `#sortDd` açıkken `Escape` üç genişlikte de KAPATMIYORDU (dışa
// tıklama vardı, klavye yolu yoktu). Yeni desen üretilmedi: kabuğun kendi
// aç/kapa katmanlarının (drawer · `#lgGate` · `#moModal` · `#lkModal`)
// document seviyesinde, açıkken guard'lı `Escape` dinleyicisi birebir
// kopyalandı; odak tetikleyiciye geri döner. Dropdown da yukarıdaki tıklama
// dinleyicisiyle AYNI gerekçeyle (SPA swap) document seviyesinde delege. ----
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('#sortDd.open').forEach(function (dd) {
    dd.classList.remove('open');
    var b = dd.querySelector('#sortBtn');
    if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
  });
});

// ---- Mobil/masaüstü temel filtre sheet'i (#lstSide) ----
(function () {
  var side = document.getElementById('lstSide');
  var overlay = document.getElementById('sheetOverlay');
  var closeBtn = document.getElementById('sheetClose');
  if (!side || !overlay) return;
  /* KAYDIRMA KILIDI — F2/W2.2 (2026-08-21, olculdu): kilit <body>'den <html>'e
     TASINDI. gourmet.css:764,766 `html,body{overflow-x:clip}` yazdigi icin <html>'in
     overflow'u `visible` degil; CSS Overflow sozlesmesi geregi <body>'nin overflow
     degeri viewport'a YAYILMIYORDU. Olcum (CDP gercek parmak kaydirmasi, 390px):
     panel acikken arka plan 465-854px kaydi. `overflow-x:clip` satirina DOKUNULMADI. */
  function open() { side.classList.add('open'); overlay.classList.add('open'); document.documentElement.style.overflow = 'hidden'; }
  function close() { side.classList.remove('open'); overlay.classList.remove('open'); document.documentElement.style.overflow = ''; }
  // RV4/B2 — #btnFilter `.lst-main` İÇİNDE (görünüm SPA swap'inde yeniden
  // basılıyor), #sortDd ile AYNI gerekçeyle document seviyesinde delege
  // edildi; side/overlay/closeBtn facet-panel'de (swap'in DIŞINDA), stabil
  // kaldığı için direkt bağlanabiliyor.
  document.addEventListener('click', function (e) { if (e.target.closest('#btnFilter')) open(); });
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();

// ---- "Tüm Filtreler" gelişmiş sheet'i (#advSide) — AYNI kalıp, TÜM genişliklerde ----
(function () {
  var side = document.getElementById('advSide');
  var overlay = document.getElementById('advOverlay');
  var openBtn = document.getElementById('btnAdvFilter');
  var closeBtn = document.getElementById('advClose');
  if (!side || !overlay || !openBtn) return;
  function open() { side.classList.add('open'); overlay.classList.add('open'); document.documentElement.style.overflow = 'hidden'; }
  function close() { side.classList.remove('open'); overlay.classList.remove('open'); document.documentElement.style.overflow = ''; }
  openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();

// ---- PRO-GATE modalı (haftalik-menu.js/video-mutfagi.js ile AYNI, sayfa-scoped kopya) ----
(function () {
  var gate = document.getElementById('proGate');
  if (!gate) return;
  var overlay = document.getElementById('pgOverlay'),
    closeBtn = document.getElementById('pgClose'),
    later = document.getElementById('pgLater'),
    title = document.getElementById('pgTitle'),
    desc = document.getElementById('pgDesc');
  var defaultTitle = title ? title.textContent : '', defaultDesc = desc ? desc.textContent : '';
  function open(t, d) { if (title) title.textContent = t || defaultTitle; if (desc) desc.textContent = d || defaultDesc; overlay.classList.add('show'); gate.classList.add('show'); document.documentElement.style.overflow = 'hidden'; }
  function close() { overlay.classList.remove('show'); gate.classList.remove('show'); document.documentElement.style.overflow = ''; }
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (later) later.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && gate.classList.contains('show')) close(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-pro-gate]');
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    open(t.getAttribute('data-pro-title'), t.getAttribute('data-pro-desc'));
  }, true);
})();

// ---- Mesafe kaydırıcısı (madde 24) — GERÇEK filtre: debounce → mesafe= ile submit ----
(function () {
  var slider = document.getElementById('mklDist');
  if (!slider) return;
  var fill = document.getElementById('mklDistFill'), valEl = document.getElementById('mklDistVal');
  var form = document.getElementById('filterForm');
  function paint() {
    var km = +slider.value, min = +slider.min, max = +slider.max;
    if (fill) fill.style.width = ((km - min) / (max - min) * 100) + '%';
    if (valEl) valEl.textContent = km + ' km';
  }
  var timer = null;
  slider.addEventListener('input', function () {
    paint();
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!form) return;
      var existing = form.querySelector('input[name="mesafe"]');
      if (!existing) {
        existing = document.createElement('input');
        existing.type = 'hidden'; existing.name = 'mesafe';
        form.appendChild(existing);
      }
      existing.value = slider.value;
      form.submit();
    }, 500);
  });
  paint();
})();

// ---- "Yakınımdakileri göster" — geolocation → lat/lng hidden input → submit ----
(function () {
  var heroForm = document.getElementById('mklHeroSearch');
  var heroCheck = document.getElementById('mklNearMe');
  var facetCheck = document.getElementById('mklNearMeFct');
  var latInput = document.getElementById('mklLatInput');
  var lngInput = document.getElementById('mklLngInput');
  var filterForm = document.getElementById('filterForm');

  function requestLocation(targetForm) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude, lng = pos.coords.longitude;
      if (latInput) latInput.value = lat;
      if (lngInput) lngInput.value = lng;
      var form = targetForm;
      if (form && form !== heroForm) {
        // filterForm zaten lat/lng hidden input'larını hero'dan miras almaz —
        // kendi kopyasını ekler (00-ortak §8 çift form senkron sözleşmesi).
        ['lat', 'lng'].forEach(function (name, i) {
          var existing = form.querySelector('input[name="' + name + '"]');
          if (!existing) { existing = document.createElement('input'); existing.type = 'hidden'; existing.name = name; form.appendChild(existing); }
          existing.value = i === 0 ? lat : lng;
        });
      }
      form.submit();
    }, function () {
      // izin reddedildi/başarısız — sessizce yut, mesafe filtresi konumsuz kalır (dist-hint zaten uyarıyor)
    });
  }

  if (heroCheck) {
    heroCheck.addEventListener('change', function () {
      if (heroCheck.checked) requestLocation(heroForm);
    });
  }
  if (facetCheck) {
    facetCheck.addEventListener('change', function () {
      if (facetCheck.checked) requestLocation(filterForm);
      else {
        ['lat', 'lng'].forEach(function (name) {
          var el = filterForm ? filterForm.querySelector('input[name="' + name + '"]') : null;
          if (el) el.value = '';
        });
        if (filterForm) filterForm.submit();
      }
    });
  }
})();

// ---- Liste/Harita segment (.vw-seg/.vs-btn, A2-LISTE m2) — RV4/B2 (Beyar
// kararı) SAYFA YENİLEMEDEN. Önceki davranış (gizli `gorunum` alanı yazıp
// form.submit()) TAM SAYFA isteği atıyordu — ölçüldü (Playwright, document
// resourceType). #mklViewSeg `.lst-main` İÇİNDE (görünüm swap'inde yeniden
// basılıyor) — dinleyici `main`e (asla yeniden basılmayan, yalnız
// innerHTML'i değişen üst kapsayıcı) delege edilir ki her swap sonrası da
// canlı kalsın; etkinlikler.js'in C7 swap'ıyla AYNI kök-neden fix'i
// (RV4/B1'de ölçüldü: doğrudan seg'e bağlı dinleyici ilk swap'ta ölüyordu).
//
// #filterForm sözleşmesi DEĞİŞMEDİ: facet checkbox/mesafe/sıralama hâlâ
// gerçek GET submit ile sunucuya gidiyor (tam sayfa) — yalnız görünüm
// segmentinin form.submit() çağrısı kaldırıldı. URL, formdaki (facet dahil
// TÜM) mevcut alanlardan `new FormData(form)` ile inşa edilir — form.submit()
// zaten AYNI query string'i üretiyordu, davranış sözleşmesi korunuyor.
// Harita görünümünde sayfalama BİLİNÇLİ yok (index.blade.php) — bu, tam
// `.lst-main` swap'iyle otomatik korunuyor (harita fragment'inde pagination
// hiç basılmıyor, ekstra JS gerekmez).
(function () {
  var main = document.querySelector('.lst-main');
  var form = document.getElementById('filterForm');
  if (!main || !form) return;

  function buildViewUrl(view) {
    var action = form.getAttribute('action') || window.location.pathname;
    var params = new URLSearchParams(new FormData(form));
    if (view === 'liste') {
      params.delete('gorunum');
    } else {
      params.set('gorunum', view);
    }
    var qs = params.toString();
    return action + (qs ? '?' + qs : '');
  }

  // filterForm'un gizli `gorunum` alanı SPA geçişinden SONRA da senkron
  // kalsın — kullanıcı haritadayken bir facet checkbox'ı işaretlerse form
  // submit'i mevcut görünümü kaybetmesin (sunucu tarafı render'ın bildiği
  // tek "gorunum" kaynağı bu gizli alan — etkinlikler.js'teki
  // syncFilterFormMode ile AYNI desen).
  function syncFormMode(mode) {
    var hidden = form.querySelector('input[name="gorunum"]');
    if (mode === 'liste') {
      if (hidden) hidden.remove();
    } else {
      if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'gorunum';
        form.appendChild(hidden);
      }
      hidden.value = mode;
    }
  }

  function swapTo(url, push) {
    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var newMain = doc.querySelector('.lst-main');
        if (!newMain) { window.location.href = url; return; } // dürüst tam-sayfa fallback

        main.innerHTML = newMain.innerHTML;

        var mode = new URL(url, window.location.origin).searchParams.get('gorunum') || 'liste';
        syncFormMode(mode);
        initMklMap(main); // harita'ya geçildiyse taze #mklMap'i kur (tembel başlatma)

        if (push) window.history.pushState({ mklSpa: true }, '', url);
        document.title = doc.title || document.title;
      })
      .catch(function () { window.location.href = url; }); // ağ hatası -> dürüst tam-sayfa fallback
  }

  main.addEventListener('click', function (e) {
    var btn = e.target.closest('#mklViewSeg .vs-btn[data-view]');
    if (!btn) return;
    e.preventDefault();
    if (btn.classList.contains('is-on')) return; // zaten bu görünümdeyiz
    swapTo(buildViewUrl(btn.getAttribute('data-view')), true);
  });

  window.addEventListener('popstate', function () {
    swapTo(window.location.href, false);
  });
})();

// ---- Yatay ray sağ-kenar fade göstergesi ([data-fade-track], tarif-liste subcat deseni) ----
(function () {
  document.querySelectorAll('[data-fade-track]').forEach(function (wrap) {
    var track = document.getElementById(wrap.getAttribute('data-fade-track'));
    if (!track) return;
    function upd() { wrap.classList.toggle('cs-more', track.scrollWidth - track.clientWidth - track.scrollLeft > 8); }
    track.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  });
})();

// ---- Kaydet (data-save-toggle) — portal.js'in XHR deseniyle AYNI (sayfa-scoped
// kopya, Gourmet kabuğu bu handler'ı taşımıyor). Guest gate önce çalışır
// (gourmet.js document-capture [data-lg-gate] delegasyonu), authed'te buraya düşer.
// RV4/B2: kart ızgarası (`#mklGrid`) `.lst-main` İÇİNDE, görünüm SPA
// swap'inde yeniden basılıyor — tek tek querySelectorAll+addEventListener
// ile bağlanan dinleyiciler swap sonrası taze kartlarda YOK olurdu. document
// seviyesinde delege edilince (bu dosyadaki PRO-GATE/karşılaştır ile AYNI
// desen) hem ilk yüklemede hem her swap sonrası ek bağlama gerekmeden çalışır. ----
(function () {
  function csrfToken() {
    var m = document.querySelector('meta[name="csrf-token"]');
    return m ? m.getAttribute('content') : '';
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-save-toggle]');
    if (!btn || !document.body.classList.contains('is-auth') || btn.disabled) return;
    var form = btn.closest('form');
    var action = form ? form.getAttribute('action') : null;
    if (!action) return;
    e.preventDefault();
    btn.disabled = true;
    fetch(action, {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': csrfToken(), Accept: 'application/json' },
    })
      // T9 (kapanış turu, 2026-08-08) — KÖK NEDEN: `res.ok` false ise (ör.
      // doğrulanmamış e-postada 403) `null` dönülüyordu, çağıran hiçbir şey
      // yapmadan çıkıyordu — Kaydet sessizce yutuluyordu (mekan-detay.js'in
      // #mdSave'iyle AYNI kök neden, aynı düzeltme deseni: `{ok,data}` ikilisi).
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          window.alert((result.data && result.data.message) || 'İşlem tamamlanamadı. Sayfayı yenileyip tekrar dene.');
          return;
        }
        var data = result.data;
        if (!data) return;
        var active = !!data.active;
        btn.classList.toggle('saved', active);
        var icon = btn.querySelector('i');
        if (icon) { icon.classList.toggle('fa-solid', active); icon.classList.toggle('fa-regular', !active); }
      })
      .catch(function () { /* sessiz-fail YASAK değil ama burada mevcut state korunur — kullanıcı tekrar dener */ })
      .finally(function () { btn.disabled = false; });
  });
})();

// ---- Karşılaştır — eski nötr-toast placeholder'ı (madde 7, 00-ortak "bu
// koşuda karşılaştırma yok" kararından kalmaydı) KALDIRILDI: A4 özelliği bu
// turda gerçekten kuruyor, `[data-compare-toast]` attribute'ü kartta artık
// yok — öksüz dinleyici bırakılmadı. Gerçek davranış: reference/gourmet-
// karsilastir/tray.js (A4, index.blade.php'de defer'lı ayrı script). ----

// ---- Harita (madde 6) — Leaflet 1.9.4, yol-guzergahim-v2.html kurulumuyla AYNI
// (unpkg değil, public/vendor/leaflet-1.9.4/ yerelde). Pinler map-data JSON'undan.
// RV4/B2: IIFE'den adlandırılmış fonksiyona çevrildi — harita tembel
// başlatılıyor (viewMode harita OLMADAN #mklMap DOM'da yok) ve SPA görünüm
// swap'inde her harita geçişinde TAZE bir #mklMap basılıyor (innerHTML
// değişince eski Leaflet instance'ı DOM'la birlikte gidiyor, Leaflet aynı
// container'ı iki kez kuramaz) — bu yüzden her harita girişinde YENİDEN
// çağrılır (initial page load'da + mekan-liste.js'in swapTo()'sunda). ----
function initMklMap(scope) {
  var container = (scope || document).querySelector('#mklMap');
  if (!container || typeof L === 'undefined') return;
  var url = container.getAttribute('data-map-url');
  var center = window.__gourmetMapCenter || { lat: 41.0082, lng: 28.9784 };

  var map = L.map(container, { zoomControl: true }).setView([center.lat, center.lng], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);

  function pinIcon() {
    return L.divIcon({
      className: 'mkl-vpin',
      html: '<span class="vp"><i class="fa-solid fa-utensils" aria-hidden="true"></i></span>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  }

  // Beyar 2026-08-11 — KÜMELEME ROZETİ. Koordinatların bir kısmı gerçek kapı
  // pini değil, ilçe/il MERKEZİNDEN türetilmiş yaklaşık noktadır; bu yüzden
  // aynı ilçedeki mekânlar birebir aynı lat/lng'ye düşüyor ve tek tek pin
  // basıldığında üst üste binip birbirini gizliyorlardı (ölçüm: 72 pin → 35
  // benzersiz nokta, en kalabalığı 5). Aynı noktadaki mekânlar tek rozette
  // toplanır, tıklayınca hepsi listelenir. Koordinat UYDURULMAZ (jitter
  // reddedildi) — nokta olduğu yerde kalır, yalnız sunumu dürüstleşir.
  function clusterIcon(count) {
    return L.divIcon({
      className: 'mkl-vpin is-cluster',
      html: '<span class="vp">' + count + '</span>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  }

  var i18n = window.__gourmetMapI18n || {};
  function t(key, fallback) { return i18n[key] || fallback; }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function venueRowHtml(v) {
    return '<div class="mp-item">' +
      '<h4>' + esc(v.name) + '</h4>' +
      '<div class="mp-meta"><span>' + esc(v.type) + '</span><span>' + esc(v.price) + '</span>' +
      '<span><i class="fa-solid fa-star" aria-hidden="true"></i> ' + Number(v.rating).toFixed(1) + '</span>' +
      '<span>' + esc(v.openLabel) + '</span></div>' +
      '<a class="btn btn-sm btn-primary" href="' + esc(v.url) + '">' + esc(t('detail', 'Detayı incele')) + '</a>' +
      '</div>';
  }

  function approxNoteHtml(group) {
    // Şerh yalnız gruptaki EN AZ BİR koordinat türetilmişse basılır; bayrak
    // sunucudan gelir (ApproximateLocation), istemci tahmin etmez.
    for (var i = 0; i < group.length; i++) {
      if (group[i].approx) {
        return '<p class="mp-approx"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> ' +
          esc(t('approxNote', 'Konum yaklaşıktır — ilçe merkezi')) + '</p>';
      }
    }
    return '';
  }

  fetch(url, { headers: { Accept: 'application/json' } })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var venues = data.venues || [];
      if (!venues.length) return;

      // Aynı koordinata düşenleri grupla. Anahtar ham lat/lng çiftidir —
      // yuvarlama YOK: yalnız BİREBİR aynı noktaya düşenler birleşir, yakın
      // ama farklı noktalar ayrı pin kalır.
      var groups = {};
      var order = [];
      venues.forEach(function (v) {
        var key = v.lat + ',' + v.lng;
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(v);
      });

      var bounds = [];
      order.forEach(function (key) {
        var group = groups[key];
        var lat = group[0].lat, lng = group[0].lng;
        var popupHtml;
        var marker;

        if (group.length === 1) {
          marker = L.marker([lat, lng], { icon: pinIcon() }).addTo(map);
          popupHtml = '<div class="mkl-popup">' + venueRowHtml(group[0]) + approxNoteHtml(group) + '</div>';
        } else {
          // ROZET SAYISI İLE LİSTE AYNI DİZİDEN ÜRETİLİR (group.length ve
          // group.map) — bu projede "başlık ile listenin İKİ AYRI kümeyi
          // sayması" kusuru ölçülmüştü; tek kaynak kullanmak onu yapısal
          // olarak imkânsız kılar.
          marker = L.marker([lat, lng], { icon: clusterIcon(group.length) }).addTo(map);
          var title = esc(t('clusterTitle', ':count mekân')).replace(':count', group.length);
          popupHtml = '<div class="mkl-popup is-cluster" data-cluster-count="' + group.length + '">' +
            '<h4 class="mp-title">' + title + '</h4>' +
            approxNoteHtml(group) +
            '<div class="mp-list">' + group.map(venueRowHtml).join('') + '</div>' +
            '</div>';
        }

        marker.bindPopup(popupHtml);
        bounds.push([lat, lng]);
      });

      if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] });
    })
    .catch(function () { /* harita verisi yüklenemedi — boş harita, konsol hatası verilmez */ });
}
initMklMap(document);

/* İl faseti arama kutusu (Beyar 2026-08-10, İş B madde 2) ARTIK ÖLÜ KOD —
   R3 (Beyar kararı, 2026-08-11) ile İl kutusu sol panelden tamamen kalktı
   (_facet-panel.blade.php), `data-city-search`/`data-city-list`/
   `data-city-empty` hedefleri artık DOM'da hiç yok. `mklCityNormalize()` /
   `initMklCitySearch()` bu yüzden kaldırıldı. */
