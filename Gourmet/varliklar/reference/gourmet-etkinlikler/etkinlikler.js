/* Etkinlikler (liste) — sayfa-yerel JS (public/reference/gourmet-etkinlikler/).
 * Facet paneli GERÇEK <form method=GET> submit'i ile çalışır (mock JS YOK) —
 * checkbox/radio değişimi otomatik submit eder, EtkinlikController@index
 * statik diziyi gerçekten filtreler (mekan-liste.js deseninin sadeleşmiş
 * sürümü — DB yok, ama form/submit sözleşmesi AYNI).
 */

// ---- FACET PANELİ: checkbox/radio değişimi -> otomatik submit ----
(function () {
  var form = document.getElementById('filterForm');
  if (!form) return;
  form.addEventListener('change', function (e) {
    if (e.target.matches('.fct-row input[type="checkbox"], .fct-row input[type="radio"]')) {
      form.submit();
    }
  });
})();

// ---- fct-head accordion (aç/kapa) ----
(function () {
  document.querySelectorAll('.fct-head').forEach(function (h) {
    h.addEventListener('click', function () { h.closest('.fct').classList.toggle('open'); });
  });
})();

// ---- R3 (2026-07-30) — Sıralama dropdown (linkler GERÇEK — yalnız aç/kapa).
// mekan-liste.js #sortDd deseni BİREBİR: #sortDd `.lst-main` İÇİNDE (görünüm
// SPA swap'inde yeniden basılıyor, bkz. aşağıdaki swapTo()) — module başında
// TEK SEFER getElementById ile yakalanan düğüme bağlı dinleyici ilk swap'ta
// DOM'dan koparılır, ölür (bu dosyada zaten yaşanmış kök neden — .vw-seg
// notlarına bkz.). document seviyesinde delege edilince swap sayısından
// bağımsız çalışır. ----
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

// ---- Mobil temel filtre sheet'i (#lstSide) ----
(function () {
  var side = document.getElementById('lstSide');
  var overlay = document.getElementById('sheetOverlay');
  var openBtn = document.getElementById('btnFilter');
  var closeBtn = document.getElementById('sheetClose');
  if (!side || !overlay || !openBtn) return;
  /* KAYDIRMA KILIDI — F2/W2.2 (2026-08-21, olculdu): kilit <body>'den <html>'e
     TASINDI. gourmet.css:764,766 `html,body{overflow-x:clip}` yazdigi icin <html>'in
     overflow'u `visible` degil; CSS Overflow sozlesmesi geregi <body>'nin overflow
     degeri viewport'a YAYILMIYORDU. Olcum (CDP gercek parmak kaydirmasi, 390px):
     panel acikken arka plan 465-854px kaydi. `overflow-x:clip` satirina DOKUNULMADI. */
  function open() { side.classList.add('open'); overlay.classList.add('open'); document.documentElement.style.overflow = 'hidden'; }
  function close() { side.classList.remove('open'); overlay.classList.remove('open'); document.documentElement.style.overflow = ''; }
  openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();

// ---- PRO-GATE modalı (mekan-liste.js ile AYNI, sayfa-scoped kopya) ----
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

/* ---- C7 (lead revizyonu) — Liste/Takvim/Harita geçişi SAYFA YENİLEMEDEN.
 * .vw-seg linkleri GERÇEK href taşır (JS başarısız/kapalıysa normal
 * navigasyona düşer — dürüst aşama-aşama iyileştirme). Tıklamada aynı GET
 * ucu fetch ile tekrar istenir, yalnız `.lst-main` (+ .vw-seg aktif durumu +
 * .lst-sum sayacı) DOM'da değiştirilir; `history.pushState` ile URL
 * (`?gorunum=` DAHİL) güncellenir. Geri/ileri tuşu `popstate`te AYNI swap'ı
 * tekrar çalıştırır — tam sayfa yeniden yüklenmez. Kart-içi (kaydet/takvim
 * günü tıklama/harita) davranışları artık `afterSwap()` içinde toplu
 * yeniden bağlanıyor — hem ilk yüklemede hem her swap sonrası TEK yerden. */
(function () {
  var main = document.querySelector('.lst-main');
  var filterForm = document.getElementById('filterForm');
  if (!main) return;

  // ---- Kaydet — ARTIK BU DOSYADA DEĞİL (Dalga 3, 2026-08-29).
  // Görsel-only toggle kaldırıldı; gerçek persist dosyanın SONUNDA, document
  // seviyesinde delege edilmiş kanonik handler'da. Gerekçe orada yazılı.
  // ⚠ Fonksiyon kabuğu KORUNDU ve boş bırakıldı: swap sonrası yeniden bağlama
  // döngüsü (`bindAll`) onu adıyla çağırıyor ve artık bağlanacak bir şey yok —
  // delege handler zaten taze kartları da yakalıyor. Çağrıyı silmek yerine
  // fonksiyonu boşaltmak, döngünün sözleşmesini bozmadan niyeti görünür kılar.
  function bindSaveToggles() {}

  // ---- Takvim günü tıklama: o günün etkinlik listesini alta açar (ayrı
  // route/fetch YOK — tüm ayın etkinlikleri zaten DOM'da, yalnız görünürlük). ----
  function bindCalendarDayClick(scope) {
    var grid = scope.querySelector('#evCalGrid');
    if (!grid) return;
    var dayList = scope.querySelector('#evCalDayList');
    grid.querySelectorAll('.ev-cal-day').forEach(function (day) {
      day.addEventListener('click', function () {
        grid.querySelectorAll('.ev-cal-day.is-active').forEach(function (d) { d.classList.remove('is-active'); });
        day.classList.add('is-active');
        var key = day.getAttribute('data-date');
        if (!dayList) return;
        dayList.querySelectorAll('[data-daypane]').forEach(function (pane) {
          pane.hidden = pane.getAttribute('data-daypane') !== key;
        });
        dayList.hidden = false;
        dayList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }

  // ---- Harita (§8) — Leaflet, veri window.__etkinlikMapData'dan. Her
  // swap'ta #evMap TAZE bir DOM elemanı olduğu için (innerHTML değişti)
  // harita da TAZE kuruluyor — eski Leaflet örneği DOM'la birlikte gitti. ----
  function initMap(scope) {
    var container = scope.querySelector('#evMap');
    if (!container || typeof L === 'undefined') return;
    var events = window.__etkinlikMapData || [];
    var center = { lat: 39.0, lng: 33.5 }, zoom = 6;
    if (events.length === 1) { center = { lat: events[0].lat, lng: events[0].lng }; zoom = 12; }

    var map = L.map(container, { zoomControl: true }).setView([center.lat, center.lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    function pinIcon() {
      return L.divIcon({
        className: 'mkl-vpin',
        html: '<span class="vp"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i></span>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
      });
    }

    if (events.length) {
      var bounds = [];
      events.forEach(function (ev) {
        var marker = L.marker([ev.lat, ev.lng], { icon: pinIcon() }).addTo(map);
        var popupHtml = '<div class="mkl-popup"><h4>' + ev.name + '</h4>'
          + '<div class="mp-meta"><span>' + ev.dateLabel + '</span><span>' + ev.priceLabel + '</span></div>'
          + '<a class="btn btn-sm btn-primary" href="' + ev.url + '">Detayı incele</a></div>';
        marker.bindPopup(popupHtml);
        marker.on('popupopen', function () {
          var el = marker.getElement();
          if (el) el.classList.add('is-selected');
        });
        marker.on('popupclose', function () {
          var el = marker.getElement();
          if (el) el.classList.remove('is-selected');
        });
        bounds.push([ev.lat, ev.lng]);
      });
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  function afterSwap(scope) {
    bindSaveToggles(scope);
    bindCalendarDayClick(scope);
    initMap(scope);
  }

  // RV4/B1 lead düzeltmesi — `seg` modül başında TEK SEFER yakalanan
  // .vw-seg düğümüydü; ilk swap'ta `main.innerHTML = ...` onu DOM'dan
  // koparıyor, bu fonksiyon o zamandan sonra yetim elemana yazıyordu
  // (görünürde etkisiz kalıyordu çünkü main.innerHTML zaten güncel active
  // sınıfıyla geliyor — ama sessiz-kırık kod bırakılmaz). `main`den HER
  // ÇAĞRIDA taze sorgulanıyor.
  function updateActiveSeg(mode) {
    main.querySelectorAll('.vw-seg .vs-btn').forEach(function (btn) {
      var url = new URL(btn.getAttribute('href'), window.location.origin);
      var m = url.searchParams.get('gorunum') || 'liste';
      btn.classList.toggle('active', m === mode);
    });
  }

  // filterForm'un gizli `gorunum` alanı SPA geçişinden SONRA da senkron
  // kalsın — kullanıcı harita/takvim'deyken bir facet checkbox'ı işaretlerse
  // form submit'i mevcut görünümü kaybetmesin (sunucu tarafı render'ın
  // bildiği tek "gorunum" kaynağı bu gizli alan).
  function syncFilterFormMode(mode) {
    if (!filterForm) return;
    var hidden = filterForm.querySelector('input[name="gorunum"]');
    if (mode === 'liste') {
      if (hidden) hidden.remove();
    } else {
      if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'gorunum';
        filterForm.appendChild(hidden);
      }
      hidden.value = mode;
    }
  }

  // A7 (2026-08-10) — KATEGORİ ŞERİDİ SENKRONU.
  // Ölçülen kök neden: kategori çipleri (.ev-filter a.chip) `.lst-layout`ın
  // ÜSTÜNDE, yani swap kapsayıcısı olan `.lst-main`in TAMAMEN DIŞINDA duruyor.
  // Bu yüzden (a) `main`e delege edilmiş tıklama dinleyicisi onları hiç
  // görmüyordu — çip gerçek href'ine düşüp TAM SAYFA istek atıyordu, (b)
  // yalnız `.lst-main` swap edilse bile aktif çip sunucudan gelen doğru
  // duruma güncellenmiyordu. Bu fonksiyon şeridi fetch edilen belgeden
  // olduğu gibi tazeler (aktif sınıfı sunucu gerçeğidir, client'ta
  // hesaplanmaz — gurme-lezzetler.js'in aynı kararı).
  //
  // Ayrıca facet formunun gizli `kategori` alanı da tazelenir: form
  // `.lst-layout`ın sol kolonunda ve swap edilmiyor; güncellenmezse
  // kullanıcı kategori seçtikten sonra bir facet kutusunu işaretlediğinde
  // form eski (ya da boş) kategoriyle submit edip seçimi geri alırdı.
  function syncCategoryStrip(doc, url) {
    var strip = document.querySelector('.ev-filter');
    var fresh = doc.querySelector('.ev-filter');
    if (strip && fresh) strip.innerHTML = fresh.innerHTML;

    if (!filterForm) return;
    var value = new URL(url, window.location.origin).searchParams.get('kategori') || '';
    var hidden = filterForm.querySelector('input[name="kategori"]');
    if (value === '') {
      if (hidden) hidden.remove();
      return;
    }
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'kategori';
      filterForm.appendChild(hidden);
    }
    hidden.value = value;
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

        // `.lst-sum` `.lst-main` İÇİNDE (aynı yetim-düğüm tuzağı) — ayrıca
        // yazmaya gerek yok, main.innerHTML zaten fetch edilen (güncel)
        // sayacı taşıyor; eski kod yetim bir kopyaya yazıp hiçbir şey
        // yapmıyordu, kaldırıldı.
        main.innerHTML = newMain.innerHTML;

        var mode = new URL(url, window.location.origin).searchParams.get('gorunum') || 'liste';
        updateActiveSeg(mode);
        syncFilterFormMode(mode);
        syncCategoryStrip(doc, url); // A7

        // Harita view'ında gömülü window.__etkinlikMapData script'i — yalnız
        // BU değişkeni atayan satır çalıştırılıyor, başka script YOK.
        doc.querySelectorAll('script').forEach(function (s) {
          if (s.textContent && s.textContent.indexOf('window.__etkinlikMapData') > -1) {
            try { (0, eval)(s.textContent); } catch (e) { /* sessiz-geç, harita boş kalır */ }
          }
        });

        afterSwap(main);
        if (push) window.history.pushState({ etkinlikSpa: true }, '', url);
        document.title = doc.title || document.title;
      })
      .catch(function () { window.location.href = url; }); // ağ hatası -> dürüst tam-sayfa fallback
  }

  // RV4/B1 ölçülen bulgu: dinleyici doğrudan `seg`e bağlıydı — `seg` (.vw-seg)
  // .lst-main'in İÇİNDE olduğu için ilk swapTo()'daki `main.innerHTML = ...`
  // eski seg düğümünü DOM'dan kopardı; taze basılan .vw-seg'de dinleyici
  // olmadığından İKİNCİ sekme tıklaması (ör. takvim→harita) gerçek href'e
  // düşüp TAM SAYFA istek atıyordu (ölçüldü: liste→takvim 0 doc-request,
  // takvim→harita 1). `main` innerHTML'i değişse de kendisi hiç
  // değiştirilmediği için dinleyici `main` üzerinde delege edilince her
  // swap sonrası da canlı kalıyor.
  main.addEventListener('click', function (e) {
    var btn = e.target.closest('.vs-btn');
    if (!btn) return;
    e.preventDefault();
    if (btn.classList.contains('active')) return; // zaten bu görünümdeyiz
    swapTo(btn.getAttribute('href'), true);
  });

  // A7 — kategori çipleri `main`in DIŞINDA olduğu için dinleyici `document`e
  // delege edilir (şeridin kendisi her swap'ta innerHTML ile tazelendiği için
  // şeride doğrudan bağlanan bir dinleyici ilk swap'ta ölürdü — bu dosyanın
  // .vw-seg'de zaten ölçtüğü aynı kök neden). Seçici `.ev-filter` ile
  // sınırlıdır: sayfadaki diğer `.chip` öğeleri (modal içi chiprow) etkilenmez.
  // href GERÇEK kalır — JS başarısız olursa/kapalıysa normal navigasyona düşer.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.ev-filter a.chip[href]');
    if (!link) return;
    e.preventDefault();
    if (link.classList.contains('active')) return; // zaten bu kategorideyiz
    swapTo(link.getAttribute('href'), true);
  });

  window.addEventListener('popstate', function () {
    swapTo(window.location.href, false);
  });

  // İlk yükleme — mevcut (sunucudan render edilmiş) içerik için de aynı
  // bağlamalar kurulur (kaydet/takvim günü/harita ilk sayfa yüklemesinde de
  // çalışsın; standalone eski script'ler bu yüzden KALDIRILDI, çift-bağlama
  // olmasın).
  afterSwap(main);
})();

// ---- Kaydet (data-save-toggle) — GERÇEK persist.
//
// 🔴 GÖRSEL-ONLY TOGGLE KALDIRILDI (Dalga 3, 2026-08-29). Eski hâli
// `e.preventDefault()` yapıp yalnız ikonu değiştiriyordu; ölçüldü
// (uçtan uca, gerçek tarayıcı): kalp doluyordu ama `saved_events` tablosunda
// **0 satır** vardı ve "Etkinlik Takvimim" boş kalıyordu. Yani düğme
// kullanıcıya yalan söylüyordu — form artık ayakta olduğu hâlde bu handler
// POST'u yutuyordu.
//
// 🔴 DESEN İCAT EDİLMEDİ — bu deponun kendi kanonik kaydet handler'ı
// (`gourmet-mekan-liste/mekan-liste.js:329-369`) birebir taşındı. Onun
// taşıdığı iki ölçülmüş ders de birlikte geldi:
//   · `{ok, data}` İKİLİSİ ZORUNLU: `res.ok` false iken (ör. doğrulanmamış
//     e-postada 403) `null` dönmek Kaydet'i SESSİZCE yutuyordu (T9, 2026-08-08).
//   · DOCUMENT SEVİYESİNDE DELEGE: kart ızgarası görünüm swap'inde yeniden
//     basılıyor; tek tek bağlanan dinleyiciler taze kartlarda yok olurdu.
// ----
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
      .catch(function () { /* mevcut state korunur — kullanıcı tekrar dener */ })
      .finally(function () { btn.disabled = false; });
  });
})();
