/* gourmet-konum.js — A5 konum/ülke seçim pop-up'ı (kabuk-genelinde, ilk
   girişte açılır). Kabuğun kendi fb-modal/mo-modal JS deseniyle AYNI üslup
   (resources/js/gourmet.js — dokunulmadı, bu dosya kendi kapsamında ayrı;
   00-ortak.md §7: paylaşılan dosyada targeted edit yasağı + "Kabuk elemanı
   arayan sayfa script'ine defer ŞART" tuzağı burada da geçerli: bu script
   layout'a doğrudan @include ile giren bir partial'ın İÇİNDE, kendi
   markup'ının HEMEN ardından <script defer> ile yüklenir — defer, script'i
   belge tamamen ayrıştırıldıktan sonra çalıştırır, DOM sorgusu asla null
   dönmez).

   Bu dosya STATİK asset (Blade DEĞİL) — URL/mesaj metinleri Blade'den
   #lkModal'ın data-* öznitelikleriyle geçirilir (mekan-detay.js'in
   data-save-url deseniyle AYNI ilke), burada {{ }} interpolasyonu YOKTUR. */
(function () {
  var overlay = document.getElementById('lkOverlay');
  var modal = document.getElementById('lkModal');
  var panel = modal ? modal.querySelector('.lk-panel') : null;
  if (!overlay || !modal || !panel) return;

  var d = modal.dataset;
  var csrfToken = document.querySelector('meta[name="csrf-token"]');
  csrfToken = csrfToken ? csrfToken.content : '';

  var closeBtn = document.getElementById('lkClose');
  var skipBtn = document.getElementById('lkSkip');
  var geoBtn = document.getElementById('lkGeoBtn');
  var searchInput = document.getElementById('lkSearchInput');
  var list = document.getElementById('lkList');
  var emptyState = document.getElementById('lkEmpty');
  var rows = Array.prototype.slice.call(modal.querySelectorAll('.lk-row'));
  var toast = document.getElementById('keToast');
  var toastMsg = document.getElementById('keToastMsg');
  var lastFocused = null;
  var activeIndex = -1; // klavye ile vurgulanan satırın GÖRÜNÜR satırlar içindeki indeksi

  // ---- TÜRKÇE KARAKTER DUYARSIZ NORMALİZASYON — CountryList::normalize()
  //      PHP ikizi (aynı eşleme tablosu, tek kaynak orada, yorum burada
  //      referans verir). TUZAK (kayıtlı ders): "İ".toLowerCase() → "i̇"
  //      (noktalı, iki kod noktası) — düz "i" ile EŞLEŞMEZ. toLowerCase()'e
  //      GÜVENİLMEDİ, önce özel TR harfleri elle eşlenir. ----
  var LK_CHAR_MAP = {
    'İ': 'i', 'I': 'i', 'ı': 'i', 'i': 'i',
    'Ş': 's', 'ş': 's',
    'Ğ': 'g', 'ğ': 'g',
    'Ü': 'u', 'ü': 'u',
    'Ö': 'o', 'ö': 'o',
    'Ç': 'c', 'ç': 'c'
  };
  function lkNormalize(value) {
    var out = '';
    for (var i = 0; i < value.length; i++) {
      var ch = value.charAt(i);
      out += LK_CHAR_MAP.hasOwnProperty(ch) ? LK_CHAR_MAP[ch] : ch.toLowerCase();
    }
    return out;
  }

  function showToast(msg) {
    if (!toast || !toastMsg || !msg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3600);
  }

  function postJson(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body || {}),
    }).then(function (res) { return res.json().catch(function () { return null; }); });
  }

  // ---- AÇ/KAPA + ODAK TUZAĞI (Tab/Shift+Tab panel içinde döner, ESC/overlay
  //      kapanışı "atla" sayılır — 00-ortak.md kapsamına girmeyen ama Beyar'ın
  //      "kaliteli" isteğinin gerektirdiği yeni davranış). Arama kutusu
  //      eklenince odaklanabilir eleman listesine `input` de dahil edildi. ----
  function focusableEls() {
    return Array.prototype.slice.call(
      panel.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function trapKeydown(e) {
    if (e.key !== 'Tab') return;
    var items = focusableEls();
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function open() {
    lastFocused = document.activeElement;
    overlay.classList.add('show');
    modal.classList.add('show');
    /* KAYDIRMA KILIDI — F2/W2.2 (2026-08-21, olculdu): kilit <body>'den <html>'e
       TASINDI. gourmet.css:764,766 `html,body{overflow-x:clip}` yazdigi icin <html>'in
       overflow'u `visible` degil; CSS Overflow sozlesmesi geregi <body>'nin overflow
       degeri viewport'a YAYILMIYORDU. Olcum (CDP gercek parmak kaydirmasi, 390px):
       panel acikken arka plan 465-854px kaydi. `overflow-x:clip` satirina DOKUNULMADI. */
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', trapKeydown, true);
    // her açılışta arama TEMİZ başlar (önceki oturumdan kalan sorgu yanıltıcı
    // olurdu) — tam liste görünür, ilk satır klavye-vurgusu alır.
    if (searchInput) searchInput.value = '';
    filterList();
    // arama kutulu bir seçici için doğal odak hedefi arama alanıdır (cmd-k
    // paleti/şehir seçici deseni) — yoksa ilk odaklanabilir öğeye düşülür.
    setTimeout(function () {
      if (searchInput) { searchInput.focus(); return; }
      var items = focusableEls();
      if (items.length) items[0].focus();
    }, 140);
  }

  function close() {
    overlay.classList.remove('show');
    modal.classList.remove('show');
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', trapKeydown, true);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  // "atla" — sunucuya bildir (bir daha gösterme, 30 gün) + kapat.
  //
  // G8 ölçümü (2026-08-14) — ÖNCEDEN close() SENKRON çağrılıp bildirim
  // arkadan ateşleniyordu. Kullanıcı modalı kapatır kapatmaz (masaüstünde
  // panel zaten arkada görünür) hemen bir filtre kutusuna tıklarsa, o
  // kutunun form.submit()'i TAM SAYFA navigasyonu başlatıyor — bu YENİ
  // sayfanın isteği sunucuya "atla" isteğinden ÖNCE ulaşabiliyor (iki
  // istek yarışıyor, sıra garantisi yok). O anda tarayıcıda henüz
  // `gourmet_location_dismissed` çerezi yokken gönderilen filtre isteği,
  // modalı kendi (doğru süzülmüş) sonuç sayfasının ÜSTÜNE yeniden açık
  // render ediyor. `fetch({keepalive:true})` bunu ÇÖZMEDİ (istek
  // tamamlanması geç kalan çerezi düzeltmez, sonraki isteğin ANINDA
  // hangi çerezle gittiğini değiştirmez) — ölçüldü, CDP ağ gecikmesi
  // simülasyonuyla 5/5 tekrar üretildi. Kanıtlanan tek çözüm: `selectRow()`
  // İLE AYNI SIRA — close() bildirimin SUNUCUYA ULAŞTIĞI onaylandıktan
  // SONRA çağrılır, böylece modal (ve onun tıklama-yutan overlay'i) o kısa
  // pencerede panelin önünde kalmaya devam eder, yarışa giren bir sonraki
  // istek diye bir şey olmaz.
  function dismissAndClose() {
    if (!d.dismissUrl) { close(); return; }
    postJson(d.dismissUrl).then(close, close);
  }

  // FOOTER-REVIZE-TALIMAT §4.C (2026-08-17) — footer'ın "Ülke veya Şehir
  // Seçimi" kalemi bu modalı açar. `open()` bugüne kadar yalnız ilk-ziyaret
  // akışından çağrılıyordu ve dışarıya hiçbir kanca vermiyordu; yeni SAYFA
  // açmak yerine (Beyar: "yeni sayfa açma, mevcut bileşeni kullan") mevcut
  // modal yeniden kullanılıyor. Kanca additive ve guard'lı: `[data-lk-open]`
  // taşıyan öğe yoksa hiçbir şey bağlanmaz, ilk-ziyaret davranışı değişmez.
  Array.prototype.forEach.call(document.querySelectorAll('[data-lk-open]'), function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });

  if (closeBtn) closeBtn.addEventListener('click', dismissAndClose);
  if (skipBtn) skipBtn.addEventListener('click', dismissAndClose);
  overlay.addEventListener('click', dismissAndClose);
  // #lkModal kendisi de tam-viewport grid konteyneri (referansın #moModal
  // deseni, gourmet.js satır 198: modal.addEventListener('click', e => {
  // if (e.target === modal) close(); }) — panel z-index'te overlay'in
  // ÜSTÜNDE olduğu için dim alana tıklama fiilen modal'a düşer, yalnız
  // overlay dinleyicisi bu tıklamayı YAKALAMAZ; aynı davranış burada da
  // birebir port edildi).
  modal.addEventListener('click', function (e) {
    if (e.target === modal) dismissAndClose();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) dismissAndClose();
  });

  // ---- ÜLKE SATIRI SEÇİMİ — hem fare tıklaması hem klavye (Enter) bu AYNI
  //      fonksiyonu çağırır (tek seçim yolu, iki tetikleyici). "Yakında"/
  //      pasif satır kavramı KALKTI (Beyar 2. tur, Altın Kural) — listede
  //      duran her satır gerçekten seçilebilir. ----
  function selectRow(row) {
    if (!row) return;
    var code = row.getAttribute('data-country');
    rows.forEach(function (r) { r.classList.remove('is-selected'); r.setAttribute('aria-selected', 'false'); });
    row.classList.add('is-selected');
    row.setAttribute('aria-selected', 'true');
    if (!d.setUrl) return;
    postJson(d.setUrl, { country: code }).then(function (data) {
      close();
      if (data && data.ok) showToast(data.label + ' ' + (d.msgSelectedSuffix || ''));
    });
  }
  rows.forEach(function (row) {
    row.addEventListener('click', function () { selectRow(row); });
  });

  // ---- ARAMA: canlı süzme (Türkçe duyarsız, ad + alt-ad) + klavye gezinme
  //      (yukarı/aşağı/Enter) + boş durum. ----
  function visibleRows() {
    return rows.filter(function (r) { return r.style.display !== 'none'; });
  }

  function setActive(index) {
    var visible = visibleRows();
    rows.forEach(function (r) { r.classList.remove('is-active'); });
    if (!visible.length) {
      activeIndex = -1;
      if (searchInput) searchInput.setAttribute('aria-activedescendant', '');
      return;
    }
    activeIndex = Math.max(0, Math.min(index, visible.length - 1));
    var row = visible[activeIndex];
    row.classList.add('is-active');
    if (searchInput) searchInput.setAttribute('aria-activedescendant', row.id);
    row.scrollIntoView({ block: 'nearest' });
  }

  function filterList() {
    var query = lkNormalize(searchInput ? searchInput.value : '');
    var anyVisible = false;
    rows.forEach(function (row) {
      var haystack = row.getAttribute('data-search') || '';
      var match = query === '' || haystack.indexOf(query) !== -1;
      row.style.display = match ? '' : 'none';
      if (match) anyVisible = true;
    });
    if (list) list.hidden = !anyVisible;
    if (emptyState) emptyState.hidden = anyVisible;
    setActive(0);
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterList);
    searchInput.addEventListener('keydown', function (e) {
      var visible = visibleRows();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (visible.length) setActive(activeIndex < 0 ? 0 : activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (visible.length) setActive(activeIndex < 0 ? visible.length - 1 : activeIndex - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var target = activeIndex >= 0 ? visible[activeIndex] : visible[0];
        if (target) selectRow(target);
      }
    });
    // mobil sanal klavye: alan odaklanınca panel içinde görünür kalsın
    // (klavye viewport'u küçültürken input'un gizlenmemesi için — madde 4).
    searchInput.addEventListener('focus', function () {
      setTimeout(function () { searchInput.scrollIntoView({ block: 'center' }); }, 60);
    });
  }

  // ---- "KONUMUMU KULLAN" — gerçek geolocation; sahte konum ÜRETİLMEZ.
  //      reference/yol-guzergahim-v2.html'deki geoBtn/locate() hata mesajı
  //      dilini birebir izler (izin reddi/timeout/desteksiz tarayıcı). Bu
  //      koşuda reverse-geocoding YOK (borç) — başarı yalnız varsayılan
  //      ülkeyi (Türkiye) seçer, çünkü 127 mekânın tamamı orada. ----
  if (geoBtn) {
    geoBtn.addEventListener('click', function () {
      if (!navigator.geolocation) {
        showToast(d.msgGeoUnsupported);
        return;
      }
      geoBtn.disabled = true;
      geoBtn.classList.add('busy');
      var icon = geoBtn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-spinner';
      function resetIcon() {
        geoBtn.disabled = false;
        geoBtn.classList.remove('busy');
        if (icon) icon.className = 'fa-solid fa-location-crosshairs';
      }
      navigator.geolocation.getCurrentPosition(
        function () {
          if (!d.setUrl) { resetIcon(); return; }
          postJson(d.setUrl, { country: d.defaultCountry || 'tr' }).then(function (data) {
            resetIcon();
            close();
            if (data && data.ok) showToast(d.msgGeoSuccess);
          });
        },
        function (err) {
          resetIcon();
          var msg = d.msgGeoGeneric;
          if (err) {
            if (err.code === 1) msg = d.msgGeoDenied;
            else if (err.code === 3) msg = d.msgGeoTimeout;
          }
          showToast(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  // ---- İLK GİRİŞ AÇILIŞI — sunucu (Blade) data-should-open ile "çerez yok"
  //      kararını verir; burada yalnız hafif bir giriş gecikmesi (cookie
  //      banner deseniyle AYNI 700ms — sayfa oturmadan modal üstüne binmesin). ----
  // B13-6 (Beyar kararı): çerez bandı önce gelsin, kapatılınca konum penceresi
  // açılsın — ikisi birden açılıp bant düğmesini örtmesin. `gourmet.js`
  // (bant betiği) bu betikten ÖNCE koşar ve bandın açılıp açılmayacağını
  // `window.dmCookieBannerBlocking`e senkron yazar. Bant açılacaksa modal
  // bandın kapanışını (`dm:cookie-banner-resolved`) bekler; bant hiç
  // açılmayacaksa (çerez zaten kabul/red edilmiş ya da bant öğesi sayfada
  // yok) eski 700ms akışı DEĞİŞMEDEN sürer.
  if (modal.getAttribute('data-should-open') === '1') {
    if (window.dmCookieBannerBlocking) {
      document.addEventListener('dm:cookie-banner-resolved', function onResolved() {
        document.removeEventListener('dm:cookie-banner-resolved', onResolved);
        open();
      });
    } else {
      setTimeout(open, 700);
    }
  }

  // dış tetikleyici — header/topbar'a eklenecek "ülke değiştir" girişi
  // için (KABUK KİLİTLİ, bu builder yazamaz) — [data-location-trigger]
  // taşıyan HERHANGİ bir öğeye tıklanınca modal açılır (lg-gate'in
  // [data-lg-gate] delegasyon desenİYLE AYNI ilke).
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-location-trigger]');
    if (!t) return;
    e.preventDefault();
    open();
  }, true);
})();
